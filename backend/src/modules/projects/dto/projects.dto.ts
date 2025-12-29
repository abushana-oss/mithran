


import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsEnum, IsUUID, Max, Min } from 'class-validator';

export enum ProjectStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  ON_HOLD = 'on_hold',
  CANCELLED = 'cancelled',
}

export class CreateProjectDto {
  @ApiProperty({ example: 'Project Alpha' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Manufacturing cost analysis project' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: ProjectStatus.DRAFT, enum: ProjectStatus })
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @ApiPropertyOptional({
    example: 50000,
    description: 'Quoted cost in dollars (max: 99,999,999.99)',
    minimum: 0,
    maximum: 99999999.99
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0, { message: 'Quoted cost must be a non-negative number' })
  @Max(99999999.99, { message: 'Quoted cost cannot exceed $99,999,999.99' })
  quotedCost?: number;
}

export class UpdateProjectDto extends PartialType(CreateProjectDto) {}

export class QueryProjectsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ProjectStatus })
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  limit?: number;
}
