import { apiClient } from './client';
import { createApiLogger } from '../utils/component-logger';

const apiLogger = createApiLogger('VendorRatingMatrix');

export interface VendorRatingMatrix {
  id: string;
  nominationEvaluationId: string;
  vendorId: string;
  sNo: number;
  category: string;
  assessmentAspects: string;
  sectionWiseCapabilityPercent: number;
  riskMitigationPercent: number;
  minorNC: number;
  majorNC: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

// ENTERPRISE: Frontend interface (camelCase)
export interface UpdateVendorRatingData {
  id: string;
  sectionWiseCapabilityPercent?: number;
  riskMitigationPercent?: number;
  minorNC?: number;
  majorNC?: number;
  assessmentAspects?: string;
}

// ENTERPRISE: Backend DTO interface (exact match for validation)
export interface BatchVendorRatingUpdateItemDto {
  id: string;
  sectionWiseCapabilityPercent?: number;
  riskMitigationPercent?: number;
  minorNC?: number;
  majorNC?: number;
  assessmentAspects?: string;
}

// ENTERPRISE: Root request DTO structure
export interface BatchVendorRatingUpdateDto {
  updates: BatchVendorRatingUpdateItemDto[];
}

export interface VendorRatingOverallScores {
  sectionWiseCapability: number;
  riskMitigation: number;
  totalMinorNC: number;
  totalMajorNC: number;
  totalRecords: number;
}

/**
 * Get vendor rating matrix data
 */
export async function getVendorRatingMatrix(
  nominationId: string,
  vendorId: string
): Promise<VendorRatingMatrix[]> {
  if (!nominationId || !vendorId) {
    throw new Error('Missing required parameters: nominationId or vendorId');
  }

  try {
    const response = await apiClient.get(`/supplier-nominations/${nominationId}/vendors/${vendorId}/rating-matrix`);
    
    const data = response?.data || [];
    
    // Transform database format to component format (proper camelCase conversion)
    const transformed = data.map((item: any) => {
      return {
        id: item.id,
        nominationEvaluationId: item.nomination_evaluation_id || item.nominationEvaluationId,
        vendorId: item.vendor_id || item.vendorId,
        sNo: item.s_no || item.sNo,
        category: item.category,
        assessmentAspects: item.assessment_aspects || item.assessmentAspects,
        sectionWiseCapabilityPercent: item.section_wise_capability_percent || item.sectionWiseCapabilityPercent || 0,
        riskMitigationPercent: item.risk_mitigation_percent || item.riskMitigationPercent || 0,
        minorNC: item.minor_nc || item.minorNC || 0,
        majorNC: item.major_nc || item.majorNC || 0,
        sortOrder: item.sort_order || item.sortOrder,
        createdAt: item.created_at || item.createdAt,
        updatedAt: item.updated_at || item.updatedAt
      };
    });
    
    return transformed;
  } catch (error) {
    // Enhanced error handling for network failures
    const status = error?.response?.status;
    const statusText = error?.response?.statusText;
    
    apiLogger.logApiError('GET', `/supplier-nominations/${nominationId}/vendors/${vendorId}/rating-matrix`, error, {
      status,
      statusText,
      nominationId,
      vendorId,
      errorType: error?.constructor?.name || 'Unknown'
    });
    
    // Return empty array for 404s (no data exists yet)
    if (status === 404) {
      return [];
    }
    
    throw error;
  }
}

/**
 * Initialize empty vendor rating matrix
 */
export async function initializeVendorRatingMatrix(
  nominationId: string,
  vendorId: string
): Promise<VendorRatingMatrix[]> {
  if (!nominationId || !vendorId) {
    throw new Error('Missing required parameters for initialization');
  }

  try {
    const response = await apiClient.post(`/supplier-nominations/${nominationId}/vendors/${vendorId}/rating-matrix/init`);
    
    // Return the created data if the API provides it
    if (response?.data && Array.isArray(response.data)) {
      return response.data;
    }
    
    // If no data in response, immediately fetch the newly created data
    return await getVendorRatingMatrix(nominationId, vendorId);
  } catch (error) {
    const status = error?.response?.status;
    
    apiLogger.logApiError('POST', `/supplier-nominations/${nominationId}/vendors/${vendorId}/rating-matrix/init`, error, {
      status,
      nominationId,
      vendorId
    });
    
    throw error;
  }
}

/**
 * Update individual rating matrix item
 */
export async function updateVendorRatingItem(
  nominationId: string,
  vendorId: string,
  ratingId: string,
  updateData: Partial<UpdateVendorRatingData>
): Promise<void> {
  try {
    await apiClient.put(
      `/supplier-nominations/${nominationId}/vendors/${vendorId}/rating-matrix/${ratingId}`, 
      updateData
    );
  } catch (error) {
    console.error('Failed to update vendor rating item:', error);
    throw error;
  }
}

/**
 * ENTERPRISE BEST PRACTICE: Batch update vendor rating matrix
 */
/**
 * ENTERPRISE: Type-safe data transformation utilities
 * Ensures data integrity and validation compliance
 */
class VendorRatingDataTransformer {
  /**
   * PRINCIPAL ENGINEER: Ultra-strict DTO transformation
   * Only includes fields that are actually changing and valid
   */
  static transformToDto(updates: UpdateVendorRatingData[]): BatchVendorRatingUpdateDto {
    const transformedUpdates: BatchVendorRatingUpdateItemDto[] = [];
    
    for (const update of updates) {
      // Skip invalid records
      if (!update.id) {
        console.warn('Skipping update without ID:', update);
        continue;
      }

      // Start with minimal valid structure
      const transformed: any = { id: update.id };
      let hasChanges = false;
      
      // Only include fields that are actually defined and valid
      if (update.sectionWiseCapabilityPercent !== undefined && 
          update.sectionWiseCapabilityPercent !== null &&
          !isNaN(Number(update.sectionWiseCapabilityPercent))) {
        transformed.sectionWiseCapabilityPercent = Number(update.sectionWiseCapabilityPercent);
        hasChanges = true;
      }
      
      if (update.riskMitigationPercent !== undefined && 
          update.riskMitigationPercent !== null &&
          !isNaN(Number(update.riskMitigationPercent))) {
        transformed.riskMitigationPercent = Number(update.riskMitigationPercent);
        hasChanges = true;
      }
      
      if (update.minorNC !== undefined && 
          update.minorNC !== null &&
          Number.isInteger(Number(update.minorNC))) {
        transformed.minorNC = Number(update.minorNC);
        hasChanges = true;
      }
      
      if (update.majorNC !== undefined && 
          update.majorNC !== null &&
          Number.isInteger(Number(update.majorNC))) {
        transformed.majorNC = Number(update.majorNC);
        hasChanges = true;
      }
      
      if (update.assessmentAspects !== undefined && 
          update.assessmentAspects !== null &&
          typeof update.assessmentAspects === 'string' &&
          update.assessmentAspects.trim().length > 0) {
        transformed.assessmentAspects = update.assessmentAspects.trim();
        hasChanges = true;
      }
      
      // Only include records that have actual changes
      if (hasChanges) {
        transformedUpdates.push(transformed as BatchVendorRatingUpdateItemDto);
      }
    }

    return { updates: transformedUpdates };
  }

  /**
   * Validate DTO structure before sending
   * Prevents runtime validation errors
   */
  static validateDto(dto: BatchVendorRatingUpdateDto): void {
    if (!dto.updates || !Array.isArray(dto.updates)) {
      throw new Error('Invalid DTO structure: updates must be an array');
    }
    
    if (dto.updates.length === 0) {
      throw new Error('No updates provided');
    }
    
    dto.updates.forEach((update, index) => {
      if (!update.id) {
        throw new Error(`Update at index ${index} missing required id field`);
      }
      
      // Validate numeric fields with enterprise-grade constraints
      const numericFields = [
        { name: 'sectionWiseCapabilityPercent', min: 0, max: 100 },
        { name: 'riskMitigationPercent', min: 0, max: 100 },
        { name: 'minorNC', min: 0, max: 999 },
        { name: 'majorNC', min: 0, max: 999 }
      ];
      
      numericFields.forEach(({ name, min, max }) => {
        const value = update[name];
        if (value !== undefined) {
          const numValue = Number(value);
          if (isNaN(numValue) || numValue < min || numValue > max) {
            throw new Error(`Update at index ${index} has invalid ${name}: must be a number between ${min} and ${max}, received ${value}`);
          }
        }
      });
    });
  }
}

export async function batchUpdateVendorRatingMatrix(
  nominationId: string,
  vendorId: string,
  updates: UpdateVendorRatingData[]
): Promise<VendorRatingMatrix[]> {
  // Declare payload outside try block to make it accessible in catch block
  let payload: BatchVendorRatingUpdateDto;
  
  try {
    // ENTERPRISE: Pre-flight validation
    if (!nominationId || !vendorId) {
      throw new Error('Missing required parameters: nominationId or vendorId');
    }

    if (!updates || updates.length === 0) {
      throw new Error('No updates provided');
    }

    // Simple validation - let the API handle the rest
    if (!nominationId || !vendorId) {
      throw new Error("Missing required IDs for rating matrix update");
    }

    // Get or initialize the rating matrix
    let existingData;
    try {
      existingData = await getVendorRatingMatrix(nominationId, vendorId);
    } catch (fetchError) {
      console.error('Failed to fetch existing data before update:', fetchError);
      throw new Error(`Cannot update rating matrix: ${fetchError.message}`);
    }

    // Auto-initialize if no data exists
    if (!existingData || existingData.length === 0) {
      try {
        console.log('Rating matrix not found, auto-initializing...');
        await initializeVendorRatingMatrix(nominationId, vendorId);
        existingData = await getVendorRatingMatrix(nominationId, vendorId);
        
        if (!existingData || existingData.length === 0) {
          throw new Error('Failed to initialize rating matrix - no data returned after initialization');
        }
        
        console.log(`Rating matrix auto-initialized with ${existingData.length} records`);
      } catch (initError) {
        console.error('Failed to auto-initialize rating matrix:', initError);
        throw new Error(`Cannot create rating matrix: ${initError.message}`);
      }
    }

    // ENTERPRISE: Type-safe transformation and validation
    payload = VendorRatingDataTransformer.transformToDto(updates);
    VendorRatingDataTransformer.validateDto(payload);
    
    apiLogger.logApiRequest('PUT', `/supplier-nominations/${nominationId}/vendors/${vendorId}/rating-matrix/batch`, {
      updateCount: payload.updates.length,
      updatedFields: payload.updates.map(u => Object.keys(u).filter(k => k !== 'id')),
      existingRecords: existingData.length
    });
    
    // PRINCIPAL ENGINEER: Debug exact payload structure
    console.log('=== DEBUGGING DTO VALIDATION ===');
    console.log('Nomination ID:', nominationId);
    console.log('Vendor ID:', vendorId);
    console.log('Updates count:', updates.length);
    console.log('Raw updates:', JSON.stringify(updates, null, 2));
    console.log('Transformed payload:', JSON.stringify(payload, null, 2));
    console.log('Payload.updates[0] structure:', payload.updates[0] ? Object.keys(payload.updates[0]) : 'No updates');
    console.log('Sample update object:', payload.updates[0]);
    console.log('=====================================');
    
    const response = await apiClient.put(
      `/supplier-nominations/${nominationId}/vendors/${vendorId}/rating-matrix/batch`, 
      payload
    );
    
    apiLogger.logApiResponse('PUT', `/supplier-nominations/${nominationId}/vendors/${vendorId}/rating-matrix/batch`, 
      response, { updateCount: payload.updates.length });

    // ENTERPRISE: Robust response transformation with type safety
    if (Array.isArray(response?.data) && response.data.length > 0) {
      const transformedData = response.data.map((item: any) => ({
        id: item.id,
        nominationEvaluationId: item.nomination_evaluation_id,
        vendorId: item.vendor_id,
        sNo: item.s_no,
        category: item.category,
        assessmentAspects: item.assessment_aspects,
        sectionWiseCapabilityPercent: item.section_wise_capability_percent,
        riskMitigationPercent: item.risk_mitigation_percent,
        minorNC: item.minor_nc,
        majorNC: item.major_nc,
        sortOrder: item.sort_order,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }));
      
      apiLogger.info('Batch update completed successfully', {
        updateCount: payload.updates.length,
        returnedRecords: transformedData.length
      });
      
      return transformedData;
    }
    
    // ENTERPRISE: Fallback with fresh data fetch
    apiLogger.info('No data in response, fetching fresh data from database');
    return getVendorRatingMatrix(nominationId, vendorId);
    
  } catch (error) {
    // Enhanced error logging to capture the actual problem
    const status = error.response?.status;
    const statusText = error.response?.statusText;
    const message = error.response?.data?.message || error.message || "Unknown error";
    const responseData = error.response?.data;
    
    console.error('Batch update failed:', {
      status,
      statusText,
      message,
      responseData,
      error: error,
      nominationId,
      vendorId,
      updateCount: updates.length,
      payloadUpdates: payload?.updates?.length || 0
    });
    
    apiLogger.logApiError('PUT', `/supplier-nominations/${nominationId}/vendors/${vendorId}/rating-matrix/batch`, error, {
      status,
      statusText,
      errorMessage: message,
      responseData,
      updateCount: updates.length,
      nominationId,
      vendorId
    });
    
    throw error;
  }
}

/**
 * Get calculated overall scores
 */
export async function getVendorRatingOverallScores(
  nominationId: string,
  vendorId: string
): Promise<VendorRatingOverallScores> {
  if (!nominationId || !vendorId) {
    return {
      sectionWiseCapability: 0,
      riskMitigation: 0,
      totalMinorNC: 0,
      totalMajorNC: 0,
      totalRecords: 0
    };
  }

  try {
    const response = await apiClient.get(`/supplier-nominations/${nominationId}/vendors/${vendorId}/rating-matrix/overall-scores`);
    
    const data = response?.data;
    if (data) {
      return {
        sectionWiseCapability: data.sectionWiseCapability || 0,
        riskMitigation: data.riskMitigation || 0,
        totalMinorNC: data.totalMinorNC || 0,
        totalMajorNC: data.totalMajorNC || 0,
        totalRecords: data.totalRecords || 0
      };
    }
    
    return {
      sectionWiseCapability: 0,
      riskMitigation: 0,
      totalMinorNC: 0,
      totalMajorNC: 0,
      totalRecords: 0
    };
  } catch (error) {
    const status = error?.response?.status;
    
    apiLogger.logApiError('GET', `/supplier-nominations/${nominationId}/vendors/${vendorId}/rating-matrix/overall-scores`, error, {
      status,
      nominationId,
      vendorId
    });
    
    // Always return valid default scores instead of throwing
    return {
      sectionWiseCapability: 0,
      riskMitigation: 0,
      totalMinorNC: 0,
      totalMajorNC: 0,
      totalRecords: 0
    };
  }
}