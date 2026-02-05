import { Injectable } from '@nestjs/common';
import { Logger } from '../../../common/logger/logger.service';

/**
 * Enterprise Field Mapping Service
 * Handles conversion between frontend camelCase and database snake_case
 * Provides centralized field mapping for maintainability and consistency
 */
@Injectable()
export class FieldMappingService {
  constructor(private readonly logger: Logger) {}

  /**
   * Vendor Rating Matrix field mappings
   */
  private static readonly VENDOR_RATING_FIELD_MAP = {
    assessmentAspects: 'assessment_aspects',
    sectionWiseCapabilityPercent: 'section_wise_capability_percent',
    riskMitigationPercent: 'risk_mitigation_percent',
    minorNC: 'minor_nc',
    majorNC: 'major_nc'
  } as const;

  /**
   * Cost Competency field mappings
   */
  private static readonly COST_COMPETENCY_FIELD_MAP = {
    netPriceUnit: 'net_price_unit',
    developmentCost: 'development_cost',
    leadTimeDays: 'lead_time_days',
    costRank: 'cost_rank',
    developmentCostRank: 'development_cost_rank',
    leadTimeRank: 'lead_time_rank',
    totalScore: 'total_score',
    overallRank: 'overall_rank'
  } as const;

  /**
   * Vendor Assessment field mappings
   */
  private static readonly VENDOR_ASSESSMENT_FIELD_MAP = {
    actualScore: 'actual_score',
    totalScore: 'total_score',
    riskSectionTotal: 'risk_section_total',
    riskActualScore: 'risk_actual_score',
    minorNC: 'minor_nc',
    majorNC: 'major_nc'
  } as const;

  /**
   * Map vendor rating update fields from camelCase to snake_case
   * Handles both camelCase and snake_case inputs for compatibility
   */
  mapVendorRatingFields(update: any): { dbFields: Record<string, any>; originalFields: Record<string, any> } {
    const dbFields: Record<string, any> = {
      updated_at: new Date().toISOString()
    };
    const originalFields: Record<string, any> = {};
    const processedFields = new Set<string>(); // Track processed database fields

    Object.entries(update).forEach(([key, value]) => {
      if (key === 'id') return; // Skip ID field

      originalFields[key] = value;

      // Check if it's a camelCase field that needs mapping
      let dbFieldName = FieldMappingService.VENDOR_RATING_FIELD_MAP[key as keyof typeof FieldMappingService.VENDOR_RATING_FIELD_MAP];
      
      // If not found, check if it's already a snake_case field
      if (!dbFieldName) {
        const snakeCaseFields = Object.values(FieldMappingService.VENDOR_RATING_FIELD_MAP) as string[];
        if (snakeCaseFields.includes(key)) {
          dbFieldName = key; // Already in snake_case format
        }
      }
      
      if (dbFieldName && value !== undefined && !processedFields.has(dbFieldName)) {
        processedFields.add(dbFieldName);
        
        // Type conversion based on field type
        if (key.includes('Percent') || dbFieldName.includes('percent')) {
          dbFields[dbFieldName] = Number(value);
        } else if (key.includes('NC') || dbFieldName.includes('_nc')) {
          dbFields[dbFieldName] = parseInt(String(value), 10);
        } else {
          dbFields[dbFieldName] = value;
        }
      }
    });

    return { dbFields, originalFields };
  }

  /**
   * Map cost competency update fields
   */
  mapCostCompetencyFields(update: any): { dbFields: Record<string, any>; originalFields: Record<string, any> } {
    const dbFields: Record<string, any> = {
      updated_at: new Date().toISOString()
    };
    const originalFields: Record<string, any> = {};

    Object.entries(update).forEach(([key, value]) => {
      if (key === 'id') return;

      originalFields[key] = value;

      const dbFieldName = FieldMappingService.COST_COMPETENCY_FIELD_MAP[key as keyof typeof FieldMappingService.COST_COMPETENCY_FIELD_MAP];
      
      if (dbFieldName && value !== undefined) {
        dbFields[dbFieldName] = Number(value);
        this.logger.log(`[FIELD_MAPPING] ${key}: ${value} -> ${dbFieldName}: ${dbFields[dbFieldName]}`);
      }
    });

    return { dbFields, originalFields };
  }

  /**
   * Map vendor assessment update fields
   */
  mapVendorAssessmentFields(update: any): { dbFields: Record<string, any>; originalFields: Record<string, any> } {
    const dbFields: Record<string, any> = {
      updated_at: new Date().toISOString()
    };
    const originalFields: Record<string, any> = {};

    Object.entries(update).forEach(([key, value]) => {
      if (key === 'id') return;

      originalFields[key] = value;

      const dbFieldName = FieldMappingService.VENDOR_ASSESSMENT_FIELD_MAP[key as keyof typeof FieldMappingService.VENDOR_ASSESSMENT_FIELD_MAP];
      
      if (dbFieldName && value !== undefined) {
        // Type conversion based on field semantics
        if (key.includes('Score') || key.includes('Total')) {
          dbFields[dbFieldName] = Number(value);
        } else if (key.includes('NC')) {
          dbFields[dbFieldName] = parseInt(String(value), 10);
        } else {
          dbFields[dbFieldName] = value;
        }

        this.logger.log(`[FIELD_MAPPING] ${key}: ${value} -> ${dbFieldName}: ${dbFields[dbFieldName]}`);
      }
    });

    return { dbFields, originalFields };
  }

  /**
   * Validate field mappings exist for all provided fields
   * Accepts both camelCase and snake_case formats for compatibility
   */
  validateVendorRatingFields(update: any): { valid: boolean; invalidFields: string[] } {
    const invalidFields: string[] = [];
    const camelCaseFields = Object.keys(FieldMappingService.VENDOR_RATING_FIELD_MAP);
    const snakeCaseFields = Object.values(FieldMappingService.VENDOR_RATING_FIELD_MAP);
    
    Object.keys(update).forEach(key => {
      if (key === 'id') return;
      
      // Accept both camelCase and snake_case formats
      const isValidCamelCase = camelCaseFields.includes(key);
      const isValidSnakeCase = (snakeCaseFields as string[]).includes(key);
      
      if (!isValidCamelCase && !isValidSnakeCase) {
        invalidFields.push(key);
      }
    });

    return {
      valid: invalidFields.length === 0,
      invalidFields
    };
  }

  /**
   * Get all supported vendor rating fields
   */
  getSupportedVendorRatingFields(): string[] {
    return Object.keys(FieldMappingService.VENDOR_RATING_FIELD_MAP);
  }

  /**
   * Get database field name for frontend field
   */
  getDbFieldName(frontendField: string, category: 'rating' | 'cost' | 'assessment'): string | undefined {
    switch (category) {
      case 'rating':
        return FieldMappingService.VENDOR_RATING_FIELD_MAP[frontendField as keyof typeof FieldMappingService.VENDOR_RATING_FIELD_MAP];
      case 'cost':
        return FieldMappingService.COST_COMPETENCY_FIELD_MAP[frontendField as keyof typeof FieldMappingService.COST_COMPETENCY_FIELD_MAP];
      case 'assessment':
        return FieldMappingService.VENDOR_ASSESSMENT_FIELD_MAP[frontendField as keyof typeof FieldMappingService.VENDOR_ASSESSMENT_FIELD_MAP];
      default:
        return undefined;
    }
  }
}