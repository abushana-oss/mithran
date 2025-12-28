import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { Logger } from '../../common/logger/logger.service';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { CreateBOMItemDto, UpdateBOMItemDto, QueryBOMItemsDto } from './dto/bom-items.dto';
import { BOMItemResponseDto, BOMItemListResponseDto } from './dto/bom-item-response.dto';
import { FileStorageService } from './services/file-storage.service';

@Injectable()
export class BOMItemsService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly logger: Logger,
    private readonly fileStorageService: FileStorageService,
  ) {}

  async findAll(query: QueryBOMItemsDto, userId: string, accessToken: string): Promise<BOMItemListResponseDto> {
    this.logger.log('Fetching all BOM items', 'BOMItemsService');

    let queryBuilder = this.supabaseService
      .getClient(accessToken)
      .from('bom_items')
      .select('*')
      .order('sort_order', { ascending: true })
      .limit(1000); // Safety limit: max 1000 items per BOM

    if (query.bomId) {
      queryBuilder = queryBuilder.eq('bom_id', query.bomId);
    }

    if (query.itemType) {
      queryBuilder = queryBuilder.eq('item_type', query.itemType);
    }

    if (query.search) {
      queryBuilder = queryBuilder.or(`name.ilike.%${query.search}%,part_number.ilike.%${query.search}%`);
    }

    const { data, error } = await queryBuilder;

    if (error) {
      this.logger.error(`Error fetching BOM items: ${error.message}`, 'BOMItemsService');
      throw new InternalServerErrorException(`Failed to fetch BOM items: ${error.message}`);
    }

    const items = (data || []).map(row => BOMItemResponseDto.fromDatabase(row));

    return { items };
  }

  async findOne(id: string, userId: string, accessToken: string): Promise<BOMItemResponseDto> {
    this.logger.log(`Fetching BOM item: ${id}`, 'BOMItemsService');

    const { data, error } = await this.supabaseService
      .getClient(accessToken)
      .from('bom_items')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      this.logger.error(`BOM item not found: ${id}`, 'BOMItemsService');
      throw new NotFoundException(`BOM item with ID ${id} not found`);
    }

    return BOMItemResponseDto.fromDatabase(data);
  }

  async create(createBOMItemDto: CreateBOMItemDto, userId: string, accessToken: string): Promise<BOMItemResponseDto> {
    this.logger.log('Creating BOM item', 'BOMItemsService');

    const { data, error } = await this.supabaseService
      .getClient(accessToken)
      .from('bom_items')
      .insert({
        bom_id: createBOMItemDto.bomId,
        name: createBOMItemDto.name,
        part_number: createBOMItemDto.partNumber,
        description: createBOMItemDto.description,
        item_type: createBOMItemDto.itemType,
        parent_item_id: createBOMItemDto.parentItemId,
        make_buy: createBOMItemDto.makeBuy,
        unit_cost: createBOMItemDto.unitCost,
        quantity: createBOMItemDto.quantity,
        annual_volume: createBOMItemDto.annualVolume,
        unit: createBOMItemDto.unit || 'pcs',
        material: createBOMItemDto.material,
        material_grade: createBOMItemDto.materialGrade,
        sort_order: createBOMItemDto.sortOrder || 0,
        file_3d_path: createBOMItemDto.file3dPath,
        file_2d_path: createBOMItemDto.file2dPath,
        user_id: userId,
      })
      .select()
      .single();

    if (error) {
      this.logger.error(`Error creating BOM item: ${error.message}`, 'BOMItemsService');
      throw new InternalServerErrorException(`Failed to create BOM item: ${error.message}`);
    }

    return BOMItemResponseDto.fromDatabase(data);
  }

  async update(id: string, updateBOMItemDto: UpdateBOMItemDto, userId: string, accessToken: string): Promise<BOMItemResponseDto> {
    this.logger.log(`Updating BOM item: ${id}`, 'BOMItemsService');

    await this.findOne(id, userId, accessToken);

    const updateData: any = {};
    if (updateBOMItemDto.name !== undefined) updateData.name = updateBOMItemDto.name;
    if (updateBOMItemDto.partNumber !== undefined) updateData.part_number = updateBOMItemDto.partNumber;
    if (updateBOMItemDto.description !== undefined) updateData.description = updateBOMItemDto.description;
    if (updateBOMItemDto.itemType !== undefined) updateData.item_type = updateBOMItemDto.itemType;
    if (updateBOMItemDto.parentItemId !== undefined) updateData.parent_item_id = updateBOMItemDto.parentItemId;
    if (updateBOMItemDto.makeBuy !== undefined) updateData.make_buy = updateBOMItemDto.makeBuy;
    if (updateBOMItemDto.unitCost !== undefined) updateData.unit_cost = updateBOMItemDto.unitCost;
    if (updateBOMItemDto.quantity !== undefined) updateData.quantity = updateBOMItemDto.quantity;
    if (updateBOMItemDto.annualVolume !== undefined) updateData.annual_volume = updateBOMItemDto.annualVolume;
    if (updateBOMItemDto.unit !== undefined) updateData.unit = updateBOMItemDto.unit;
    if (updateBOMItemDto.material !== undefined) updateData.material = updateBOMItemDto.material;
    if (updateBOMItemDto.materialGrade !== undefined) updateData.material_grade = updateBOMItemDto.materialGrade;
    if (updateBOMItemDto.sortOrder !== undefined) updateData.sort_order = updateBOMItemDto.sortOrder;
    if (updateBOMItemDto.file3dPath !== undefined) updateData.file_3d_path = updateBOMItemDto.file3dPath;
    if (updateBOMItemDto.file2dPath !== undefined) updateData.file_2d_path = updateBOMItemDto.file2dPath;

    const { data, error } = await this.supabaseService
      .getClient(accessToken)
      .from('bom_items')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      this.logger.error(`Error updating BOM item: ${error.message}`, 'BOMItemsService');
      throw new InternalServerErrorException(`Failed to update BOM item: ${error.message}`);
    }

    return BOMItemResponseDto.fromDatabase(data);
  }

  async remove(id: string, userId: string, accessToken: string) {
    this.logger.log(`Deleting BOM item: ${id}`, 'BOMItemsService');

    // Fetch item first to get file paths for cleanup
    const item = await this.findOne(id, userId, accessToken);

    // Delete from database first
    const { error } = await this.supabaseService
      .getClient(accessToken)
      .from('bom_items')
      .delete()
      .eq('id', id);

    if (error) {
      this.logger.error(`Error deleting BOM item: ${error.message}`, 'BOMItemsService');
      throw new InternalServerErrorException(`Failed to delete BOM item: ${error.message}`);
    }

    // Clean up associated files (best effort - don't fail if files already deleted)
    try {
      if (item.file3dPath) {
        await this.fileStorageService.deleteFile(item.file3dPath);
        this.logger.log(`Deleted 3D file: ${item.file3dPath}`, 'BOMItemsService');
      }
      if (item.file2dPath) {
        await this.fileStorageService.deleteFile(item.file2dPath);
        this.logger.log(`Deleted 2D file: ${item.file2dPath}`, 'BOMItemsService');
      }
    } catch (fileError) {
      // Log warning but don't fail the operation - DB record is already deleted
      this.logger.warn(
        `Failed to delete files for BOM item ${id}, but item deleted from database: ${fileError.message}`,
        'BOMItemsService',
      );
    }

    return { message: 'BOM item deleted successfully' };
  }

  async updateSortOrder(items: Array<{ id: string; sortOrder: number }>, userId: string, accessToken: string) {
    this.logger.log('Updating BOM items sort order', 'BOMItemsService');

    if (!items || items.length === 0) {
      return { message: 'No items to update' };
    }

    // Verify first item exists and get its BOM ID
    const firstItem = await this.findOne(items[0].id, userId, accessToken);
    const bomId = firstItem.bomId;

    // Use atomic database function for transaction-safe update
    const { error } = await this.supabaseService
      .getClient(accessToken)
      .rpc('update_bom_items_sort_order', {
        item_updates: items,
        expected_bom_id: bomId,
      });

    if (error) {
      this.logger.error(`Error updating sort order: ${error.message}`, 'BOMItemsService');
      throw new InternalServerErrorException(`Failed to update sort order: ${error.message}`);
    }

    return { message: 'Sort order updated successfully' };
  }

  async getProjectIdFromBomItem(bomId: string, accessToken: string): Promise<string> {
    this.logger.log(`Fetching project ID for BOM: ${bomId}`, 'BOMItemsService');

    const { data, error } = await this.supabaseService
      .getClient(accessToken)
      .from('boms')
      .select('project_id')
      .eq('id', bomId)
      .single();

    if (error || !data) {
      this.logger.error(`BOM not found: ${bomId}`, 'BOMItemsService');
      throw new NotFoundException(`BOM with ID ${bomId} not found`);
    }

    return data.project_id;
  }

  async fixBOMHierarchy(bomId: string, userId: string, accessToken: string) {
    this.logger.log(`Fixing BOM hierarchy for BOM: ${bomId}`, 'BOMItemsService');

    // Fetch all items for this BOM
    const { data: items, error: fetchError } = await this.supabaseService
      .getClient(accessToken)
      .from('bom_items')
      .select('*')
      .eq('bom_id', bomId)
      .order('created_at', { ascending: true });

    if (fetchError) {
      this.logger.error(`Error fetching BOM items: ${fetchError.message}`, 'BOMItemsService');
      throw new InternalServerErrorException(`Failed to fetch BOM items: ${fetchError.message}`);
    }

    if (!items || items.length === 0) {
      return { message: 'No items to fix', itemsUpdated: 0 };
    }

    // Organize items by type
    const assemblies = items.filter(item => item.item_type === 'assembly');
    const subAssemblies = items.filter(item => item.item_type === 'sub_assembly');
    const childParts = items.filter(item => item.item_type === 'child_part');

    let updatedCount = 0;
    const updates: Array<{ id: string; parentItemId: string | null }> = [];

    // Step 1: Ensure all assemblies are root-level (no parent)
    for (const assembly of assemblies) {
      if (assembly.parent_item_id !== null) {
        updates.push({ id: assembly.id, parentItemId: null });
        updatedCount++;
      }
    }

    // Step 2: Assign sub-assemblies to assemblies
    // Each sub-assembly goes under the most recent assembly before it
    for (const subAssembly of subAssemblies) {
      // Find the most recent assembly created before this sub-assembly
      const parentAssembly = assemblies
        .filter(a => new Date(a.created_at) <= new Date(subAssembly.created_at))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

      const newParentId = parentAssembly?.id || null;

      if (subAssembly.parent_item_id !== newParentId) {
        updates.push({ id: subAssembly.id, parentItemId: newParentId });
        updatedCount++;
      }
    }

    // Step 3: Assign child parts to sub-assemblies or assemblies
    for (const childPart of childParts) {
      // Try to find the most recent sub-assembly created before this child part
      const parentSubAssembly = subAssemblies
        .filter(sa => new Date(sa.created_at) <= new Date(childPart.created_at))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

      let newParentId: string | null;

      if (parentSubAssembly) {
        newParentId = parentSubAssembly.id;
      } else {
        // If no sub-assembly, go under most recent assembly
        const parentAssembly = assemblies
          .filter(a => new Date(a.created_at) <= new Date(childPart.created_at))
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
        newParentId = parentAssembly?.id || null;
      }

      if (childPart.parent_item_id !== newParentId) {
        updates.push({ id: childPart.id, parentItemId: newParentId });
        updatedCount++;
      }
    }

    // Apply all updates
    if (updates.length > 0) {
      for (const update of updates) {
        const { error: updateError } = await this.supabaseService
          .getClient(accessToken)
          .from('bom_items')
          .update({ parent_item_id: update.parentItemId })
          .eq('id', update.id);

        if (updateError) {
          this.logger.error(`Error updating item ${update.id}: ${updateError.message}`, 'BOMItemsService');
        }
      }
    }

    this.logger.log(`Fixed ${updatedCount} items in BOM hierarchy`, 'BOMItemsService');

    return {
      message: 'BOM hierarchy fixed successfully',
      itemsUpdated: updatedCount,
      details: {
        assemblies: assemblies.length,
        subAssemblies: subAssemblies.length,
        childParts: childParts.length,
      },
    };
  }
}
