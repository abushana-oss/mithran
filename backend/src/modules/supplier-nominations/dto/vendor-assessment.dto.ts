import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsString, IsNumber, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class VendorAssessmentCriteriaDto {
  @ApiProperty({
    description: 'Unique identifier for the assessment criteria',
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
    description: 'Assessment category',
    example: 'Quality'
  })
  @IsString()
  category: string;

  @ApiProperty({
    description: 'Assessment aspects',
    example: 'Manufacturing Capability'
  })
  @IsString()
  assessment_aspects: string;

  @ApiProperty({
    description: 'Total possible score',
    example: 100
  })
  @IsNumber()
  total_score: number;

  @ApiProperty({
    description: 'Actual achieved score',
    example: 85
  })
  @IsNumber()
  actual_score: number;

  @ApiProperty({
    description: 'High threshold percentage',
    example: 70
  })
  @IsNumber()
  high_threshold: number;

  @ApiProperty({
    description: 'Low threshold percentage',
    example: 50
  })
  @IsNumber()
  low_threshold: number;

  @ApiProperty({
    description: 'Sectionwise capability percentage',
    example: 85.0
  })
  @IsNumber()
  sectionwise_capability: number;

  @ApiProperty({
    description: 'Risk section total score',
    example: 50
  })
  @IsNumber()
  risk_section_total: number;

  @ApiProperty({
    description: 'Risk actual score',
    example: 40
  })
  @IsNumber()
  risk_actual_score: number;

  @ApiProperty({
    description: 'Risk mitigation percentage',
    example: 80.0
  })
  @IsNumber()
  risk_mitigation: number;

  @ApiProperty({
    description: 'Number of minor non-conformities',
    example: 2
  })
  @IsNumber()
  minor_nc: number;

  @ApiProperty({
    description: 'Number of major non-conformities',
    example: 0
  })
  @IsNumber()
  major_nc: number;

  @ApiProperty({
    description: 'Sort order for display',
    example: 1
  })
  @IsNumber()
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

export class BatchAssessmentUpdateItemDto {
  @ApiProperty({
    description: 'Criteria ID to update',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
  })
  @IsString()
  criteriaId: string;

  @ApiProperty({
    description: 'Actual score',
    example: 85,
    required: false
  })
  @IsOptional()
  @IsNumber()
  actualScore?: number;

  @ApiProperty({
    description: 'Total score',
    example: 100,
    required: false
  })
  @IsOptional()
  @IsNumber()
  totalScore?: number;

  @ApiProperty({
    description: 'Risk section total',
    example: 50,
    required: false
  })
  @IsOptional()
  @IsNumber()
  riskSectionTotal?: number;

  @ApiProperty({
    description: 'Risk actual score',
    example: 40,
    required: false
  })
  @IsOptional()
  @IsNumber()
  riskActualScore?: number;

  @ApiProperty({
    description: 'Minor non-conformities count',
    example: 2,
    required: false
  })
  @IsOptional()
  @IsNumber()
  minorNC?: number;

  @ApiProperty({
    description: 'Major non-conformities count',
    example: 0,
    required: false
  })
  @IsOptional()
  @IsNumber()
  majorNC?: number;
}

export class BatchAssessmentUpdateDto {
  @ApiProperty({
    description: 'Array of assessment updates',
    type: [BatchAssessmentUpdateItemDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BatchAssessmentUpdateItemDto)
  updates: BatchAssessmentUpdateItemDto[];
}

export class VendorAssessmentMetricsDto {
  @ApiProperty({
    description: 'Overall capability score percentage',
    example: 85.0
  })
  @IsNumber()
  overallScore1: number;

  @ApiProperty({
    description: 'Overall risk mitigation score percentage',
    example: 80.0
  })
  @IsNumber()
  overallScore2: number;

  @ApiProperty({
    description: 'Total actual score points',
    example: 425
  })
  @IsNumber()
  totalActual: number;

  @ApiProperty({
    description: 'Total possible score points',
    example: 500
  })
  @IsNumber()
  totalPossible: number;

  @ApiProperty({
    description: 'Total minor non-conformities',
    example: 5
  })
  @IsNumber()
  totalMinorNC: number;

  @ApiProperty({
    description: 'Total major non-conformities',
    example: 1
  })
  @IsNumber()
  totalMajorNC: number;

  @ApiProperty({
    description: 'Rating status classification',
    example: 'excellent',
    enum: ['excellent', 'good', 'needs_improvement']
  })
  @IsString()
  ratingStatus: 'excellent' | 'good' | 'needs_improvement';
}