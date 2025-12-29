import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ============================================================================
// PROCESS TEMPLATE STEP RESPONSE
// ============================================================================

export class ProcessTemplateStepResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  processTemplateId: string;

  @ApiProperty()
  processId: string;

  @ApiProperty()
  stepNumber: number;

  @ApiProperty()
  operationName: string;

  @ApiPropertyOptional()
  defaultSetupTimeMinutes?: number;

  @ApiPropertyOptional()
  defaultCycleTimeMinutes?: number;

  @ApiPropertyOptional()
  notes?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromDatabase(data: any): ProcessTemplateStepResponseDto {
    return {
      id: data.id,
      processTemplateId: data.process_template_id,
      processId: data.process_id,
      stepNumber: data.step_number,
      operationName: data.operation_name,
      defaultSetupTimeMinutes: data.default_setup_time_minutes ? parseFloat(data.default_setup_time_minutes) : undefined,
      defaultCycleTimeMinutes: data.default_cycle_time_minutes ? parseFloat(data.default_cycle_time_minutes) : undefined,
      notes: data.notes,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }
}

// ============================================================================
// PROCESS TEMPLATE RESPONSE
// ============================================================================

export class ProcessTemplateResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  category?: string;

  @ApiProperty()
  userId: string;

  @ApiPropertyOptional()
  organizationId?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional({ type: [ProcessTemplateStepResponseDto] })
  steps?: ProcessTemplateStepResponseDto[];

  static fromDatabase(data: any): ProcessTemplateResponseDto {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      category: data.category,
      userId: data.user_id,
      organizationId: data.organization_id,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      steps: data.steps ? data.steps.map((step: any) => ProcessTemplateStepResponseDto.fromDatabase(step)) : undefined,
    };
  }
}

export class ProcessTemplateListResponseDto {
  @ApiProperty({ type: [ProcessTemplateResponseDto] })
  templates: ProcessTemplateResponseDto[];

  @ApiProperty()
  count: number;

  @ApiPropertyOptional()
  page?: number;

  @ApiPropertyOptional()
  limit?: number;
}
