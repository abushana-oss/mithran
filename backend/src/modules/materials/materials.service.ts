import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { Logger } from '../../common/logger/logger.service';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { CreateMaterialDto, UpdateMaterialDto, QueryMaterialsDto } from './dto/materials.dto';
import { MaterialResponseDto, MaterialListResponseDto } from './dto/material-response.dto';

@Injectable()
export class MaterialsService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly logger: Logger,
  ) {}

  async findAll(query: QueryMaterialsDto, userId: string, accessToken: string): Promise<MaterialListResponseDto> {
    this.logger.log('Fetching all materials', 'MaterialsService');

    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Determine sort field and order
    const sortBy = query.sortBy || 'material_group';
    const sortOrder = query.sortOrder === 'desc' ? false : true; // ascending by default

    let queryBuilder = this.supabaseService
      .getClient(accessToken)
      .from('materials')
      .select('*', { count: 'exact' });

    // Filter by material group if specified
    if (query.materialGroup) {
      queryBuilder = queryBuilder.eq('material_group', query.materialGroup);
    }

    // Filter by material (full name) if specified
    if (query.material) {
      queryBuilder = queryBuilder.eq('material', query.material);
    }

    // Filter by material grade if specified
    if (query.materialGrade) {
      queryBuilder = queryBuilder.ilike('material_grade', `%${query.materialGrade}%`);
    }

    // Filter by abbreviation if specified
    if (query.abbreviation) {
      queryBuilder = queryBuilder.eq('material_abbreviation', query.abbreviation);
    }

    // Filter by location if specified
    if (query.location) {
      queryBuilder = queryBuilder.eq('location', query.location);
    }

    // Filter by regrind if specified
    if (query.regrind !== undefined) {
      queryBuilder = queryBuilder.eq('regrinding', query.regrind);
    }

    // Apply search filter (searches across multiple fields)
    if (query.search) {
      queryBuilder = queryBuilder.or(
        `material.ilike.%${query.search}%,material_grade.ilike.%${query.search}%,application.ilike.%${query.search}%,material_abbreviation.ilike.%${query.search}%`
      );
    }

    // Apply sorting
    queryBuilder = queryBuilder.order(sortBy, { ascending: sortOrder });

    // If not sorted by material_group, add it as secondary sort
    if (sortBy !== 'material_group') {
      queryBuilder = queryBuilder.order('material_group', { ascending: true });
    }

    // Add tertiary sort by material name
    if (sortBy !== 'material') {
      queryBuilder = queryBuilder.order('material', { ascending: true });
    }

    // Apply pagination
    queryBuilder = queryBuilder.range(from, to);

    const { data, error, count } = await queryBuilder;

    if (error) {
      this.logger.error(`Error fetching materials: ${error.message}`, 'MaterialsService');
      throw new InternalServerErrorException(`Failed to fetch materials: ${error.message}`);
    }

    const materials = (data || []).map(row => MaterialResponseDto.fromDatabase(row));

    return {
      materials,
      count: count || 0,
      page,
      limit,
    };
  }

  async findOne(id: string, userId: string, accessToken: string): Promise<MaterialResponseDto> {
    this.logger.log(`Fetching material: ${id}`, 'MaterialsService');

    const { data, error } = await this.supabaseService
      .getClient(accessToken)
      .from('materials')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      this.logger.error(`Material not found: ${id}`, 'MaterialsService');
      throw new NotFoundException(`Material with ID ${id} not found`);
    }

    return MaterialResponseDto.fromDatabase(data);
  }

  async create(createDto: CreateMaterialDto, userId: string, accessToken: string): Promise<MaterialResponseDto> {
    this.logger.log('Creating material', 'MaterialsService');

    const { data, error } = await this.supabaseService
      .getClient(accessToken)
      .from('materials')
      .insert({
        material_group: createDto.materialGroup,
        material: createDto.material,
        material_abbreviation: createDto.materialAbbreviation,
        material_grade: createDto.materialGrade,
        stock_form: createDto.stockForm,
        material_state: createDto.materialState,
        application: createDto.application,
        regrinding: createDto.regrinding,
        regrinding_percentage: createDto.regrindingPercentage,
        clamping_pressure_mpa: createDto.clampingPressureMpa,
        eject_deflection_temp_celsius: createDto.ejectDeflectionTempCelsius,
        melting_temp_celsius: createDto.meltingTempCelsius,
        mold_temp_celsius: createDto.moldTempCelsius,
        density_kg_per_m3: createDto.densityKgPerM3,
        specific_heat_j_per_g_celsius: createDto.specificHeatJPerGCelsius,
        thermal_conductivity_w_per_m_celsius: createDto.thermalConductivityWPerMCelsius,
        location: createDto.location,
        year: createDto.year,
        cost_q1: createDto.costQ1,
        cost_q2: createDto.costQ2,
        cost_q3: createDto.costQ3,
        cost_q4: createDto.costQ4,
        user_id: userId,
      })
      .select()
      .single();

    if (error || !data) {
      this.logger.error(`Error creating material: ${error?.message}`, 'MaterialsService');
      throw new InternalServerErrorException(`Failed to create material: ${error?.message}`);
    }

    return MaterialResponseDto.fromDatabase(data);
  }

  async update(id: string, updateDto: UpdateMaterialDto, userId: string, accessToken: string): Promise<MaterialResponseDto> {
    this.logger.log(`Updating material: ${id}`, 'MaterialsService');

    const updateData: any = {};
    if (updateDto.materialGroup !== undefined) updateData.material_group = updateDto.materialGroup;
    if (updateDto.material !== undefined) updateData.material = updateDto.material;
    if (updateDto.materialAbbreviation !== undefined) updateData.material_abbreviation = updateDto.materialAbbreviation;
    if (updateDto.materialGrade !== undefined) updateData.material_grade = updateDto.materialGrade;
    if (updateDto.stockForm !== undefined) updateData.stock_form = updateDto.stockForm;
    if (updateDto.materialState !== undefined) updateData.material_state = updateDto.materialState;
    if (updateDto.application !== undefined) updateData.application = updateDto.application;
    if (updateDto.regrinding !== undefined) updateData.regrinding = updateDto.regrinding;
    if (updateDto.regrindingPercentage !== undefined) updateData.regrinding_percentage = updateDto.regrindingPercentage;
    if (updateDto.clampingPressureMpa !== undefined) updateData.clamping_pressure_mpa = updateDto.clampingPressureMpa;
    if (updateDto.ejectDeflectionTempCelsius !== undefined) updateData.eject_deflection_temp_celsius = updateDto.ejectDeflectionTempCelsius;
    if (updateDto.meltingTempCelsius !== undefined) updateData.melting_temp_celsius = updateDto.meltingTempCelsius;
    if (updateDto.moldTempCelsius !== undefined) updateData.mold_temp_celsius = updateDto.moldTempCelsius;
    if (updateDto.densityKgPerM3 !== undefined) updateData.density_kg_per_m3 = updateDto.densityKgPerM3;
    if (updateDto.specificHeatJPerGCelsius !== undefined) updateData.specific_heat_j_per_g_celsius = updateDto.specificHeatJPerGCelsius;
    if (updateDto.thermalConductivityWPerMCelsius !== undefined) updateData.thermal_conductivity_w_per_m_celsius = updateDto.thermalConductivityWPerMCelsius;
    if (updateDto.location !== undefined) updateData.location = updateDto.location;
    if (updateDto.year !== undefined) updateData.year = updateDto.year;
    if (updateDto.costQ1 !== undefined) updateData.cost_q1 = updateDto.costQ1;
    if (updateDto.costQ2 !== undefined) updateData.cost_q2 = updateDto.costQ2;
    if (updateDto.costQ3 !== undefined) updateData.cost_q3 = updateDto.costQ3;
    if (updateDto.costQ4 !== undefined) updateData.cost_q4 = updateDto.costQ4;

    const { data, error } = await this.supabaseService
      .getClient(accessToken)
      .from('materials')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      this.logger.error(`Error updating material: ${error?.message}`, 'MaterialsService');
      throw new NotFoundException(`Failed to update material with ID ${id}`);
    }

    return MaterialResponseDto.fromDatabase(data);
  }

  async remove(id: string, userId: string, accessToken: string): Promise<{ message: string }> {
    this.logger.log(`Deleting material: ${id}`, 'MaterialsService');

    const { error } = await this.supabaseService
      .getClient(accessToken)
      .from('materials')
      .delete()
      .eq('id', id);

    if (error) {
      this.logger.error(`Error deleting material: ${error.message}`, 'MaterialsService');
      throw new InternalServerErrorException(`Failed to delete material: ${error.message}`);
    }

    return { message: 'Material deleted successfully' };
  }
}
