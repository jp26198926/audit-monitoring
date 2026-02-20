-- Migration: Add soft delete to findings
-- Description: Add deleted_at and deleted_by columns to implement soft deletion

ALTER TABLE findings
ADD COLUMN deleted_at TIMESTAMP NULL,
ADD COLUMN deleted_by INT NULL,
ADD CONSTRAINT fk_findings_deleted_by 
FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX idx_findings_deleted_at ON findings(deleted_at);
