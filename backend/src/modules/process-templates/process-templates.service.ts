import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { Logger } from '../../common/logger/logger.service';
import { SupabaseService } from '../../common/supabase/supabase.service';
import {
  CreateProcessTemplateDto,
  UpdateProcessTemplateDto,
  QueryProcessTemplatesDto,
  CreateProcessTemplateStepDto,
  UpdateProcessTemplateStepDto,
  ApplyTemplateDto,
} from './dto/process-templates.dto';
import {
  ProcessTemplateResponseDto,
  ProcessTemplateListResponseDto,
  ProcessTemplateStepResponseDto,
} from './dto/process-template-response.dto';
import { ProcessRouteResponseDto } from '../process-routes/dto/process-route-response.dto';

@Injectable()
export class ProcessTemplatesService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly logger: Logger,
  ) {}

  // ============================================================================
  // PROCESS TEMPLATES - CRUD OPERATIONS
  // ============================================================================

  async findAll(query: QueryProcessTemplatesDto, userId: string, accessToken: string): Promise<ProcessTemplateListResponseDto> {
    this.logger.log('Fetching all process templates', 'ProcessTemplatesService');

    const page = query.page || 1;
    const limit = Math.min(query.limit || 10, 100);
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let queryBuilder = this.supabaseService
      .getClient(accessToken)
      .from('process_templates')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    // Filter by category if specified
    if (query.category) {
      queryBuilder = queryBuilder.eq('category', query.category);
    }

    // Apply search filter
    if (query.search) {
      queryBuilder = queryBuilder.or(`name.ilike.%${query.search}%,description.ilike.%${query.search}%`);
    }

    const { data, error, count } = await queryBuilder;

    if (error) {
      this.logger.error(`Error fetching process templates: ${error.message}`, 'ProcessTemplatesService');
      throw new InternalServerErrorException(`Failed to fetch process templates: ${error.message}`);
    }

    const templates = (data || []).map(row => ProcessTemplateResponseDto.fromDatabase(row));

    return {
      templates,
      count: count || 0,
      page,
      limit,
    };
  }

  async findOne(id: string, userId: string, accessToken: string): Promise<ProcessTemplateResponseDto> {
    this.logger.log(`Fetching process template: ${id}`, 'ProcessTemplatesService');

    const { data, error } = await this.supabaseService
      .getClient(accessToken)
      .from('process_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      this.logger.error(`Process template not found: ${id}`, 'ProcessTemplatesService');
      throw new NotFoundException(`Process template with ID ${id} not found`);
    }

    // Fetch steps for this template
    const stepsData = await this.getTemplateSteps(id, accessToken);
    const template = ProcessTemplateResponseDto.fromDatabase(data);
    template.steps = stepsData;

    return template;
  }

  async create(createDto: CreateProcessTemplateDto, userId: string, accessToken: string): Promise<ProcessTemplateResponseDto> {
    this.logger.log('Creating process template', 'ProcessTemplatesService');

    const { data, error } = await this.supabaseService
      .getClient(accessToken)
      .from('process_templates')
      .insert({
        name: createDto.name,
        description: createDto.description,
        category: createDto.category,
        user_id: userId,
      })
      .select()
      .single();

    if (error || !data) {
      this.logger.error(`Error creating process template: ${error?.message}`, 'ProcessTemplatesService');
      throw new InternalServerErrorException(`Failed to create process template: ${error?.message}`);
    }

    return ProcessTemplateResponseDto.fromDatabase(data);
  }

  async update(id: string, updateDto: UpdateProcessTemplateDto, userId: string, accessToken: string): Promise<ProcessTemplateResponseDto> {
    this.logger.log(`Updating process template: ${id}`, 'ProcessTemplatesService');

    const updateData: any = {};
    if (updateDto.name !== undefined) updateData.name = updateDto.name;
    if (updateDto.description !== undefined) updateData.description = updateDto.description;
    if (updateDto.category !== undefined) updateData.category = updateDto.category;

    const { data, error } = await this.supabaseService
      .getClient(accessToken)
      .from('process_templates')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      this.logger.error(`Error updating process template: ${error?.message}`, 'ProcessTemplatesService');
      throw new NotFoundException(`Failed to update process template with ID ${id}`);
    }

    return ProcessTemplateResponseDto.fromDatabase(data);
  }

  async remove(id: string, userId: string, accessToken: string): Promise<{ message: string }> {
    this.logger.log(`Deleting process template: ${id}`, 'ProcessTemplatesService');

    const { error } = await this.supabaseService
      .getClient(accessToken)
      .from('process_templates')
      .delete()
      .eq('id', id);

    if (error) {
      this.logger.error(`Error deleting process template: ${error.message}`, 'ProcessTemplatesService');
      throw new InternalServerErrorException(`Failed to delete process template: ${error.message}`);
    }

    return { message: 'Process template deleted successfully' };
  }

  // ============================================================================
  // PROCESS TEMPLATE STEPS - CRUD OPERATIONS
  // ============================================================================

  async getTemplateSteps(templateId: string, accessToken: string): Promise<ProcessTemplateStepResponseDto[]> {
    const { data, error } = await this.supabaseService
      .getClient(accessToken)
      .from('process_template_steps')
      .select('*')
      .eq('process_template_id', templateId)
      .order('step_number', { ascending: true });

    if (error) {
      this.logger.error(`Error fetching template steps: ${error.message}`, 'ProcessTemplatesService');
      throw new InternalServerErrorException(`Failed to fetch template steps: ${error.message}`);
    }

    return (data || []).map(row => ProcessTemplateStepResponseDto.fromDatabase(row));
  }

  async addStep(createDto: CreateProcessTemplateStepDto, userId: string, accessToken: string): Promise<ProcessTemplateStepResponseDto> {
    this.logger.log('Adding process template step', 'ProcessTemplatesService');

    const { data, error } = await this.supabaseService
      .getClient(accessToken)
      .from('process_template_steps')
      .insert({
        process_template_id: createDto.processTemplateId,
        process_id: createDto.processId,
        step_number: createDto.stepNumber,
        operation_name: createDto.operationName,
        default_setup_time_minutes: createDto.defaultSetupTimeMinutes,
        default_cycle_time_minutes: createDto.defaultCycleTimeMinutes,
        notes: createDto.notes,
      })
      .select()
      .single();

    if (error || !data) {
      this.logger.error(`Error adding template step: ${error?.message}`, 'ProcessTemplatesService');
      throw new InternalServerErrorException(`Failed to add template step: ${error?.message}`);
    }

    return ProcessTemplateStepResponseDto.fromDatabase(data);
  }

  async updateStep(stepId: string, updateDto: UpdateProcessTemplateStepDto, userId: string, accessToken: string): Promise<ProcessTemplateStepResponseDto> {
    this.logger.log(`Updating template step: ${stepId}`, 'ProcessTemplatesService');

    const updateData: any = {};
    if (updateDto.processId !== undefined) updateData.process_id = updateDto.processId;
    if (updateDto.stepNumber !== undefined) updateData.step_number = updateDto.stepNumber;
    if (updateDto.operationName !== undefined) updateData.operation_name = updateDto.operationName;
    if (updateDto.defaultSetupTimeMinutes !== undefined) updateData.default_setup_time_minutes = updateDto.defaultSetupTimeMinutes;
    if (updateDto.defaultCycleTimeMinutes !== undefined) updateData.default_cycle_time_minutes = updateDto.defaultCycleTimeMinutes;
    if (updateDto.notes !== undefined) updateData.notes = updateDto.notes;

    const { data, error } = await this.supabaseService
      .getClient(accessToken)
      .from('process_template_steps')
      .update(updateData)
      .eq('id', stepId)
      .select()
      .single();

    if (error || !data) {
      this.logger.error(`Error updating template step: ${error?.message}`, 'ProcessTemplatesService');
      throw new NotFoundException(`Failed to update template step with ID ${stepId}`);
    }

    return ProcessTemplateStepResponseDto.fromDatabase(data);
  }

  async removeStep(stepId: string, userId: string, accessToken: string): Promise<{ message: string }> {
    this.logger.log(`Deleting template step: ${stepId}`, 'ProcessTemplatesService');

    const { error } = await this.supabaseService
      .getClient(accessToken)
      .from('process_template_steps')
      .delete()
      .eq('id', stepId);

    if (error) {
      this.logger.error(`Error deleting template step: ${error.message}`, 'ProcessTemplatesService');
      throw new InternalServerErrorException(`Failed to delete template step: ${error.message}`);
    }

    return { message: 'Template step deleted successfully' };
  }

  // ============================================================================
  // APPLY TEMPLATE - KEY FEATURE
  // ============================================================================

  async applyTemplate(applyDto: ApplyTemplateDto, userId: string, accessToken: string): Promise<ProcessRouteResponseDto> {
    this.logger.log(`Applying template ${applyDto.templateId} to BOM item ${applyDto.bomItemId}`, 'ProcessTemplatesService');

    // 1. Fetch template with all steps
    const template = await this.findOne(applyDto.templateId, userId, accessToken);
    const templateSteps = await this.getTemplateSteps(applyDto.templateId, accessToken);

    // 2. Create new process route for BOM item
    const { data: routeData, error: routeError } = await this.supabaseService
      .getClient(accessToken)
      .from('process_routes')
      .insert({
        bom_item_id: applyDto.bomItemId,
        name: applyDto.routeName || template.name,
        description: `Applied from template: ${template.name}`,
        is_template: false,
        user_id: userId,
      })
      .select()
      .single();

    if (routeError || !routeData) {
      this.logger.error(`Error creating process route: ${routeError?.message}`, 'ProcessTemplatesService');
      throw new InternalServerErrorException(`Failed to create process route: ${routeError?.message}`);
    }

    const route = ProcessRouteResponseDto.fromDatabase(routeData);

    // 3. Copy all steps from template to route
    const createdSteps = [];
    for (const templateStep of templateSteps) {
      const { data: stepData, error: stepError } = await this.supabaseService
        .getClient(accessToken)
        .from('process_route_steps')
        .insert({
          process_route_id: route.id,
          process_id: templateStep.processId,
          step_number: templateStep.stepNumber,
          operation_name: templateStep.operationName,
          setup_time_minutes: templateStep.defaultSetupTimeMinutes,
          cycle_time_minutes: templateStep.defaultCycleTimeMinutes,
          notes: templateStep.notes,
        })
        .select()
        .single();

      if (stepData) {
        createdSteps.push(stepData);
      }
    }

    // 4. Calculate initial cost (if steps have rate info, this will be calculated later)
    // For now, just update the time totals
    let totalSetupTime = 0;
    let totalCycleTime = 0;
    for (const step of createdSteps) {
      totalSetupTime += step.setup_time_minutes ? parseFloat(step.setup_time_minutes) : 0;
      totalCycleTime += step.cycle_time_minutes ? parseFloat(step.cycle_time_minutes) : 0;
    }

    await this.supabaseService
      .getClient(accessToken)
      .from('process_routes')
      .update({
        total_setup_time_minutes: totalSetupTime,
        total_cycle_time_minutes: totalCycleTime,
      })
      .eq('id', route.id);

    // Update route object
    route.totalSetupTimeMinutes = totalSetupTime;
    route.totalCycleTimeMinutes = totalCycleTime;

    this.logger.log(`Template applied successfully. Created route ${route.id} with ${createdSteps.length} steps`, 'ProcessTemplatesService');

    return route;
  }
}
