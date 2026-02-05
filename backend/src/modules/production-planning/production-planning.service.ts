import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '@/common/supabase/supabase.service';
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

@Injectable()
export class ProductionPlanningService {
  constructor(private readonly supabaseService: SupabaseService) {}

  // ============================================================================
  // PRODUCTION LOTS METHODS
  // ============================================================================

  async createProductionLot(
    createDto: CreateProductionLotDto,
    userId: string,
  ): Promise<ProductionLotResponseDto> {
    const supabase = this.supabaseService.getClient();

    // Verify user owns the BOM
    const { data: bomCheck } = await supabase
      .from('boms')
      .select('id, user_id')
      .eq('id', createDto.bomId)
      .eq('user_id', userId)
      .single();

    if (!bomCheck) {
      throw new NotFoundException('BOM not found or you do not have permission to access it');
    }

    // Check if lot number is unique
    const { data: existingLot } = await supabase
      .from('production_lots')
      .select('id')
      .eq('lot_number', createDto.lotNumber)
      .single();

    if (existingLot) {
      throw new BadRequestException('Lot number already exists');
    }

    // Calculate total estimated cost based on BOM
    const totalEstimatedCost = await this.calculateEstimatedLotCost(
      createDto.bomId,
      createDto.productionQuantity,
    );

    // Create production lot
    const { data: lotData, error } = await supabase
      .from('production_lots')
      .insert({
        bom_id: createDto.bomId,
        lot_number: createDto.lotNumber,
        production_quantity: createDto.productionQuantity,
        planned_start_date: createDto.plannedStartDate,
        planned_end_date: createDto.plannedEndDate,
        priority: createDto.priority,
        lot_type: createDto.lotType,
        total_estimated_cost: totalEstimatedCost,
        remarks: createDto.remarks,
        created_by: userId,
      })
      .select('*')
      .single();

    if (error) {
      throw new BadRequestException(`Failed to create production lot: ${error.message}`);
    }

    // If specific BOM items are selected, create records for them
    if (createDto.selectedBomItemIds && createDto.selectedBomItemIds.length > 0) {
      const lotBomItems = createDto.selectedBomItemIds.map(itemId => ({
        production_lot_id: lotData.id,
        bom_item_id: itemId,
      }));

      const { error: itemsError } = await supabase
        .from('production_lot_bom_items')
        .insert(lotBomItems);

      if (itemsError) {
        // If inserting lot items fails, we should clean up the lot
        await supabase.from('production_lots').delete().eq('id', lotData.id);
        throw new BadRequestException(`Failed to associate BOM items: ${itemsError.message}`);
      }
    }

    // Fetch the complete lot data with BOM info and selected items
    const { data, error: fetchError } = await supabase
      .from('production_lots')
      .select(`
        *,
        bom:boms(
          id, 
          name, 
          version,
          items:bom_items(
            id,
            part_number,
            description,
            quantity,
            item_type,
            unit_cost,
            material_grade,
            make_buy
          )
        ),
        selected_bom_items:production_lot_bom_items(
          bom_item_id,
          bom_item:bom_items(
            id,
            part_number,
            description,
            quantity,
            item_type,
            unit_cost,
            material_grade,
            make_buy
          )
        )
      `)
      .eq('id', lotData.id)
      .single();

    if (fetchError) {
      throw new BadRequestException(`Failed to fetch production lot: ${fetchError.message}`);
    }

    return this.mapToProductionLotResponse(data);
  }

  async getProductionLots(
    userId: string,
    filters: { status?: string; bomId?: string; priority?: string },
  ): Promise<ProductionLotResponseDto[]> {
    const supabase = this.supabaseService.getClient();

    let query = supabase
      .from('production_lots')
      .select(`
        *,
        bom:boms(
          id, 
          name, 
          version
        ),
        selected_bom_items:production_lot_bom_items(
          bom_item_id,
          bom_item:bom_items(
            id,
            part_number,
            description,
            quantity,
            item_type,
            unit_cost,
            material_grade,
            make_buy
          )
        )
      `)
      .eq('boms.user_id', userId)
      .order('created_at', { ascending: false });

    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.bomId) {
      query = query.eq('bom_id', filters.bomId);
    }
    if (filters.priority) {
      query = query.eq('priority', filters.priority);
    }

    const { data, error } = await query;

    if (error) {
      throw new BadRequestException(`Failed to get production lots: ${error.message}`);
    }

    return data.map((lot) => this.mapToProductionLotResponse(lot));
  }

  async getProductionLotById(id: string, userId: string): Promise<ProductionLotResponseDto> {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('production_lots')
      .select(`
        *,
        bom:boms(
          id, 
          name, 
          version,
          items:bom_items(
            id,
            part_number,
            description,
            quantity,
            item_type,
            unit_cost,
            material_grade,
            make_buy
          )
        ),
        selected_bom_items:production_lot_bom_items(
          bom_item_id,
          bom_item:bom_items(
            id,
            part_number,
            description,
            quantity,
            item_type,
            unit_cost,
            material_grade,
            make_buy
          )
        ),
        vendor_assignments:lot_vendor_assignments(
          *,
          bom_item:bom_items(id, part_number, description),
          vendor:vendors(id, name, company_email)
        ),
        processes:production_processes(
          *,
          subtasks:process_subtasks(*)
        )
      `)
      .eq('id', id)
      .eq('boms.user_id', userId)
      .single();

    if (error || !data) {
      throw new NotFoundException('Production lot not found');
    }

    return this.mapToProductionLotResponse(data);
  }

  async updateProductionLot(
    id: string,
    updateDto: UpdateProductionLotDto,
    userId: string,
  ): Promise<ProductionLotResponseDto> {
    const supabase = this.supabaseService.getClient();

    // Verify ownership through BOM
    const { data: existingLot } = await supabase
      .from('production_lots')
      .select('id, boms!inner(user_id)')
      .eq('id', id)
      .eq('boms.user_id', userId)
      .single();

    if (!existingLot) {
      throw new NotFoundException('Production lot not found');
    }

    const { data, error } = await supabase
      .from('production_lots')
      .update({
        ...updateDto,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(`
        *,
        bom:boms(id, name, version)
      `)
      .single();

    if (error) {
      throw new BadRequestException(`Failed to update production lot: ${error.message}`);
    }

    return this.mapToProductionLotResponse(data);
  }

  async deleteProductionLot(id: string, userId: string): Promise<void> {
    const supabase = this.supabaseService.getClient();

    // Verify ownership through BOM
    const { data: existingLot } = await supabase
      .from('production_lots')
      .select('id, boms!inner(user_id)')
      .eq('id', id)
      .eq('boms.user_id', userId)
      .single();

    if (!existingLot) {
      throw new NotFoundException('Production lot not found');
    }

    const { error } = await supabase.from('production_lots').delete().eq('id', id);

    if (error) {
      throw new BadRequestException(`Failed to delete production lot: ${error.message}`);
    }
  }

  // ============================================================================
  // VENDOR ASSIGNMENT METHODS
  // ============================================================================

  async createVendorAssignment(
    createDto: CreateLotVendorAssignmentDto,
    userId: string,
  ): Promise<any> {
    const supabase = this.supabaseService.getClient();

    // Verify lot ownership
    await this.verifyLotOwnership(createDto.productionLotId, userId);

    const totalCost = createDto.unitCost ? createDto.requiredQuantity * createDto.unitCost : 0;

    const { data, error } = await supabase
      .from('lot_vendor_assignments')
      .insert({
        production_lot_id: createDto.productionLotId,
        bom_item_id: createDto.bomItemId,
        vendor_id: createDto.vendorId,
        required_quantity: createDto.requiredQuantity,
        unit_cost: createDto.unitCost || 0,
        total_cost: totalCost,
        expected_delivery_date: createDto.expectedDeliveryDate,
        remarks: createDto.remarks,
      })
      .select(`
        *,
        bom_item:bom_items(id, part_number, description),
        vendor:vendors(id, name, company_email)
      `)
      .single();

    if (error) {
      throw new BadRequestException(`Failed to create vendor assignment: ${error.message}`);
    }

    return data;
  }

  async bulkCreateVendorAssignments(
    bulkDto: BulkVendorAssignmentDto,
    userId: string,
  ): Promise<any[]> {
    const supabase = this.supabaseService.getClient();

    // Verify lot ownership
    await this.verifyLotOwnership(bulkDto.productionLotId, userId);

    const assignments = bulkDto.assignments.map((assignment) => ({
      production_lot_id: bulkDto.productionLotId,
      bom_item_id: assignment.bomItemId,
      vendor_id: assignment.vendorId,
      required_quantity: assignment.requiredQuantity,
      unit_cost: assignment.unitCost || 0,
      total_cost: assignment.unitCost
        ? assignment.requiredQuantity * assignment.unitCost
        : 0,
      expected_delivery_date: assignment.expectedDeliveryDate,
      remarks: assignment.remarks,
    }));

    const { data, error } = await supabase
      .from('lot_vendor_assignments')
      .insert(assignments)
      .select(`
        *,
        bom_item:bom_items(id, part_number, description),
        vendor:vendors(id, name, company_email)
      `);

    if (error) {
      throw new BadRequestException(`Failed to create vendor assignments: ${error.message}`);
    }

    return data;
  }

  async getVendorAssignments(lotId: string, userId: string): Promise<any[]> {
    const supabase = this.supabaseService.getClient();

    // Verify lot ownership
    await this.verifyLotOwnership(lotId, userId);

    const { data, error } = await supabase
      .from('lot_vendor_assignments')
      .select(`
        *,
        bom_item:bom_items(id, part_number, description),
        vendor:vendors(id, name, company_email)
      `)
      .eq('production_lot_id', lotId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new BadRequestException(`Failed to get vendor assignments: ${error.message}`);
    }

    return data;
  }

  async updateVendorAssignment(
    id: string,
    updateDto: UpdateLotVendorAssignmentDto,
    userId: string,
  ): Promise<any> {
    const supabase = this.supabaseService.getClient();

    // Verify ownership
    const { data: assignment } = await supabase
      .from('lot_vendor_assignments')
      .select('production_lot_id')
      .eq('id', id)
      .single();

    if (!assignment) {
      throw new NotFoundException('Vendor assignment not found');
    }

    await this.verifyLotOwnership(assignment.production_lot_id, userId);

    // Calculate total cost if unit cost or quantity is updated
    let updateData: any = { ...updateDto };
    if (updateDto.unitCost !== undefined || updateDto.requiredQuantity !== undefined) {
      const { data: currentAssignment } = await supabase
        .from('lot_vendor_assignments')
        .select('unit_cost, required_quantity')
        .eq('id', id)
        .single();

      const unitCost = updateDto.unitCost ?? currentAssignment?.unit_cost ?? 0;
      const quantity = updateDto.requiredQuantity ?? currentAssignment?.required_quantity ?? 0;
      updateData.total_cost = unitCost * quantity;
    }

    const { data, error } = await supabase
      .from('lot_vendor_assignments')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        bom_item:bom_items(id, part_number, description),
        vendor:vendors(id, name, company_email)
      `)
      .single();

    if (error) {
      throw new BadRequestException(`Failed to update vendor assignment: ${error.message}`);
    }

    return data;
  }

  async deleteVendorAssignment(id: string, userId: string): Promise<void> {
    const supabase = this.supabaseService.getClient();

    // Verify ownership
    const { data: assignment } = await supabase
      .from('lot_vendor_assignments')
      .select('production_lot_id')
      .eq('id', id)
      .single();

    if (!assignment) {
      throw new NotFoundException('Vendor assignment not found');
    }

    await this.verifyLotOwnership(assignment.production_lot_id, userId);

    const { error } = await supabase.from('lot_vendor_assignments').delete().eq('id', id);

    if (error) {
      throw new BadRequestException(`Failed to delete vendor assignment: ${error.message}`);
    }
  }

  // ============================================================================
  // PRODUCTION PROCESS METHODS
  // ============================================================================

  async createProductionProcess(
    createDto: CreateProductionProcessDto,
    userId: string,
  ): Promise<any> {
    const supabase = this.supabaseService.getClient();

    // Verify lot ownership
    await this.verifyLotOwnership(createDto.productionLotId, userId);

    const { data, error } = await supabase
      .from('production_processes')
      .insert({
        production_lot_id: createDto.productionLotId,
        process_id: createDto.processId,
        process_sequence: createDto.processSequence,
        process_name: createDto.processName,
        description: createDto.description,
        planned_start_date: createDto.plannedStartDate,
        planned_end_date: createDto.plannedEndDate,
        assigned_department: createDto.assignedDepartment,
        responsible_person: createDto.responsiblePerson,
        machine_allocation: createDto.machineAllocation ? JSON.stringify(createDto.machineAllocation) : null,
        depends_on_process_id: createDto.dependsOnProcessId,
        quality_check_required: createDto.qualityCheckRequired,
        remarks: createDto.remarks,
      })
      .select('*')
      .single();

    if (error) {
      throw new BadRequestException(`Failed to create production process: ${error.message}`);
    }

    return data;
  }

  async getProductionProcesses(
    lotId: string,
    userId: string,
    filters: { status?: string },
  ): Promise<any[]> {
    const supabase = this.supabaseService.getClient();

    // Verify lot ownership
    await this.verifyLotOwnership(lotId, userId);

    let query = supabase
      .from('production_processes')
      .select(`
        *,
        subtasks:process_subtasks(*)
      `)
      .eq('production_lot_id', lotId)
      .order('process_sequence', { ascending: true });

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;

    if (error) {
      throw new BadRequestException(`Failed to get production processes: ${error.message}`);
    }

    return data;
  }

  async updateProductionProcess(
    id: string,
    updateDto: UpdateProductionProcessDto,
    userId: string,
  ): Promise<any> {
    const supabase = this.supabaseService.getClient();

    // Verify ownership
    const { data: process } = await supabase
      .from('production_processes')
      .select('production_lot_id')
      .eq('id', id)
      .single();

    if (!process) {
      throw new NotFoundException('Production process not found');
    }

    await this.verifyLotOwnership(process.production_lot_id, userId);

    let updateData: any = { ...updateDto };
    if (updateDto.machineAllocation) {
      updateData.machine_allocation = JSON.stringify(updateDto.machineAllocation);
    }

    const { data, error } = await supabase
      .from('production_processes')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      throw new BadRequestException(`Failed to update production process: ${error.message}`);
    }

    return data;
  }

  // ============================================================================
  // PROCESS SUBTASK METHODS
  // ============================================================================

  async createProcessSubtask(createDto: CreateProcessSubtaskDto, userId: string): Promise<any> {
    const supabase = this.supabaseService.getClient();

    // Verify process ownership
    await this.verifyProcessOwnership(createDto.productionProcessId, userId);

    const { data, error } = await supabase
      .from('process_subtasks')
      .insert(createDto)
      .select('*')
      .single();

    if (error) {
      throw new BadRequestException(`Failed to create process subtask: ${error.message}`);
    }

    return data;
  }

  async getProcessSubtasks(processId: string, userId: string): Promise<any[]> {
    const supabase = this.supabaseService.getClient();

    // Verify process ownership
    await this.verifyProcessOwnership(processId, userId);

    const { data, error } = await supabase
      .from('process_subtasks')
      .select('*')
      .eq('production_process_id', processId)
      .order('task_sequence', { ascending: true });

    if (error) {
      throw new BadRequestException(`Failed to get process subtasks: ${error.message}`);
    }

    return data;
  }

  async updateProcessSubtask(
    id: string,
    updateDto: UpdateProcessSubtaskDto,
    userId: string,
  ): Promise<any> {
    const supabase = this.supabaseService.getClient();

    // Verify ownership
    const { data: subtask } = await supabase
      .from('process_subtasks')
      .select('production_process_id')
      .eq('id', id)
      .single();

    if (!subtask) {
      throw new NotFoundException('Process subtask not found');
    }

    await this.verifyProcessOwnership(subtask.production_process_id, userId);

    const { data, error } = await supabase
      .from('process_subtasks')
      .update(updateDto)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      throw new BadRequestException(`Failed to update process subtask: ${error.message}`);
    }

    return data;
  }

  // ============================================================================
  // DAILY PRODUCTION ENTRY METHODS
  // ============================================================================

  async createDailyProductionEntry(
    createDto: CreateDailyProductionEntryDto,
    userId: string,
  ): Promise<DailyProductionEntryResponseDto> {
    const supabase = this.supabaseService.getClient();

    // Verify lot ownership
    await this.verifyLotOwnership(createDto.productionLotId, userId);

    // Calculate efficiency percentage
    const efficiencyPercentage = createDto.plannedQuantity
      ? Math.round((createDto.actualQuantity / createDto.plannedQuantity) * 100)
      : 0;

    const { data, error } = await supabase
      .from('daily_production_entries')
      .insert({
        ...createDto,
        efficiency_percentage: efficiencyPercentage,
        entered_by: userId,
      })
      .select(`
        *,
        production_lot:production_lots(id, lot_number, production_quantity),
        production_process:production_processes(id, process_name, status)
      `)
      .single();

    if (error) {
      throw new BadRequestException(`Failed to create daily production entry: ${error.message}`);
    }

    return data;
  }

  async getDailyProductionEntries(
    lotId: string,
    userId: string,
    filters: { startDate?: string; endDate?: string; entryType?: string },
  ): Promise<DailyProductionEntryResponseDto[]> {
    const supabase = this.supabaseService.getClient();

    // Verify lot ownership
    await this.verifyLotOwnership(lotId, userId);

    let query = supabase
      .from('daily_production_entries')
      .select(`
        *,
        production_lot:production_lots(id, lot_number, production_quantity),
        production_process:production_processes(id, process_name, status)
      `)
      .eq('production_lot_id', lotId)
      .order('entry_date', { ascending: false });

    if (filters.startDate) {
      query = query.gte('entry_date', filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte('entry_date', filters.endDate);
    }
    if (filters.entryType) {
      query = query.eq('entry_type', filters.entryType);
    }

    const { data, error } = await query;

    if (error) {
      throw new BadRequestException(`Failed to get daily production entries: ${error.message}`);
    }

    return data;
  }

  async updateDailyProductionEntry(
    id: string,
    updateDto: UpdateDailyProductionEntryDto,
    userId: string,
  ): Promise<DailyProductionEntryResponseDto> {
    const supabase = this.supabaseService.getClient();

    // Verify ownership
    const { data: entry } = await supabase
      .from('daily_production_entries')
      .select('production_lot_id')
      .eq('id', id)
      .single();

    if (!entry) {
      throw new NotFoundException('Daily production entry not found');
    }

    await this.verifyLotOwnership(entry.production_lot_id, userId);

    // Recalculate efficiency if quantities are updated
    let updateData: any = { ...updateDto };
    if (updateDto.actualQuantity !== undefined || updateDto.plannedQuantity !== undefined) {
      const { data: currentEntry } = await supabase
        .from('daily_production_entries')
        .select('planned_quantity, actual_quantity')
        .eq('id', id)
        .single();

      const plannedQuantity = updateDto.plannedQuantity ?? currentEntry?.planned_quantity ?? 0;
      const actualQuantity = updateDto.actualQuantity ?? currentEntry?.actual_quantity ?? 0;

      updateData.efficiency_percentage = plannedQuantity
        ? Math.round((actualQuantity / plannedQuantity) * 100)
        : 0;
    }

    const { data, error } = await supabase
      .from('daily_production_entries')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        production_lot:production_lots(id, lot_number, production_quantity),
        production_process:production_processes(id, process_name, status)
      `)
      .single();

    if (error) {
      throw new BadRequestException(`Failed to update daily production entry: ${error.message}`);
    }

    return data;
  }

  // ============================================================================
  // DASHBOARD & REPORTING METHODS
  // ============================================================================

  async getProductionSummary(lotId: string, userId: string): Promise<ProductionSummaryDto> {
    const supabase = this.supabaseService.getClient();

    // Verify lot ownership
    await this.verifyLotOwnership(lotId, userId);

    // Get production entries data
    const { data: entries } = await supabase
      .from('daily_production_entries')
      .select('*')
      .eq('production_lot_id', lotId);

    // Get process data
    const { data: processes } = await supabase
      .from('production_processes')
      .select('status')
      .eq('production_lot_id', lotId);

    // Calculate summary metrics
    const totalPlannedQuantity = entries?.reduce((sum, entry) => sum + entry.planned_quantity, 0) || 0;
    const totalActualQuantity = entries?.reduce((sum, entry) => sum + entry.actual_quantity, 0) || 0;
    const totalRejectedQuantity = entries?.reduce((sum, entry) => sum + entry.rejected_quantity, 0) || 0;
    const totalReworkQuantity = entries?.reduce((sum, entry) => sum + entry.rework_quantity, 0) || 0;

    const overallEfficiency = totalPlannedQuantity
      ? Math.round((totalActualQuantity / totalPlannedQuantity) * 100)
      : 0;

    const totalDowntime = entries?.reduce((sum, entry) => sum + entry.downtime_hours, 0) || 0;

    const activeProcesses = processes?.filter(p => p.status === 'in_progress').length || 0;
    const completedProcesses = processes?.filter(p => p.status === 'completed').length || 0;

    // Daily production trend
    const dailyProduction = entries?.map(entry => ({
      date: entry.entry_date,
      plannedQuantity: entry.planned_quantity,
      actualQuantity: entry.actual_quantity,
      efficiency: entry.efficiency_percentage,
    })) || [];

    // Quality metrics
    const totalProduced = totalActualQuantity + totalRejectedQuantity + totalReworkQuantity;
    const acceptanceRate = totalProduced ? Math.round((totalActualQuantity / totalProduced) * 100) : 0;
    const rejectionRate = totalProduced ? Math.round((totalRejectedQuantity / totalProduced) * 100) : 0;
    const reworkRate = totalProduced ? Math.round((totalReworkQuantity / totalProduced) * 100) : 0;
    const firstPassYield = totalProduced ? Math.round(((totalActualQuantity + totalReworkQuantity) / totalProduced) * 100) : 0;

    return {
      totalPlannedQuantity,
      totalActualQuantity,
      totalRejectedQuantity,
      totalReworkQuantity,
      overallEfficiency,
      totalDowntime,
      activeProcesses,
      completedProcesses,
      dailyProduction,
      qualityMetrics: {
        acceptanceRate,
        rejectionRate,
        reworkRate,
        firstPassYield,
      },
    };
  }

  async getDashboardData(
    userId: string,
    filters: { startDate?: string; endDate?: string },
  ): Promise<any> {
    const supabase = this.supabaseService.getClient();

    // Get lots with basic stats
    let query = supabase
      .from('production_lots')
      .select(`
        *,
        bom:boms!inner(user_id),
        processes:production_processes(status),
        entries:daily_production_entries(actual_quantity, rejected_quantity, efficiency_percentage)
      `)
      .eq('boms.user_id', userId);

    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate);
    }

    const { data: lots } = await query;

    // Calculate dashboard metrics
    const totalLots = lots?.length || 0;
    const activeLots = lots?.filter(lot => lot.status === 'in_production').length || 0;
    const completedLots = lots?.filter(lot => lot.status === 'completed').length || 0;
    const plannedLots = lots?.filter(lot => lot.status === 'planned').length || 0;

    // Overall production metrics
    const overallProduction = lots?.reduce((sum, lot) => {
      const lotProduction = lot.entries?.reduce((entrySum: number, entry: any) => entrySum + entry.actual_quantity, 0) || 0;
      return sum + lotProduction;
    }, 0) || 0;

    const overallRejected = lots?.reduce((sum, lot) => {
      const lotRejected = lot.entries?.reduce((entrySum: number, entry: any) => entrySum + entry.rejected_quantity, 0) || 0;
      return sum + lotRejected;
    }, 0) || 0;

    const averageEfficiency = lots?.length 
      ? Math.round(lots.reduce((sum, lot) => {
          const lotEfficiency = lot.entries?.length 
            ? lot.entries.reduce((entrySum: number, entry: any) => entrySum + entry.efficiency_percentage, 0) / lot.entries.length
            : 0;
          return sum + lotEfficiency;
        }, 0) / lots.length)
      : 0;

    return {
      summary: {
        totalLots,
        activeLots,
        completedLots,
        plannedLots,
        overallProduction,
        overallRejected,
        averageEfficiency,
      },
      lots: lots?.slice(0, 10) || [], // Recent 10 lots
    };
  }

  async getGanttData(lotId: string, userId: string): Promise<any> {
    const supabase = this.supabaseService.getClient();

    // Verify lot ownership
    await this.verifyLotOwnership(lotId, userId);

    const { data: processes } = await supabase
      .from('production_processes')
      .select(`
        *,
        subtasks:process_subtasks(*)
      `)
      .eq('production_lot_id', lotId)
      .order('process_sequence', { ascending: true });

    // Transform data for Gantt chart
    const ganttData = processes?.map(process => ({
      id: process.id,
      name: process.process_name,
      start: process.planned_start_date,
      end: process.planned_end_date,
      progress: process.completion_percentage,
      status: process.status,
      dependencies: process.depends_on_process_id ? [process.depends_on_process_id] : [],
      subtasks: process.subtasks?.map((subtask: any) => ({
        id: subtask.id,
        name: subtask.task_name,
        duration: subtask.estimated_duration_hours,
        status: subtask.status,
        assignedOperator: subtask.assigned_operator,
      })) || [],
    })) || [];

    return {
      processes: ganttData,
      timeline: {
        start: processes?.[0]?.planned_start_date,
        end: processes?.[processes.length - 1]?.planned_end_date,
      },
    };
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private async verifyLotOwnership(lotId: string, userId: string): Promise<void> {
    const supabase = this.supabaseService.getClient();

    const { data } = await supabase
      .from('production_lots')
      .select('id, boms!inner(user_id)')
      .eq('id', lotId)
      .eq('boms.user_id', userId)
      .single();

    if (!data) {
      throw new NotFoundException('Production lot not found or you do not have permission to access it');
    }
  }

  private async verifyProcessOwnership(processId: string, userId: string): Promise<void> {
    const supabase = this.supabaseService.getClient();

    const { data } = await supabase
      .from('production_processes')
      .select(`
        id,
        production_lots!inner(
          boms!inner(user_id)
        )
      `)
      .eq('id', processId)
      .eq('production_lots.boms.user_id', userId)
      .single();

    if (!data) {
      throw new NotFoundException('Production process not found or you do not have permission to access it');
    }
  }

  private async calculateEstimatedLotCost(bomId: string, quantity: number): Promise<number> {
    const supabase = this.supabaseService.getClient();

    // Get BOM items total cost
    const { data: bomCost } = await supabase
      .rpc('calculate_bom_total_cost', { bom_id: bomId })
      .single();

    const cost = typeof bomCost === 'number' ? bomCost : Number(bomCost) || 0;
    return cost * quantity;
  }

  private mapToProductionLotResponse(data: any): ProductionLotResponseDto {
    // Transform BOM data to match DTO structure
    const bom = data.bom ? {
      id: data.bom.id,
      name: data.bom.name,
      version: data.bom.version,
      items: data.bom.items?.map((item: any) => ({
        id: item.id,
        partNumber: item.part_number,
        description: item.description,
        quantity: item.quantity,
        itemType: item.item_type,
        unitCost: item.unit_cost,
        materialGrade: item.material_grade,
        makeBuy: item.make_buy,
      })) || [],
    } : undefined;

    // Transform selected BOM items
    const selectedBomItems = data.selected_bom_items?.map((selectedItem: any) => ({
      id: selectedItem.bom_item.id,
      partNumber: selectedItem.bom_item.part_number,
      description: selectedItem.bom_item.description,
      quantity: selectedItem.bom_item.quantity,
      itemType: selectedItem.bom_item.item_type,
      unitCost: selectedItem.bom_item.unit_cost,
      materialGrade: selectedItem.bom_item.material_grade,
      makeBuy: selectedItem.bom_item.make_buy,
    })) || [];

    return {
      id: data.id,
      bomId: data.bom_id,
      lotNumber: data.lot_number,
      productionQuantity: data.production_quantity,
      status: data.status,
      plannedStartDate: data.planned_start_date,
      plannedEndDate: data.planned_end_date,
      actualStartDate: data.actual_start_date,
      actualEndDate: data.actual_end_date,
      priority: data.priority,
      lotType: data.lot_type,
      totalMaterialCost: data.total_material_cost,
      totalProcessCost: data.total_process_cost,
      totalEstimatedCost: data.total_estimated_cost,
      remarks: data.remarks,
      createdBy: data.created_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      bom: bom,
      selectedBomItems: selectedBomItems,
      vendorAssignments: data.vendor_assignments || [],
      processes: data.processes || [],
    };
  }
}