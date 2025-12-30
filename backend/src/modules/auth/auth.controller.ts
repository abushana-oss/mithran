import {
  Controller,
  Get,
  UseGuards,
  Request,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';

/**
 * Auth Controller
 *
 * ⚠️ IMPORTANT: Authentication is handled by Supabase on the frontend
 * This controller only provides token verification endpoints
 *
 * Frontend handles:
 * - User registration (Supabase Auth)
 * - Login/logout (Supabase Auth)
 * - Password reset (Supabase Auth)
 * - Token refresh (Supabase Auth)
 * - OAuth (Google, GitHub, etc.)
 *
 * Backend handles:
 * - Token verification (SupabaseAuthGuard)
 * - User info extraction from tokens
 * - Authorization (roles, permissions)
 */
@ApiTags('Authentication')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  /**
   * Get current authenticated user
   *
   * The SupabaseAuthGuard automatically verifies the JWT token
   * and extracts user information, attaching it to req.user
   */
  @Get('me')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current user',
    description: 'Returns the currently authenticated user information from the JWT token'
  })
  @ApiResponse({
    status: 200,
    description: 'Current user information',
    schema: {
      example: {
        success: true,
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'user@example.com',
          fullName: 'John Doe',
          emailConfirmed: true,
        },
        metadata: {
          timestamp: '2024-01-01T00:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  async getCurrentUser(@Request() req: any) {
    // User info is already attached to request by SupabaseAuthGuard
    return {
      id: req.user.id,
      email: req.user.email,
      fullName: req.user.user_metadata?.full_name,
      emailConfirmed: req.user.email_confirmed_at ? true : false,
    };
  }
}
