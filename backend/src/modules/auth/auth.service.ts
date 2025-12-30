import { Injectable } from '@nestjs/common';
import { Logger } from '../../common/logger/logger.service';

/**
 * Auth Service
 *
 * ⚠️ DEPRECATED: Most auth logic has been moved to frontend (Supabase Auth)
 *
 * This service is kept minimal for:
 * - Potential future backend-specific auth operations
 * - Migration compatibility
 *
 * Authentication flow:
 * 1. Frontend: User signs in via Supabase Auth (email/password or OAuth)
 * 2. Frontend: Receives JWT token from Supabase
 * 3. Frontend: Sends JWT token in Authorization header to backend APIs
 * 4. Backend: SupabaseAuthGuard verifies JWT token signature
 * 5. Backend: Extracts user info from verified token
 * 6. Backend: Enforces authorization (roles, permissions, RLS)
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly logger: Logger,
  ) {
    this.logger.log('AuthService initialized - Using Supabase frontend authentication', 'AuthService');
  }

  /**
   * Note: All authentication methods (register, login, refresh, logout)
   * have been removed as they are now handled by Supabase on the frontend.
   *
   * The frontend uses @supabase/ssr for authentication.
   * The backend uses SupabaseAuthGuard for token verification.
   */
}
