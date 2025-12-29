import { Injectable, NotFoundException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { Logger } from '../../common/logger/logger.service';
import { SupabaseService } from '../../common/supabase/supabase.service';
import {
  CreateProcessRouteDto,
  UpdateProcessRouteDto,
  QueryProcessRoutesDto,
  CreateProcessRouteStepDto,
  UpdateProcessRouteStepDto,
  ReorderStepsDto,
} from './dto/process-routes.dto';
import {
  ProcessRouteResponseDto,
  ProcessRouteListResponseDto,
  ProcessRouteStepResponseDto,
  CostBreakdownDto,
} from './dto/process-route-response.dto';

@Injectable()
export class ProcessRoutesService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly logger: Logger,
  ) {}

  // ============================================================================
  // PROCESS ROUTES - CRUD OPERATIONS
  // ============================================================================

  async findAll(query: QueryProcessRoutesDto, userId: string, accessToken: string): Promise<ProcessRouteListResponseDto> {
    this.logger.log('Fetching all process routes', 'ProcessRoutesService');

    const page = query.page || 1;
    const limit = Math.min(query.limit || 10, 100);
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let queryBuilder = this.supabaseService
      .getClient(accessToken)
      .from('process_routes')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    // Filter by BOM item if specified
    if (query.bomItemId) {
      queryBuilder = queryBuilder.eq('bom_item_id', query.bomItemId);
    }

    // Apply search filter
    if (query.search) {
      queryBuilder = queryBuilder.or(`name.ilike.%${query.search}%,description.ilike.%${query.search}%`);
    }

    const { data, error, count } = await queryBuilder;

    if (error) {
      this.logger.error(`Error fetching process routes: ${error.message}`, 'ProcessRoutesService');
      throw new InternalServerErrorException(`Failed to fetch process routes: ${error.message}`);
    }

    const routes = (data || []).map(row => ProcessRouteResponseDto.fromDatabase(row));

    return {
      routes,
      count: count || 0,
      page,
      limit,
    };
  }

  async findOne(id: string, userId: string, accessToken: string): Promise<ProcessRouteResponseDto> {
    this.logger.log(`Fetching process route: ${id}`, 'ProcessRoutesService');

    const { data, error } = await this.supabaseService
      .getClient(accessToken)
      .from('process_routes')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      this.logger.error(`Process route not found: ${id}`, 'ProcessRoutesService');
      throw new NotFoundException(`Process route with ID ${id} not found`);
    }

    // Fetch steps for this route
    const stepsData = await this.getRouteSteps(id, accessToken);
    const route = ProcessRouteResponseDto.fromDatabase(data);
    route.steps = stepsData;

    return route;
  }

  async create(createDto: CreateProcessRouteDto, userId: string, accessToken: string): Promise<ProcessRouteResponseDto> {
    this.logger.log('Creating process route', 'ProcessRoutesService');

    const { data, error } = await this.supabaseService
      .getClient(accessToken)
      .from('process_routes')
      .insert({
        bom_item_id: createDto.bomItemId,
        name: createDto.name,
        description: createDto.description,
        is_template: createDto.isTemplate,
        template_name: createDto.templateName,
        user_id: userId,
      })
      .select()
      .single();

    if (error || !data) {
      this.logger.error(`Error creating process route: ${error?.message}`, 'ProcessRoutesService');
      throw new InternalServerErrorException(`Failed to create process route: ${error?.message}`);
    }

    return ProcessRouteResponseDto.fromDatabase(data);
  }

  async update(id: string, updateDto: UpdateProcessRouteDto, userId: string, accessToken: string): Promise<ProcessRouteResponseDto> {
    this.logger.log(`Updating process route: ${id}`, 'ProcessRoutesService');

    const updateData: any = {};
    if (updateDto.name !== undefined) updateData.name = updateDto.name;
    if (updateDto.description !== undefined) updateData.description = updateDto.description;
    if (updateDto.isTemplate !== undefined) updateData.is_template = updateDto.isTemplate;
    if (updateDto.templateName !== undefined) updateData.template_name = updateDto.templateName;

    const { data, error } = await this.supabaseService
      .getClient(accessToken)
      .from('process_routes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      this.logger.error(`Error updating process route: ${error?.message}`, 'ProcessRoutesService');
      throw new NotFoundException(`Failed to update process route with ID ${id}`);
    }

    return ProcessRouteResponseDto.fromDatabase(data);
  }

  async remove(id: string, userId: string, accessToken: string): Promise<{ message: string }> {
    this.logger.log(`Deleting process route: ${id}`, 'ProcessRoutesService');

    const { error } = await this.supabaseService
      .getClient(accessToken)
      .from('process_routes')
      .delete()
      .eq('id', id);

    if (error) {
      this.logger.error(`Error deleting process route: ${error.message}`, 'ProcessRoutesService');
      throw new InternalServerErrorException(`Failed to delete process route: ${error.message}`);
    }

    return { message: 'Process route deleted successfully' };
  }

  // ============================================================================
  // PROCESS ROUTE STEPS - CRUD OPERATIONS
  // ============================================================================

  async getRouteSteps(routeId: string, accessToken: string): Promise<ProcessRouteStepResponseDto[]> {
    const { data, error } = await this.supabaseService
      .getClient(accessToken)
      .from('process_route_steps')
      .select('*')
      .eq('process_route_id', routeId)
      .order('step_number', { ascending: true });

    if (error) {
      this.logger.error(`Error fetching route steps: ${error.message}`, 'ProcessRoutesService');
      throw new InternalServerErrorException(`Failed to fetch route steps: ${error.message}`);
    }

    return (data || []).map(row => ProcessRouteStepResponseDto.fromDatabase(row));
  }

  async addStep(createDto: CreateProcessRouteStepDto, userId: string, accessToken: string): Promise<ProcessRouteStepResponseDto> {
    this.logger.log('Adding process route step', 'ProcessRoutesService');

    const { data, error } = await this.supabaseService
      .getClient(accessToken)
      .from('process_route_steps')
      .insert({
        process_route_id: createDto.processRouteId,
        process_id: createDto.processId,
        step_number: createDto.stepNumber,
        operation_name: createDto.operationName,
        setup_time_minutes: createDto.setupTimeMinutes,
        cycle_time_minutes: createDto.cycleTimeMinutes,
        labor_hours: createDto.laborHours,
        machine_hours: createDto.machineHours,
        machine_hour_rate_id: createDto.machineHourRateId,
        labor_hour_rate_id: createDto.laborHourRateId,
        notes: createDto.notes,
      })
      .select()
      .single();

    if (error || !data) {
      this.logger.error(`Error adding process route step: ${error?.message}`, 'ProcessRoutesService');
      throw new InternalServerErrorException(`Failed to add process route step: ${error?.message}`);
    }

    return ProcessRouteStepResponseDto.fromDatabase(data);
  }

  async updateStep(stepId: string, updateDto: UpdateProcessRouteStepDto, userId: string, accessToken: string): Promise<ProcessRouteStepResponseDto> {
    this.logger.log(`Updating process route step: ${stepId}`, 'ProcessRoutesService');

    const updateData: any = {};
    if (updateDto.processId !== undefined) updateData.process_id = updateDto.processId;
    if (updateDto.stepNumber !== undefined) updateData.step_number = updateDto.stepNumber;
    if (updateDto.operationName !== undefined) updateData.operation_name = updateDto.operationName;
    if (updateDto.setupTimeMinutes !== undefined) updateData.setup_time_minutes = updateDto.setupTimeMinutes;
    if (updateDto.cycleTimeMinutes !== undefined) updateData.cycle_time_minutes = updateDto.cycleTimeMinutes;
    if (updateDto.laborHours !== undefined) updateData.labor_hours = updateDto.laborHours;
    if (updateDto.machineHours !== undefined) updateData.machine_hours = updateDto.machineHours;
    if (updateDto.machineHourRateId !== undefined) updateData.machine_hour_rate_id = updateDto.machineHourRateId;
    if (updateDto.laborHourRateId !== undefined) updateData.labor_hour_rate_id = updateDto.laborHourRateId;
    if (updateDto.notes !== undefined) updateData.notes = updateDto.notes;

    const { data, error } = await this.supabaseService
      .getClient(accessToken)
      .from('process_route_steps')
      .update(updateData)
      .eq('id', stepId)
      .select()
      .single();

    if (error || !data) {
      this.logger.error(`Error updating process route step: ${error?.message}`, 'ProcessRoutesService');
      throw new NotFoundException(`Failed to update process route step with ID ${stepId}`);
    }

    return ProcessRouteStepResponseDto.fromDatabase(data);
  }

  async removeStep(stepId: string, userId: string, accessToken: string): Promise<{ message: string }> {
    this.logger.log(`Deleting process route step: ${stepId}`, 'ProcessRoutesService');

    const { error } = await this.supabaseService
      .getClient(accessToken)
      .from('process_route_steps')
      .delete()
      .eq('id', stepId);

    if (error) {
      this.logger.error(`Error deleting process route step: ${error.message}`, 'ProcessRoutesService');
      throw new InternalServerErrorException(`Failed to delete process route step: ${error.message}`);
    }

    return { message: 'Process route step deleted successfully' };
  }

  async reorderSteps(routeId: string, reorderDto: ReorderStepsDto, userId: string, accessToken: string): Promise<{ message: string }> {
    this.logger.log(`Reordering steps for route: ${routeId}`, 'ProcessRoutesService');

    // Update each step's step_number
    for (const step of reorderDto.steps) {
      await this.supabaseService
        .getClient(accessToken)
        .from('process_route_steps')
        .update({ step_number: step.stepNumber })
        .eq('id', step.id);
    }

    return { message: 'Steps reordered successfully' };
  }

  // ============================================================================
  // COST CALCULATION
  // ============================================================================

  async calculateRouteCost(routeId: string, userId: string, accessToken: string): Promise<CostBreakdownDto> {
    this.logger.log(`Calculating cost for route: ${routeId}`, 'ProcessRoutesService');

    // Fetch all steps for this route
    const steps = await this.getRouteSteps(routeId, accessToken);

    let totalCost = 0;
    let totalSetupTime = 0;
    let totalCycleTime = 0;

    // Calculate cost for each step
    for (const step of steps) {
      let stepCost = 0;

      // Calculate machine cost if applicable
      if (step.machineHourRateId && step.machineHours) {
        const mhr = await this.fetchMachineHourRate(step.machineHourRateId, accessToken);
        if (mhr && mhr.hourly_rate) {
          const machineCost = step.machineHours * parseFloat(mhr.hourly_rate);
          stepCost += machineCost;
        }
      }

      // Calculate labor cost if applicable
      if (step.laborHourRateId && step.laborHours) {
        const lhr = await this.fetchLaborHourRate(step.laborHourRateId, accessToken);
        if (lhr && lhr.hourly_rate) {
          const laborCost = step.laborHours * parseFloat(lhr.hourly_rate);
          stepCost += laborCost;
        }
      }

      // Update step calculated_cost
      await this.supabaseService
        .getClient(accessToken)
        .from('process_route_steps')
        .update({ calculated_cost: stepCost })
        .eq('id', step.id);

      // Update the step object
      step.calculatedCost = stepCost;

      totalCost += stepCost;
      totalSetupTime += step.setupTimeMinutes || 0;
      totalCycleTime += step.cycleTimeMinutes || 0;
    }

    // Update route totals
    await this.supabaseService
      .getClient(accessToken)
      .from('process_routes')
      .update({
        total_cost: totalCost,
        total_setup_time_minutes: totalSetupTime,
        total_cycle_time_minutes: totalCycleTime,
      })
      .eq('id', routeId);

    return {
      totalCost,
      totalSetupTimeMinutes: totalSetupTime,
      totalCycleTimeMinutes: totalCycleTime,
      steps,
    };
  }

  private async fetchMachineHourRate(id: string, accessToken: string): Promise<any> {
    const { data } = await this.supabaseService
      .getClient(accessToken)
      .from('machine_hour_rates')
      .select('*')
      .eq('id', id)
      .single();

    return data;
  }

  private async fetchLaborHourRate(id: string, accessToken: string): Promise<any> {
    const { data } = await this.supabaseService
      .getClient(accessToken)
      .from('labor_hour_rates')
      .select('*')
      .eq('id', id)
      .single();

    return data;
  }
}
