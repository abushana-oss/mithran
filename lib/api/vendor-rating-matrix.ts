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

export interface UpdateVendorRatingData {
  id: string;
  sectionWiseCapabilityPercent?: number;
  riskMitigationPercent?: number;
  minorNC?: number;
  majorNC?: number;
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
    apiLogger.logApiError('GET', `/supplier-nominations/${nominationId}/vendors/${vendorId}/rating-matrix`, error);
    throw error; // Let the component handle the error appropriately
  }
}

/**
 * Initialize empty vendor rating matrix
 */
export async function initializeVendorRatingMatrix(
  nominationId: string,
  vendorId: string
): Promise<void> {
  try {
    await apiClient.post(`/supplier-nominations/${nominationId}/vendors/${vendorId}/rating-matrix/init`);
  } catch (error) {
    apiLogger.logApiError('POST', `/supplier-nominations/${nominationId}/vendors/${vendorId}/rating-matrix/init`, error);
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
export async function batchUpdateVendorRatingMatrix(
  nominationId: string,
  vendorId: string,
  updates: UpdateVendorRatingData[]
): Promise<VendorRatingMatrix[]> {
  try {
    console.log('Batch updating vendor rating matrix:', { updates });
    
    const response = await apiClient.put(
      `/supplier-nominations/${nominationId}/vendors/${vendorId}/rating-matrix/batch`, 
      { updates }
    );
    
    // Transform response if we get data back
    if (Array.isArray(response?.data) && response.data.length > 0) {
      return response.data.map((item: any) => ({
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
    }
    
    // Return updated data by fetching it fresh
    return getVendorRatingMatrix(nominationId, vendorId);
  } catch (error) {
    console.error('Failed to batch update vendor rating matrix:', error);
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
    console.error('Failed to get overall scores:', error);
    return {
      sectionWiseCapability: 0,
      riskMitigation: 0,
      totalMinorNC: 0,
      totalMajorNC: 0,
      totalRecords: 0
    };
  }
}