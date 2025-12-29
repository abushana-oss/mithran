import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsBoolean, IsNumber, IsArray, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

// ============================================================================
// PROCESS ROUTE DTOs
// ============================================================================

export class CreateProcessRouteDto {
  @ApiProperty({ example: 'bom-item-uuid' })
  @IsUUID()
  bomItemId: string;

  @ApiProperty({ example: 'Standard Casting Process' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Standard process for casting components' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isTemplate?: boolean;

  @ApiPropertyOptional({ example: 'Standard Casting' })
  @IsOptional()
  @IsString()
  templateName?: string;
}

export class UpdateProcessRouteDto extends PartialType(CreateProcessRouteDto) {}

export class QueryProcessRoutesDto {
  @ApiPropertyOptional({ example: 'bom-item-uuid' })
  @IsOptional()
  @IsUUID()
  bomItemId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}

// ============================================================================
// PROCESS ROUTE STEP DTOs
// ============================================================================

export class CreateProcessRouteStepDto {
  @ApiProperty({ example: 'process-route-uuid' })
  @IsUUID()
  processRouteId: string;

  @ApiProperty({ example: 'process-uuid' })
  @IsUUID()
  processId: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  stepNumber: number;

  @ApiProperty({ example: 'CNC Machining Operation' })
  @IsString()
  operationName: string;

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @IsNumber()
  setupTimeMinutes?: number;

  @ApiPropertyOptional({ example: 15 })
  @IsOptional()
  @IsNumber()
  cycleTimeMinutes?: number;

  @ApiPropertyOptional({ example: 2.5 })
  @IsOptional()
  @IsNumber()
  laborHours?: number;

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @IsNumber()
  machineHours?: number;

  @ApiPropertyOptional({ example: 'machine-hour-rate-uuid' })
  @IsOptional()
  @IsUUID()
  machineHourRateId?: string;

  @ApiPropertyOptional({ example: 'labor-hour-rate-uuid' })
  @IsOptional()
  @IsUUID()
  laborHourRateId?: string;

  @ApiPropertyOptional({ example: 'Additional notes for this operation' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateProcessRouteStepDto extends PartialType(CreateProcessRouteStepDto) {}

export class ReorderStepsDto {
  @ApiProperty({
    example: [
      { id: 'step-uuid-1', stepNumber: 1 },
      { id: 'step-uuid-2', stepNumber: 2 },
    ],
  })
  @IsArray()
  steps: Array<{ id: string; stepNumber: number }>;
}
