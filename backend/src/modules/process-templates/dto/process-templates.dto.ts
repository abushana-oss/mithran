import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsNumber, IsArray, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

// ============================================================================
// PROCESS TEMPLATE DTOs
// ============================================================================

export class CreateProcessTemplateDto {
  @ApiProperty({ example: 'Standard Casting Process' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Standard process for casting operations' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Casting' })
  @IsOptional()
  @IsString()
  category?: string;
}

export class UpdateProcessTemplateDto extends PartialType(CreateProcessTemplateDto) {}

export class QueryProcessTemplatesDto {
  @ApiPropertyOptional({ example: 'Casting' })
  @IsOptional()
  @IsString()
  category?: string;

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
// PROCESS TEMPLATE STEP DTOs
// ============================================================================

export class CreateProcessTemplateStepDto {
  @ApiProperty({ example: 'template-uuid' })
  @IsUUID()
  processTemplateId: string;

  @ApiProperty({ example: 'process-uuid' })
  @IsUUID()
  processId: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  stepNumber: number;

  @ApiProperty({ example: 'Mold Preparation' })
  @IsString()
  operationName: string;

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @IsNumber()
  defaultSetupTimeMinutes?: number;

  @ApiPropertyOptional({ example: 15 })
  @IsOptional()
  @IsNumber()
  defaultCycleTimeMinutes?: number;

  @ApiPropertyOptional({ example: 'Setup mold with proper alignment' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateProcessTemplateStepDto extends PartialType(CreateProcessTemplateStepDto) {}

// ============================================================================
// APPLY TEMPLATE DTO
// ============================================================================

export class ApplyTemplateDto {
  @ApiProperty({ example: 'bom-item-uuid' })
  @IsUUID()
  bomItemId: string;

  @ApiProperty({ example: 'template-uuid' })
  @IsUUID()
  templateId: string;

  @ApiPropertyOptional({ example: 'Custom Route Name' })
  @IsOptional()
  @IsString()
  routeName?: string;
}
