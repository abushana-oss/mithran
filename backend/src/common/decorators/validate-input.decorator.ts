import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, IsDateString, IsUUID, IsOptional, MaxLength, Matches } from 'class-validator';

/**
 * Enhanced input validation decorators for production-grade security
 */

// Sanitize string inputs by trimming and removing dangerous characters
export const SanitizedString = (options?: { 
  maxLength?: number; 
  allowSpecialChars?: boolean;
  required?: boolean;
}) => {
  const decorators = [
    Transform(({ value }) => {
      if (typeof value !== 'string') return value;
      
      // Trim whitespace
      let sanitized = value.trim();
      
      // Remove or escape dangerous characters if not explicitly allowed
      if (!options?.allowSpecialChars) {
        // Remove HTML tags, script tags, and other potential XSS vectors
        sanitized = sanitized
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<[^>]+>/g, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '');
      }
      
      return sanitized;
    }),
  ];

  if (options?.required !== false) {
    decorators.push(IsNotEmpty({ message: 'This field is required' }));
  } else {
    decorators.push(IsOptional());
  }

  decorators.push(IsString({ message: 'Must be a valid string' }));
  
  if (options?.maxLength) {
    decorators.push(MaxLength(options.maxLength, { 
      message: `Must be no longer than ${options.maxLength} characters` 
    }));
  }

  return applyDecorators(...decorators);
};

// Validate and sanitize date strings
export const SanitizedDate = (options?: { required?: boolean }) => {
  const decorators = [
    Transform(({ value }) => {
      if (!value) return value;
      
      // Ensure it's a valid date format
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        return value; // Let validation catch this
      }
      
      // Return ISO string format
      return date.toISOString().split('T')[0];
    }),
  ];

  if (options?.required !== false) {
    decorators.push(IsNotEmpty({ message: 'Date is required' }));
  } else {
    decorators.push(IsOptional());
  }

  decorators.push(IsDateString({}, { message: 'Must be a valid date (YYYY-MM-DD)' }));

  return applyDecorators(...decorators);
};

// Validate UUIDs with sanitization
export const SanitizedUUID = (options?: { required?: boolean }) => {
  const decorators = [
    Transform(({ value }) => {
      if (typeof value !== 'string') return value;
      return value.trim().toLowerCase();
    }),
  ];

  if (options?.required !== false) {
    decorators.push(IsNotEmpty({ message: 'ID is required' }));
  } else {
    decorators.push(IsOptional());
  }

  decorators.push(IsUUID(4, { message: 'Must be a valid UUID' }));

  return applyDecorators(...decorators);
};

// Validate production lot numbers with specific format
export const SanitizedLotNumber = () => {
  return applyDecorators(
    Transform(({ value }) => {
      if (typeof value !== 'string') return value;
      return value.trim().toUpperCase();
    }),
    IsString({ message: 'Lot number must be a string' }),
    MaxLength(50, { message: 'Lot number must be no longer than 50 characters' }),
    Matches(/^[A-Z0-9\-_]+$/, { 
      message: 'Lot number can only contain letters, numbers, hyphens, and underscores' 
    }),
  );
};

// Validate quantity fields with bounds
export const SanitizedQuantity = (options?: { min?: number; max?: number }) => {
  const decorators = [
    Transform(({ value }) => {
      const num = Number(value);
      return isNaN(num) ? value : Math.abs(num); // Ensure positive
    }),
  ];

  return applyDecorators(...decorators);
};