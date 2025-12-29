import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsInt, Min, Max } from 'class-validator';

export class CreateRawMaterialDto {
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

  @ApiPropertyOptional({ example: 'ABS' })
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
  matlState?: string;

  @ApiPropertyOptional({ example: 'Ext & Int Parts-Automotive, Electronics, Appliances' })
  @IsOptional()
  @IsString()
  application?: string;

  @ApiPropertyOptional({ example: 'Yes' })
  @IsOptional()
  @IsString()
  regrinding?: string;

  @ApiPropertyOptional({ example: 10.00 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  regrindingPercentage?: number;

  @ApiPropertyOptional({ example: 49.4 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  clampingPressureMpa?: number;

  @ApiPropertyOptional({ example: 85 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  ejectDeflectionTempC?: number;

  @ApiPropertyOptional({ example: 240 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  meltingTempC?: number;

  @ApiPropertyOptional({ example: 70 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  moldTempC?: number;

  @ApiPropertyOptional({ example: 1040 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  densityKgM3?: number;

  @ApiPropertyOptional({ example: 1.8 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  specificHeatMelt?: number;

  @ApiPropertyOptional({ example: 0.127 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  thermalConductivityMelt?: number;

  @ApiPropertyOptional({ example: 'Bangalore' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ example: 2025 })
  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(2100)
  year?: number;

  @ApiPropertyOptional({ example: 125.00 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  q1Cost?: number;

  @ApiPropertyOptional({ example: 130.00 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  q2Cost?: number;

  @ApiPropertyOptional({ example: 140.00 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  q3Cost?: number;

  @ApiPropertyOptional({ example: 150.00 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  q4Cost?: number;
}

export class UpdateRawMaterialDto extends PartialType(CreateRawMaterialDto) {}

export class QueryRawMaterialsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  materialGroup?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  material?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  year?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'] })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
}
