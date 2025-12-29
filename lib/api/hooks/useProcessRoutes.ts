import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';
import { toast } from 'sonner';

// ============================================================================
// TYPES
// ============================================================================

export interface ProcessRouteStep {
  id: string;
  processRouteId: string;
  processId: string;
  stepNumber: number;
  operationName: string;
  setupTimeMinutes?: number;
  cycleTimeMinutes?: number;
  laborHours?: number;
  machineHours?: number;
  machineHourRateId?: string;
  laborHourRateId?: string;
  calculatedCost?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProcessRoute {
  id: string;
  bomItemId: string;
  name: string;
  description?: string;
  isTemplate?: boolean;
  templateName?: string;
  totalSetupTimeMinutes?: number;
  totalCycleTimeMinutes?: number;
  totalCost?: number;
  userId: string;
  organizationId?: string;
  createdAt: Date;
  updatedAt: Date;
  steps?: ProcessRouteStep[];
}

export interface ProcessRouteListResponse {
  routes: ProcessRoute[];
  count: number;
  page?: number;
  limit?: number;
}

export interface CostBreakdown {
  totalCost: number;
  totalSetupTimeMinutes: number;
  totalCycleTimeMinutes: number;
  steps: ProcessRouteStep[];
}

export interface QueryProcessRoutesParams {
  bomItemId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateProcessRouteData {
  bomItemId: string;
  name: string;
  description?: string;
  isTemplate?: boolean;
  templateName?: string;
}

export interface UpdateProcessRouteData extends Partial<CreateProcessRouteData> {}

export interface CreateProcessRouteStepData {
  processRouteId: string;
  processId: string;
  stepNumber: number;
  operationName: string;
  setupTimeMinutes?: number;
  cycleTimeMinutes?: number;
  laborHours?: number;
  machineHours?: number;
  machineHourRateId?: string;
  laborHourRateId?: string;
  notes?: string;
}

export interface UpdateProcessRouteStepData extends Partial<CreateProcessRouteStepData> {}

export interface ReorderStepsData {
  steps: Array<{ id: string; stepNumber: number }>;
}

// ============================================================================
// PROCESS ROUTES - QUERY HOOKS
// ============================================================================

export function useProcessRoutes(params?: QueryProcessRoutesParams) {
  return useQuery({
    queryKey: ['process-routes', 'list', params],
    queryFn: async () => {
      const response = await apiClient.get<ProcessRouteListResponse>('/process-routes', { params });
      return response;
    },
    enabled: !!params?.bomItemId, // Only fetch if bomItemId is provided
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useProcessRoute(id: string | undefined) {
  return useQuery({
    queryKey: ['process-routes', 'detail', id],
    queryFn: async () => {
      if (!id) throw new Error('Process route ID is required');
      const response = await apiClient.get<ProcessRoute>(`/process-routes/${id}`);
      return response;
    },
    enabled: !!id,
  });
}

// ============================================================================
// PROCESS ROUTES - MUTATION HOOKS
// ============================================================================

export function useCreateProcessRoute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateProcessRouteData) => {
      const response = await apiClient.post<ProcessRoute>('/process-routes', data);
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['process-routes', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['process-routes', 'list', { bomItemId: variables.bomItemId }] });
      toast.success('Process route created successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to create process route');
    },
  });
}

export function useUpdateProcessRoute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateProcessRouteData }) => {
      const response = await apiClient.put<ProcessRoute>(`/process-routes/${id}`, data);
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['process-routes', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['process-routes', 'detail', variables.id] });
      toast.success('Process route updated successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update process route');
    },
  });
}

export function useDeleteProcessRoute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/process-routes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['process-routes', 'list'] });
      toast.success('Process route deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to delete process route');
    },
  });
}

// ============================================================================
// PROCESS ROUTE STEPS - MUTATION HOOKS
// ============================================================================

export function useAddRouteStep() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateProcessRouteStepData) => {
      const response = await apiClient.post<ProcessRouteStep>(
        `/process-routes/${data.processRouteId}/steps`,
        data
      );
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['process-routes', 'detail', variables.processRouteId] });
      toast.success('Step added successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to add step');
    },
  });
}

export function useUpdateRouteStep() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ routeId, stepId, data }: { routeId: string; stepId: string; data: UpdateProcessRouteStepData }) => {
      const response = await apiClient.put<ProcessRouteStep>(
        `/process-routes/${routeId}/steps/${stepId}`,
        data
      );
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['process-routes', 'detail', variables.routeId] });
      toast.success('Step updated successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update step');
    },
  });
}

export function useDeleteRouteStep() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ routeId, stepId }: { routeId: string; stepId: string }) => {
      await apiClient.delete(`/process-routes/${routeId}/steps/${stepId}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['process-routes', 'detail', variables.routeId] });
      toast.success('Step deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to delete step');
    },
  });
}

export function useReorderRouteSteps() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ routeId, data }: { routeId: string; data: ReorderStepsData }) => {
      await apiClient.patch(`/process-routes/${routeId}/reorder-steps`, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['process-routes', 'detail', variables.routeId] });
      toast.success('Steps reordered successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to reorder steps');
    },
  });
}

// ============================================================================
// COST CALCULATION - MUTATION HOOK
// ============================================================================

export function useCalculateRouteCost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (routeId: string) => {
      const response = await apiClient.post<CostBreakdown>(`/process-routes/${routeId}/calculate-cost`);
      return response;
    },
    onSuccess: (_, routeId) => {
      queryClient.invalidateQueries({ queryKey: ['process-routes', 'detail', routeId] });
      queryClient.invalidateQueries({ queryKey: ['process-routes', 'list'] });
      toast.success('Cost calculated successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to calculate cost');
    },
  });
}
