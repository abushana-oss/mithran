import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsBoolean, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMaterialDto {
  @ApiProperty({ example: 'Plastic & Rubber' })
  @IsString()
  materialGroup: string;

  @ApiProperty({ example: 'Acrylonitrile Butadiene Styrene' })
  @IsString()
  material: string;

  @ApiPropertyOptional({ example: 'ABS' })
  @IsOptional()
  @IsString()
  materialAbbreviation?: string;

  @ApiPropertyOptional({ example: 'ABS, PC-ABS' })
  @IsOptional()
  @IsString()
  materialGrade?: string;

  @ApiPropertyOptional({ example: 'Granules' })
  @IsOptional()
  @IsString()
  stockForm?: string;

  @ApiPropertyOptional({ example: 'Base Polymer' })
  @IsOptional()
  @IsString()
  materialState?: string;

  @ApiPropertyOptional({ example: 'Automotive, Electronics, Appliances' })
  @IsOptional()
  @IsString()
  application?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  regrinding?: boolean;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsNumber()
  regrindingPercentage?: number;

  @ApiPropertyOptional({ example: 49.4 })
  @IsOptional()
  @IsNumber()
  clampingPressureMpa?: number;

  @ApiPropertyOptional({ example: 85 })
  @IsOptional()
  @IsNumber()
  ejectDeflectionTempCelsius?: number;

  @ApiPropertyOptional({ example: 240 })
  @IsOptional()
  @IsNumber()
  meltingTempCelsius?: number;

  @ApiPropertyOptional({ example: 70 })
  @IsOptional()
  @IsNumber()
  moldTempCelsius?: number;

  @ApiPropertyOptional({ example: 1040 })
  @IsOptional()
  @IsNumber()
  densityKgPerM3?: number;

  @ApiPropertyOptional({ example: 1.8 })
  @IsOptional()
  @IsNumber()
  specificHeatJPerGCelsius?: number;

  @ApiPropertyOptional({ example: 0.127 })
  @IsOptional()
  @IsNumber()
  thermalConductivityWPerMCelsius?: number;

  @ApiPropertyOptional({ example: 'Bangalore' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ example: 2025 })
  @IsOptional()
  @IsInt()
  year?: number;

  @ApiPropertyOptional({ example: 125 })
  @IsOptional()
  @IsNumber()
  costQ1?: number;

  @ApiPropertyOptional({ example: 130 })
  @IsOptional()
  @IsNumber()
  costQ2?: number;

  @ApiPropertyOptional({ example: 140 })
  @IsOptional()
  @IsNumber()
  costQ3?: number;

  @ApiPropertyOptional({ example: 150 })
  @IsOptional()
  @IsNumber()
  costQ4?: number;
}

export class UpdateMaterialDto extends PartialType(CreateMaterialDto) {}

export class QueryMaterialsDto {
  @ApiPropertyOptional({ example: 'Plastic & Rubber' })
  @IsOptional()
  @IsString()
  materialGroup?: string;

  @ApiPropertyOptional({ example: 'Acrylonitrile Butadiene Styrene' })
  @IsOptional()
  @IsString()
  material?: string;

  @ApiPropertyOptional({ example: 'ABS-123' })
  @IsOptional()
  @IsString()
  materialGrade?: string;

  @ApiPropertyOptional({ example: 'ABS' })
  @IsOptional()
  @IsString()
  abbreviation?: string;

  @ApiPropertyOptional({ example: 'Automotive' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 'Bangalore' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  regrind?: boolean;

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

  @ApiPropertyOptional({ example: 'material', enum: ['material', 'materialGroup', 'avgCost', 'createdAt'] })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ example: 'asc', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsString()
  sortOrder?: string;
}
