import { ApiProperty } from '@nestjs/swagger';

export class RawMaterialResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  materialGroup: string;

  @ApiProperty()
  material: string;

  @ApiProperty({ required: false })
  materialAbbreviation?: string;

  @ApiProperty({ required: false })
  materialGrade?: string;

  @ApiProperty({ required: false })
  stockForm?: string;

  @ApiProperty({ required: false })
  matlState?: string;

  @ApiProperty({ required: false })
  application?: string;

  @ApiProperty({ required: false })
  regrinding?: string;

  @ApiProperty({ required: false })
  regrindingPercentage?: number;

  @ApiProperty({ required: false })
  clampingPressureMpa?: number;

  @ApiProperty({ required: false })
  ejectDeflectionTempC?: number;

  @ApiProperty({ required: false })
  meltingTempC?: number;

  @ApiProperty({ required: false })
  moldTempC?: number;

  @ApiProperty({ required: false })
  densityKgM3?: number;

  @ApiProperty({ required: false })
  specificHeatMelt?: number;

  @ApiProperty({ required: false })
  thermalConductivityMelt?: number;

  @ApiProperty({ required: false })
  location?: string;

  @ApiProperty({ required: false })
  year?: number;

  @ApiProperty({ required: false })
  q1Cost?: number;

  @ApiProperty({ required: false })
  q2Cost?: number;

  @ApiProperty({ required: false })
  q3Cost?: number;

  @ApiProperty({ required: false })
  q4Cost?: number;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromDatabase(row: any): RawMaterialResponseDto {
    return {
      id: row.id,
      materialGroup: row.material_group,
      material: row.material,
      materialAbbreviation: row.material_abbreviation,
      materialGrade: row.material_grade,
      stockForm: row.stock_form,
      matlState: row.matl_state,
      application: row.application,
      regrinding: row.regrinding,
      regrindingPercentage: row.regrinding_percentage ? parseFloat(row.regrinding_percentage) : undefined,
      clampingPressureMpa: row.clamping_pressure_mpa ? parseFloat(row.clamping_pressure_mpa) : undefined,
      ejectDeflectionTempC: row.eject_deflection_temp_c ? parseFloat(row.eject_deflection_temp_c) : undefined,
      meltingTempC: row.melting_temp_c ? parseFloat(row.melting_temp_c) : undefined,
      moldTempC: row.mold_temp_c ? parseFloat(row.mold_temp_c) : undefined,
      densityKgM3: row.density_kg_m3 ? parseFloat(row.density_kg_m3) : undefined,
      specificHeatMelt: row.specific_heat_melt ? parseFloat(row.specific_heat_melt) : undefined,
      thermalConductivityMelt: row.thermal_conductivity_melt ? parseFloat(row.thermal_conductivity_melt) : undefined,
      location: row.location,
      year: row.year,
      q1Cost: row.q1_cost ? parseFloat(row.q1_cost) : undefined,
      q2Cost: row.q2_cost ? parseFloat(row.q2_cost) : undefined,
      q3Cost: row.q3_cost ? parseFloat(row.q3_cost) : undefined,
      q4Cost: row.q4_cost ? parseFloat(row.q4_cost) : undefined,
      userId: row.user_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export class RawMaterialListResponseDto {
  @ApiProperty({ type: [RawMaterialResponseDto] })
  items: RawMaterialResponseDto[];

  @ApiProperty()
  total: number;
}
