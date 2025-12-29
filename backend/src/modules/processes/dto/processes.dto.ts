import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsBoolean, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProcessDto {
  @ApiProperty({ example: 'CNC Machining' })
  @IsString()
  processName: string;

  @ApiProperty({ example: 'Machining' })
  @IsString()
  processCategory: string;

  @ApiPropertyOptional({ example: 'CNC milling operation for complex geometries' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 120.5 })
  @IsOptional()
  @IsNumber()
  standardTimeMinutes?: number;

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @IsNumber()
  setupTimeMinutes?: number;

  @ApiPropertyOptional({ example: 15 })
  @IsOptional()
  @IsNumber()
  cycleTimeMinutes?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  machineRequired?: boolean;

  @ApiPropertyOptional({ example: 'CNC Mill' })
  @IsOptional()
  @IsString()
  machineType?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  laborRequired?: boolean;

  @ApiPropertyOptional({ example: 'Level 3 - Specialist' })
  @IsOptional()
  @IsString()
  skillLevelRequired?: string;
}

export class UpdateProcessDto extends PartialType(CreateProcessDto) {}

export class QueryProcessesDto {
  @ApiPropertyOptional({ example: 'Machining' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 'CNC' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 'CNC Mill' })
  @IsOptional()
  @IsString()
  machineType?: string;

  @ApiPropertyOptional({ example: 1, description: 'Page number (starting from 1)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 10, description: 'Items per page (max 100)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}
