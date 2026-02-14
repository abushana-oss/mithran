import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AuthConfig } from '../../config/auth.config';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  private authConfig: AuthConfig;

  constructor(
    private supabaseService: SupabaseService,
    private reflector: Reflector,
    private configService: ConfigService,
  ) {
    this.authConfig = new AuthConfig(configService);
    
    // Validate security settings on startup
    this.authConfig.validateSecuritySettings();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // Development bypass - Enhanced with configurable mock users
    if (this.authConfig.isAuthBypassEnabled) {
      return this.handleDevBypass(context);
    }

    // Legacy environment variable support
    if (process.env.DISABLE_AUTH === 'true') {
      return this.handleLegacyDevBypass(context);
    }

    // Production authentication flow
    return this.handleProductionAuth(context);
  }

  private handleDevBypass(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const mockUser = this.authConfig.getMockUserFromRequest(request);
    
    // Attach comprehensive mock user data
    request.user = {
      id: mockUser.id,
      email: mockUser.email,
      role: mockUser.role,
      name: mockUser.name,
      permissions: mockUser.permissions,
      user_metadata: {
        name: mockUser.name,
        role: mockUser.role
      }
    };

    // Generate a mock access token for development
    const mockToken = `dev-token-${mockUser.id}-${Date.now()}`;
    request.accessToken = mockToken;

    // Add development debugging headers
    request.headers['x-auth-bypass'] = 'true';
    request.headers['x-mock-user-id'] = mockUser.id;
    request.headers['x-mock-user-role'] = mockUser.role;
    
    return true;
  }

  private handleLegacyDevBypass(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    // Legacy mock user for backward compatibility - using actual user ID from lots
    request.user = {
      id: '6e7124e7-bf9e-4686-9cac-2245f016a3e4', // Updated to match existing lot creator
      email: 'emuski@mithran.com',
      role: 'admin',
      name: 'Principal Engineer',
    };

    // Generate a mock access token for development
    const mockToken = `dev-token-6e7124e7-bf9e-4686-9cac-2245f016a3e4-${Date.now()}`;
    request.accessToken = mockToken;
    
    return true;
  }

  private async handleProductionAuth(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    const token = authHeader.substring(7);

    try {
      const user = await this.supabaseService.verifyToken(token);
      request.user = user;
      request.accessToken = token; // Store token for Supabase client auth
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
