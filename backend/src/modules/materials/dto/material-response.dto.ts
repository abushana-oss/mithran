import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MaterialResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  materialGroup: string;

  @ApiProperty()
  material: string;

  @ApiPropertyOptional()
  materialAbbreviation?: string;

  @ApiPropertyOptional()
  materialGrade?: string;

  @ApiPropertyOptional()
  stockForm?: string;

  @ApiPropertyOptional()
  materialState?: string;

  @ApiPropertyOptional()
  application?: string;

  @ApiPropertyOptional()
  regrinding?: boolean;

  @ApiPropertyOptional()
  regrindingPercentage?: number;

  @ApiPropertyOptional()
  clampingPressureMpa?: number;

  @ApiPropertyOptional()
  ejectDeflectionTempCelsius?: number;

  @ApiPropertyOptional()
  meltingTempCelsius?: number;

  @ApiPropertyOptional()
  moldTempCelsius?: number;

  @ApiPropertyOptional()
  densityKgPerM3?: number;

  @ApiPropertyOptional()
  specificHeatJPerGCelsius?: number;

  @ApiPropertyOptional()
  thermalConductivityWPerMCelsius?: number;

  @ApiPropertyOptional()
  location?: string;

  @ApiPropertyOptional()
  year?: number;

  @ApiPropertyOptional()
  costQ1?: number;

  @ApiPropertyOptional()
  costQ2?: number;

  @ApiPropertyOptional()
  costQ3?: number;

  @ApiPropertyOptional()
  costQ4?: number;

  @ApiProperty()
  userId: string;

  @ApiPropertyOptional()
  organizationId?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromDatabase(data: any): MaterialResponseDto {
    return {
      id: data.id,
      materialGroup: data.material_group,
      material: data.material,
      materialAbbreviation: data.material_abbreviation,
      materialGrade: data.material_grade,
      stockForm: data.stock_form,
      materialState: data.material_state,
      application: data.application,
      regrinding: data.regrinding,
      regrindingPercentage: data.regrinding_percentage ? parseFloat(data.regrinding_percentage) : undefined,
      clampingPressureMpa: data.clamping_pressure_mpa ? parseFloat(data.clamping_pressure_mpa) : undefined,
      ejectDeflectionTempCelsius: data.eject_deflection_temp_celsius ? parseFloat(data.eject_deflection_temp_celsius) : undefined,
      meltingTempCelsius: data.melting_temp_celsius ? parseFloat(data.melting_temp_celsius) : undefined,
      moldTempCelsius: data.mold_temp_celsius ? parseFloat(data.mold_temp_celsius) : undefined,
      densityKgPerM3: data.density_kg_per_m3 ? parseFloat(data.density_kg_per_m3) : undefined,
      specificHeatJPerGCelsius: data.specific_heat_j_per_g_celsius ? parseFloat(data.specific_heat_j_per_g_celsius) : undefined,
      thermalConductivityWPerMCelsius: data.thermal_conductivity_w_per_m_celsius ? parseFloat(data.thermal_conductivity_w_per_m_celsius) : undefined,
      location: data.location,
      year: data.year,
      costQ1: data.cost_q1 ? parseFloat(data.cost_q1) : undefined,
      costQ2: data.cost_q2 ? parseFloat(data.cost_q2) : undefined,
      costQ3: data.cost_q3 ? parseFloat(data.cost_q3) : undefined,
      costQ4: data.cost_q4 ? parseFloat(data.cost_q4) : undefined,
      userId: data.user_id,
      organizationId: data.organization_id,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }
}

export class MaterialListResponseDto {
  @ApiProperty({ type: [MaterialResponseDto] })
  materials: MaterialResponseDto[];

  @ApiProperty()
  count: number;

  @ApiPropertyOptional()
  page?: number;

  @ApiPropertyOptional()
  limit?: number;
}
