/**
 * Auth-Aware React Query Integration
 * 
 * Enterprise-grade solution for data fetching that respects auth state:
 * - Prevents requests during auth initialization
 * - Automatically retries after auth is ready
 * - Industry standard pattern for authenticated SPAs
 * - Integrates seamlessly with React Query
 */

'use client'

import React from 'react';
import { useQuery, useQueryClient, UseQueryOptions, QueryKey } from '@tanstack/react-query';
import { useEffect, useState, useCallback } from 'react';
import { authCoordinator } from './auth-coordinator';
import { appReadiness, AppReadinessState } from '@/lib/core/app-readiness';
import { authTokenManager } from '@/lib/auth/token-manager';
import { requestQueue } from './request-queue';

export interface AuthAwareQueryOptions<T = any> extends Omit<UseQueryOptions<T>, 'queryFn'> {
  queryFn: () => Promise<T>;
  requireAuth?: boolean; // Default: true
  allowDuringInitialization?: boolean; // Default: false (for public endpoints)
}

/**
 * Hook that provides auth readiness state
 */
export function useAuthReadiness() {
  const [readinessState, setReadinessState] = useState(appReadiness.getState());
  const [hasValidToken, setHasValidToken] = useState(!!authTokenManager.getCurrentToken());
  const [authCoordinatorAllowsRequests, setAuthCoordinatorAllowsRequests] = useState(authCoordinator.shouldAllowRequests());

  useEffect(() => {
    const unsubscribeAppReadiness = appReadiness.addListener((state) => {
      setReadinessState(state);
      setHasValidToken(!!authTokenManager.getCurrentToken());
    });

    // Also listen to auth coordinator state changes
    const unsubscribeAuthCoordinator = authCoordinator.addListener(() => {
      setAuthCoordinatorAllowsRequests(authCoordinator.shouldAllowRequests());
      setHasValidToken(!!authTokenManager.getCurrentToken());
    });

    return () => {
      unsubscribeAppReadiness();
      unsubscribeAuthCoordinator();
    };
  }, []);

  return {
    readinessState,
    hasValidToken,
    isReady: appReadiness.isReady(),
    isAuthReady: appReadiness.isAuthReady(),
    shouldAllowRequests: authCoordinatorAllowsRequests,
  };
}

/**
 * Auth-aware useQuery wrapper that prevents requests during initialization
 */
export function useAuthAwareQuery<T = any>(
  queryKey: QueryKey,
  options: AuthAwareQueryOptions<T>
): ReturnType<typeof useQuery<T>> {
  const {
    queryFn,
    requireAuth = true,
    allowDuringInitialization = false,
    enabled = true,
    ...queryOptions
  } = options;

  const { readinessState, hasValidToken, shouldAllowRequests } = useAuthReadiness();

  // Determine if the query should be enabled
  const shouldEnable = useCallback(() => {
    // Always respect the user's enabled flag first
    if (!enabled) return false;

    // Public endpoints can run during initialization
    if (allowDuringInitialization) return true;

    // Auth-required endpoints need auth to be ready
    if (requireAuth) {
      return shouldAllowRequests && hasValidToken;
    }

    // Non-auth endpoints just need app to be not in booting state
    return readinessState !== AppReadinessState.BOOTING;
  }, [enabled, requireAuth, allowDuringInitialization, shouldAllowRequests, hasValidToken, readinessState]);

  // Wrap queryFn to handle auth-related errors and coordinate with auth system
  const wrappedQueryFn = useCallback(async (): Promise<T> => {
    // Double-check auth state at execution time
    if (requireAuth) {
      // Wait for auth coordinator to complete validation
      const authReady = await authCoordinator.waitForAuth();
      
      if (!authReady) {
        throw new Error('Authentication required - please sign in');
      }
      
      // Additional token check as fallback
      if (!authTokenManager.getCurrentToken()) {
        throw new Error('Authentication required - please sign in');
      }
    }

    return queryFn();
  }, [queryFn, requireAuth]);

  const query = useQuery<T>({
    queryKey,
    queryFn: wrappedQueryFn,
    enabled: shouldEnable(),
    // Retry configuration for auth-related failures
    retry: (failureCount, error) => {
      // Don't retry auth errors
      if (error?.message?.includes('Authentication') || 
          error?.message?.includes('Unauthorized') ||
          error?.message?.includes('sign in')) {
        return false;
      }

      // Standard retry logic for other errors
      return failureCount < 3;
    },
    // Stale time based on auth requirement
    staleTime: requireAuth ? 5 * 60 * 1000 : 10 * 60 * 1000, // 5min auth, 10min public
    ...queryOptions,
  });

  return query;
}

/**
 * Hook to get request queue status for debugging
 */
export function useRequestQueueStatus() {
  const [status, setStatus] = useState(requestQueue.getQueueStatus());

  useEffect(() => {
    const updateStatus = () => {
      setStatus(requestQueue.getQueueStatus());
    };

    const unsubscribe = requestQueue.addListener(updateStatus);
    
    // Update immediately
    updateStatus();
    
    // Update periodically
    const interval = setInterval(updateStatus, 1000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  return status;
}

/**
 * Hook to retry failed queries when auth becomes ready
 */
export function useRetryQueriesOnAuthReady() {
  const queryClient = useQueryClient();
  const { readinessState } = useAuthReadiness();

  useEffect(() => {
    if (readinessState === AppReadinessState.READY) {
      // Retry all failed queries that might have failed due to auth not being ready
      queryClient.invalidateQueries({
        predicate: (query) => {
          return query.state.status === 'error' && 
                 query.state.error?.message?.includes?.('Authentication');
        },
      });
    }
  }, [readinessState, queryClient]);
}

/**
 * Higher-order component to wrap components that need auth-aware queries
 */
export function withAuthAwareQueries<P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  return function AuthAwareQueriesWrapper(props: P) {
    // Automatically retry queries when auth becomes ready
    useRetryQueriesOnAuthReady();

    // Use React.createElement to avoid JSX spread operator parsing issues
    return React.createElement(Component, props);
  };
}

// Export utilities
export { requestQueue } from './request-queue';