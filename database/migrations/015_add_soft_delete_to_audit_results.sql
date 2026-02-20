-- Migration: Add soft delete to audit_results
-- Description: Add deleted_at and deleted_by columns to implement soft deletion

ALTER TABLE audit_results
ADD COLUMN deleted_at TIMESTAMP NULL,
ADD COLUMN deleted_by INT NULL,
ADD CONSTRAINT fk_audit_results_deleted_by 
FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX idx_audit_results_deleted_at ON audit_results(deleted_at);
