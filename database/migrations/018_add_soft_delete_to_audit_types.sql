-- Migration 018: Add soft delete columns to audit_types table
-- Date: 2026-02-20
-- Description: Add deleted_at and deleted_by columns for soft deletion

ALTER TABLE audit_types 
  ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL,
  ADD COLUMN deleted_by INT NULL DEFAULT NULL,
  ADD INDEX idx_audit_types_deleted_at (deleted_at),
  ADD CONSTRAINT fk_audit_types_deleted_by 
    FOREIGN KEY (deleted_by) 
    REFERENCES users(id) 
    ON DELETE SET NULL;
