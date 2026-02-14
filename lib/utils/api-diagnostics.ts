/**
 * API Connection Diagnostics
 * 
 * Utilities to diagnose and fix common API connection issues:
 * - Circuit breaker reset
 * - Connection health check
 * - Network diagnostics
 * - CORS validation
 */

import { config } from '../config';

/**
 * Test basic API connectivity
 */
export async function testApiConnection(): Promise<{
  success: boolean;
  error?: string;
  details?: any;
}> {
  try {
    const response = await fetch(`${config.api.baseUrl}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        details: {
          status: response.status,
          headers: Object.fromEntries(response.headers.entries()),
          data
        }
      };
    } else {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
        details: {
          status: response.status,
          statusText: response.statusText
        }
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown network error',
      details: error
    };
  }
}

/**
 * Test actual API endpoint (projects)
 */
export async function testProjectsEndpoint(): Promise<{
  success: boolean;
  error?: string;
  details?: any;
}> {
  try {
    const response = await fetch(`${config.api.baseUrl}/projects`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token' // Add auth header
      },
    });
    
    if (response.ok || response.status === 401) { // 401 is expected without valid token
      let data;
      try {
        data = await response.json();
      } catch (e) {
        data = 'No JSON response';
      }
      return {
        success: response.ok,
        details: {
          status: response.status,
          headers: Object.fromEntries(response.headers.entries()),
          data
        }
      };
    } else {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
        details: {
          status: response.status,
          statusText: response.statusText
        }
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown network error',
      details: error
    };
  }
}

/**
 * Reset circuit breaker state
 */
export function resetCircuitBreaker(): void {
  try {
    // Clear any cached circuit breaker state
    if (typeof window !== 'undefined') {
      localStorage.removeItem('circuit-breaker-state');
      sessionStorage.removeItem('circuit-breaker-state');
      
      // Clear circuit breaker counters
      localStorage.removeItem('cb-failure-count');
      localStorage.removeItem('cb-request-history');
      localStorage.removeItem('cb-last-failure-time');
      
      // Force reload API configuration
      window.location.reload();
    }
  } catch (error) {
    // Failed to reset circuit breaker
  }
}

/**
 * Comprehensive API diagnostics
 */
export async function runApiDiagnostics(): Promise<void> {
  try {
    // 1. Test basic connectivity
    const connectionTest = await testApiConnection();
    
    // 2. Check CORS headers
    if (connectionTest.success && connectionTest.details?.headers) {
      const corsHeaders = connectionTest.details.headers;
      const hasCors = corsHeaders['access-control-allow-origin'];
    }

    // 3. Test authentication endpoint
    try {
      const authTest = await fetch(`${config.api.baseUrl}/auth/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
      });
    } catch (authError) {
      // Auth endpoint test failed
    }

    // 4. Environment check
    // Configuration validated

    // 5. Circuit breaker status
    // Circuit breaker information gathered

  } catch (error) {
    // Diagnostics failed
  }
}

/**
 * Quick fix for common connection issues
 */
export async function quickApiFix(): Promise<boolean> {
  try {
    // 1. Reset circuit breaker
    resetCircuitBreaker();
    
    // 2. Test connection
    const test = await testApiConnection();
    
    if (test.success) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    return false;
  }
}

/**
 * Force reset circuit breaker instance
 */
export function forceResetCircuitBreaker(): void {
  try {
    // Import and reset the circuit breaker directly
    import('../api/client').then((clientModule) => {
      if (clientModule.circuitBreaker) {
        clientModule.circuitBreaker.forceReset();
      }
    });
    
    // Clear storage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('circuit-breaker-state');
      sessionStorage.removeItem('circuit-breaker-state');
      localStorage.removeItem('cb-failure-count');
      localStorage.removeItem('cb-request-history');
      localStorage.removeItem('cb-last-failure-time');
    }
  } catch (error) {
    // Failed to force reset circuit breaker
  }
}

/**
 * Get circuit breaker status
 */
export async function getCircuitBreakerStatus(): Promise<any> {
  try {
    const clientModule = await import('../api/client');
    if (clientModule.circuitBreaker) {
      const metrics = clientModule.circuitBreaker.getMetrics();
      return metrics;
    }
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Add to window for browser console access (development only)
 */
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).apiDiagnostics = {
    test: testApiConnection,
    testProjects: testProjectsEndpoint,
    reset: resetCircuitBreaker,
    forceReset: forceResetCircuitBreaker,
    status: getCircuitBreakerStatus,
    diagnose: runApiDiagnostics,
    quickFix: quickApiFix
  };
}