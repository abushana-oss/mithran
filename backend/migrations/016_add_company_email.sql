-- Migration: Add company_email field to vendors table
-- Description: Adds email field for vendor companies

-- Add company_email column to vendors table
ALTER TABLE vendors
ADD COLUMN IF NOT EXISTS company_email TEXT;

-- Add comment to describe the column
COMMENT ON COLUMN vendors.company_email IS 'Company email address for general inquiries';
