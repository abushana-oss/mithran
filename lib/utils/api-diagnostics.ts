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
    console.log('Testing projects endpoint:', `${config.api.baseUrl}/projects`);
    const response = await fetch(`${config.api.baseUrl}/projects`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token' // Add auth header
      },
    });

    console.log('Projects response status:', response.status);
    
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
    console.error('Projects endpoint test failed:', error);
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
    console.log('🔄 Resetting circuit breaker...');
    
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
    
    console.log('✅ Circuit breaker reset - page will reload');
  } catch (error) {
    console.error('❌ Failed to reset circuit breaker:', error);
  }
}

/**
 * Comprehensive API diagnostics
 */
export async function runApiDiagnostics(): Promise<void> {
  console.group('🔍 API Connection Diagnostics');
  
  try {
    // 1. Test basic connectivity
    console.log('1️⃣ Testing basic connectivity...');
    const connectionTest = await testApiConnection();
    
    if (connectionTest.success) {
      console.log('✅ API is reachable');
      console.log('📊 Response details:', connectionTest.details);
    } else {
      console.error('❌ API connection failed:', connectionTest.error);
      console.log('🔍 Error details:', connectionTest.details);
    }

    // 2. Check CORS headers
    console.log('2️⃣ Checking CORS configuration...');
    if (connectionTest.success && connectionTest.details?.headers) {
      const corsHeaders = connectionTest.details.headers;
      const hasCors = corsHeaders['access-control-allow-origin'];
      
      if (hasCors) {
        console.log('✅ CORS headers present:', hasCors);
      } else {
        console.warn('⚠️ No CORS headers found - this might cause issues');
      }
    }

    // 3. Test authentication endpoint
    console.log('3️⃣ Testing authentication flow...');
    try {
      const authTest = await fetch(`${config.api.baseUrl}/auth/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
      });
      
      if (authTest.status === 401) {
        console.log('✅ Auth endpoint responding correctly (401 expected)');
      } else {
        console.log(`ℹ️ Auth endpoint status: ${authTest.status}`);
      }
    } catch (authError) {
      console.warn('⚠️ Auth endpoint test failed:', authError);
    }

    // 4. Environment check
    console.log('4️⃣ Environment configuration...');
    console.log('🔧 API Base URL:', config.api.baseUrl);
    console.log('🔧 Environment:', process.env.NODE_ENV);
    console.log('🔧 Timeout:', config.api.timeout + 'ms');

    // 5. Circuit breaker status
    console.log('5️⃣ Circuit breaker information...');
    console.log('🔧 Enabled:', config.api.circuitBreaker.enabled);
    console.log('🔧 Failure threshold:', config.api.circuitBreaker.failureThreshold);
    console.log('🔧 Timeout:', config.api.circuitBreaker.timeout + 'ms');

  } catch (error) {
    console.error('❌ Diagnostics failed:', error);
  } finally {
    console.groupEnd();
  }
}

/**
 * Quick fix for common connection issues
 */
export async function quickApiFix(): Promise<boolean> {
  console.log('🔧 Running quick API connection fix...');
  
  try {
    // 1. Reset circuit breaker
    resetCircuitBreaker();
    
    // 2. Test connection
    const test = await testApiConnection();
    
    if (test.success) {
      console.log('✅ API connection restored!');
      return true;
    } else {
      console.error('❌ API still unreachable:', test.error);
      
      // 3. Provide helpful suggestions
      console.group('💡 Troubleshooting suggestions:');
      console.log('1. Ensure backend is running: npm run start:dev');
      console.log('2. Check if port 4000 is available');
      console.log('3. Verify no firewall blocking localhost:4000');
      console.log('4. Try refreshing the page');
      console.log('5. Check browser network tab for specific errors');
      console.groupEnd();
      
      return false;
    }
  } catch (error) {
    console.error('❌ Quick fix failed:', error);
    return false;
  }
}

/**
 * Force reset circuit breaker instance
 */
export function forceResetCircuitBreaker(): void {
  try {
    console.log('🔄 Force resetting circuit breaker instance...');
    
    // Import and reset the circuit breaker directly
    import('../api/client').then((clientModule) => {
      if (clientModule.circuitBreaker) {
        clientModule.circuitBreaker.forceReset();
        console.log('✅ Circuit breaker instance reset');
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
    
    console.log('✅ Circuit breaker force reset completed');
  } catch (error) {
    console.error('❌ Failed to force reset circuit breaker:', error);
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
      console.log('🔍 Circuit Breaker Status:', {
        state: metrics.state,
        failures: metrics.failures,
        successes: metrics.successes,
        totalRequests: metrics.totalRequests,
        rejectedRequests: metrics.rejectedRequests,
        failureRate: clientModule.circuitBreaker.getFailureRate(),
        nextAttemptTime: metrics.nextAttemptTime ? new Date(metrics.nextAttemptTime).toLocaleTimeString() : 'N/A'
      });
      return metrics;
    }
    return null;
  } catch (error) {
    console.error('❌ Failed to get circuit breaker status:', error);
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
  
  console.log('🔧 API diagnostics available: window.apiDiagnostics');
  console.log('💡 Try: window.apiDiagnostics.testProjects() to test actual endpoints');
}