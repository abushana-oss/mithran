import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import FormData from 'form-data';

/**
 * STEP to STL Converter Service
 *
 * Professional Production Implementation:
 * - Uses dedicated Python + OpenCascade CAD engine microservice
 * - Industry-standard conversion (same tech as FreeCAD, CATIA, Salome)
 * - ISO 10303 (STEP) compliant
 * - High-quality mesh generation
 *
 * Architecture:
 * NestJS Backend → Python CAD Engine → OpenCascade OCCT
 */
@Injectable()
export class StepConverterService {
  private readonly logger = new Logger(StepConverterService.name);
  private readonly cadEngineUrl: string;
  private cadEngineAvailable: boolean | null = null;

  constructor(private configService: ConfigService) {
    this.cadEngineUrl = this.configService.get<string>(
      'CAD_ENGINE_URL',
      'http://localhost:5000',
    );
    this.logger.log(`CAD Engine configured at: ${this.cadEngineUrl}`);
  }

  /**
   * Check if CAD engine is available
   */
  private async checkCadEngineAvailability(): Promise<boolean> {
    // Cache the availability check
    if (this.cadEngineAvailable !== null) {
      return this.cadEngineAvailable;
    }

    try {
      const response = await axios.get(`${this.cadEngineUrl}/health`, {
        timeout: 5000,
      });

      this.cadEngineAvailable = response.data.status === 'healthy';

      if (this.cadEngineAvailable) {
        this.logger.log(
          `CAD Engine available - OpenCascade ${response.data.opencascade}`,
        );
      } else {
        this.logger.warn('CAD Engine responded but not healthy');
      }

      return this.cadEngineAvailable;
    } catch (error) {
      this.cadEngineAvailable = false;
      this.logger.warn(
        `CAD Engine not available at ${this.cadEngineUrl} - STEP files will be download-only`,
      );
      return false;
    }
  }

  /**
   * Convert STEP file to STL using Python CAD Engine
   *
   * @param stepFileBuffer - STEP file content
   * @param originalFilename - Original filename (for logging)
   * @returns STL file buffer
   * @throws Error if conversion fails
   */
  async convertStepToStl(
    stepFileBuffer: Buffer,
    originalFilename?: string,
  ): Promise<Buffer> {
    const canConvert = await this.checkCadEngineAvailability();

    if (!canConvert) {
      throw new Error(
        `CAD Engine not available at ${this.cadEngineUrl}. Make sure the service is running.`,
      );
    }

    try {
      // Create form data with STEP file
      const formData = new FormData();
      formData.append('file', stepFileBuffer, {
        filename: originalFilename || 'model.step',
        contentType: 'application/octet-stream',
      });

      this.logger.log(`Converting STEP file: ${originalFilename || 'model.step'}`);

      // Send to CAD engine for conversion
      const response = await axios.post(
        `${this.cadEngineUrl}/convert/step-to-stl`,
        formData,
        {
          headers: formData.getHeaders(),
          responseType: 'arraybuffer',
          timeout: 60000, // 60 seconds for large files
          maxContentLength: 100 * 1024 * 1024, // 100MB max
          maxBodyLength: 100 * 1024 * 1024,
        },
      );

      const stlBuffer = Buffer.from(response.data);
      const stlSizeMB = (stlBuffer.length / 1024 / 1024).toFixed(2);

      this.logger.log(
        `Successfully converted STEP to STL (${stlSizeMB} MB)`,
      );

      return stlBuffer;
    } catch (error) {
      this.logger.error(
        `STEP to STL conversion failed: ${error.message}`,
        error.stack,
      );

      // Provide detailed error message
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNREFUSED') {
          this.cadEngineAvailable = false;
          throw new Error(
            `CAD Engine connection refused at ${this.cadEngineUrl}. Make sure the service is running.`,
          );
        } else if (error.response) {
          const errorMsg = error.response.data?.error || error.response.statusText;
          throw new Error(
            `CAD Engine conversion failed (${error.response.status}): ${errorMsg}`,
          );
        }
      }

      throw new Error(`STEP conversion failed: ${error.message}`);
    }
  }

  /**
   * Check if a file is a STEP file based on extension
   */
  isStepFile(filename: string): boolean {
    const ext = filename.toLowerCase().split('.').pop();
    return ['step', 'stp', 'iges', 'igs'].includes(ext || '');
  }

  /**
   * Get supported CAD file extensions
   */
  getSupportedExtensions(): string[] {
    return ['step', 'stp', 'iges', 'igs'];
  }

  /**
   * Reset availability check (useful for testing/debugging)
   */
  resetAvailabilityCheck(): void {
    this.cadEngineAvailable = null;
  }
}
