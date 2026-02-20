-- Migration: Add soft delete columns to audits table
-- Date: 2026-02-20
-- Description: Add deleted_at and deleted_by columns to implement soft deletion for audits

-- Step 1: Add deleted_at column
ALTER TABLE audits 
ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL AFTER updated_at;

-- Step 2: Add deleted_by column
ALTER TABLE audits 
ADD COLUMN deleted_by INT NULL DEFAULT NULL AFTER deleted_at;

-- Step 3: Add foreign key constraint for deleted_by
ALTER TABLE audits 
ADD CONSTRAINT fk_audits_deleted_by 
FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL;

-- Step 4: Add index for deleted_at to improve query performance
CREATE INDEX idx_deleted_at ON audits(deleted_at);

-- Step 5: Add composite index for common queries (non-deleted records)
CREATE INDEX idx_active_audits ON audits(deleted_at, status);

