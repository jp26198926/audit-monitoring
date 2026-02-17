-- Migration: Modify audit_reference to be nullable and auto-generated
-- Date: 2026-02-17
-- Description: Make audit_reference nullable to allow auto-generation based on ID

-- Remove the unique constraint temporarily
ALTER TABLE audits DROP INDEX audit_reference;

-- Modify column to allow NULL
ALTER TABLE audits MODIFY COLUMN audit_reference VARCHAR(100) NULL;

-- Add back the unique constraint but allow NULL values
ALTER TABLE audits ADD UNIQUE KEY audit_reference_unique (audit_reference);

-- Update existing records with proper format if they don't match the pattern
-- AUD-[YY]-00000 where 00000 is left-padded ID
UPDATE audits 
SET audit_reference = CONCAT('AUD-', DATE_FORMAT(NOW(), '%y'), '-', LPAD(id, 5, '0'))
WHERE audit_reference IS NULL 
   OR audit_reference NOT LIKE 'AUD-%';
