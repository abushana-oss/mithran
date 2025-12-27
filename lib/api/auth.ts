/**
 * Authentication API
 */

import { apiClient } from './client';

export type AuthUser = {
  id: string;
  email: string;
  fullName?: string;
  role?: string;
  createdAt: string;
  updatedAt: string;
};

export type LoginCredentials = {
  email: string;
  password: string;
};

export type RegisterData = {
  email: string;
  password: string;
  fullName?: string;
};

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
  requiresEmailConfirmation?: boolean;
};

export const authApi = {
  /**
   * Login with email and password
   */
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);

    // Store tokens in API client
    if (response.accessToken) {
      apiClient.setAccessToken(response.accessToken);
      apiClient.setRefreshToken(response.refreshToken);
    }

    return response;
  },

  /**
   * Register new user
   */
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);

    // Store tokens in API client
    if (response.accessToken) {
      apiClient.setAccessToken(response.accessToken);
      apiClient.setRefreshToken(response.refreshToken);
    }

    return response;
  },

  /**
   * Logout current user
   */
  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout', {});
    } finally {
      // Clear tokens regardless of API call result
      apiClient.setAccessToken(null);
      apiClient.setRefreshToken(null);
    }
  },

  /**
   * Get current user profile
   */
  getCurrentUser: async (): Promise<AuthUser> => {
    return apiClient.get<AuthUser>('/auth/me');
  },

  /**
   * Refresh access token
   */
  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/refresh', {
      refreshToken,
    });

    // Update tokens in API client
    if (response.accessToken) {
      apiClient.setAccessToken(response.accessToken);
      apiClient.setRefreshToken(response.refreshToken);
    }

    return response;
  },

  // Password reset and profile management endpoints will be added in future release
};
