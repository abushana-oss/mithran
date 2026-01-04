import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ProcessesService } from './processes.service';
import {
  CreateProcessDto,
  UpdateProcessDto,
  QueryProcessesDto,
  CreateReferenceTableDto,
  UpdateReferenceTableDto,
  CreateTableRowDto,
  UpdateTableRowDto,
  BulkUpdateTableRowsDto,
} from './dto/processes.dto';
import { ProcessResponseDto, ProcessListResponseDto } from './dto/process-response.dto';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { AccessToken } from '../../common/decorators/access-token.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Processes')
@ApiBearerAuth()
@Controller({ path: 'processes', version: '1' })
export class ProcessesController {
  constructor(private readonly processesService: ProcessesService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all processes' })
  @ApiResponse({ status: 200, description: 'Processes retrieved successfully', type: ProcessListResponseDto })
  async findAll(@Query() query: QueryProcessesDto, @CurrentUser() user?: any, @AccessToken() token?: string): Promise<ProcessListResponseDto> {
    return this.processesService.findAll(query, user?.id, token);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get process by ID' })
  @ApiResponse({ status: 200, description: 'Process retrieved successfully', type: ProcessResponseDto })
  @ApiResponse({ status: 404, description: 'Process not found' })
  async findOne(@Param('id') id: string, @CurrentUser() user: any, @AccessToken() token: string): Promise<ProcessResponseDto> {
    return this.processesService.findOne(id, user.id, token);
  }

  @Post()
  @ApiOperation({ summary: 'Create new process' })
  @ApiResponse({ status: 201, description: 'Process created successfully', type: ProcessResponseDto })
  async create(@Body() createProcessDto: CreateProcessDto, @CurrentUser() user: any, @AccessToken() token: string): Promise<ProcessResponseDto> {
    return this.processesService.create(createProcessDto, user.id, token);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update process' })
  @ApiResponse({ status: 200, description: 'Process updated successfully', type: ProcessResponseDto })
  async update(@Param('id') id: string, @Body() updateProcessDto: UpdateProcessDto, @CurrentUser() user: any, @AccessToken() token: string): Promise<ProcessResponseDto> {
    return this.processesService.update(id, updateProcessDto, user.id, token);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete process' })
  @ApiResponse({ status: 200, description: 'Process deleted successfully' })
  async remove(@Param('id') id: string, @CurrentUser() user: any, @AccessToken() token: string) {
    return this.processesService.remove(id, user.id, token);
  }

  // ============================================================================
  // REFERENCE TABLES ENDPOINTS
  // ============================================================================

  @Get(':processId/reference-tables')
  @ApiOperation({ summary: 'Get all reference tables for a process' })
  @ApiResponse({ status: 200, description: 'Reference tables retrieved successfully' })
  async getReferenceTables(@Param('processId') processId: string, @AccessToken() token: string) {
    return this.processesService.getReferenceTables(processId, token);
  }

  @Get('reference-tables/:tableId')
  @ApiOperation({ summary: 'Get a specific reference table with rows' })
  @ApiResponse({ status: 200, description: 'Reference table retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Reference table not found' })
  async getReferenceTable(@Param('tableId') tableId: string, @AccessToken() token: string) {
    return this.processesService.getReferenceTable(tableId, token);
  }

  @Post(':processId/reference-tables')
  @ApiOperation({ summary: 'Create a new reference table' })
  @ApiResponse({ status: 201, description: 'Reference table created successfully' })
  async createReferenceTable(
    @Param('processId') processId: string,
    @Body() createDto: CreateReferenceTableDto,
    @AccessToken() token: string,
  ) {
    // Ensure processId from URL matches DTO
    createDto.processId = processId;
    return this.processesService.createReferenceTable(createDto, token);
  }

  @Put('reference-tables/:tableId')
  @ApiOperation({ summary: 'Update a reference table' })
  @ApiResponse({ status: 200, description: 'Reference table updated successfully' })
  @ApiResponse({ status: 404, description: 'Reference table not found' })
  async updateReferenceTable(
    @Param('tableId') tableId: string,
    @Body() updateDto: UpdateReferenceTableDto,
    @AccessToken() token: string,
  ) {
    return this.processesService.updateReferenceTable(tableId, updateDto, token);
  }

  @Delete('reference-tables/:tableId')
  @ApiOperation({ summary: 'Delete a reference table' })
  @ApiResponse({ status: 200, description: 'Reference table deleted successfully' })
  async deleteReferenceTable(@Param('tableId') tableId: string, @AccessToken() token: string) {
    return this.processesService.deleteReferenceTable(tableId, token);
  }

  @Post('reference-tables/:tableId/rows')
  @ApiOperation({ summary: 'Add a row to a reference table' })
  @ApiResponse({ status: 201, description: 'Table row created successfully' })
  async createTableRow(
    @Param('tableId') tableId: string,
    @Body() createDto: CreateTableRowDto,
    @AccessToken() token: string,
  ) {
    // Ensure tableId from URL matches DTO
    createDto.tableId = tableId;
    return this.processesService.createTableRow(createDto, token);
  }

  @Put('reference-tables/rows/:rowId')
  @ApiOperation({ summary: 'Update a table row' })
  @ApiResponse({ status: 200, description: 'Table row updated successfully' })
  @ApiResponse({ status: 404, description: 'Table row not found' })
  async updateTableRow(
    @Param('rowId') rowId: string,
    @Body() updateDto: UpdateTableRowDto,
    @AccessToken() token: string,
  ) {
    return this.processesService.updateTableRow(rowId, updateDto, token);
  }

  @Delete('reference-tables/rows/:rowId')
  @ApiOperation({ summary: 'Delete a table row' })
  @ApiResponse({ status: 200, description: 'Table row deleted successfully' })
  async deleteTableRow(@Param('rowId') rowId: string, @AccessToken() token: string) {
    return this.processesService.deleteTableRow(rowId, token);
  }

  @Post('reference-tables/:tableId/rows/bulk')
  @ApiOperation({ summary: 'Bulk update table rows (delete old, insert new)' })
  @ApiResponse({ status: 200, description: 'Table rows updated successfully' })
  async bulkUpdateTableRows(
    @Param('tableId') tableId: string,
    @Body() bulkDto: BulkUpdateTableRowsDto,
    @AccessToken() token: string,
  ) {
    // Ensure tableId from URL matches DTO
    bulkDto.tableId = tableId;
    return this.processesService.bulkUpdateTableRows(bulkDto, token);
  }
}
