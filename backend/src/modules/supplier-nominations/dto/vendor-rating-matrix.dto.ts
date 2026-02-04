import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsString, IsNumber, IsOptional, IsArray, ValidateNested, Min, Max, IsInt, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class VendorRatingMatrixDto {
  @ApiProperty({
    description: 'Unique identifier for the rating record',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
  })
  @IsUUID()
  id: string;

  @ApiProperty({
    description: 'Supplier nomination evaluation ID',
    example: 'e47ac10b-58cc-4372-a567-0e02b2c3d479'
  })
  @IsUUID()
  nomination_evaluation_id: string;

  @ApiProperty({
    description: 'Vendor ID',
    example: 'd47ac10b-58cc-4372-a567-0e02b2c3d479'
  })
  @IsUUID()
  vendor_id: string;

  @ApiProperty({
    description: 'Serial number for display order',
    example: 1
  })
  @IsInt()
  @Min(1)
  s_no: number;

  @ApiProperty({
    description: 'Rating category',
    example: 'Quality'
  })
  @IsString()
  category: string;

  @ApiProperty({
    description: 'Assessment aspects description',
    example: 'Manufacturing Capability'
  })
  @IsString()
  assessment_aspects: string;

  @ApiProperty({
    description: 'Section wise capability percentage (0-100)',
    example: 75.38
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  section_wise_capability_percent: number;

  @ApiProperty({
    description: 'Risk mitigation percentage (0-100)',
    example: 68.00
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  risk_mitigation_percent: number;

  @ApiProperty({
    description: 'Number of minor non-conformities',
    example: 2
  })
  @IsInt()
  @Min(0)
  minor_nc: number;

  @ApiProperty({
    description: 'Number of major non-conformities',
    example: 0
  })
  @IsInt()
  @Min(0)
  major_nc: number;

  @ApiProperty({
    description: 'Sort order for display',
    example: 1
  })
  @IsInt()
  sort_order: number;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-01T00:00:00.000Z'
  })
  created_at: string;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-01T00:00:00.000Z'
  })
  updated_at: string;
}

export class UpdateVendorRatingDto {
  @ApiProperty({
    description: 'Assessment aspects description',
    example: 'Manufacturing Capability',
    required: false
  })
  @IsOptional()
  @IsString()
  assessmentAspects?: string;

  @ApiProperty({
    description: 'Section wise capability percentage',
    example: 75.38,
    required: false
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  sectionWiseCapabilityPercent?: number;

  @ApiProperty({
    description: 'Risk mitigation percentage',
    example: 68.00,
    required: false
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  riskMitigationPercent?: number;

  @ApiProperty({
    description: 'Minor non-conformities count',
    example: 2,
    required: false
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  minorNC?: number;

  @ApiProperty({
    description: 'Major non-conformities count',
    example: 0,
    required: false
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  majorNC?: number;
}

export class BatchVendorRatingUpdateItemDto {
  @ApiProperty({
    description: 'Rating ID to update',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
  })
  @IsUUID()
  id: string;

  @ApiProperty({
    description: 'Assessment aspects description',
    example: 'Manufacturing Capability',
    required: false
  })
  @IsOptional()
  @IsString()
  assessmentAspects?: string;

  @ApiProperty({
    description: 'Section wise capability percentage',
    example: 75.38,
    required: false
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  sectionWiseCapabilityPercent?: number;

  @ApiProperty({
    description: 'Risk mitigation percentage',
    example: 68.00,
    required: false
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  riskMitigationPercent?: number;

  @ApiProperty({
    description: 'Minor non-conformities count',
    example: 2,
    required: false
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  minorNC?: number;

  @ApiProperty({
    description: 'Major non-conformities count',
    example: 0,
    required: false
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  majorNC?: number;
}

export class BatchVendorRatingUpdateDto {
  @ApiProperty({
    description: 'Array of rating updates',
    type: [BatchVendorRatingUpdateItemDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BatchVendorRatingUpdateItemDto)
  updates: BatchVendorRatingUpdateItemDto[];
}

export class VendorRatingOverallScoresDto {
  @ApiProperty({
    description: 'Average section wise capability percentage',
    example: 68.7
  })
  @IsNumber()
  sectionWiseCapability: number;

  @ApiProperty({
    description: 'Average risk mitigation percentage',
    example: 65.5
  })
  @IsNumber()
  riskMitigation: number;

  @ApiProperty({
    description: 'Total minor non-conformities',
    example: 95
  })
  @IsInt()
  totalMinorNC: number;

  @ApiProperty({
    description: 'Total major non-conformities',
    example: 10
  })
  @IsInt()
  totalMajorNC: number;

  @ApiProperty({
    description: 'Total number of records',
    example: 13
  })
  @IsInt()
  totalRecords: number;
}

export class UpdateCapabilityCriteriaDto {
  @ApiProperty({
    description: 'New criteria name',
    example: 'Quality Management System'
  })
  @IsString()
  @IsNotEmpty()
  criteriaName: string;
}