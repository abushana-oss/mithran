/**
 * Frontend Authentication Configuration
 * 
 * Industry Best Practices:
 * - Environment-based auth bypass for faster development
 * - Secure production settings
 * - Type-safe configuration
 * - Runtime validation
 */

export interface MockUser {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'USER' | 'VIEWER';
  permissions: string[];
}

export class AuthConfig {
  // Environment checks
  static get isDevelopment(): boolean {
    return process.env.NODE_ENV === 'development';
  }

  static get isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
  }

  static get isTest(): boolean {
    return process.env.NODE_ENV === 'test';
  }

  // Auth bypass configuration - NEVER enable in production
  static get isAuthBypassEnabled(): boolean {
    return this.isDevelopment && 
           process.env.NEXT_PUBLIC_DISABLE_AUTH_IN_DEV === 'true';
  }

  // Legacy support
  static get isLegacyAuthDisabled(): boolean {
    return process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true';
  }

  // Combined auth bypass check
  static get shouldSkipAuth(): boolean {
    return this.isAuthBypassEnabled || this.isLegacyAuthDisabled;
  }

  // Default mock user for development
  static get defaultMockUser(): MockUser {
    return {
      id: 'dev-user-001',
      email: 'dev@mithran.local',
      name: 'Development User',
      role: 'ADMIN',
      permissions: ['*']
    };
  }

  // Mock users for different scenarios
  static get mockUsers(): Record<string, MockUser> {
    return {
      admin: {
        id: 'dev-admin-001',
        email: 'admin@mithran.local',
        name: 'Admin User',
        role: 'ADMIN',
        permissions: ['*']
      },
      user: {
        id: 'dev-user-001',
        email: 'user@mithran.local',
        name: 'Regular User',
        role: 'USER',
        permissions: [
          'projects:read',
          'projects:write',
          'vendors:read',
          'vendors:write',
          'production-planning:read',
          'production-planning:write'
        ]
      },
      viewer: {
        id: 'dev-viewer-001',
        email: 'viewer@mithran.local',
        name: 'Viewer User',
        role: 'VIEWER',
        permissions: [
          'projects:read',
          'vendors:read',
          'production-planning:read'
        ]
      }
    };
  }

  // Get mock user type from localStorage or URL params
  static getCurrentMockUser(): MockUser {
    if (typeof window === 'undefined') {
      return this.defaultMockUser;
    }

    // Check URL params for mock user type (useful for testing)
    const urlParams = new URLSearchParams(window.location.search);
    const mockUserType = urlParams.get('mock-user') || 
                        localStorage.getItem('dev-mock-user') || 
                        'admin';

    return this.mockUsers[mockUserType] || this.defaultMockUser;
  }

  // Set mock user type (for testing different roles)
  static setMockUser(userType: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('dev-mock-user', userType);
    }
  }

  // Security validation
  static validateSecuritySettings(): void {
    if (this.isProduction && this.isAuthBypassEnabled) {
      throw new Error(
        'CRITICAL SECURITY ERROR: Auth bypass cannot be enabled in production. ' +
        'Remove NEXT_PUBLIC_DISABLE_AUTH_IN_DEV environment variable.'
      );
    }

    if (this.shouldSkipAuth && this.isDevelopment) {
      console.log(
        '🔓 DEVELOPMENT MODE: Authentication bypassed for faster development. ' +
        'This is ONLY safe in development environments.'
      );
    }
  }

  // Supabase configuration
  static get supabaseConfig() {
    return {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    };
  }

  // Auth URLs
  static get authUrls() {
    return {
      signIn: '/auth/signin',
      signUp: '/auth/signup',
      signOut: '/auth/signout',
      resetPassword: '/auth/reset-password',
      dashboard: '/dashboard',
    };
  }
}

// Initialize validation on module load
if (typeof window !== 'undefined') {
  AuthConfig.validateSecuritySettings();
}