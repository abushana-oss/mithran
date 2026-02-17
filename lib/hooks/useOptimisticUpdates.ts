/**
 * Hook for managing optimistic updates in production planning
 */

import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface OptimisticUpdateOptions<T> {
  queryKey: string[];
  updateFn: (data: T) => Promise<T>;
  rollbackFn?: (error: Error, data: T) => void;
}

export const useOptimisticUpdates = <T>() => {
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);

  const performOptimisticUpdate = useCallback(
    async <K extends T>(
      options: OptimisticUpdateOptions<K>,
      optimisticData: Partial<K>
    ) => {
      const { queryKey, updateFn, rollbackFn } = options;
      
      setIsUpdating(true);
      
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey });
      
      // Snapshot current data
      const previousData = queryClient.getQueryData<K>(queryKey);
      
      // Optimistically update cache
      if (previousData) {
        queryClient.setQueryData<K>(queryKey, {
          ...previousData,
          ...optimisticData
        });
      }
      
      try {
        // Perform actual update
        const updatedData = await updateFn(previousData as K);
        
        // Update cache with real data
        queryClient.setQueryData<K>(queryKey, updatedData);
        
        return updatedData;
      } catch (error) {
        // Rollback on error
        if (previousData) {
          queryClient.setQueryData<K>(queryKey, previousData);
        }
        
        // Call custom rollback if provided
        if (rollbackFn && previousData) {
          rollbackFn(error as Error, previousData);
        }
        
        throw error;
      } finally {
        setIsUpdating(false);
      }
    },
    [queryClient]
  );

  const invalidateQueries = useCallback(
    (queryKey: string[]) => {
      return queryClient.invalidateQueries({ queryKey });
    },
    [queryClient]
  );

  const updateCache = useCallback(
    <K>(queryKey: string[], updateFn: (data: K | undefined) => K) => {
      queryClient.setQueryData<K>(queryKey, updateFn);
    },
    [queryClient]
  );

  return {
    performOptimisticUpdate,
    invalidateQueries,
    updateCache,
    isUpdating
  };
};