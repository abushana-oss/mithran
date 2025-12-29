import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProcessResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  processName: string;

  @ApiProperty()
  processCategory: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  standardTimeMinutes?: number;

  @ApiPropertyOptional()
  setupTimeMinutes?: number;

  @ApiPropertyOptional()
  cycleTimeMinutes?: number;

  @ApiPropertyOptional()
  machineRequired?: boolean;

  @ApiPropertyOptional()
  machineType?: string;

  @ApiPropertyOptional()
  laborRequired?: boolean;

  @ApiPropertyOptional()
  skillLevelRequired?: string;

  @ApiProperty()
  userId: string;

  @ApiPropertyOptional()
  organizationId?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromDatabase(data: any): ProcessResponseDto {
    return {
      id: data.id,
      processName: data.process_name,
      processCategory: data.process_category,
      description: data.description,
      standardTimeMinutes: data.standard_time_minutes ? parseFloat(data.standard_time_minutes) : undefined,
      setupTimeMinutes: data.setup_time_minutes ? parseFloat(data.setup_time_minutes) : undefined,
      cycleTimeMinutes: data.cycle_time_minutes ? parseFloat(data.cycle_time_minutes) : undefined,
      machineRequired: data.machine_required,
      machineType: data.machine_type,
      laborRequired: data.labor_required,
      skillLevelRequired: data.skill_level_required,
      userId: data.user_id,
      organizationId: data.organization_id,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }
}

export class ProcessListResponseDto {
  @ApiProperty({ type: [ProcessResponseDto] })
  processes: ProcessResponseDto[];

  @ApiProperty()
  count: number;

  @ApiPropertyOptional()
  page?: number;

  @ApiPropertyOptional()
  limit?: number;
}
