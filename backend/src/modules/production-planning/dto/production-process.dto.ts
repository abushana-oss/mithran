import { IsUUID, IsString, IsOptional, IsDateString, IsEnum, IsInt, IsBoolean, IsArray, IsNumber, Min, Max } from 'class-validator';

export enum ProcessStatus {
  PENDING = 'pending',
  READY = 'ready',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  ON_HOLD = 'on_hold',
  CANCELLED = 'cancelled'
}

export enum QualityStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  PASSED = 'passed',
  FAILED = 'failed',
  REWORK_REQUIRED = 'rework_required'
}

export class CreateProductionProcessDto {
  @IsUUID()
  productionLotId: string;

  @IsUUID()
  processId: string;

  @IsInt()
  @Min(1)
  processSequence: number;

  @IsString()
  processName: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  plannedStartDate: string;

  @IsDateString()
  plannedEndDate: string;

  @IsOptional()
  @IsString()
  assignedDepartment?: string;

  @IsOptional()
  @IsString()
  responsiblePerson?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  machineAllocation?: string[];

  @IsOptional()
  @IsUUID()
  dependsOnProcessId?: string;

  @IsOptional()
  @IsBoolean()
  qualityCheckRequired?: boolean = true;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class UpdateProductionProcessDto {
  @IsOptional()
  @IsString()
  processName?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  plannedStartDate?: string;

  @IsOptional()
  @IsDateString()
  plannedEndDate?: string;

  @IsOptional()
  @IsDateString()
  actualStartDate?: string;

  @IsOptional()
  @IsDateString()
  actualEndDate?: string;

  @IsOptional()
  @IsString()
  assignedDepartment?: string;

  @IsOptional()
  @IsString()
  responsiblePerson?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  machineAllocation?: string[];

  @IsOptional()
  @IsEnum(ProcessStatus)
  status?: ProcessStatus;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  completionPercentage?: number;

  @IsOptional()
  @IsUUID()
  dependsOnProcessId?: string;

  @IsOptional()
  @IsBoolean()
  qualityCheckRequired?: boolean;

  @IsOptional()
  @IsEnum(QualityStatus)
  qualityStatus?: QualityStatus;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class CreateProcessSubtaskDto {
  @IsUUID()
  productionProcessId: string;

  @IsString()
  taskName: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  @Min(1)
  taskSequence: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  estimatedDurationHours?: number = 0;

  @IsOptional()
  @IsString()
  assignedOperator?: string;

  @IsOptional()
  @IsString()
  skillRequirement?: string;

  @IsOptional()
  @IsBoolean()
  qualityCheckRequired?: boolean = false;

  @IsOptional()
  @IsUUID()
  dependsOnSubtaskId?: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class UpdateProcessSubtaskDto {
  @IsOptional()
  @IsString()
  taskName?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  taskSequence?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  estimatedDurationHours?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  actualDurationHours?: number;

  @IsOptional()
  @IsString()
  assignedOperator?: string;

  @IsOptional()
  @IsString()
  skillRequirement?: string;

  @IsOptional()
  @IsEnum(ProcessStatus)
  status?: ProcessStatus;

  @IsOptional()
  @IsBoolean()
  qualityCheckRequired?: boolean;

  @IsOptional()
  @IsBoolean()
  qualityCheckPassed?: boolean;

  @IsOptional()
  @IsUUID()
  dependsOnSubtaskId?: string;

  @IsOptional()
  @IsDateString()
  startedAt?: string;

  @IsOptional()
  @IsDateString()
  completedAt?: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}