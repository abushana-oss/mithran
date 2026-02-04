/**
 * ENTERPRISE: Centralized type definitions for API operations
 * Ensures type safety across frontend-backend communication
 */

// Base error interface for consistent error handling
export interface ApiErrorDetails {
  code: string;
  message: string;
  field?: string;
  value?: any;
  timestamp: string;
}

// Validation result interface
export interface ValidationResult<T> {
  isValid: boolean;
  data?: T;
  errors: ApiErrorDetails[];
}

// API operation metadata for monitoring
export interface ApiOperationMetadata {
  operationId: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  retryCount: number;
  cacheHit?: boolean;
}

// Enterprise audit trail interface
export interface ApiAuditEntry {
  operationId: string;
  userId?: string;
  action: string;
  resource: string;
  timestamp: string;
  success: boolean;
  metadata?: Record<string, any>;
}

export default {};