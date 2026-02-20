-- Migration: Add soft delete columns to users table
-- Date: 2026-02-20
-- Description: Add deleted_at and deleted_by columns for soft deletion functionality

ALTER TABLE users
ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL,
ADD COLUMN deleted_by INT NULL DEFAULT NULL,
ADD INDEX idx_deleted_at (deleted_at),
ADD CONSTRAINT fk_users_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL;
