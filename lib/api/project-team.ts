/**
 * Project Team Members API
 */

import { apiClient } from './client';

export type TeamMemberRole = 'owner' | 'admin' | 'member' | 'viewer';

export type TeamMember = {
  id: string;
  userId: string;
  email: string;
  name?: string;
  role: TeamMemberRole;
  addedAt: string;
};

export type AddTeamMemberData = {
  email: string;
  role?: TeamMemberRole;
};

export type UpdateTeamMemberData = {
  role: TeamMemberRole;
};

export type TeamMembersResponse = {
  members: TeamMember[];
  total: number;
};

export const projectTeamApi = {
  /**
   * Get all team members for a project
   */
  getAll: async (projectId: string): Promise<TeamMembersResponse> => {
    return apiClient.get<TeamMembersResponse>(`/projects/${projectId}/team`);
  },

  /**
   * Add team member to project
   */
  add: async (projectId: string, data: AddTeamMemberData): Promise<TeamMember> => {
    return apiClient.post<TeamMember>(`/projects/${projectId}/team`, data);
  },

  /**
   * Update team member role
   */
  update: async (projectId: string, memberId: string, data: UpdateTeamMemberData): Promise<TeamMember> => {
    return apiClient.put<TeamMember>(`/projects/${projectId}/team/${memberId}`, data);
  },

  /**
   * Remove team member from project
   */
  remove: async (projectId: string, memberId: string): Promise<void> => {
    return apiClient.delete(`/projects/${projectId}/team/${memberId}`);
  },
};
