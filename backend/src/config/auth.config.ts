/**
 * Authentication Configuration
 * 
 * Industry Best Practices:
 * - Environment-based auth bypass for development speed
 * - Zero-trust security model for production
 * - Configurable mock users for testing
 * - Audit trail and security logging
 */

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface MockUser {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'USER' | 'VIEWER';
  permissions: string[];
}

@Injectable()
export class AuthConfig {
  constructor(private configService: ConfigService) {}

  // Environment-based auth bypass - NEVER enable in production
  get isAuthBypassEnabled(): boolean {
    return this.configService.get('NODE_ENV') === 'development' && 
           this.configService.get('DISABLE_AUTH_IN_DEV', 'false') === 'true';
  }

  // Default mock user for development
  get defaultMockUser(): MockUser {
    return {
      id: 'dev-user-001',
      email: 'dev@mithran.local',
      name: 'Development User',
      role: 'ADMIN',
      permissions: ['*'] // Full permissions in development
    };
  }

  // Mock users for different scenarios
  get mockUsers(): Record<string, MockUser> {
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

  // Get mock user from request header or default
  getMockUserFromRequest(request: any): MockUser {
    const mockUserType = request.headers['x-mock-user'] || 'admin';
    return this.mockUsers[mockUserType] || this.defaultMockUser;
  }

  // Security validation - ensure auth bypass is never enabled in production
  validateSecuritySettings(): void {
    const nodeEnv = this.configService.get('NODE_ENV');
    const authBypass = this.configService.get('DISABLE_AUTH_IN_DEV', 'false');
    
    if (nodeEnv === 'production' && authBypass === 'true') {
      throw new Error(
        'CRITICAL SECURITY ERROR: Auth bypass cannot be enabled in production. ' +
        'Remove DISABLE_AUTH_IN_DEV environment variable.'
      );
    }

    if (nodeEnv === 'staging' && authBypass === 'true') {
      // Auth bypass enabled in staging environment
    }

    if (this.isAuthBypassEnabled) {
      // Authentication bypassed for development
    }
  }

  // JWT Configuration
  get jwtConfig() {
    return {
      secret: this.configService.get('JWT_SECRET', 'dev-secret-key'),
      expirationTime: this.configService.get('JWT_EXPIRATION', '24h'),
      refreshExpirationTime: this.configService.get('JWT_REFRESH_EXPIRATION', '7d'),
    };
  }

  // Supabase Configuration
  get supabaseConfig() {
    return {
      url: this.configService.get('SUPABASE_URL'),
      anonKey: this.configService.get('SUPABASE_ANON_KEY'),
      serviceRoleKey: this.configService.get('SUPABASE_SERVICE_ROLE_KEY'),
    };
  }
}