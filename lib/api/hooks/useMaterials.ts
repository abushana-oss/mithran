import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';
import { toast } from 'sonner';

// ============================================================================
// TYPES
// ============================================================================

export interface Material {
  id: string;
  materialGroup: string;
  material: string;
  materialAbbreviation?: string;
  materialGrade?: string;
  manufacturer?: string;
  productName?: string;
  clampingPressureMpa?: number;
  meltingTempCelsius?: number;
  moldTempCelsius?: number;
  densityKgPerM3?: number;
  shrinkage?: number;
  location?: string;
  year?: number;
  costQ1?: number;
  costQ2?: number;
  costQ3?: number;
  costQ4?: number;
  avgCost?: number;
  regrind?: boolean;
  partWeightGrams?: number;
  wastagePercent?: number;
  partWeightWithWastageGrams?: number;
  materialCostPerPartInr?: number;
  materialCostPerPartUsd?: number;
  notes?: string;
  userId: string;
  organizationId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MaterialListResponse {
  materials: Material[];
  count: number;
  page?: number;
  limit?: number;
}

export interface QueryMaterialsParams {
  search?: string;
  materialGroup?: string;
  material?: string;
  materialGrade?: string;
  location?: string;
  regrind?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'material' | 'materialGroup' | 'avgCost' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface MaterialGroupedByType {
  [materialGroup: string]: {
    [material: string]: Material[];
  };
}

export interface CreateMaterialData {
  materialGroup: string;
  material: string;
  materialAbbreviation?: string;
  materialGrade?: string;
  manufacturer?: string;
  productName?: string;
  clampingPressureMpa?: number;
  meltingTempCelsius?: number;
  moldTempCelsius?: number;
  densityKgPerM3?: number;
  shrinkage?: number;
  location?: string;
  year?: number;
  costQ1?: number;
  costQ2?: number;
  costQ3?: number;
  costQ4?: number;
  avgCost?: number;
  regrind?: boolean;
  partWeightGrams?: number;
  wastagePercent?: number;
  partWeightWithWastageGrams?: number;
  materialCostPerPartInr?: number;
  materialCostPerPartUsd?: number;
  notes?: string;
}

export interface UpdateMaterialData extends Partial<CreateMaterialData> {}

export interface LinkMaterialToBOMItemData {
  bomItemId: string;
  materialId: string;
}

// ============================================================================
// QUERY HOOKS
// ============================================================================

export function useMaterials(params?: QueryMaterialsParams) {
  return useQuery({
    queryKey: ['materials', 'list', params],
    queryFn: async () => {
      const response = await apiClient.get<MaterialListResponse>('/materials', { params });
      return response;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useMaterial(id: string | undefined) {
  return useQuery({
    queryKey: ['materials', 'detail', id],
    queryFn: async () => {
      if (!id) throw new Error('Material ID is required');
      const response = await apiClient.get<Material>(`/materials/${id}`);
      return response;
    },
    enabled: !!id,
  });
}

// Specialized hook for autocomplete - returns minimal data for fast searching
export function useMaterialsAutocomplete(search: string, filters?: Partial<QueryMaterialsParams>) {
  return useQuery({
    queryKey: ['materials', 'autocomplete', search, filters],
    queryFn: async () => {
      const response = await apiClient.get<MaterialListResponse>('/materials', {
        params: {
          search,
          ...filters,
          limit: 50, // Limit for autocomplete performance
        },
      });
      return response;
    },
    enabled: search.length >= 2, // Only search when user has typed at least 2 characters
    staleTime: 1000 * 60 * 10, // 10 minutes - autocomplete results can be cached longer
  });
}

// Hook to get materials grouped by material group and type (for hierarchical selection)
export function useMaterialsGrouped(params?: QueryMaterialsParams) {
  return useQuery({
    queryKey: ['materials', 'grouped', params],
    queryFn: async () => {
      const response = await apiClient.get<MaterialListResponse>('/materials', { params });

      // Group materials by materialGroup -> material type
      const grouped: MaterialGroupedByType = {};

      response.materials.forEach((material) => {
        const groupKey = material.materialGroup;
        const typeKey = material.material;
        const group = (grouped[groupKey] ??= {});
        const list = (group[typeKey] ??= []);
        list.push(material);
      });

      return grouped;
    },
    staleTime: 1000 * 60 * 5,
  });
}

// Hook to get unique filter options for dropdowns
export function useMaterialFilterOptions() {
  return useQuery({
    queryKey: ['materials', 'filter-options'],
    queryFn: async () => {
      const response = await apiClient.get<MaterialListResponse>('/materials', {
        params: { limit: 1000 }, // Get all for filter options
      });

      const materialGroups = [...new Set(response.materials.map(m => m.materialGroup))].sort();
      const materialTypes = [...new Set(response.materials.map(m => m.material))].sort();
      const locations = [...new Set(response.materials.map(m => m.location).filter(Boolean))].sort();
      const grades = [...new Set(response.materials.map(m => m.materialGrade).filter(Boolean))].sort();

      return {
        materialGroups,
        materialTypes,
        locations,
        grades,
      };
    },
    staleTime: 1000 * 60 * 30, // 30 minutes - filter options don't change often
  });
}

// ============================================================================
// MUTATION HOOKS
// ============================================================================

export function useCreateMaterial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateMaterialData) => {
      const response = await apiClient.post<Material>('/materials', data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      toast.success('Material created successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to create material');
    },
  });
}

export function useUpdateMaterial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateMaterialData }) => {
      const response = await apiClient.put<Material>(`/materials/${id}`, data);
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      queryClient.invalidateQueries({ queryKey: ['materials', 'detail', variables.id] });
      toast.success('Material updated successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update material');
    },
  });
}

export function useDeleteMaterial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/materials/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      toast.success('Material deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to delete material');
    },
  });
}

// Link material to BOM item
export function useLinkMaterialToBOMItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: LinkMaterialToBOMItemData) => {
      const response = await apiClient.put(`/bom-items/${data.bomItemId}/material`, {
        materialId: data.materialId,
      });
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bom-items', 'detail', variables.bomItemId] });
      queryClient.invalidateQueries({ queryKey: ['bom-items', 'list'] });
      toast.success('Material linked to BOM item successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to link material');
    },
  });
}

// Unlink material from BOM item
export function useUnlinkMaterialFromBOMItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bomItemId: string) => {
      const response = await apiClient.put(`/bom-items/${bomItemId}/material`, {
        materialId: null,
      });
      return response;
    },
    onSuccess: (_, bomItemId) => {
      queryClient.invalidateQueries({ queryKey: ['bom-items', 'detail', bomItemId] });
      queryClient.invalidateQueries({ queryKey: ['bom-items', 'list'] });
      toast.success('Material unlinked from BOM item');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to unlink material');
    },
  });
}
