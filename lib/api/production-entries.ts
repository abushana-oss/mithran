/**
 * API functions for production entries
 */

import { apiClient } from './client';

export interface ProductionEntry {
  id: string;
  lot_id: string;
  bom_part_id?: string;
  process_id?: string;
  date: string;
  quantity: number;
  unit: string;
  status: 'planned' | 'in_progress' | 'completed' | 'on_hold';
  operator_id?: string;
  operator_name?: string;
  shift?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateProductionEntryRequest {
  lot_id: string; // For URL path (will be extracted)
  productionLotId: string;
  productionProcessId?: string;
  entryDate: string;
  entryType: 'daily' | 'weekly' | 'shift';
  plannedQuantity?: number;
  actualQuantity: number;
  rejectedQuantity?: number;
  reworkQuantity?: number;
  downtimeHours?: number;
  downtimeReason?: string;
  shift?: string;
  operatorsCount?: number;
  supervisor?: string;
  remarks?: string;
  issuesEncountered?: string;
}

export interface UpdateProductionEntryRequest {
  date?: string;
  quantity?: number;
  unit?: string;
  status?: 'planned' | 'in_progress' | 'completed' | 'on_hold';
  operator_id?: string;
  shift?: string;
  notes?: string;
}

export const productionEntriesApi = {
  /**
   * Get production entries for a lot
   */
  getEntriesByLot: async (lotId: string): Promise<ProductionEntry[]> => {
    return apiClient.get(`/production-planning/lots/${lotId}/production-entries`);
  },

  /**
   * Get production entries for a process
   */
  getEntriesByProcess: async (processId: string): Promise<ProductionEntry[]> => {
    return apiClient.get(`/production-planning/processes/${processId}/production-entries`);
  },

  /**
   * Create a new production entry
   */
  createEntry: async (data: CreateProductionEntryRequest & { lot_id: string }): Promise<ProductionEntry> => {
    const { lot_id, ...entryData } = data;
    return apiClient.post(`/production-planning/lots/${lot_id}/production-entries`, entryData);
  },

  /**
   * Update a production entry
   */
  updateEntry: async (entryId: string, data: UpdateProductionEntryRequest): Promise<ProductionEntry> => {
    return apiClient.put(`/production-planning/production-entries/${entryId}`, data);
  },

  /**
   * Delete a production entry
   */
  deleteEntry: async (entryId: string): Promise<void> => {
    return apiClient.delete(`/production-planning/production-entries/${entryId}`);
  },

  /**
   * Get entry by ID
   */
  getEntryById: async (entryId: string): Promise<ProductionEntry> => {
    return apiClient.get(`/production-planning/production-entries/${entryId}`);
  },

  /**
   * Get daily production summary
   */
  getDailyProduction: async (date: string, lotId?: string): Promise<{
    date: string;
    totalQuantity: number;
    entriesCount: number;
    byStatus: Record<string, number>;
  }> => {
    const params = lotId ? { lot_id: lotId } : {};
    return apiClient.get(`/production-planning/daily-production/${date}`, { params });
  },

  /**
   * Get weekly production summary
   */
  getWeeklySummary: async (lotId: string): Promise<{
    week: string;
    totalPlanned: number;
    totalActual: number;
    totalRejected: number;
    totalRework: number;
    efficiency: number;
    dailyBreakdown: Array<{
      date: string;
      planned: number;
      actual: number;
      rejected: number;
      rework: number;
      efficiency: number;
    }>;
  }[]> => {
    return apiClient.get(`/production-planning/production-entries/weekly-summary/${lotId}`);
  }
};