-- Migration: Add result column to audits table
-- Date: 2026-02-17
-- Description: Add result field to store audit outcome

-- Add result column
ALTER TABLE audits 
ADD COLUMN result ENUM('Satisfactory', 'Unsatisfactory', 'With Observations', 'Not Applicable') NULL 
AFTER status;

-- Add index for result column for faster filtering
CREATE INDEX idx_result ON audits(result);
