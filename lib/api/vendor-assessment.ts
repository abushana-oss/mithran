import { apiClient } from './client';

export interface AssessmentCriteria {
  id: string;
  nominationId: string;
  vendorId: string;
  category: string;
  assessmentAspects: string;
  totalScore: number;
  actualScore: number;
  highThreshold: number;
  lowThreshold: number;
  sectionwiseCapability: number;
  riskSectionTotal: number;
  riskActualScore: number;
  riskMitigation: number;
  minorNC: number;
  majorNC: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface BatchAssessmentUpdate {
  criteriaId: string;
  actualScore?: number;
  totalScore?: number;
  riskSectionTotal?: number;
  riskActualScore?: number;
  minorNC?: number;
  majorNC?: number;
}

export interface BulkUpdateAssessmentData {
  updates: BatchAssessmentUpdate[];
}

export interface AssessmentMetrics {
  overallScore1: number;
  overallScore2: number;
  totalMinorNC: number;
  totalMajorNC: number;
  totalPossible: number;
  totalActual: number;
  ratingStatus: 'excellent' | 'good' | 'needs_improvement';
}

/**
 * Get assessment criteria for a nomination and vendor
 */
export async function getAssessmentCriteria(
  nominationId: string,
  vendorId: string
): Promise<AssessmentCriteria[]> {
  try {
    const response = await apiClient.get(`/supplier-nominations/${nominationId}/vendors/${vendorId}/assessment`);
    const data = Array.isArray(response) ? response : [];
    
    // Transform database format to component format
    return data.map(item => ({
      id: item.id,
      nominationId: item.nomination_evaluation_id,
      vendorId: item.vendor_id,
      category: item.category,
      assessmentAspects: item.assessment_aspects,
      totalScore: item.total_score,
      actualScore: item.actual_score,
      highThreshold: item.high_threshold,
      lowThreshold: item.low_threshold,
      sectionwiseCapability: item.sectionwise_capability || 0,
      riskSectionTotal: item.risk_section_total,
      riskActualScore: item.risk_actual_score,
      riskMitigation: item.risk_mitigation || 0,
      minorNC: item.minor_nc,
      majorNC: item.major_nc,
      sortOrder: item.sort_order,
      createdAt: item.created_at,
      updatedAt: item.updated_at
    }));
  } catch (error) {
    console.error('Failed to get assessment criteria:', error);
    return [];
  }
}

/**
 * Initialize assessment criteria for a nomination and vendor
 */
export async function initializeAssessmentCriteria(
  nominationId: string,
  vendorId: string
): Promise<void> {
  try {
    await apiClient.post(`/supplier-nominations/${nominationId}/vendors/${vendorId}/assessment/init`);
  } catch (error) {
    console.error('Failed to initialize assessment criteria:', error);
    throw error;
  }
}

/**
 * Update individual assessment criterion
 */
export async function updateAssessmentCriterion(
  nominationId: string,
  vendorId: string,
  criteriaId: string,
  updateData: Partial<BatchAssessmentUpdate>
): Promise<void> {
  try {
    await apiClient.put(
      `/supplier-nominations/${nominationId}/vendors/${vendorId}/assessment/${criteriaId}`, 
      updateData
    );
  } catch (error) {
    console.error('Failed to update assessment criterion:', error);
    throw error;
  }
}

/**
 * Batch update assessment criteria - ENTERPRISE BEST PRACTICE
 */
export async function batchUpdateAssessmentCriteria(
  nominationId: string,
  vendorId: string,
  updates: BatchAssessmentUpdate[]
): Promise<AssessmentCriteria[]> {
  try {
    // Try batch endpoint first (preferred)
    const response = await apiClient.put(
      `/supplier-nominations/${nominationId}/vendors/${vendorId}/assessment/batch`, 
      { updates }
    );
    
    // Transform response if we get data back
    if (Array.isArray(response) && response.length > 0) {
      return response.map(item => ({
        id: item.id,
        nominationId: item.nomination_evaluation_id,
        vendorId: item.vendor_id,
        category: item.category,
        assessmentAspects: item.assessment_aspects,
        totalScore: item.total_score,
        actualScore: item.actual_score,
        highThreshold: item.high_threshold,
        lowThreshold: item.low_threshold,
        sectionwiseCapability: item.sectionwise_capability || 0,
        riskSectionTotal: item.risk_section_total,
        riskActualScore: item.risk_actual_score,
        riskMitigation: item.risk_mitigation || 0,
        minorNC: item.minor_nc,
        majorNC: item.major_nc,
        sortOrder: item.sort_order,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }));
    }
    
    // Return updated data by fetching it fresh
    return getAssessmentCriteria(nominationId, vendorId);
  } catch (error) {
    console.warn('Batch assessment update failed, falling back to individual requests:', error);
    
    // Fallback to individual requests if batch fails
    const updatePromises = updates.map(update =>
      updateAssessmentCriterion(nominationId, vendorId, update.criteriaId, update)
    );
    
    await Promise.all(updatePromises);
    
    // Return updated data
    return getAssessmentCriteria(nominationId, vendorId);
  }
}

/**
 * Calculate assessment metrics from criteria data
 */
export function calculateAssessmentMetrics(criteria: AssessmentCriteria[]): AssessmentMetrics {
  const totalPossible = criteria.reduce((sum, item) => sum + item.totalScore, 0);
  const totalActual = criteria.reduce((sum, item) => sum + item.actualScore, 0);
  const overallScore1 = totalPossible > 0 ? (totalActual / totalPossible) * 100 : 0;

  const riskTotalPossible = criteria.reduce((sum, item) => sum + item.riskSectionTotal, 0);
  const riskTotalActual = criteria.reduce((sum, item) => sum + item.riskActualScore, 0);
  const overallScore2 = riskTotalPossible > 0 ? (riskTotalActual / riskTotalPossible) * 100 : 0;

  const totalMinorNC = criteria.reduce((sum, item) => sum + item.minorNC, 0);
  const totalMajorNC = criteria.reduce((sum, item) => sum + item.majorNC, 0);

  let ratingStatus: 'excellent' | 'good' | 'needs_improvement';
  if (overallScore1 >= 75) {
    ratingStatus = 'excellent';
  } else if (overallScore1 >= 60) {
    ratingStatus = 'good';
  } else {
    ratingStatus = 'needs_improvement';
  }

  return {
    overallScore1,
    overallScore2,
    totalMinorNC,
    totalMajorNC,
    totalPossible,
    totalActual,
    ratingStatus
  };
}

/**
 * Transform assessment data from API format to component format
 */
export function transformAssessmentDataToComponent(
  assessmentData: AssessmentCriteria[]
): AssessmentCriteria[] {
  if (!assessmentData || !Array.isArray(assessmentData)) {
    return [];
  }

  return assessmentData.map(criteria => ({
    ...criteria,
    sectionwiseCapability: criteria.totalScore > 0 
      ? (criteria.actualScore / criteria.totalScore) * 100 
      : 0,
    riskMitigation: criteria.riskSectionTotal > 0 
      ? (criteria.riskActualScore / criteria.riskSectionTotal) * 100 
      : 0
  }));
}

/**
 * Get default assessment criteria template
 */
export function getDefaultAssessmentCriteria(): Omit<AssessmentCriteria, 'id' | 'nominationId' | 'vendorId' | 'createdAt' | 'updatedAt'>[] {
  return [
    {
      category: "Quality",
      assessmentAspects: "Manufacturing Capability",
      totalScore: 100,
      actualScore: 0,
      highThreshold: 70,
      lowThreshold: 50,
      sectionwiseCapability: 0,
      riskSectionTotal: 0,
      riskActualScore: 0,
      riskMitigation: 0,
      minorNC: 0,
      majorNC: 0,
      sortOrder: 1
    },
    {
      category: "Quality", 
      assessmentAspects: "Quality Control Systems",
      totalScore: 100,
      actualScore: 0,
      highThreshold: 70,
      lowThreshold: 50,
      sectionwiseCapability: 0,
      riskSectionTotal: 0,
      riskActualScore: 0,
      riskMitigation: 0,
      minorNC: 0,
      majorNC: 0,
      sortOrder: 2
    },
    {
      category: "Cost",
      assessmentAspects: "Cost Competency",
      totalScore: 100,
      actualScore: 0,
      highThreshold: 70,
      lowThreshold: 50,
      sectionwiseCapability: 0,
      riskSectionTotal: 0,
      riskActualScore: 0,
      riskMitigation: 0,
      minorNC: 0,
      majorNC: 0,
      sortOrder: 3
    },
    {
      category: "Logistics",
      assessmentAspects: "Delivery Performance",
      totalScore: 100,
      actualScore: 0,
      highThreshold: 70,
      lowThreshold: 50,
      sectionwiseCapability: 0,
      riskSectionTotal: 0,
      riskActualScore: 0,
      riskMitigation: 0,
      minorNC: 0,
      majorNC: 0,
      sortOrder: 4
    },
    {
      category: "Development",
      assessmentAspects: "Design & Development Capability",
      totalScore: 100,
      actualScore: 0,
      highThreshold: 70,
      lowThreshold: 50,
      sectionwiseCapability: 0,
      riskSectionTotal: 0,
      riskActualScore: 0,
      riskMitigation: 0,
      minorNC: 0,
      majorNC: 0,
      sortOrder: 5
    }
  ];
}