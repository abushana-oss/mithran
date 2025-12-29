import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ============================================================================
// PROCESS ROUTE STEP RESPONSE
// ============================================================================

export class ProcessRouteStepResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  processRouteId: string;

  @ApiProperty()
  processId: string;

  @ApiProperty()
  stepNumber: number;

  @ApiProperty()
  operationName: string;

  @ApiPropertyOptional()
  setupTimeMinutes?: number;

  @ApiPropertyOptional()
  cycleTimeMinutes?: number;

  @ApiPropertyOptional()
  laborHours?: number;

  @ApiPropertyOptional()
  machineHours?: number;

  @ApiPropertyOptional()
  machineHourRateId?: string;

  @ApiPropertyOptional()
  laborHourRateId?: string;

  @ApiPropertyOptional()
  calculatedCost?: number;

  @ApiPropertyOptional()
  notes?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromDatabase(data: any): ProcessRouteStepResponseDto {
    return {
      id: data.id,
      processRouteId: data.process_route_id,
      processId: data.process_id,
      stepNumber: data.step_number,
      operationName: data.operation_name,
      setupTimeMinutes: data.setup_time_minutes ? parseFloat(data.setup_time_minutes) : undefined,
      cycleTimeMinutes: data.cycle_time_minutes ? parseFloat(data.cycle_time_minutes) : undefined,
      laborHours: data.labor_hours ? parseFloat(data.labor_hours) : undefined,
      machineHours: data.machine_hours ? parseFloat(data.machine_hours) : undefined,
      machineHourRateId: data.machine_hour_rate_id,
      laborHourRateId: data.labor_hour_rate_id,
      calculatedCost: data.calculated_cost ? parseFloat(data.calculated_cost) : undefined,
      notes: data.notes,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }
}

// ============================================================================
// PROCESS ROUTE RESPONSE
// ============================================================================

export class ProcessRouteResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  bomItemId: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  isTemplate?: boolean;

  @ApiPropertyOptional()
  templateName?: string;

  @ApiPropertyOptional()
  totalSetupTimeMinutes?: number;

  @ApiPropertyOptional()
  totalCycleTimeMinutes?: number;

  @ApiPropertyOptional()
  totalCost?: number;

  @ApiProperty()
  userId: string;

  @ApiPropertyOptional()
  organizationId?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional({ type: [ProcessRouteStepResponseDto] })
  steps?: ProcessRouteStepResponseDto[];

  static fromDatabase(data: any): ProcessRouteResponseDto {
    return {
      id: data.id,
      bomItemId: data.bom_item_id,
      name: data.name,
      description: data.description,
      isTemplate: data.is_template,
      templateName: data.template_name,
      totalSetupTimeMinutes: data.total_setup_time_minutes ? parseFloat(data.total_setup_time_minutes) : undefined,
      totalCycleTimeMinutes: data.total_cycle_time_minutes ? parseFloat(data.total_cycle_time_minutes) : undefined,
      totalCost: data.total_cost ? parseFloat(data.total_cost) : undefined,
      userId: data.user_id,
      organizationId: data.organization_id,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      steps: data.steps ? data.steps.map((step: any) => ProcessRouteStepResponseDto.fromDatabase(step)) : undefined,
    };
  }
}

export class ProcessRouteListResponseDto {
  @ApiProperty({ type: [ProcessRouteResponseDto] })
  routes: ProcessRouteResponseDto[];

  @ApiProperty()
  count: number;

  @ApiPropertyOptional()
  page?: number;

  @ApiPropertyOptional()
  limit?: number;
}

// ============================================================================
// COST CALCULATION RESPONSE
// ============================================================================

export class CostBreakdownDto {
  @ApiProperty()
  totalCost: number;

  @ApiProperty()
  totalSetupTimeMinutes: number;

  @ApiProperty()
  totalCycleTimeMinutes: number;

  @ApiProperty({ type: [ProcessRouteStepResponseDto] })
  steps: ProcessRouteStepResponseDto[];
}
