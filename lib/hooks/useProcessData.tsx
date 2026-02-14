/**
 * Production-ready React hook for process data management
 * Follows React best practices and provides proper error boundaries
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ProcessDataService, MainProcessSection } from '@/lib/services/process-data-service';
import { productionPlanningApi } from '@/lib/api/production-planning';
import { logger } from '@/lib/utils/logger';
import { Button } from '@/components/ui/button';

interface UseProcessDataOptions {
  lotId: string;
  initialSections: MainProcessSection[];
  onError?: (error: Error) => void;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseProcessDataReturn {
  sections: MainProcessSection[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  retryCount: number;
  lastRefresh: Date | null;
}

const MAX_RETRY_ATTEMPTS = 3;
const DEFAULT_REFRESH_INTERVAL = 30000; // 30 seconds

export function useProcessData(options: UseProcessDataOptions): UseProcessDataReturn {
  const {
    lotId,
    initialSections,
    onError,
    autoRefresh = false,
    refreshInterval = DEFAULT_REFRESH_INTERVAL
  } = options;

  // State management
  const [sections, setSections] = useState<MainProcessSection[]>(initialSections);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Refs for cleanup and state persistence
  const serviceRef = useRef<ProcessDataService>();
  const refreshTimerRef = useRef<NodeJS.Timeout>();
  const abortControllerRef = useRef<AbortController>();
  const isUnmountedRef = useRef(false);

  // Initialize service
  useEffect(() => {
    serviceRef.current = new ProcessDataService();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isUnmountedRef.current = true;
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  /**
   * Core data fetching logic with proper error handling and retry mechanism
   */
  const fetchProcessData = useCallback(async (attempt = 0): Promise<void> => {
    if (!lotId?.trim() || !serviceRef.current || isUnmountedRef.current) {
      return;
    }

    // Cancel any existing requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      setError(null);

      logger.info('Fetching process data', { 
        lotId, 
        attempt: attempt + 1,
        maxAttempts: MAX_RETRY_ATTEMPTS
      });

      // Create a wrapper function that respects abort signal
      const fetchWithAbort = async (lotId: string) => {
        if (abortControllerRef.current?.signal.aborted) {
          throw new Error('Request aborted');
        }
        return await productionPlanningApi.getProcessesByLot(lotId, true);
      };

      const result = await serviceRef.current.processLotData(
        lotId,
        fetchWithAbort,
        sections
      );

      // Check if component was unmounted during fetch
      if (isUnmountedRef.current || abortControllerRef.current?.signal.aborted) {
        return;
      }

      if (result.error) {
        throw result.error;
      }

      // Success - update state
      setSections(result.sections);
      setLastRefresh(new Date());
      setRetryCount(0);

      logger.info('Successfully fetched process data', { 
        lotId, 
        sectionCount: result.sections.length,
        processCount: result.sections.reduce((acc, s) => acc + s.subProcesses.length, 0)
      });

    } catch (err) {
      if (isUnmountedRef.current) return;

      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      
      // Handle different types of errors
      if (error.message.includes('aborted')) {
        logger.debug('Request was aborted', { lotId });
        return;
      }

      logger.error('Failed to fetch process data', { 
        lotId, 
        attempt: attempt + 1, 
        error: error.message 
      });

      // Retry logic
      if (attempt < MAX_RETRY_ATTEMPTS - 1) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000); // Exponential backoff
        logger.info('Retrying process data fetch', { lotId, delay, nextAttempt: attempt + 2 });
        
        setTimeout(() => {
          if (!isUnmountedRef.current) {
            setRetryCount(attempt + 1);
            fetchProcessData(attempt + 1);
          }
        }, delay);
        
        return;
      }

      // Max retries exceeded
      setError(error);
      setRetryCount(attempt + 1);
      
      if (onError) {
        onError(error);
      }

      // Fallback to showing existing sections
      logger.warn('Using fallback sections due to fetch failure', { 
        lotId, 
        sectionCount: sections.length 
      });
      
    } finally {
      if (!isUnmountedRef.current) {
        setLoading(false);
      }
    }
  }, [lotId, sections, onError]);

  /**
   * Manual refresh function
   */
  const refresh = useCallback(async (): Promise<void> => {
    setRetryCount(0);
    await fetchProcessData(0);
  }, [fetchProcessData]);

  /**
   * Auto-refresh setup
   */
  useEffect(() => {
    if (!autoRefresh || !refreshInterval) return;

    const setupAutoRefresh = () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }

      refreshTimerRef.current = setTimeout(() => {
        if (!isUnmountedRef.current && !loading && !error) {
          logger.debug('Auto-refreshing process data', { lotId });
          refresh();
        }
        setupAutoRefresh(); // Schedule next refresh
      }, refreshInterval);
    };

    setupAutoRefresh();

    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, [autoRefresh, refreshInterval, refresh, loading, error, lotId]);

  /**
   * Initial data fetch
   */
  useEffect(() => {
    if (lotId?.trim()) {
      fetchProcessData(0);
    } else {
      // Reset state for invalid lotId
      setSections(initialSections);
      setError(null);
      setRetryCount(0);
      setLastRefresh(null);
    }
  }, [lotId, fetchProcessData]); // Don't include initialSections to avoid unnecessary re-fetches

  return {
    sections,
    loading,
    error,
    refresh,
    retryCount,
    lastRefresh
  };
}

/**
 * Higher-order component for error boundary
 */
export function withProcessDataErrorBoundary<P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  return function ProcessDataErrorBoundary(props: P) {
    const [error, setError] = useState<Error | null>(null);

    const handleError = useCallback((error: Error) => {
      logger.error('Process data error boundary triggered', { error });
      setError(error);
    }, []);

    if (error) {
      return (
        <div className="p-6 text-center">
          <div className="text-red-600 mb-2">
            <h3 className="text-lg font-semibold">Process Data Error</h3>
          </div>
          <p className="text-muted-foreground mb-4">{error.message}</p>
          <Button 
            onClick={() => setError(null)}
            variant="default"
          >
            Try Again
          </Button>
        </div>
      );
    }

    return <Component {...props} />;
  };
}