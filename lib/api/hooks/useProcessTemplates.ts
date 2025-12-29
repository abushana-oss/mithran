import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';
import { toast } from 'sonner';
import { ProcessRoute } from './useProcessRoutes';

// ============================================================================
// TYPES
// ============================================================================

export interface ProcessTemplateStep {
  id: string;
  processTemplateId: string;
  processId: string;
  stepNumber: number;
  operationName: string;
  defaultSetupTimeMinutes?: number;
  defaultCycleTimeMinutes?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProcessTemplate {
  id: string;
  name: string;
  description?: string;
  category?: string;
  userId: string;
  organizationId?: string;
  createdAt: Date;
  updatedAt: Date;
  steps?: ProcessTemplateStep[];
}

export interface ProcessTemplateListResponse {
  templates: ProcessTemplate[];
  count: number;
  page?: number;
  limit?: number;
}

export interface QueryProcessTemplatesParams {
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateProcessTemplateData {
  name: string;
  description?: string;
  category?: string;
}

export interface UpdateProcessTemplateData extends Partial<CreateProcessTemplateData> {}

export interface CreateProcessTemplateStepData {
  processTemplateId: string;
  processId: string;
  stepNumber: number;
  operationName: string;
  defaultSetupTimeMinutes?: number;
  defaultCycleTimeMinutes?: number;
  notes?: string;
}

export interface UpdateProcessTemplateStepData extends Partial<CreateProcessTemplateStepData> {}

export interface ApplyTemplateData {
  bomItemId: string;
  templateId: string;
  routeName?: string;
}

// ============================================================================
// PROCESS TEMPLATES - QUERY HOOKS
// ============================================================================

export function useProcessTemplates(params?: QueryProcessTemplatesParams) {
  return useQuery({
    queryKey: ['process-templates', 'list', params],
    queryFn: async () => {
      const response = await apiClient.get<ProcessTemplateListResponse>('/process-templates', { params });
      return response;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useProcessTemplate(id: string | undefined) {
  return useQuery({
    queryKey: ['process-templates', 'detail', id],
    queryFn: async () => {
      if (!id) throw new Error('Process template ID is required');
      const response = await apiClient.get<ProcessTemplate>(`/process-templates/${id}`);
      return response;
    },
    enabled: !!id,
  });
}

// ============================================================================
// PROCESS TEMPLATES - MUTATION HOOKS
// ============================================================================

export function useCreateProcessTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateProcessTemplateData) => {
      const response = await apiClient.post<ProcessTemplate>('/process-templates', data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['process-templates', 'list'] });
      toast.success('Process template created successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to create process template');
    },
  });
}

export function useUpdateProcessTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateProcessTemplateData }) => {
      const response = await apiClient.put<ProcessTemplate>(`/process-templates/${id}`, data);
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['process-templates', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['process-templates', 'detail', variables.id] });
      toast.success('Process template updated successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update process template');
    },
  });
}

export function useDeleteProcessTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/process-templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['process-templates', 'list'] });
      toast.success('Process template deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to delete process template');
    },
  });
}

// ============================================================================
// PROCESS TEMPLATE STEPS - MUTATION HOOKS
// ============================================================================

export function useAddTemplateStep() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateProcessTemplateStepData) => {
      const response = await apiClient.post<ProcessTemplateStep>(
        `/process-templates/${data.processTemplateId}/steps`,
        data
      );
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['process-templates', 'detail', variables.processTemplateId] });
      toast.success('Template step added successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to add template step');
    },
  });
}

export function useUpdateTemplateStep() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ templateId, stepId, data }: { templateId: string; stepId: string; data: UpdateProcessTemplateStepData }) => {
      const response = await apiClient.put<ProcessTemplateStep>(
        `/process-templates/${templateId}/steps/${stepId}`,
        data
      );
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['process-templates', 'detail', variables.templateId] });
      toast.success('Template step updated successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update template step');
    },
  });
}

export function useDeleteTemplateStep() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ templateId, stepId }: { templateId: string; stepId: string }) => {
      await apiClient.delete(`/process-templates/${templateId}/steps/${stepId}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['process-templates', 'detail', variables.templateId] });
      toast.success('Template step deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to delete template step');
    },
  });
}

// ============================================================================
// APPLY TEMPLATE - KEY MUTATION
// ============================================================================

export function useApplyTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ApplyTemplateData) => {
      const response = await apiClient.post<ProcessRoute>('/process-templates/apply-template', data);
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['process-routes', 'list', { bomItemId: variables.bomItemId }] });
      queryClient.invalidateQueries({ queryKey: ['process-routes', 'list'] });
      toast.success('Template applied successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to apply template');
    },
  });
}
