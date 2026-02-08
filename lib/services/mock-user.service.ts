/**
 * Mock User Service for Development
 * 
 * Provides mock user functionality for development environments
 * following industry best practices:
 * - Type-safe user interfaces
 * - Role-based access control simulation
 * - Easy user switching for testing
 * - Production safety guards
 */

import { AuthConfig, MockUser } from '../config/auth.config';

export class MockUserService {
  private static instance: MockUserService;
  private currentUser: MockUser | null = null;

  private constructor() {
    if (!AuthConfig.shouldSkipAuth) {
      throw new Error('MockUserService can only be used when auth is bypassed');
    }
    
    this.currentUser = AuthConfig.getCurrentMockUser();
  }

  static getInstance(): MockUserService {
    if (!this.instance) {
      this.instance = new MockUserService();
    }
    return this.instance;
  }

  // Get current mock user
  getCurrentUser(): MockUser {
    return this.currentUser || AuthConfig.defaultMockUser;
  }

  // Switch to different mock user role
  switchUser(userType: 'admin' | 'user' | 'viewer'): void {
    if (!AuthConfig.shouldSkipAuth) {
      throw new Error('Cannot switch users when auth is not bypassed');
    }

    const newUser = AuthConfig.mockUsers[userType];
    if (!newUser) {
      throw new Error(`Invalid user type: ${userType}`);
    }

    this.currentUser = newUser;
    AuthConfig.setMockUser(userType);
    
    // Emit custom event for components to react to user changes
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mockUserChanged', {
        detail: { user: newUser, userType }
      }));
    }

    console.log(`🔄 Switched to mock user: ${newUser.name} (${newUser.role})`);
  }

  // Check if user has permission
  hasPermission(permission: string): boolean {
    const user = this.getCurrentUser();
    
    // Admin has all permissions
    if (user.permissions.includes('*')) {
      return true;
    }

    return user.permissions.includes(permission);
  }

  // Check if user has role
  hasRole(role: string): boolean {
    return this.getCurrentUser().role === role.toUpperCase();
  }

  // Get user info for API headers
  getApiHeaders(): Record<string, string> {
    const user = this.getCurrentUser();
    
    return {
      'x-mock-user': user.role.toLowerCase(),
      'x-auth-bypass': 'true',
      'x-dev-mode': 'true',
      'x-mock-user-id': user.id,
      'x-mock-user-email': user.email,
    };
  }

  // Get all available mock users
  getAvailableUsers(): Record<string, MockUser> {
    return AuthConfig.mockUsers;
  }

  // Create session-like object for compatibility
  createMockSession() {
    const user = this.getCurrentUser();
    
    return {
      user: {
        id: user.id,
        email: user.email,
        user_metadata: {
          name: user.name,
          role: user.role
        }
      },
      access_token: 'mock-token',
      expires_in: 3600,
      token_type: 'bearer'
    };
  }

  // Dev tools for debugging
  debugInfo() {
    const user = this.getCurrentUser();
    
    return {
      currentUser: user,
      authBypass: AuthConfig.shouldSkipAuth,
      environment: process.env.NODE_ENV,
      availableUsers: Object.keys(AuthConfig.mockUsers),
      permissions: user.permissions,
    };
  }
}

// Export singleton instance for easy use
export const mockUserService = AuthConfig.shouldSkipAuth 
  ? MockUserService.getInstance() 
  : null;

// React hook for mock user (if using React)
export function useMockUser() {
  if (!AuthConfig.shouldSkipAuth || !mockUserService) {
    throw new Error('useMockUser can only be used when auth is bypassed');
  }

  return {
    user: mockUserService.getCurrentUser(),
    switchUser: mockUserService.switchUser.bind(mockUserService),
    hasPermission: mockUserService.hasPermission.bind(mockUserService),
    hasRole: mockUserService.hasRole.bind(mockUserService),
    debugInfo: mockUserService.debugInfo.bind(mockUserService),
  };
}