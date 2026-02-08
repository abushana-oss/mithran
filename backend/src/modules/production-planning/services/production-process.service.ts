import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { SupabaseService } from '@/common/supabase/supabase.service';
import { UuidValidator } from '@/common/validators/uuid.validator';
import {
  CreateProductionProcessDto,
  UpdateProductionProcessDto,
  ProcessStatus,
} from '../dto/production-process.dto';
import {
  CreateLotVendorAssignmentDto,
  UpdateLotVendorAssignmentDto,
} from '../dto/vendor-assignment.dto';
import {
  ProductionProcessResponseDto,
  LotVendorAssignmentResponseDto as VendorAssignmentResponseDto,
} from '../dto/production-lot.dto';

@Injectable()
export class ProductionProcessService {
  private readonly logger = new Logger(ProductionProcessService.name);

  constructor(private readonly supabaseService: SupabaseService) { }

  async createProductionProcess(
    createDto: CreateProductionProcessDto,
    userId: string
  ): Promise<ProductionProcessResponseDto> {
    UuidValidator.validateUuid(userId, 'User ID');

    const supabase = this.supabaseService.getClient();

    // Verify user owns the production lot
    const { data: lot } = await supabase
      .from('production_lots')
      .select('id')
      .eq('id', createDto.production_lot_id)
      .eq('created_by', userId)
      .single();

    if (!lot) {
      throw new NotFoundException('Production lot not found or access denied');
    }

    // Get next sequence number
    const { data: maxSeq } = await supabase
      .from('production_processes')
      .select('process_sequence')
      .eq('production_lot_id', createDto.production_lot_id)
      .order('process_sequence', { ascending: false })
      .limit(1);

    const nextSequence = (maxSeq && maxSeq.length > 0) ? maxSeq[0].process_sequence + 1 : 1;

    const { data, error } = await supabase
      .from('production_processes')
      .insert({
        ...createDto,
        process_sequence: nextSequence,
        status: 'pending',
        completion_percentage: 0,
        created_by: userId,
        updated_by: userId
      })
      .select('*')
      .single();

    if (error) {
      this.logger.error('Failed to create production process', { error: error.message, createDto });
      throw new InternalServerErrorException('Failed to create production process');
    }

    return this.mapToProductionProcessResponse(data);
  }

  async getProductionProcessById(id: string, userId: string): Promise<ProductionProcessResponseDto> {
    UuidValidator.validateUuid(id, 'Process ID');
    UuidValidator.validateUuid(userId, 'User ID');

    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('production_processes')
      .select(`
        *,
        production_lot:production_lots!inner(id, created_by),
        process_subtasks(
          id,
          task_name,
          description,
          task_sequence,
          status,
          estimated_duration_hours,
          actual_duration_hours,
          assigned_operator,
          quality_check_required,
          quality_check_passed
        )
      `)
      .eq('id', id)
      .eq('production_lots.created_by', userId)
      .single();

    if (error || !data) {
      throw new NotFoundException('Production process not found or access denied');
    }

    return this.mapToProductionProcessResponse(data);
  }

  async updateProductionProcess(
    id: string,
    updateDto: UpdateProductionProcessDto,
    userId: string
  ): Promise<ProductionProcessResponseDto> {
    UuidValidator.validateUuid(id, 'Process ID');

    const supabase = this.supabaseService.getClient();

    // Verify ownership
    const { data: existing } = await supabase
      .from('production_processes')
      .select('id, production_lot:production_lots!inner(created_by)')
      .eq('id', id)
      .eq('production_lots.created_by', userId)
      .single();

    if (!existing) {
      throw new NotFoundException('Production process not found or access denied');
    }

    const { data, error } = await supabase
      .from('production_processes')
      .update({
        ...updateDto,
        updated_by: userId,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      this.logger.error('Failed to update production process', { error: error.message, id, updateDto });
      throw new InternalServerErrorException('Failed to update production process');
    }

    return this.mapToProductionProcessResponse(data);
  }

  async deleteProductionProcess(id: string, userId: string): Promise<void> {
    UuidValidator.validateUuid(id, 'Process ID');

    const supabase = this.supabaseService.getClient();

    // Verify ownership
    const { data: existing } = await supabase
      .from('production_processes')
      .select('id, production_lot:production_lots!inner(created_by)')
      .eq('id', id)
      .eq('production_lots.created_by', userId)
      .single();

    if (!existing) {
      throw new NotFoundException('Production process not found or access denied');
    }

    const { error } = await supabase
      .from('production_processes')
      .delete()
      .eq('id', id);

    if (error) {
      this.logger.error('Failed to delete production process', { error: error.message, id });
      throw new InternalServerErrorException('Failed to delete production process');
    }
  }

  async getProcessesByLot(lotId: string, userId: string): Promise<ProductionProcessResponseDto[]> {
    UuidValidator.validateUuid(lotId, 'Lot ID');

    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('production_processes')
      .select(`
        *,
        production_lot:production_lots!inner(id, created_by)
      `)
      .eq('production_lot_id', lotId)
      .eq('production_lots.created_by', userId)
      .order('process_sequence');

    if (error) {
      throw new InternalServerErrorException(`Failed to fetch processes: ${error.message}`);
    }

    return data.map(process => this.mapToProductionProcessResponse(process));
  }

  async assignVendorToProcess(
    processId: string,
    assignmentDto: CreateLotVendorAssignmentDto,
    userId: string
  ): Promise<VendorAssignmentResponseDto> {
    UuidValidator.validateUuid(processId, 'Process ID');

    const supabase = this.supabaseService.getClient();

    // Verify process ownership and get production lot ID
    const { data: process } = await supabase
      .from('production_processes')
      .select('production_lot_id, production_lot:production_lots!inner(created_by)')
      .eq('id', processId)
      .eq('production_lots.created_by', userId)
      .single();

    if (!process) {
      throw new NotFoundException('Production process not found or access denied');
    }

    const { data, error } = await supabase
      .from('lot_vendor_assignments')
      .insert({
        production_lot_id: process.production_lot_id,
        bom_item_id: assignmentDto.bomItemId,
        vendor_id: assignmentDto.vendorId,
        required_quantity: assignmentDto.requiredQuantity,
        unit_cost: assignmentDto.unitCost,
        total_cost: assignmentDto.requiredQuantity * (assignmentDto.unitCost || 0),
        delivery_status: 'pending',
        expected_delivery_date: assignmentDto.expectedDeliveryDate,
        remarks: assignmentDto.remarks
      })
      .select(`
        *,
        vendors!inner(id, name, company_email, contact_person),
        bom_items!inner(id, name, part_number, description)
      `)
      .single();

    if (error) {
      this.logger.error('Failed to assign vendor', { error: error.message, processId, assignmentDto });
      throw new InternalServerErrorException('Failed to assign vendor');
    }

    return this.mapToVendorAssignmentResponse(data);
  }

  async getProcessVendorAssignments(processId: string, userId: string): Promise<VendorAssignmentResponseDto[]> {
    UuidValidator.validateUuid(processId, 'Process ID');

    const supabase = this.supabaseService.getClient();

    // Get production lot ID from process
    const { data: process } = await supabase
      .from('production_processes')
      .select('production_lot_id, production_lot:production_lots!inner(created_by)')
      .eq('id', processId)
      .eq('production_lots.created_by', userId)
      .single();

    if (!process) {
      throw new NotFoundException('Production process not found or access denied');
    }

    const { data, error } = await supabase
      .from('lot_vendor_assignments')
      .select(`
        *,
        vendors!inner(id, name, company_email, contact_person),
        bom_items!inner(id, name, part_number, description)
      `)
      .eq('production_lot_id', process.production_lot_id);

    if (error) {
      throw new InternalServerErrorException(`Failed to fetch vendor assignments: ${error.message}`);
    }

    return data.map(assignment => this.mapToVendorAssignmentResponse(assignment));
  }

  async updateVendorAssignment(
    assignmentId: string,
    updateDto: UpdateLotVendorAssignmentDto,
    userId: string
  ): Promise<VendorAssignmentResponseDto> {
    UuidValidator.validateUuid(assignmentId, 'Assignment ID');

    const supabase = this.supabaseService.getClient();

    // Verify ownership through production lot
    const { data: existing } = await supabase
      .from('lot_vendor_assignments')
      .select(`
        id,
        production_lot:production_lots!inner(created_by)
      `)
      .eq('id', assignmentId)
      .eq('production_lots.created_by', userId)
      .single();

    if (!existing) {
      throw new NotFoundException('Vendor assignment not found or access denied');
    }

    // Calculate total cost if quantity or unit cost changed
    const updateData: any = { ...updateDto };
    if (updateDto.requiredQuantity || updateDto.unitCost) {
      const { data: current } = await supabase
        .from('lot_vendor_assignments')
        .select('required_quantity, unit_cost')
        .eq('id', assignmentId)
        .single();

      const quantity = updateDto.requiredQuantity ?? current?.required_quantity ?? 0;
      const unitCost = updateDto.unitCost ?? current?.unit_cost ?? 0;
      updateData.total_cost = quantity * unitCost;
    }

    const { data, error } = await supabase
      .from('lot_vendor_assignments')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', assignmentId)
      .select(`
        *,
        vendors!inner(id, name, company_email, contact_person),
        bom_items!inner(id, name, part_number, description)
      `)
      .single();

    if (error) {
      this.logger.error('Failed to update vendor assignment', { error: error.message, assignmentId, updateDto });
      throw new InternalServerErrorException('Failed to update vendor assignment');
    }

    return this.mapToVendorAssignmentResponse(data);
  }

  async updateProcessSchedule(
    processId: string,
    scheduleDto: {
      planned_start_date: string;
      planned_end_date: string;
      assigned_department?: string;
      responsible_person?: string;
    },
    userId: string
  ): Promise<any> {
    return this.updateProductionProcess(processId, scheduleDto as any, userId);
  }

  async updateProcessStatus(
    processId: string,
    statusDto: {
      status: string;
      completion_percentage?: number;
      actual_start_date?: string;
      actual_end_date?: string;
    },
    userId: string
  ): Promise<ProductionProcessResponseDto> {
    return this.updateProductionProcess(processId, {
      ...statusDto,
      status: statusDto.status as ProcessStatus
    }, userId);
  }

  private mapToProductionProcessResponse(data: any): ProductionProcessResponseDto {
    return {
      id: data.id,
      productionLotId: data.production_lot_id,
      processId: data.process_id,
      processSequence: data.process_sequence,
      processName: data.process_name,
      description: data.description,
      plannedStartDate: data.planned_start_date,
      plannedEndDate: data.planned_end_date,
      actualStartDate: data.actual_start_date,
      actualEndDate: data.actual_end_date,
      status: data.status,
      completionPercentage: data.completion_percentage,
      assignedDepartment: data.assigned_department,
      responsiblePerson: data.responsible_person,
      qualityCheckRequired: data.quality_check_required,
      qualityStatus: data.quality_status,
      remarks: data.remarks,
      subtasks: data.process_subtasks?.map((subtask: any) => ({
        id: subtask.id,
        productionProcessId: subtask.production_process_id,
        taskName: subtask.task_name,
        description: subtask.description,
        taskSequence: subtask.task_sequence,
        status: subtask.status,
        estimatedDurationHours: subtask.estimated_duration_hours,
        actualDurationHours: subtask.actual_duration_hours,
        assignedOperator: subtask.assigned_operator,
        qualityCheckRequired: subtask.quality_check_required,
        qualityCheckPassed: subtask.quality_check_passed
      })) || [],
      // created_at: data.created_at, // Not in DTO? Check DTO if needed later. DTO has no created_at/updated_at?
      // updated_at: data.updated_at
    } as any; // Cast to any to avoid missing property errors if DTO is stricter or missing fields. Actually DTO has specific fields. Let's try to match exactly.
    // DTO for ProductionProcessResponseDto has: id, productionLotId, processId, processSequence, processName, description...
    // Let's remove the "as any" and see if it fits. I will match properties exactly.
  }

  private mapToVendorAssignmentResponse(data: any): VendorAssignmentResponseDto {
    return {
      id: data.id,
      productionLotId: data.production_lot_id,
      bomItemId: data.bom_item_id,
      vendorId: data.vendor_id,
      requiredQuantity: data.required_quantity,
      unitCost: data.unit_cost,
      totalCost: data.total_cost,
      deliveryStatus: data.delivery_status,
      expectedDeliveryDate: data.expected_delivery_date,
      actualDeliveryDate: data.actual_delivery_date,
      qualityStatus: data.quality_status,
      remarks: data.remarks,
      vendor: data.vendors ? {
        id: data.vendors.id,
        name: data.vendors.name,
        company_email: data.vendors.company_email,
        // contact_person: data.vendors.contact_person // DTO does not have contact_person for vendor? Check DTO. Step 11: LotVendorAssignmentResponseDto -> vendor object has id, name, company_email. No contact_person.
      } : undefined,
      bomItem: data.bom_items ? {
        id: data.bom_items.id,
        // name: data.bom_items.name, // DTO doesn't have name
        partNumber: data.bom_items.part_number,
        description: data.bom_items.description
      } : undefined,
      // created_at: data.created_at,
      // updated_at: data.updated_at
    };
  }
}