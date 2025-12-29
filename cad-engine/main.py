"""
CAD Engine - STEP to STL Conversion Service

Professional implementation using OpenCascade (pythonocc-core)
Same technology as: FreeCAD, Salome, CAD Exchanger

Author: Mithran Platform
Standards: ISO 10303 (STEP), STL Binary Format
"""

import os
import logging
import tempfile
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# OpenCascade imports - Only import what we use
from OCC.Core.STEPControl import STEPControl_Reader
from OCC.Core.IFSelect import IFSelect_RetDone
from OCC.Core.BRepMesh import BRepMesh_IncrementalMesh
from OCC.Core.StlAPI import StlAPI_Writer
from OCC.Core.TopoDS import TopoDS_Shape

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# FastAPI app
app = FastAPI(
    title="Mithran CAD Engine",
    description="Professional STEP to STL conversion service",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:4000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class StepConverter:
    """
    Professional STEP to STL converter

    Uses OpenCascade Technology (OCCT) - industry standard CAD kernel
    """

    def __init__(self, linear_deflection: float = 0.1, angular_deflection: float = 0.5):
        """
        Initialize converter with mesh quality settings

        Args:
            linear_deflection: Mesh linear deflection (smaller = higher quality)
            angular_deflection: Mesh angular deflection in radians
        """
        self.linear_deflection = linear_deflection
        self.angular_deflection = angular_deflection
        logger.info(f"StepConverter initialized (linear: {linear_deflection}, angular: {angular_deflection})")

    def read_step_file(self, step_file_path: str) -> Optional[TopoDS_Shape]:
        """
        Read STEP file and return shape

        Args:
            step_file_path: Path to STEP file

        Returns:
            TopoDS_Shape or None if failed
        """
        try:
            logger.info(f"Reading STEP file: {step_file_path}")

            # Verify file exists
            if not os.path.exists(step_file_path):
                logger.error(f"STEP file does not exist: {step_file_path}")
                return None

            file_size = os.path.getsize(step_file_path)
            logger.info(f"STEP file size: {file_size} bytes")

            # Create STEP reader
            reader = STEPControl_Reader()

            # Read file
            status = reader.ReadFile(step_file_path)
            logger.info(f"STEP read status: {status}")

            if status != IFSelect_RetDone:
                logger.error(f"Failed to read STEP file: {step_file_path}, status: {status}")
                return None

            # Transfer roots to document
            logger.info("Transferring roots...")
            nb_roots = reader.TransferRoots()
            logger.info(f"Transferred {nb_roots} roots")

            # Get shape
            shape = reader.OneShape()

            if shape.IsNull():
                logger.error("STEP file contains no valid shapes")
                return None

            logger.info(f"Successfully read STEP file - Shape type: {shape.ShapeType()}")
            return shape

        except Exception as e:
            logger.error(f"Error reading STEP file: {str(e)}", exc_info=True)
            return None

    def mesh_shape(self, shape: TopoDS_Shape) -> bool:
        """
        Create triangular mesh from B-Rep shape

        Args:
            shape: TopoDS_Shape to mesh

        Returns:
            bool: True if meshing succeeded
        """
        try:
            logger.info("Meshing shape...")

            # Create incremental mesh
            mesh = BRepMesh_IncrementalMesh(
                shape,
                self.linear_deflection,
                False,  # Not relative
                self.angular_deflection,
                True    # In parallel
            )

            mesh.Perform()

            if not mesh.IsDone():
                logger.error("Meshing failed")
                return False

            logger.info("Meshing completed successfully")
            return True

        except Exception as e:
            logger.error(f"Error meshing shape: {str(e)}", exc_info=True)
            return False

    def write_stl_file(self, shape: TopoDS_Shape, stl_file_path: str) -> bool:
        """
        Write shape to STL file

        Args:
            shape: TopoDS_Shape to export
            stl_file_path: Output STL file path

        Returns:
            bool: True if export succeeded
        """
        try:
            logger.info(f"Writing STL file: {stl_file_path}")

            # Create STL writer
            stl_writer = StlAPI_Writer()
            stl_writer.SetASCIIMode(False)  # Binary STL (smaller files)

            # Write to file
            stl_writer.Write(shape, stl_file_path)

            # Verify file was created
            if not os.path.exists(stl_file_path):
                logger.error("STL file was not created")
                return False

            file_size = os.path.getsize(stl_file_path)
            logger.info(f"STL file written successfully ({file_size} bytes)")
            return True

        except Exception as e:
            logger.error(f"Error writing STL file: {str(e)}", exc_info=True)
            return False

    def convert_step_to_stl(
        self,
        step_file_path: str,
        stl_file_path: str
    ) -> bool:
        """
        Complete conversion pipeline: STEP → STL

        Args:
            step_file_path: Input STEP file
            stl_file_path: Output STL file

        Returns:
            bool: True if conversion succeeded
        """
        logger.info(f"Starting conversion: {step_file_path} → {stl_file_path}")

        # Step 1: Read STEP file
        shape = self.read_step_file(step_file_path)
        if shape is None:
            return False

        # Step 2: Mesh the shape
        if not self.mesh_shape(shape):
            return False

        # Step 3: Write STL file
        if not self.write_stl_file(shape, stl_file_path):
            return False

        logger.info("Conversion completed successfully")
        return True


# Global converter instance
converter = StepConverter(linear_deflection=0.1, angular_deflection=0.5)


def cleanup_files(*file_paths):
    """
    Background task to cleanup temporary files after response is sent
    """
    for file_path in file_paths:
        try:
            if os.path.exists(file_path):
                os.unlink(file_path)
                logger.info(f"Cleaned up temp file: {file_path}")
        except Exception as e:
            logger.warning(f"Cleanup error for {file_path}: {str(e)}")


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "service": "Mithran CAD Engine",
        "status": "running",
        "version": "1.0.0",
        "engine": "OpenCascade Technology (OCCT)"
    }


@app.get("/health")
async def health():
    """Detailed health check"""
    return {
        "status": "healthy",
        "opencascade": "pythonocc-core 7.7.2",
        "capabilities": ["STEP", "IGES", "STL"]
    }


@app.post("/convert/step-to-stl")
async def convert_step_to_stl(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...)
):
    """
    Convert STEP file to STL

    Accepts: .step, .stp, .iges, .igs files
    Returns: STL file (binary format)
    """
    # Validate file extension
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ['.step', '.stp', '.iges', '.igs']:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type: {file_ext}. Supported: .step, .stp, .iges, .igs"
        )

    logger.info(f"Received conversion request: {file.filename}")

    # Create temporary files
    with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as temp_step:
        step_path = temp_step.name

        # Write uploaded file to temp location
        content = await file.read()
        temp_step.write(content)
        temp_step.flush()

    # Create output STL path
    stl_path = str(Path(step_path).with_suffix('.stl'))

    try:
        # Convert STEP to STL
        success = converter.convert_step_to_stl(step_path, stl_path)

        if not success:
            # Cleanup on failure
            cleanup_files(step_path, stl_path)
            raise HTTPException(
                status_code=500,
                detail="STEP to STL conversion failed"
            )

        logger.info(f"Conversion successful: {file.filename} → STL")

        # Schedule cleanup after response is sent
        background_tasks.add_task(cleanup_files, step_path, stl_path)

        # Return STL file
        return FileResponse(
            stl_path,
            media_type="application/octet-stream",
            filename=Path(file.filename).stem + ".stl",
            headers={
                "X-Original-Filename": file.filename,
                "X-Conversion-Engine": "OpenCascade"
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        # Cleanup on error
        cleanup_files(step_path, stl_path)
        logger.error(f"Conversion error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Internal conversion error"
        )

@app.post("/convert/step-to-stl-base64")
async def convert_step_to_stl_base64(file: UploadFile = File(...)):
    """
    Convert STEP file to STL and return as base64

    Useful for direct embedding in responses
    """
    import base64

    # Validate file extension
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ['.step', '.stp', '.iges', '.igs']:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type: {file_ext}"
        )

    logger.info(f"Received base64 conversion request: {file.filename}")

    # Create temporary files
    with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as temp_step:
        step_path = temp_step.name
        content = await file.read()
        temp_step.write(content)
        temp_step.flush()

    stl_path = str(Path(step_path).with_suffix('.stl'))

    try:
        # Convert
        success = converter.convert_step_to_stl(step_path, stl_path)

        if not success:
            raise HTTPException(status_code=500, detail="Conversion failed")

        # Read STL and encode to base64
        with open(stl_path, 'rb') as f:
            stl_data = f.read()

        stl_base64 = base64.b64encode(stl_data).decode('utf-8')

        return {
            "success": True,
            "original_filename": file.filename,
            "stl_filename": Path(file.filename).stem + ".stl",
            "stl_size": len(stl_data),
            "stl_base64": stl_base64
        }

    finally:
        # Cleanup
        try:
            if os.path.exists(step_path):
                os.unlink(step_path)
            if os.path.exists(stl_path):
                os.unlink(stl_path)
        except OSError as e:
            logger.warning(f"Cleanup error: {e}")


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    logger.info(f"Starting CAD Engine on port {port}")

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level="info"
    )
