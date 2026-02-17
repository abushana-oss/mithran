/**
 * API functions for comments system
 */

import { apiClient } from './client';

export interface Comment {
  id: string;
  content: string;
  author_id: string;
  author_name?: string;
  parent_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateCommentRequest {
  commentText: string;
  remarkId: string;
}

export interface UpdateCommentRequest {
  content: string;
}

export const CommentsApi = {
  /**
   * Get comments for a remark
   */
  getCommentsByRemark: async (remarkId: string): Promise<Comment[]> => {
    return apiClient.get(`/remarks/${remarkId}/comments`);
  },

  /**
   * Create a new comment
   */
  createComment: async (remarkId: string, data: CreateCommentRequest): Promise<Comment> => {
    return apiClient.post(`/remarks/${remarkId}/comments`, data);
  },

  /**
   * Update a comment
   */
  updateComment: async (commentId: string, data: UpdateCommentRequest): Promise<Comment> => {
    return apiClient.put(`/remarks/comments/${commentId}`, data);
  },

  /**
   * Delete a comment
   */
  deleteComment: async (commentId: string): Promise<void> => {
    return apiClient.delete(`/remarks/comments/${commentId}`);
  },

  /**
   * Get comment by ID
   */
  getCommentById: async (commentId: string): Promise<Comment> => {
    return apiClient.get(`/remarks/comments/${commentId}`);
  }
};