-- Migration: Add vessel_code column and make registration_number optional
-- Date: 2026-02-19
-- Description: Add unique vessel_code column and change registration_number to be optional

-- Step 1: Add vessel_code column (nullable first to allow existing data)
ALTER TABLE vessels 
ADD COLUMN vessel_code VARCHAR(50) NULL AFTER vessel_name;

-- Step 2: Modify registration_number to be optional (remove NOT NULL constraint)
ALTER TABLE vessels 
MODIFY COLUMN registration_number VARCHAR(50) NULL;

-- Step 3: Remove UNIQUE constraint from registration_number first
ALTER TABLE vessels 
DROP INDEX registration_number;

-- Step 4: Add UNIQUE constraint back to registration_number but allow NULL values
-- Note: In MySQL, multiple NULL values are allowed in UNIQUE columns
ALTER TABLE vessels 
ADD UNIQUE KEY unique_registration_number (registration_number);

-- Step 5: For existing vessels without vessel_code, generate one from vessel_name
-- This is a one-time update to ensure all existing vessels have a vessel_code
UPDATE vessels 
SET vessel_code = CONCAT('VSL-', LPAD(id, 4, '0'))
WHERE vessel_code IS NULL;

-- Step 6: Now make vessel_code NOT NULL and add UNIQUE constraint
ALTER TABLE vessels 
MODIFY COLUMN vessel_code VARCHAR(50) NOT NULL;

ALTER TABLE vessels 
ADD UNIQUE KEY unique_vessel_code (vessel_code);

-- Step 7: Add index for better query performance
ALTER TABLE vessels 
ADD INDEX idx_vessel_code (vessel_code);
