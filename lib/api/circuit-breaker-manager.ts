/**
 * Circuit Breaker Manager - Simplified
 * 
 * Manages circuit breaker state for API calls
 * Simplified version without complex auth coordination
 */

'use client'

import { logger } from '@/lib/utils/logger';

class CircuitBreakerManager {
  private static instance: CircuitBreakerManager;
  private apiClientResetFn: (() => void) | null = null;

  private constructor() {
    // Simplified initialization - no auth coordination needed
  }

  static getInstance(): CircuitBreakerManager {
    if (!CircuitBreakerManager.instance) {
      CircuitBreakerManager.instance = new CircuitBreakerManager();
    }
    return CircuitBreakerManager.instance;
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