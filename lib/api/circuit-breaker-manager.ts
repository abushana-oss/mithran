/**
 * Circuit Breaker Manager - Auth Integration
 * 
 * Manages circuit breaker state in coordination with auth system
 * Prevents circuit breaker from staying open due to auth issues
 */

'use client'

import { authCoordinator, AuthCoordinatorState } from './auth-coordinator';
import { logger } from '@/lib/utils/logger';

class CircuitBreakerManager {
  private static instance: CircuitBreakerManager;
  private apiClientResetFn: (() => void) | null = null;

  private constructor() {
    if (typeof window !== 'undefined') {
      this.initialize();
    }
  }

  static getInstance(): CircuitBreakerManager {
    if (!CircuitBreakerManager.instance) {
      CircuitBreakerManager.instance = new CircuitBreakerManager();
    }
    return CircuitBreakerManager.instance;
  }

  private initialize(): void {
    // Listen for auth state changes
    authCoordinator.addListener((state) => {
      if (state === AuthCoordinatorState.AUTHENTICATED) {
        this.resetCircuitBreaker('auth_validated');
      }
    });
  }

  /**
   * Register the API client's circuit breaker reset function
   */
  registerResetFunction(resetFn: () => void): void {
    this.apiClientResetFn = resetFn;
  }

  /**
   * Reset circuit breaker with reason logging
   */
  resetCircuitBreaker(reason: string): void {
    if (this.apiClientResetFn) {
      logger.info('Resetting circuit breaker', { reason }, 'CircuitBreakerManager');
      this.apiClientResetFn();
    }
  }

  /**
   * Force reset (manual intervention)
   */
  forceReset(): void {
    this.resetCircuitBreaker('manual_force_reset');
  }
}

export const circuitBreakerManager = CircuitBreakerManager.getInstance();