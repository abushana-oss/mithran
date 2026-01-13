import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';
import type {
  ProcessRoute,
  PaginatedProcessRoutes,
  ProcessRoutesFilters,
  CreateProcessRouteRequest,
  UpdateProcessRouteRequest,
  WorkflowTransitionRequest,
  CostSummary,
  WorkflowHistory,
} from '../types/process-planning.types';

// Query keys
export const processRoutesKeys = {
  all: ['process-routes'] as const,
  lists: () => [...processRoutesKeys.all, 'list'] as const,
  list: (filters: ProcessRoutesFilters) => [...processRoutesKeys.lists(), filters] as const,
  details: () => [...processRoutesKeys.all, 'detail'] as const,
  detail: (id: string) => [...processRoutesKeys.details(), id] as const,
  costSummary: (id: string) => [...processRoutesKeys.detail(id), 'cost-summary'] as const,
  workflowHistory: (id: string) => [...processRoutesKeys.detail(id), 'workflow-history'] as const,
};

// Fetch all process routes with filters
export function useProcessRoutes(
  filters: ProcessRoutesFilters = {},
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: processRoutesKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });

      const response = await apiClient.get<PaginatedProcessRoutes>(
        `/process-routes?${params.toString()}`
      );
      return response;
    },
    enabled: options?.enabled !== false,
  });
}

// Fetch single process route
export function useProcessRoute(id: string | undefined) {
  return useQuery({
    queryKey: processRoutesKeys.detail(id!),
    queryFn: async () => {
      const response = await apiClient.get<ProcessRoute>(`/process-routes/${id}`);
      return response;
    },
    enabled: !!id,
  });
}

// Fetch cost summary
export function useProcessRouteCostSummary(id: string | undefined) {
  return useQuery({
    queryKey: processRoutesKeys.costSummary(id!),
    queryFn: async () => {
      const response = await apiClient.get<CostSummary>(`/process-routes/${id}/cost-summary`);
      return response;
    },
    enabled: !!id,
  });
}

// Fetch workflow history
export function useWorkflowHistory(id: string | undefined) {
  return useQuery({
    queryKey: processRoutesKeys.workflowHistory(id!),
    queryFn: async () => {
      const response = await apiClient.get<WorkflowHistory[]>(
        `/process-routes/${id}/workflow/history`
      );
      return response;
    },
    enabled: !!id,
  });
}

// Create process route
export function useCreateProcessRoute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateProcessRouteRequest) => {
      const response = await apiClient.post<ProcessRoute>('/process-routes', data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: processRoutesKeys.lists() });
    },
  });
}

// Update process route
export function useUpdateProcessRoute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateProcessRouteRequest }) => {
      const response = await apiClient.put<ProcessRoute>(`/process-routes/${id}`, data);
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: processRoutesKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: processRoutesKeys.lists() });
    },
  });
}

// Delete process route
export function useDeleteProcessRoute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/process-routes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: processRoutesKeys.lists() });
    },
  });
}

// Workflow actions
export function useSubmitForReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: WorkflowTransitionRequest }) => {
      const response = await apiClient.post<ProcessRoute>(
        `/process-routes/${id}/workflow/submit-for-review`,
        data
      );
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: processRoutesKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: processRoutesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: processRoutesKeys.workflowHistory(variables.id) });
    },
  });
}

export function useApproveRoute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: WorkflowTransitionRequest }) => {
      const response = await apiClient.post<ProcessRoute>(
        `/process-routes/${id}/workflow/approve`,
        data
      );
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: processRoutesKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: processRoutesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: processRoutesKeys.workflowHistory(variables.id) });
    },
  });
}

export function useRejectRoute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: WorkflowTransitionRequest }) => {
      const response = await apiClient.post<ProcessRoute>(
        `/process-routes/${id}/workflow/reject`,
        data
      );
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: processRoutesKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: processRoutesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: processRoutesKeys.workflowHistory(variables.id) });
    },
  });
}

export function useActivateRoute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: WorkflowTransitionRequest }) => {
      const response = await apiClient.post<ProcessRoute>(
        `/process-routes/${id}/workflow/activate`,
        data
      );
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: processRoutesKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: processRoutesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: processRoutesKeys.workflowHistory(variables.id) });
    },
  });
}

export function useArchiveRoute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: WorkflowTransitionRequest }) => {
      const response = await apiClient.post<ProcessRoute>(
        `/process-routes/${id}/workflow/archive`,
        data
      );
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: processRoutesKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: processRoutesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: processRoutesKeys.workflowHistory(variables.id) });
    },
  });
}
