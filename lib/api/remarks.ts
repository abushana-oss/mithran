/**
 * API functions for remarks and issues system
 */

import { apiClient } from './client';

export interface Remark {
  id: string;
  lot_id: string;
  bom_part_id?: string | null;
  type: 'remark' | 'issue' | 'quality_check' | 'delay' | 'material_shortage';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  assigned_to?: string | null;
  assigned_to_name?: string | null;
  reported_by: string;
  reported_by_name?: string;
  due_date?: string | null;
  resolved_at?: string | null;
  resolution?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateRemarkRequest {
  lot_id: string;
  bom_part_id?: string | null;
  type: 'remark' | 'issue' | 'quality_check' | 'delay' | 'material_shortage';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  assigned_to?: string | null;
  due_date?: string | null;
}

export interface UpdateRemarkRequest {
  title?: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  status?: 'open' | 'in_progress' | 'resolved' | 'closed';
  assigned_to?: string | null;
  due_date?: string | null;
  resolution?: string | null;
}

export interface RemarkResponseDto {
  data: Remark[];
  total?: number;
  page?: number;
  limit?: number;
}

export const RemarksApi = {
  /**
   * Get remarks for a production lot
   */
  getRemarksByLot: async (lotId: string): Promise<Remark[]> => {
    return apiClient.get(`/remarks/lot/${lotId}`);
  },

  /**
   * Get remarks for a BOM part
   */
  getRemarksByBomPart: async (bomPartId: string): Promise<Remark[]> => {
    return apiClient.get(`/remarks/bom-part/${bomPartId}`);
  },

  /**
   * Create a new remark
   */
  createRemark: async (data: CreateRemarkRequest): Promise<Remark> => {
    return apiClient.post('/remarks', data);
  },

  /**
   * Update a remark
   */
  updateRemark: async (remarkId: string, data: UpdateRemarkRequest): Promise<Remark> => {
    return apiClient.put(`/remarks/${remarkId}`, data);
  },

  /**
   * Delete a remark
   */
  deleteRemark: async (remarkId: string): Promise<void> => {
    return apiClient.delete(`/remarks/${remarkId}`);
  },

  /**
   * Get remark by ID
   */
  getRemarkById: async (remarkId: string): Promise<Remark> => {
    return apiClient.get(`/remarks/${remarkId}`);
  },

  /**
   * Assign remark to user
   */
  assignRemark: async (remarkId: string, userId: string): Promise<Remark> => {
    return apiClient.put(`/remarks/${remarkId}/assign`, {
      assigned_to: userId
    });
  },

  /**
   * Resolve a remark
   */
  resolveRemark: async (remarkId: string, resolution: string): Promise<Remark> => {
    return apiClient.put(`/remarks/${remarkId}/resolve`, {
      resolution,
      status: 'resolved'
    });
  },

  /**
   * Get remarks by status
   */
  getRemarksByStatus: async (status: string, lotId?: string): Promise<Remark[]> => {
    const params = lotId ? { lot_id: lotId } : {};
    return apiClient.get(`/remarks/status/${status}`, { params });
  },

  /**
   * Get remarks assigned to user
   */
  getRemarksByAssignee: async (userId: string): Promise<Remark[]> => {
    return apiClient.get(`/remarks/assigned/${userId}`);
  }
};