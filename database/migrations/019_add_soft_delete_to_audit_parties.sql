-- Migration 019: Add soft delete columns to audit_parties table
-- Date: 2026-02-20
-- Description: Add deleted_at and deleted_by columns for soft deletion

ALTER TABLE audit_parties 
  ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL,
  ADD COLUMN deleted_by INT NULL DEFAULT NULL,
  ADD INDEX idx_audit_parties_deleted_at (deleted_at),
  ADD CONSTRAINT fk_audit_parties_deleted_by 
    FOREIGN KEY (deleted_by) 
    REFERENCES users(id) 
    ON DELETE SET NULL;
