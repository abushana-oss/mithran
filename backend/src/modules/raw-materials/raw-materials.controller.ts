import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { RawMaterialsService } from './raw-materials.service';
import { CreateRawMaterialDto, UpdateRawMaterialDto, QueryRawMaterialsDto } from './dto/raw-materials.dto';
import { RawMaterialResponseDto, RawMaterialListResponseDto } from './dto/raw-material-response.dto';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { AccessToken } from '../../common/decorators/access-token.decorator';
const XLSX = require('xlsx');

@ApiTags('Raw Materials')
@ApiBearerAuth()
@Controller({ path: 'raw-materials', version: '1' })
export class RawMaterialsController {
  constructor(private readonly rawMaterialsService: RawMaterialsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all raw materials' })
  @ApiResponse({ status: 200, description: 'Raw materials retrieved successfully', type: RawMaterialListResponseDto })
  async findAll(@Query() query: QueryRawMaterialsDto, @CurrentUser() user: any, @AccessToken() token: string): Promise<RawMaterialListResponseDto> {
    return this.rawMaterialsService.findAll(query, user.id, token);
  }

  @Get('grouped')
  @ApiOperation({ summary: 'Get raw materials grouped by material group' })
  @ApiResponse({ status: 200, description: 'Grouped materials retrieved successfully' })
  async getGrouped(@CurrentUser() user: any, @AccessToken() token: string) {
    return this.rawMaterialsService.getGroupedByMaterialGroup(user.id, token);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get raw material by ID' })
  @ApiResponse({ status: 200, description: 'Raw material retrieved successfully', type: RawMaterialResponseDto })
  @ApiResponse({ status: 404, description: 'Raw material not found' })
  async findOne(@Param('id') id: string, @CurrentUser() user: any, @AccessToken() token: string): Promise<RawMaterialResponseDto> {
    return this.rawMaterialsService.findOne(id, user.id, token);
  }

  @Post()
  @ApiOperation({ summary: 'Create new raw material' })
  @ApiResponse({ status: 201, description: 'Raw material created successfully', type: RawMaterialResponseDto })
  async create(@Body() createRawMaterialDto: CreateRawMaterialDto, @CurrentUser() user: any, @AccessToken() token: string): Promise<RawMaterialResponseDto> {
    return this.rawMaterialsService.create(createRawMaterialDto, user.id, token);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update raw material' })
  @ApiResponse({ status: 200, description: 'Raw material updated successfully', type: RawMaterialResponseDto })
  async update(@Param('id') id: string, @Body() updateRawMaterialDto: UpdateRawMaterialDto, @CurrentUser() user: any, @AccessToken() token: string): Promise<RawMaterialResponseDto> {
    return this.rawMaterialsService.update(id, updateRawMaterialDto, user.id, token);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete raw material' })
  @ApiResponse({ status: 200, description: 'Raw material deleted successfully' })
  async remove(@Param('id') id: string, @CurrentUser() user: any, @AccessToken() token: string) {
    return this.rawMaterialsService.remove(id, user.id, token);
  }

  @Delete()
  @ApiOperation({ summary: 'Delete all raw materials for current user' })
  @ApiResponse({ status: 200, description: 'All raw materials deleted successfully' })
  async removeAll(@CurrentUser() user: any, @AccessToken() token: string) {
    return this.rawMaterialsService.removeAll(user.id, token);
  }

  @Post('upload-excel')
  @ApiOperation({ summary: 'Upload Excel file to bulk import raw materials' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'Excel file processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file or data' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadExcel(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: any,
    @AccessToken() token: string,
  ): Promise<{ message: string; created: number; failed: number; errors?: any[] }> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate file type
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv', // .csv
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Please upload an Excel (.xlsx, .xls) or CSV file');
    }

    try {
      // Parse Excel file
      const workbook = XLSX.read(file.buffer, { type: 'buffer', cellDates: true });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // Helper function to find the header row
      const findHeaderRow = (): number => {
        // Try reading first 5 rows to find where headers are
        for (let skipRows = 0; skipRows < 5; skipRows++) {
          const testData = XLSX.utils.sheet_to_json(worksheet, {
            range: skipRows,
            header: 1, // Use array format to see raw values
            defval: '',
          });

          if (testData.length === 0) continue;

          const firstRow = testData[0] as any[];
          const validHeaders = firstRow.filter(cell =>
            cell && typeof cell === 'string' &&
            (cell.toLowerCase().includes('material') ||
             cell.toLowerCase().includes('group') ||
             cell.toLowerCase().includes('grade') ||
             cell.toLowerCase().includes('location') ||
             cell.toLowerCase().includes('density') ||
             cell.toLowerCase().includes('temp'))
          );

          console.log(`Row ${skipRows + 1}: Found ${validHeaders.length} material-related headers out of ${firstRow.length} columns`);

          // If we found at least 2 material-related headers, this is likely the header row
          if (validHeaders.length >= 2) {
            return skipRows;
          }
        }

        return 0; // Default to first row if nothing found
      };

      const headerRowIndex = findHeaderRow();
      console.log(`Using row ${headerRowIndex + 1} as header row`);

      // Read data with detected header row
      let jsonData = XLSX.utils.sheet_to_json(worksheet, {
        range: headerRowIndex,
        defval: '',
      });

      if (!jsonData || jsonData.length === 0) {
        throw new BadRequestException('Excel file is empty or has no data rows after headers');
      }

      // Final validation: check if we still have too many empty headers
      const finalRowKeys = Object.keys(jsonData[0]);
      const finalEmptyCount = finalRowKeys.filter(key => key.startsWith('__EMPTY')).length;

      console.log(`Final check: ${finalEmptyCount} empty headers out of ${finalRowKeys.length} total`);
      console.log(`Column names: ${finalRowKeys.slice(0, 10).join(', ')}${finalRowKeys.length > 10 ? '...' : ''}`);

      if (finalEmptyCount > finalRowKeys.length * 0.7) {
        throw new BadRequestException(
          `Invalid Excel format: Most columns (${finalEmptyCount}/${finalRowKeys.length}) have no header names. ` +
          `Found: ${finalRowKeys.filter(k => !k.startsWith('__EMPTY')).join(', ') || 'none'}. ` +
          `Please ensure your Excel file has a header row with column names like "MaterialGroup", "Material", etc. ` +
          `The header row should be the first non-empty row in your Excel file.`
        );
      }

      // Log first row for debugging column names
      if (jsonData.length > 0) {
        console.log('Excel columns found:', Object.keys(jsonData[0]));
        console.log('First row sample data:', JSON.stringify(jsonData[0], null, 2));
      }

      // Helper function to safely get column value with multiple possible names
      const getColumnValue = (row: any, ...columnNames: string[]): any => {
        for (const name of columnNames) {
          if (row[name] !== undefined && row[name] !== null && row[name] !== '') {
            return row[name];
          }
        }
        return undefined;
      };

      // Helper function to parse numeric value
      const parseNumeric = (value: any): number | undefined => {
        if (value === undefined || value === null || value === '') return undefined;
        const str = String(value).replace(/[%,]/g, '').trim();
        const num = parseFloat(str);
        return isNaN(num) ? undefined : num;
      };

      // Collect valid materials for batch insert
      const validMaterials: CreateRawMaterialDto[] = [];
      const errors: any[] = [];

      // Process each row
      for (const [index, row] of jsonData.entries()) {
        try {
          const rowData: any = row;

          // Map Excel columns to DTO properties with comprehensive column name matching
          const materialGroup = getColumnValue(rowData, 'MaterialGroup', 'Material Group', 'material_group', 'MATERIALGROUP');
          const material = getColumnValue(rowData, 'Material', 'material', 'MATERIAL');

          // Validate required fields first
          if (!materialGroup || !material) {
            const availableColumns = Object.keys(rowData).join(', ');
            throw new Error(
              `Missing required fields. Expected 'MaterialGroup' and 'Material' but got columns: ${availableColumns}`
            );
          }

          // Extract specific heat and thermal conductivity with logging
          // Note: Adding exact column names from user's Excel including mangled encodings
          const specificHeatRaw = getColumnValue(
            rowData,
            'Specific Heat of Melt (J / g * Ã\x82Â°C)', // Exact from Excel
            'Specific Heat of Melt',
            'Specific Heat of Melt (J / g * °C)',
            'Specific Heat of Melt (J / g * Â°C)',
            'Specific Heat of Melt (J / g * ÃÂ°C)',
            'SpecificHeatMelt',
            'specific_heat_melt',
            'Specific Heat',
            'Sp. Heat'
          );
          const thermalCondRaw = getColumnValue(
            rowData,
            'Thermal Conductivity of Melt (Watts / m * Ã\x82Â°C)', // Exact from Excel
            'Thermal Conductivity of Melt',
            'Thermal Conductivity of Melt (Watts / m * °C)',
            'Thermal Conductivity of Melt (Watts / m * Â°C)',
            'Thermal Conductivity of Melt (Watts / m * ÃÂ°C)',
            'ThermalConductivityMelt',
            'thermal_conductivity_melt',
            'Thermal Conductivity',
            'Thermal Cond.',
            'Thermal Cond'
          );

          // Log for first row to debug
          if (index === 0) {
            console.log('DEBUG - Row 1 extracted values:');
            console.log('  Specific Heat raw:', specificHeatRaw);
            console.log('  Thermal Cond raw:', thermalCondRaw);
            console.log('  Specific Heat parsed:', parseNumeric(specificHeatRaw));
            console.log('  Thermal Cond parsed:', parseNumeric(thermalCondRaw));
          }

          const createDto: CreateRawMaterialDto = {
            materialGroup,
            material,
            materialAbbreviation: getColumnValue(rowData, 'MaterialAbbreviation', 'Material Abbreviation', 'material_abbreviation', 'Abbr', 'Abbreviation'),
            materialGrade: getColumnValue(rowData, 'MaterialGrade', 'Material Grade', 'material_grade', 'Grade'),
            stockForm: getColumnValue(rowData, 'StockForm', 'Stock Form', 'stock_form', 'Form'),
            matlState: getColumnValue(rowData, 'MatlState', 'Matl State', 'matl_state', 'State', 'Material State'),
            application: getColumnValue(rowData, 'Application', 'application', 'APPLICATION'),
            regrinding: getColumnValue(rowData, 'Regrinding', 'regrinding', 'REGRINDING'),
            regrindingPercentage: parseNumeric(getColumnValue(rowData, 'Regrinding%', 'Regrinding Percentage', 'regrinding_percentage', 'RegrindingPercentage')),
            clampingPressureMpa: parseNumeric(getColumnValue(rowData, 'Clamping Pressure (MPa)', 'ClampingPressureMpa', 'clamping_pressure_mpa', 'Clamping Pressure', 'Clamp Pressure (MPa)', 'Clamp Pressure')),
            ejectDeflectionTempC: parseNumeric(getColumnValue(rowData, 'Eject Deflection Temp (Â°C)', 'Eject Deflection Temp (°C)', 'Eject Temp (Â°C)', 'Eject Temp (°C)', 'EjectDeflectionTempC', 'eject_deflection_temp_c', 'Eject Temp')),
            meltingTempC: parseNumeric(getColumnValue(rowData, 'Melting Temp (Â°C)', 'Melting Temp (°C)', 'Melt Temp (Â°C)', 'Melt Temp (°C)', 'MeltingTempC', 'melting_temp_c', 'Melting Temperature', 'Melt Temp')),
            moldTempC: parseNumeric(getColumnValue(rowData, 'Mold Temp (Â°C)', 'Mold Temp (°C)', 'MoldTempC', 'mold_temp_c', 'Mold Temperature')),
            densityKgM3: parseNumeric(getColumnValue(rowData, 'Density (kg / m^3)', 'Density (kg/m³)', 'Density (kg/mÂ³)', 'DensityKgM3', 'density_kg_m3', 'Density')),
            specificHeatMelt: parseNumeric(specificHeatRaw),
            thermalConductivityMelt: parseNumeric(thermalCondRaw),
            location: getColumnValue(rowData, 'Location', 'location', 'LOCATION'),
            year: parseNumeric(getColumnValue(rowData, 'Year', 'year', 'YEAR')),
            q1Cost: parseNumeric(getColumnValue(rowData, 'Q1', 'q1', 'Q1 Cost', 'q1_cost')),
            q2Cost: parseNumeric(getColumnValue(rowData, 'Q2', 'q2', 'Q2 Cost', 'q2_cost')),
            q3Cost: parseNumeric(getColumnValue(rowData, 'Q3', 'q3', 'Q3 Cost', 'q3_cost')),
            q4Cost: parseNumeric(getColumnValue(rowData, 'Q4', 'q4', 'Q4 Cost', 'q4_cost')),
          };

          // Add to valid materials array for batch insert
          validMaterials.push(createDto);

          // Log progress every 50 rows
          if ((index + 1) % 50 === 0) {
            console.log(`Processed ${index + 1} rows...`);
          }
        } catch (error) {
          // Properly serialize error with all details
          const errorDetail = {
            row: index + 2, // +2 because Excel is 1-indexed and has header row
            message: error?.message || String(error),
            type: error?.name || 'Error',
            stack: error?.stack?.split('\n').slice(0, 3).join('\n'), // First 3 lines of stack
            columns: Object.keys(row),
            sampleData: {
              MaterialGroup: getColumnValue(row, 'MaterialGroup', 'Material Group'),
              Material: getColumnValue(row, 'Material'),
              Grade: getColumnValue(row, 'MaterialGrade', 'Material Grade', 'Grade'),
            },
          };

          errors.push(errorDetail);

          // Log first 5 errors with details
          if (errors.length <= 5) {
            console.error(`❌ Row ${errorDetail.row} error:`, {
              message: errorDetail.message,
              type: errorDetail.type,
              data: errorDetail.sampleData,
            });
          }
        }
      }

      console.log(`\n✅ Validation complete: ${validMaterials.length} valid, ${errors.length} failed`);

      // Batch insert all valid materials
      let created = 0;
      if (validMaterials.length > 0) {
        console.log(`🚀 Starting batch insert of ${validMaterials.length} materials...`);
        try {
          created = await this.rawMaterialsService.createBatch(validMaterials, user.id, token);
          console.log(`✅ Batch insert complete: ${created} materials created`);
        } catch (error) {
          console.error(`❌ Batch insert failed:`, error.message);
          throw new BadRequestException(`Batch insert failed: ${error.message}`);
        }
      }

      const failed = errors.length;

      console.log(`\n✅ Upload complete: ${created} created, ${failed} failed out of ${jsonData.length} total rows`);

      if (failed > 0) {
        console.log(`Failed rows: ${errors.map(e => e.row).join(', ')}`);
      }

      return {
        message: `Excel file processed: ${created} materials created, ${failed} failed`,
        created,
        failed,
        errors: failed > 0 ? errors : undefined,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to process Excel file: ${error.message}`);
    }
  }
}
