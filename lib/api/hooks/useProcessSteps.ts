import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';
import type {
  ProcessRouteStep,
  CreateProcessRouteStepRequest,
  UpdateProcessRouteStepRequest,
} from '../types/process-planning.types';
import { processRoutesKeys } from './useProcessRoutes';

// Query keys
export const processStepsKeys = {
  all: ['process-steps'] as const,
  byRoute: (routeId: string) => [...processStepsKeys.all, 'route', routeId] as const,
  detail: (id: string) => [...processStepsKeys.all, 'detail', id] as const,
};

// Fetch steps for a route
export function useProcessSteps(routeId: string | undefined) {
  return useQuery({
    queryKey: processStepsKeys.byRoute(routeId!),
    queryFn: async () => {
      const response = await apiClient.get<ProcessRouteStep[]>(`/process-routes/${routeId}/steps`);
      return response;
    },
    enabled: !!routeId,
  });
}

// Create step
export function useCreateProcessStep() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      routeId,
      data,
    }: {
      routeId: string;
      data: CreateProcessRouteStepRequest;
    }) => {
      const response = await apiClient.post<ProcessRouteStep>(
        `/process-routes/${routeId}/steps`,
        data
      );
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: processStepsKeys.byRoute(variables.routeId) });
      queryClient.invalidateQueries({ queryKey: processRoutesKeys.detail(variables.routeId) });
      queryClient.invalidateQueries({
        queryKey: processRoutesKeys.costSummary(variables.routeId),
      });
    },
  });
}

// Update step
export function useUpdateProcessStep() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      routeId,
      stepId,
      data,
    }: {
      routeId: string;
      stepId: string;
      data: UpdateProcessRouteStepRequest;
    }) => {
      const response = await apiClient.put<ProcessRouteStep>(
        `/process-routes/${routeId}/steps/${stepId}`,
        data
      );
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: processStepsKeys.byRoute(variables.routeId) });
      queryClient.invalidateQueries({ queryKey: processRoutesKeys.detail(variables.routeId) });
      queryClient.invalidateQueries({
        queryKey: processRoutesKeys.costSummary(variables.routeId),
      });
    },
  });
}

// Delete step
export function useDeleteProcessStep() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ routeId, stepId }: { routeId: string; stepId: string }) => {
      await apiClient.delete(`/process-routes/${routeId}/steps/${stepId}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: processStepsKeys.byRoute(variables.routeId) });
      queryClient.invalidateQueries({ queryKey: processRoutesKeys.detail(variables.routeId) });
      queryClient.invalidateQueries({
        queryKey: processRoutesKeys.costSummary(variables.routeId),
      });
    },
  });
}

// Reorder steps
export function useReorderProcessSteps() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ routeId, stepIds }: { routeId: string; stepIds: string[] }) => {
      const response = await apiClient.post<ProcessRouteStep[]>(
        `/process-routes/${routeId}/steps/reorder`,
        { stepIds }
      );
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: processStepsKeys.byRoute(variables.routeId) });
    },
  });
}

// Execute calculator for step
export function useExecuteCalculator() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      routeId,
      stepId,
      inputs,
    }: {
      routeId: string;
      stepId: string;
      inputs: Record<string, any>;
    }) => {
      const response = await apiClient.post<ProcessRouteStep>(
        `/process-routes/${routeId}/steps/${stepId}/calculate`,
        { inputs }
      );
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: processStepsKeys.byRoute(variables.routeId) });
      queryClient.invalidateQueries({ queryKey: processRoutesKeys.detail(variables.routeId) });
      queryClient.invalidateQueries({
        queryKey: processRoutesKeys.costSummary(variables.routeId),
      });
    },
  });
}
