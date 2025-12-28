@echo off
REM CAD Engine Test Script - Windows Version
REM Tests STEP to STL conversion with sample file

echo.
echo CAD Engine Conversion Test
echo ==========================
echo.

REM Check if CAD engine is running
echo 1. Checking CAD engine health...
curl -s http://localhost:5000/health > nul 2>&1

if %errorlevel% equ 0 (
    echo [OK] CAD Engine is running
    curl -s http://localhost:5000/health
) else (
    echo [ERROR] CAD Engine is not accessible at http://localhost:5000
    echo         Start it with: docker-compose up cad-engine
    exit /b 1
)

echo.
echo 2. Testing STEP file conversion...

REM Check if test file is provided
if "%1"=="" (
    echo [WARNING] No STEP file provided
    echo.
    echo Usage: test-conversion.bat ^<path-to-step-file^>
    echo Example: test-conversion.bat ..\test-files\cone_clutch.stp
    exit /b 1
)

set STEP_FILE=%1

if not exist "%STEP_FILE%" (
    echo [ERROR] File not found: %STEP_FILE%
    exit /b 1
)

echo    Input file: %STEP_FILE%

REM Convert STEP to STL
set OUTPUT_FILE=output_%random%.stl
echo.
echo 3. Converting STEP to STL...
echo    (This may take 5-60 seconds depending on file complexity)
echo.

curl -X POST http://localhost:5000/convert/step-to-stl ^
    -F "file=@%STEP_FILE%" ^
    -o "%OUTPUT_FILE%" ^
    --max-time 120

if exist "%OUTPUT_FILE%" (
    echo.
    echo [OK] Conversion successful!
    echo    Output file: %OUTPUT_FILE%
    dir "%OUTPUT_FILE%" | findstr /R "[0-9]"
    echo.
    echo You can now:
    echo  - View the STL in a 3D viewer (FreeCAD, MeshLab, etc.)
    echo  - Upload it to your application for browser viewing
) else (
    echo.
    echo [ERROR] Conversion failed
    echo        Check CAD engine logs: docker-compose logs cad-engine
    exit /b 1
)
