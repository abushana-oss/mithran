import { SetMetadata } from '@nestjs/common';

export const RATE_LIMIT_KEY = 'rate_limit';

export interface RateLimitOptions {
  windowMs?: number; // Time window in milliseconds
  max?: number; // Max requests per window
  message?: string; // Custom error message
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

/**
 * Rate limiting decorator for production-grade API endpoints
 * 
 * @param options Rate limiting configuration
 * 
 * @example
 * // Basic rate limiting: 100 requests per 15 minutes
 * @RateLimit({ max: 100, windowMs: 15 * 60 * 1000 })
 * 
 * // Strict rate limiting for sensitive operations
 * @RateLimit({ max: 10, windowMs: 60 * 1000, message: 'Too many attempts' })
 */
export const RateLimit = (options: RateLimitOptions = {}) => {
  const defaultOptions: RateLimitOptions = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: 'Too many requests, please try again later',
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
    ...options,
  };

  return SetMetadata(RATE_LIMIT_KEY, defaultOptions);
};

// Predefined rate limit configurations for different endpoint types
export const RateLimits = {
  // For data retrieval endpoints
  READ_OPERATIONS: { max: 200, windowMs: 15 * 60 * 1000 }, // 200/15min
  
  // For data modification endpoints
  WRITE_OPERATIONS: { max: 50, windowMs: 15 * 60 * 1000 }, // 50/15min
  
  // For sensitive operations (date updates, production changes)
  CRITICAL_OPERATIONS: { max: 20, windowMs: 15 * 60 * 1000 }, // 20/15min
  
  // For bulk operations or file uploads
  BULK_OPERATIONS: { max: 5, windowMs: 60 * 1000 }, // 5/1min
  
  // For authentication endpoints
  AUTH_OPERATIONS: { max: 10, windowMs: 15 * 60 * 1000 }, // 10/15min
};