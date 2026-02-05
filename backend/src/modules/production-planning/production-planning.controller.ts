import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { SupabaseAuthGuard } from '@/common/guards/supabase-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { createResponse, ApiResponse } from '@/common/dto/api-response.dto';
import { ProductionPlanningService } from './production-planning.service';
import { ProductionMaterialTrackingService } from './services/production-material-tracking.service';
import {
  CreateProductionLotDto,
  UpdateProductionLotDto,
  ProductionLotResponseDto,
} from './dto/production-lot.dto';
import {
  CreateLotVendorAssignmentDto,
  UpdateLotVendorAssignmentDto,
  BulkVendorAssignmentDto,
} from './dto/vendor-assignment.dto';
import {
  CreateProductionProcessDto,
  UpdateProductionProcessDto,
  CreateProcessSubtaskDto,
  UpdateProcessSubtaskDto,
} from './dto/production-process.dto';
import {
  CreateDailyProductionEntryDto,
  UpdateDailyProductionEntryDto,
  DailyProductionEntryResponseDto,
  ProductionSummaryDto,
} from './dto/daily-production.dto';

@Controller('production-planning')
@UseGuards(SupabaseAuthGuard)
export class ProductionPlanningController {
  constructor(
    private readonly productionPlanningService: ProductionPlanningService,
    private readonly materialTrackingService: ProductionMaterialTrackingService,
  ) {}

  // ============================================================================
  // PRODUCTION LOTS ENDPOINTS
  // ============================================================================

  @Post('lots')
  async createProductionLot(
    @Body() createDto: CreateProductionLotDto,
    @CurrentUser() user: any,
  ): Promise<ApiResponse<ProductionLotResponseDto>> {
    const result = await this.productionPlanningService.createProductionLot(createDto, user.id);
    return createResponse(result);
  }

  @Get('lots')
  async getProductionLots(
    @CurrentUser() user: any,
    @Query('status') status?: string,
    @Query('bomId') bomId?: string,
    @Query('priority') priority?: string,
  ): Promise<ApiResponse<ProductionLotResponseDto[]>> {
    const result = await this.productionPlanningService.getProductionLots(user.id, {
      status,
      bomId,
      priority,
    });
    return createResponse(result);
  }

  @Get('lots/:id')
  async getProductionLotById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ): Promise<ApiResponse<ProductionLotResponseDto>> {
    const result = await this.productionPlanningService.getProductionLotById(id, user.id);
    return createResponse(result);
  }

  @Put('lots/:id')
  async updateProductionLot(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateProductionLotDto,
    @CurrentUser() user: any,
  ): Promise<ApiResponse<ProductionLotResponseDto>> {
    const result = await this.productionPlanningService.updateProductionLot(id, updateDto, user.id);
    return createResponse(result);
  }

  @Delete('lots/:id')
  async deleteProductionLot(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ): Promise<ApiResponse<void>> {
    await this.productionPlanningService.deleteProductionLot(id, user.id);
    return createResponse(undefined);
  }

  // ============================================================================
  // VENDOR ASSIGNMENTS ENDPOINTS
  // ============================================================================

  @Post('lots/:lotId/vendor-assignments')
  async createVendorAssignment(
    @Param('lotId', ParseUUIDPipe) lotId: string,
    @Body() createDto: CreateLotVendorAssignmentDto,
    @CurrentUser() user: any,
  ): Promise<ApiResponse<any>> {
    const result = await this.productionPlanningService.createVendorAssignment(createDto, user.id);
    return createResponse(result);
  }

  @Post('lots/:lotId/vendor-assignments/bulk')
  async bulkCreateVendorAssignments(
    @Param('lotId', ParseUUIDPipe) lotId: string,
    @Body() bulkDto: BulkVendorAssignmentDto,
    @CurrentUser() user: any,
  ): Promise<ApiResponse<any[]>> {
    const result = await this.productionPlanningService.bulkCreateVendorAssignments(bulkDto, user.id);
    return createResponse(result);
  }

  @Get('lots/:lotId/vendor-assignments')
  async getVendorAssignments(
    @Param('lotId', ParseUUIDPipe) lotId: string,
    @CurrentUser() user: any,
  ): Promise<ApiResponse<any[]>> {
    const result = await this.productionPlanningService.getVendorAssignments(lotId, user.id);
    return createResponse(result);
  }

  @Put('vendor-assignments/:id')
  async updateVendorAssignment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateLotVendorAssignmentDto,
    @CurrentUser() user: any,
  ): Promise<ApiResponse<any>> {
    const result = await this.productionPlanningService.updateVendorAssignment(id, updateDto, user.id);
    return createResponse(result);
  }

  @Delete('vendor-assignments/:id')
  async deleteVendorAssignment(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ): Promise<ApiResponse<void>> {
    await this.productionPlanningService.deleteVendorAssignment(id, user.id);
    return createResponse(undefined);
  }

  // ============================================================================
  // PRODUCTION PROCESSES ENDPOINTS
  // ============================================================================

  @Post('lots/:lotId/processes')
  async createProductionProcess(
    @Param('lotId', ParseUUIDPipe) lotId: string,
    @Body() createDto: CreateProductionProcessDto,
    @CurrentUser() user: any,
  ): Promise<ApiResponse<any>> {
    const result = await this.productionPlanningService.createProductionProcess(createDto, user.id);
    return createResponse(result);
  }

  @Get('lots/:lotId/processes')
  async getProductionProcesses(
    @Param('lotId', ParseUUIDPipe) lotId: string,
    @CurrentUser() user: any,
    @Query('status') status?: string,
  ): Promise<ApiResponse<any[]>> {
    const result = await this.productionPlanningService.getProductionProcesses(lotId, user.id, { status });
    return createResponse(result);
  }

  @Put('processes/:id')
  async updateProductionProcess(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateProductionProcessDto,
    @CurrentUser() user: any,
  ): Promise<ApiResponse<any>> {
    const result = await this.productionPlanningService.updateProductionProcess(id, updateDto, user.id);
    return createResponse(result);
  }

  // ============================================================================
  // PROCESS SUBTASKS ENDPOINTS
  // ============================================================================

  @Post('processes/:processId/subtasks')
  async createProcessSubtask(
    @Param('processId', ParseUUIDPipe) processId: string,
    @Body() createDto: CreateProcessSubtaskDto,
    @CurrentUser() user: any,
  ): Promise<ApiResponse<any>> {
    const result = await this.productionPlanningService.createProcessSubtask(createDto, user.id);
    return createResponse(result);
  }

  @Get('processes/:processId/subtasks')
  async getProcessSubtasks(
    @Param('processId', ParseUUIDPipe) processId: string,
    @CurrentUser() user: any,
  ): Promise<ApiResponse<any[]>> {
    const result = await this.productionPlanningService.getProcessSubtasks(processId, user.id);
    return createResponse(result);
  }

  @Put('subtasks/:id')
  async updateProcessSubtask(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateProcessSubtaskDto,
    @CurrentUser() user: any,
  ): Promise<ApiResponse<any>> {
    const result = await this.productionPlanningService.updateProcessSubtask(id, updateDto, user.id);
    return createResponse(result);
  }

  // ============================================================================
  // DAILY PRODUCTION ENTRIES ENDPOINTS
  // ============================================================================

  @Post('lots/:lotId/production-entries')
  async createDailyProductionEntry(
    @Param('lotId', ParseUUIDPipe) lotId: string,
    @Body() createDto: CreateDailyProductionEntryDto,
    @CurrentUser() user: any,
  ): Promise<ApiResponse<DailyProductionEntryResponseDto>> {
    const result = await this.productionPlanningService.createDailyProductionEntry(createDto, user.id);
    return createResponse(result);
  }

  @Get('lots/:lotId/production-entries')
  async getDailyProductionEntries(
    @Param('lotId', ParseUUIDPipe) lotId: string,
    @CurrentUser() user: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('entryType') entryType?: string,
  ): Promise<ApiResponse<DailyProductionEntryResponseDto[]>> {
    const result = await this.productionPlanningService.getDailyProductionEntries(lotId, user.id, {
      startDate,
      endDate,
      entryType,
    });
    return createResponse(result);
  }

  @Put('production-entries/:id')
  async updateDailyProductionEntry(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateDailyProductionEntryDto,
    @CurrentUser() user: any,
  ): Promise<ApiResponse<DailyProductionEntryResponseDto>> {
    const result = await this.productionPlanningService.updateDailyProductionEntry(id, updateDto, user.id);
    return createResponse(result);
  }

  // ============================================================================
  // DASHBOARD & REPORTING ENDPOINTS
  // ============================================================================

  @Get('lots/:lotId/summary')
  async getProductionSummary(
    @Param('lotId', ParseUUIDPipe) lotId: string,
    @CurrentUser() user: any,
  ): Promise<ApiResponse<ProductionSummaryDto>> {
    const result = await this.productionPlanningService.getProductionSummary(lotId, user.id);
    return createResponse(result);
  }

  @Get('dashboard')
  async getDashboardData(
    @CurrentUser() user: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<ApiResponse<any>> {
    const result = await this.productionPlanningService.getDashboardData(user.id, { startDate, endDate });
    return createResponse(result);
  }

  @Get('lots/:lotId/gantt')
  async getGanttData(
    @Param('lotId', ParseUUIDPipe) lotId: string,
    @CurrentUser() user: any,
  ): Promise<ApiResponse<any>> {
    const result = await this.productionPlanningService.getGanttData(lotId, user.id);
    return createResponse(result);
  }

  // ============================================================================
  // MATERIAL TRACKING ENDPOINTS
  // ============================================================================

  @Post('lots/:lotId/materials/initialize')
  async initializeLotMaterials(
    @Param('lotId', ParseUUIDPipe) lotId: string,
    @CurrentUser() user: any,
  ): Promise<ApiResponse<any[]>> {
    const result = await this.materialTrackingService.initializeProductionLotMaterials(lotId, user.id);
    return createResponse(result);
  }

  @Get('lots/:lotId/materials')
  async getLotMaterials(
    @Param('lotId', ParseUUIDPipe) lotId: string,
    @CurrentUser() user: any,
  ): Promise<ApiResponse<any[]>> {
    const result = await this.materialTrackingService.getProductionLotMaterials(lotId, user.id);
    return createResponse(result);
  }

  @Put('materials/:materialId/status')
  async updateMaterialStatus(
    @Param('materialId', ParseUUIDPipe) materialId: string,
    @Body() updateData: any,
    @CurrentUser() user: any,
  ): Promise<ApiResponse<any>> {
    const result = await this.materialTrackingService.updateMaterialStatus(materialId, updateData, user.id);
    return createResponse(result);
  }

  @Get('materials/:materialId/tracking-history')
  async getMaterialTrackingHistory(
    @Param('materialId', ParseUUIDPipe) materialId: string,
    @CurrentUser() user: any,
  ): Promise<ApiResponse<any[]>> {
    const result = await this.materialTrackingService.getMaterialTrackingHistory(materialId, user.id);
    return createResponse(result);
  }

  // ============================================================================
  // INTEGRATED MONITORING ENDPOINTS
  // ============================================================================

  @Get('lots/:lotId/monitoring')
  async getProductionMonitoring(
    @Param('lotId', ParseUUIDPipe) lotId: string,
    @CurrentUser() user: any,
  ): Promise<ApiResponse<any>> {
    const result = await this.materialTrackingService.getProductionMonitoringData(lotId, user.id);
    return createResponse(result);
  }

  @Get('lots/:lotId/integrated-dashboard')
  async getIntegratedDashboard(
    @Param('lotId', ParseUUIDPipe) lotId: string,
    @CurrentUser() user: any,
  ): Promise<ApiResponse<any>> {
    const result = await this.materialTrackingService.getIntegratedDashboardData(lotId, user.id);
    return createResponse(result);
  }

  @Post('lots/:lotId/metrics')
  async recordProductionMetrics(
    @Param('lotId', ParseUUIDPipe) lotId: string,
    @Body() metricsData: any,
    @CurrentUser() user: any,
  ): Promise<ApiResponse<any>> {
    const result = await this.materialTrackingService.recordProductionMetrics(lotId, metricsData, user.id);
    return createResponse(result);
  }

  // ============================================================================
  // ALERTS MANAGEMENT ENDPOINTS
  // ============================================================================

  @Get('lots/:lotId/alerts')
  async getProductionAlerts(
    @Param('lotId', ParseUUIDPipe) lotId: string,
    @CurrentUser() user: any,
  ): Promise<ApiResponse<any[]>> {
    const result = await this.materialTrackingService.getProductionAlerts(lotId, user.id);
    return createResponse(result);
  }

  @Post('lots/:lotId/alerts')
  async createManualAlert(
    @Param('lotId', ParseUUIDPipe) lotId: string,
    @Body() alertData: any,
    @CurrentUser() user: any,
  ): Promise<ApiResponse<any>> {
    const result = await this.materialTrackingService.createManualAlert(lotId, alertData, user.id);
    return createResponse(result);
  }

  @Put('alerts/:alertId/resolve')
  async resolveAlert(
    @Param('alertId', ParseUUIDPipe) alertId: string,
    @Body() resolutionData: { notes: string },
    @CurrentUser() user: any,
  ): Promise<ApiResponse<any>> {
    const result = await this.materialTrackingService.resolveAlert(alertId, resolutionData.notes, user.id);
    return createResponse(result);
  }
}