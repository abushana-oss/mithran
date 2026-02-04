/**
 * Authentication Request Interceptor - Principal Engineering Solution
 * 
 * Enterprise-grade request interceptor that coordinates auth state:
 * - Intercepts all API requests
 * - Validates auth state before allowing requests
 * - Queues requests during auth validation
 * - Prevents race conditions at the API layer
 * - Scalable for high-throughput applications
 */

import { authCoordinator, AuthCoordinatorState } from './auth-coordinator';
import { requestQueue } from './request-queue';
import { logger } from '@/lib/utils/logger';

interface RequestContext {
  endpoint: string;
  method: string;
  isPublic: boolean;
  requiresAuth: boolean;
}

export class AuthRequestInterceptor {
  private static instance: AuthRequestInterceptor;

  private constructor() {}

  static getInstance(): AuthRequestInterceptor {
    if (!AuthRequestInterceptor.instance) {
      AuthRequestInterceptor.instance = new AuthRequestInterceptor();
    }
    return AuthRequestInterceptor.instance;
  }

  /**
   * Intercept request and coordinate auth state
   */
  async interceptRequest<T>(
    context: RequestContext,
    executor: () => Promise<T>
  ): Promise<T> {
    const { endpoint, method, isPublic, requiresAuth } = context;

    // Allow public endpoints immediately
    if (isPublic || !requiresAuth) {
      return executor();
    }

    const authState = authCoordinator.getState();

    // Handle different auth states
    switch (authState) {
      case AuthCoordinatorState.AUTHENTICATED:
        // Auth is confirmed - execute immediately
        return executor();

      case AuthCoordinatorState.INITIALIZING:
      case AuthCoordinatorState.VALIDATING:
        // Auth in progress - queue the request
        return this.queueRequest(context, executor);

      case AuthCoordinatorState.UNAUTHENTICATED:
        // No auth - reject immediately
        throw new Error('Authentication required - please sign in');

      case AuthCoordinatorState.ERROR:
        // Auth error - try to recover once, then fail
        return this.handleAuthError(context, executor);

      default:
        // Unknown state - queue for safety
        return this.queueRequest(context, executor);
    }
  }

  /**
   * Queue request until auth is ready
   */
  private async queueRequest<T>(
    context: RequestContext,
    executor: () => Promise<T>
  ): Promise<T> {
    const { endpoint, method } = context;
    
    logger.info('Queueing request pending auth', { endpoint, method }, 'AuthInterceptor');

    return requestQueue.enqueue(
      `${method}_${endpoint}_${Date.now()}`,
      async () => {
        // Wait for auth to complete
        const authReady = await authCoordinator.waitForAuth();
        
        if (!authReady) {
          throw new Error('Authentication failed - please sign in');
        }

        // Auth is ready - execute the request
        return executor();
      },
      {
        priority: 'normal',
        maxRetries: 2
      }
    );
  }

  /**
   * Handle auth error state
   */
  private async handleAuthError<T>(
    context: RequestContext,
    executor: () => Promise<T>
  ): Promise<T> {
    logger.warn('Handling auth error state', { context }, 'AuthInterceptor');

    try {
      // Try to revalidate auth once
      await authCoordinator.revalidate();
      
      // If revalidation succeeded, execute the request
      if (authCoordinator.getState() === AuthCoordinatorState.AUTHENTICATED) {
        return executor();
      }
    } catch (error) {
      logger.error('Auth revalidation failed', { error }, 'AuthInterceptor');
    }

    // Revalidation failed - reject the request
    throw new Error('Authentication error - please sign in again');
  }

  /**
   * Determine if an endpoint is public
   */
  static isPublicEndpoint(endpoint: string): boolean {
    const publicEndpoints = [
      '/health',
      '/status',
      '/auth/validate',
      '/auth/refresh'
    ];

    return publicEndpoints.some(pattern => endpoint.includes(pattern));
  }

  /**
   * Determine if an endpoint requires authentication
   */
  static requiresAuthentication(endpoint: string): boolean {
    return !this.isPublicEndpoint(endpoint);
  }
}

export const authRequestInterceptor = AuthRequestInterceptor.getInstance();