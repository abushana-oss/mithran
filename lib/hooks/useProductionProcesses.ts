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

export interface CreateProcessData {
    productionLotId: string;
    processName: string;
    description?: string;
    plannedStartDate: string;
    plannedEndDate: string;
    assignedDepartment?: string;
    responsiblePerson?: string;
    machineAllocation?: string[];
    dependsOnProcessId?: string;
    qualityCheckRequired?: boolean;
    remarks?: string;
}

export interface UpdateProcessData {
    processName?: string;
    description?: string;
    plannedStartDate?: string;
    plannedEndDate?: string;
    actualStartDate?: string;
    actualEndDate?: string;
    assignedDepartment?: string;
    responsiblePerson?: string;
    machineAllocation?: string[];
    status?: string;
    completionPercentage?: number;
    dependsOnProcessId?: string;
    qualityCheckRequired?: boolean;
    qualityStatus?: string;
    remarks?: string;
}

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

    const createProcess = useCallback(async (data: CreateProcessData) => {
        // Validate UUID fields before making API call
        if (!isValidUUID(data.productionLotId)) {
            const errorMessage = 'Invalid production lot ID format. Must be a valid UUID.';
            setError(errorMessage);
            toast.error(errorMessage);
            throw new Error(errorMessage);
        }

        if (data.dependsOnProcessId && !isValidUUID(data.dependsOnProcessId)) {
            const errorMessage = 'Invalid depends-on process ID format. Must be a valid UUID.';
            setError(errorMessage);
            toast.error(errorMessage);
            throw new Error(errorMessage);
        }

        setLoading(true);
        setError(null);
        try {
            // Convert frontend camelCase to backend snake_case format
            const backendData = {
                production_lot_id: data.productionLotId,
                process_name: data.processName,
                description: data.description,
                planned_start_date: data.plannedStartDate,
                planned_end_date: data.plannedEndDate,
                assigned_department: data.assignedDepartment,
                responsible_person: data.responsiblePerson,
                machine_allocation: data.machineAllocation,
                depends_on_process_id: data.dependsOnProcessId,
                quality_check_required: data.qualityCheckRequired ?? true, // Default to true
                remarks: data.remarks
            };

            const response: any = await apiClient.post(`/production-planning/lots/${data.productionLotId}/processes`, backendData);
            toast.success('Production process created successfully');
            return response.data;
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || 'Failed to create production process';
            setError(errorMessage);
            toast.error(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

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

    const updateProcess = useCallback(async (processId: string, data: UpdateProcessData) => {
        setLoading(true);
        setError(null);
        try {
            const response: any = await apiClient.patch(`/production-planning/processes/${processId}`, data);
            toast.success('Process updated successfully');
            return response.data;
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || 'Failed to update process';
            setError(errorMessage);
            toast.error(errorMessage);
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

    return {
        loading,
        error,
        createProcess,
        getProcessesByLot,
        getProcessById,
        updateProcess,
        deleteProcess,
        createSubtask,
        getSubtasksByProcess,
        updateSubtask,
        deleteSubtask,
        getAvailableProcesses,
        getLotBomItems,
    };
};
