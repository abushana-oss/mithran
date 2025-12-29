import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';
import { toast } from 'sonner';

// ============================================================================
// TYPES
// ============================================================================

export interface Process {
  id: string;
  processName: string;
  processCategory: string;
  description?: string;
  standardTimeMinutes?: number;
  setupTimeMinutes?: number;
  cycleTimeMinutes?: number;
  machineRequired?: boolean;
  machineType?: string;
  laborRequired?: boolean;
  skillLevelRequired?: string;
  userId: string;
  organizationId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProcessListResponse {
  processes: Process[];
  count: number;
  page?: number;
  limit?: number;
}

export interface QueryProcessesParams {
  category?: string;
  search?: string;
  machineType?: string;
  page?: number;
  limit?: number;
}

export interface CreateProcessData {
  processName: string;
  processCategory: string;
  description?: string;
  standardTimeMinutes?: number;
  setupTimeMinutes?: number;
  cycleTimeMinutes?: number;
  machineRequired?: boolean;
  machineType?: string;
  laborRequired?: boolean;
  skillLevelRequired?: string;
}

export interface UpdateProcessData extends Partial<CreateProcessData> {}

// ============================================================================
// QUERY HOOKS
// ============================================================================

export function useProcesses(params?: QueryProcessesParams) {
  return useQuery({
    queryKey: ['processes', 'list', params],
    queryFn: async () => {
      const response = await apiClient.get<ProcessListResponse>('/processes', { params });
      return response;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useProcess(id: string | undefined) {
  return useQuery({
    queryKey: ['processes', 'detail', id],
    queryFn: async () => {
      if (!id) throw new Error('Process ID is required');
      const response = await apiClient.get<Process>(`/processes/${id}`);
      return response;
    },
    enabled: !!id,
  });
}

// ============================================================================
// MUTATION HOOKS
// ============================================================================

export function useCreateProcess() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateProcessData) => {
      const response = await apiClient.post<Process>('/processes', data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['processes', 'list'] });
      toast.success('Process created successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to create process');
    },
  });
}

export function useUpdateProcess() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateProcessData }) => {
      const response = await apiClient.put<Process>(`/processes/${id}`, data);
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['processes', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['processes', 'detail', variables.id] });
      toast.success('Process updated successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update process');
    },
  });
}

export function useDeleteProcess() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/processes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['processes', 'list'] });
      toast.success('Process deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to delete process');
    },
  });
}
