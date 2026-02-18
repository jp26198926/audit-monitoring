-- Migration: Create audit_attachments table
-- Date: 2026-02-18
-- Description: Add support for multiple file attachments per audit

-- Create audit_attachments table
CREATE TABLE IF NOT EXISTS audit_attachments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    audit_id INT NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100),
    file_size INT,
    uploaded_by INT NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (audit_id) REFERENCES audits(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_audit_id (audit_id),
    INDEX idx_uploaded_by (uploaded_by),
    INDEX idx_uploaded_at (uploaded_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Note: The existing report_file_path column in audits table can remain
-- for backward compatibility or be used as the primary/main report
