/**
 * API functions for production planning date updates
 * Updates existing main processes with schedule dates
 */

import { apiClient } from './client';
import { enhancedApiClient } from './enhanced-client';

export interface ProcessScheduleUpdate {
  planned_start_date: string;
  planned_end_date: string;
  assigned_department?: string;
  responsible_person?: string;
}

export const productionPlanningApi = {
  /**
   * Update schedule dates for an existing production process
   * This updates the main process (Raw Material, Process Conversion, etc.)
   */
  updateProcessScheduleDates: async (
    processId: string,
    scheduleData: ProcessScheduleUpdate
  ) => {
    return enhancedApiClient.put(
      `/production-planning/processes/${processId}/schedule-dates`,
      scheduleData,
      {
        retries: 2,
        invalidateCache: [`processes/${processId}`, `lot`], // Invalidate related cache
      }
    );
  },

  /**
   * Update production lot dates - for main planned task dates
   * Enhanced with optimistic updates and cache invalidation
   */
  updateProductionLotDates: async (
    lotId: string,
    dateData: {
      plannedStartDate?: string;
      plannedEndDate?: string;
    }
  ) => {
    return enhancedApiClient.put(
      `/production-planning/lots/${lotId}`, 
      dateData,
      {
        retries: 3, // Critical operation, more retries
        timeout: 20000, // Longer timeout for date updates
        invalidateCache: [`lots/${lotId}`, `production-planning/lots`], // Invalidate lot cache
      }
    );
  },

  /**
   * Get all processes for a production lot
   * Enhanced with caching for better performance
   */
  getProcessesByLot: async (lotId: string, useCache: boolean = true) => {
    return enhancedApiClient.get(
      `/production-planning/processes/lot/${lotId}`,
      {
        cache: useCache,
        cacheTTL: 3 * 60 * 1000, // 3 minutes cache for process data
        retries: 3,
      }
    );
  },


  /**
   * Get production lot by ID - includes main lot dates
   * Enhanced with aggressive caching since lot data changes less frequently
   */
  getProductionLotById: async (lotId: string, useCache: boolean = true) => {
    return enhancedApiClient.get(
      `/production-planning/lots/${lotId}`,
      {
        cache: useCache,
        cacheTTL: 2 * 60 * 1000, // 2 minutes cache for lot data
        retries: 3,
      }
    );
  },

  /**
   * Prefetch related data for better UX
   */
  prefetchLotData: async (lotId: string) => {
    // Fire and forget - prefetch commonly accessed data
    Promise.all([
      productionPlanningApi.getProductionLotById(lotId),
      productionPlanningApi.getProcessesByLot(lotId),
    ]).catch(error => {
      console.warn('Prefetch failed:', error);
    });
  },

  /**
   * Batch update multiple lot dates (for bulk operations)
   */
  batchUpdateLotDates: async (
    updates: Array<{
      lotId: string;
      dateData: {
        plannedStartDate?: string;
        plannedEndDate?: string;
      };
    }>
  ) => {
    // Execute updates with limited concurrency to avoid overwhelming the server
    const BATCH_SIZE = 3;
    const results = [];
    
    for (let i = 0; i < updates.length; i += BATCH_SIZE) {
      const batch = updates.slice(i, i + BATCH_SIZE);
      const batchPromises = batch.map(update =>
        productionPlanningApi.updateProductionLotDates(update.lotId, update.dateData)
      );
      
      const batchResults = await Promise.allSettled(batchPromises);
      results.push(...batchResults);
      
      // Small delay between batches to respect rate limits
      if (i + BATCH_SIZE < updates.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return results;
  },

  /**
   * Clear all production planning related cache
   */
  clearCache: () => {
    enhancedApiClient.invalidateCache();
  },

  /**
   * Get cache statistics for debugging
   */
  getCacheStats: () => {
    return enhancedApiClient.getCacheStats();
  },

  /**
   * Get process templates for production planning
   */
  getProcessTemplates: async (useCache: boolean = true) => {
    return enhancedApiClient.get(
      `/production-planning/process-templates`,
      {
        cache: useCache,
        cacheTTL: 10 * 60 * 1000, // 10 minutes cache for templates (rarely change)
        retries: 2,
      }
    );
  },

  /**
   * Create a custom process template
   */
  createProcessTemplate: async (templateData: {
    name: string;
    description?: string;
    category?: string;
  }) => {
    return enhancedApiClient.post(
      `/production-planning/process-templates`,
      templateData,
      {
        retries: 2,
        invalidateCache: ['process-templates'], // Invalidate template cache
      }
    );
  },

  /**
   * Update production lot status
   */
  updateLotStatus: async (lotId: string, status: string) => {
    return enhancedApiClient.put(
      `/production-planning/lots/${lotId}`,
      { status },
      {
        retries: 2,
        invalidateCache: [`lots/${lotId}`, 'production-planning/lots'], // Invalidate lot cache
      }
    );
  },

  /**
   * Auto-update lot status based on progress
   */
  updateLotStatusByProgress: async (lotId: string) => {
    return enhancedApiClient.post(
      `/production-planning/lots/${lotId}/update-status-by-progress`,
      {},
      {
        retries: 2,
        invalidateCache: [`lots/${lotId}`, 'production-planning/lots'], // Invalidate lot cache
      }
    );
  },

  /**
   * Clean up production lot materials to only show selected BOM items
   */
  cleanupLotMaterials: async (lotId: string) => {
    return enhancedApiClient.post(
      `/production-planning/lots/${lotId}/cleanup-materials`,
      {},
      {
        retries: 2,
        invalidateCache: [`lots/${lotId}`, 'production-planning/lots'], // Invalidate lot cache
      }
    );
  },
};

/**
 * Helper function to format dates for API
 */
export const formatDateForAPI = (date: Date): string => {
  return date.toISOString();
};

/**
 * Helper function to update multiple processes with dates
 * Use this when user selects dates in the UI
 */
export const updateProcessesWithDates = async (
  processes: Array<{
    id: string;
    startDate: Date;
    endDate: Date;
    department?: string;
    responsiblePerson?: string;
  }>
) => {
  const results = [];
  
  for (const process of processes) {
    try {
      const result = await productionPlanningApi.updateProcessScheduleDates(
        process.id,
        {
          planned_start_date: formatDateForAPI(process.startDate),
          planned_end_date: formatDateForAPI(process.endDate),
          assigned_department: process.department,
          responsible_person: process.responsiblePerson
        }
      );
      results.push(result);
    } catch (error) {
      console.error(`Failed to update process ${process.id}:`, error);
      throw error;
    }
  }
  
  return results;
};