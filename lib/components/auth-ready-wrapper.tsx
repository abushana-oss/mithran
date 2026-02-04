/**
 * Auth Ready Wrapper Component
 * 
 * Enterprise-grade wrapper that ensures components only render when auth is ready
 * Prevents UI flickering and improves user experience during initialization
 */

'use client'

import { useEffect, useState } from 'react';
import { appReadiness, AppReadinessState } from '@/lib/core/app-readiness';
import { useAuthReadiness } from '@/lib/api/auth-aware-query';

interface AuthReadyWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireFullyReady?: boolean; // Default: false, just needs auth ready
}

export function AuthReadyWrapper({ 
  children, 
  fallback = <AuthLoadingSpinner />,
  requireFullyReady = false 
}: AuthReadyWrapperProps) {
  const { readinessState, shouldAllowRequests, isReady } = useAuthReadiness();
  
  const shouldRender = requireFullyReady ? isReady : shouldAllowRequests;

  // Show fallback during initialization states
  if (!shouldRender) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Simple loading spinner for auth initialization
 */
function AuthLoadingSpinner() {
  const [dots, setDots] = useState('.');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '.' : prev + '.');
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
        <p className="text-muted-foreground text-sm">
          Initializing application{dots}
        </p>
      </div>
    </div>
  );
}

/**
 * Hook to check if data fetching should be enabled
 * More granular than the wrapper component
 */
export function useDataFetchingEnabled(additionalConditions: boolean = true): boolean {
  const { shouldAllowRequests } = useAuthReadiness();
  return shouldAllowRequests && additionalConditions;
}

/**
 * Higher-order component version
 */
export function withAuthReadiness<P extends object>(
  Component: React.ComponentType<P>,
  options: { requireFullyReady?: boolean } = {}
) {
  return function AuthReadyComponent(props: P) {
    return (
      <AuthReadyWrapper requireFullyReady={options.requireFullyReady}>
        <Component {...props} />
      </AuthReadyWrapper>
    );
  };
}