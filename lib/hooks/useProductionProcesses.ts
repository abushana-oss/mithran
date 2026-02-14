import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api/client';
import { toast } from 'sonner';

/**
 * Production Processes Hook
 * 
 * Handles all production process operations with proper error handling and UUID validation.
 * 
 * Available endpoints:
 * - POST /production-planning/processes - Create new process
 * - GET /production-planning/lots/:lotId/processes - Get processes for a lot
 * - GET /production-planning/processes/:id - Get specific process
 * - PUT /production-planning/processes/:id - Update process
 * - DELETE /production-planning/processes/:id - Delete process
 * - GET /production-planning/processes/:id/subtasks - Get subtasks for a process
 */

// Utility function to validate UUID
const isValidUUID = (uuid: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
};


export interface CreateSubtaskData {
    productionProcessId: string;
    taskName: string;
    description?: string;
    taskSequence: number;
    estimatedDurationHours?: number;
    assignedOperator?: string;
    skillRequirement?: string;
    qualityCheckRequired?: boolean;
    dependsOnSubtaskId?: string;
    remarks?: string;
}

export interface UpdateSubtaskData {
    taskName?: string;
    description?: string;
    taskSequence?: number;
    estimatedDurationHours?: number;
    actualDurationHours?: number;
    assignedOperator?: string;
    skillRequirement?: string;
    status?: string;
    qualityCheckRequired?: boolean;
    qualityCheckPassed?: boolean;
    dependsOnSubtaskId?: string;
    startedAt?: string;
    completedAt?: string;
    remarks?: string;
}

export const useProductionProcesses = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // ==================== Production Processes ====================


    const getProcessesByLot = useCallback(async (lotId: string, silent: boolean = false) => {
        // Validate UUID before making API call
        if (!isValidUUID(lotId)) {
            const errorMessage = 'Invalid lot ID format. Must be a valid UUID.';
            setError(errorMessage);
            if (!silent) {
                toast.error(errorMessage);
            }
            throw new Error(errorMessage);
        }

        setLoading(true);
        setError(null);
        try {
            // Use the correct endpoint from the controller
            const response: any = await apiClient.get(`/production-planning/lots/${lotId}/processes`, { silent: silent as any });
            return response;
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || 'Failed to fetch processes for this production lot';
            setError(errorMessage);
            if (!silent) {
                throw err;
            }
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const getProcessById = useCallback(async (processId: string) => {
        setLoading(true);
        setError(null);
        try {
            const response: any = await apiClient.get(`/production-planning/processes/${processId}`);
            return response.data;
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || 'Failed to fetch process';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);


    const deleteProcess = useCallback(async (processId: string) => {
        setLoading(true);
        setError(null);
        try {
            await apiClient.delete(`/production-planning/processes/${processId}`);
            toast.success('Process deleted successfully');
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || 'Failed to delete process';
            setError(errorMessage);
            toast.error(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // ==================== Process Subtasks ====================

    const createSubtask = useCallback(async (data: CreateSubtaskData) => {
        setLoading(true);
        setError(null);
        try {
            const response: any = await apiClient.post('/production-planning/processes/subtasks', data);
            toast.success('Subtask created successfully');
            return response.data;
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || 'Failed to create subtask';
            setError(errorMessage);
            toast.error(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const getSubtasksByProcess = useCallback(async (processId: string) => {
        setLoading(true);
        setError(null);
        try {
            const response: any = await apiClient.get(`/production-planning/processes/${processId}/subtasks`);
            return response.data;
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || 'Failed to fetch subtasks';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const updateSubtask = useCallback(async (subtaskId: string, data: UpdateSubtaskData) => {
        setLoading(true);
        setError(null);
        try {
            const response: any = await apiClient.patch(`/production-planning/processes/subtasks/${subtaskId}`, data);
            toast.success('Subtask updated successfully');
            return response.data;
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || 'Failed to update subtask';
            setError(errorMessage);
            toast.error(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const deleteSubtask = useCallback(async (subtaskId: string) => {
        setLoading(true);
        setError(null);
        try {
            await apiClient.delete(`/production-planning/processes/subtasks/${subtaskId}`);
            toast.success('Subtask deleted successfully');
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || 'Failed to delete subtask';
            setError(errorMessage);
            toast.error(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const getAvailableProcesses = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Use existing processes API endpoint
            const response: any = await apiClient.get('/processes');
            return response;
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch available processes';
            setError(errorMessage);
            toast.error(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // ==================== Global Process Templates ====================

    const getGlobalProcessTemplates = useCallback(async (silent: boolean = false) => {
        setLoading(true);
        setError(null);
        try {
            // Fetch global process templates that can be used across all lots
            const response: any = await apiClient.get('/production-planning/process-templates', { silent: silent as any });
            return response;
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || 'Failed to fetch global process templates';
            setError(errorMessage);
            if (!silent) {
                toast.error(errorMessage);
                throw err;
            }
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const createGlobalProcessTemplate = useCallback(async (templateData: any) => {
        setLoading(true);
        setError(null);
        try {
            const response: any = await apiClient.post('/production-planning/process-templates', templateData);
            toast.success('Global process template created successfully');
            return response;
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || 'Failed to create global process template';
            setError(errorMessage);
            toast.error(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const getLotBomItems = useCallback(async (lotId: string, silent: boolean = false) => {
        // Validate UUID before making API call
        if (!isValidUUID(lotId)) {
            const errorMessage = 'Invalid lot ID format. Must be a valid UUID.';
            setError(errorMessage);
            if (!silent) {
                toast.error(errorMessage);
            }
            throw new Error(errorMessage);
        }

        setLoading(true);
        setError(null);
        try {
            const response: any = await apiClient.get(`/production-planning/lots/${lotId}/bom-items`, { silent: silent as any });
            return response;
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || 'Failed to fetch BOM items for this lot';
            setError(errorMessage);
            if (!silent) {
                toast.error(errorMessage);
            }
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // ==================== BOM Items Management ====================

    const addBomItemToLot = useCallback(async (lotId: string, bomItemData: {
        partNumber: string;
        partName: string;
        description?: string;
        requiredQuantity: number;
        unit: string;
        materialId?: string;
    }) => {
        if (!isValidUUID(lotId)) {
            const errorMessage = 'Invalid lot ID format. Must be a valid UUID.';
            setError(errorMessage);
            toast.error(errorMessage);
            throw new Error(errorMessage);
        }

        setLoading(true);
        setError(null);
        try {
            const response: any = await apiClient.post(`/production-planning/lots/${lotId}/bom-items`, bomItemData);
            toast.success('BOM item added to lot successfully');
            return response;
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || 'Failed to add BOM item to lot';
            setError(errorMessage);
            toast.error(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const updateLotBomItem = useCallback(async (lotId: string, bomItemId: string, updateData: {
        partNumber?: string;
        partName?: string;
        description?: string;
        requiredQuantity?: number;
        unit?: string;
    }) => {
        if (!isValidUUID(lotId)) {
            const errorMessage = 'Invalid lot ID format. Must be a valid UUID.';
            setError(errorMessage);
            toast.error(errorMessage);
            throw new Error(errorMessage);
        }

        setLoading(true);
        setError(null);
        try {
            const response: any = await apiClient.put(`/production-planning/lots/${lotId}/bom-items/${bomItemId}`, updateData);
            toast.success('BOM item updated successfully');
            return response;
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || 'Failed to update BOM item';
            setError(errorMessage);
            toast.error(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const removeBomItemFromLot = useCallback(async (lotId: string, bomItemId: string) => {
        if (!isValidUUID(lotId)) {
            const errorMessage = 'Invalid lot ID format. Must be a valid UUID.';
            setError(errorMessage);
            toast.error(errorMessage);
            throw new Error(errorMessage);
        }

        setLoading(true);
        setError(null);
        try {
            await apiClient.delete(`/production-planning/lots/${lotId}/bom-items/${bomItemId}`);
            toast.success('BOM item removed from lot successfully');
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || 'Failed to remove BOM item from lot';
            setError(errorMessage);
            toast.error(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const copyBomFromProject = useCallback(async (lotId: string, projectId: string, bomId?: string) => {
        if (!isValidUUID(lotId) || !isValidUUID(projectId)) {
            const errorMessage = 'Invalid lot or project ID format. Must be valid UUIDs.';
            setError(errorMessage);
            toast.error(errorMessage);
            throw new Error(errorMessage);
        }

        setLoading(true);
        setError(null);
        try {
            const payload = { projectId, ...(bomId && { bomId }) };
            const response: any = await apiClient.post(`/production-planning/lots/${lotId}/copy-bom`, payload);
            toast.success('BOM copied to lot successfully');
            return response;
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || 'Failed to copy BOM to lot';
            setError(errorMessage);
            toast.error(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const createProcess = useCallback(async (processData: any) => {
        const { productionLotId, ...createDto } = processData;
        
        if (!isValidUUID(productionLotId)) {
            const errorMessage = 'Invalid production lot ID format. Must be a valid UUID.';
            setError(errorMessage);
            toast.error(errorMessage);
            throw new Error(errorMessage);
        }

        // Include production_lot_id in the DTO as required by backend
        const requestDto = {
            ...createDto,
            production_lot_id: productionLotId
        };

        setLoading(true);
        setError(null);
        try {
            const response: any = await apiClient.post(`/production-planning/lots/${productionLotId}/processes`, requestDto);
            toast.success('Process created successfully');
            return response;
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || 'Failed to create process';
            setError(errorMessage);
            toast.error(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const updateProcess = useCallback(async (processId: string, updateData: any) => {
        if (!isValidUUID(processId)) {
            const errorMessage = 'Invalid process ID format. Must be a valid UUID.';
            setError(errorMessage);
            toast.error(errorMessage);
            throw new Error(errorMessage);
        }

        setLoading(true);
        setError(null);
        try {
            const response: any = await apiClient.put(`/production-planning/processes/${processId}`, updateData);
            toast.success('Process updated successfully');
            return response;
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || 'Failed to update process';
            setError(errorMessage);
            toast.error(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        loading,
        error,
        getProcessesByLot,
        getProcessById,
        deleteProcess,
        createProcess,
        updateProcess,
        createSubtask,
        getSubtasksByProcess,
        updateSubtask,
        deleteSubtask,
        getAvailableProcesses,
        getGlobalProcessTemplates,
        createGlobalProcessTemplate,
        getLotBomItems,
        addBomItemToLot,
        updateLotBomItem,
        removeBomItemFromLot,
        copyBomFromProject,
    };
};
