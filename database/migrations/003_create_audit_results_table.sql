-- Migration: Create audit_results table and modify audits table
-- Date: 2026-02-17
-- Description: Create separate table for audit results to allow dynamic result types

-- Step 1: Create audit_results table
CREATE TABLE audit_results (
    id INT PRIMARY KEY AUTO_INCREMENT,
    result_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_is_active (is_active),
    INDEX idx_result_name (result_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 2: Insert default audit results
INSERT INTO audit_results (result_name, description) VALUES
('Satisfactory', 'Audit passed with no major issues'),
('Unsatisfactory', 'Audit failed with major non-conformities'),
('With Observations', 'Audit passed with minor observations'),
('Not Applicable', 'Audit result not applicable');

-- Step 3: Add audit_result_id column to audits table
ALTER TABLE audits ADD COLUMN audit_result_id INT NULL AFTER status;

-- Step 4: Migrate existing result data
UPDATE audits a
JOIN audit_results ar ON a.result = ar.result_name
SET a.audit_result_id = ar.id
WHERE a.result IS NOT NULL;

-- Step 5: Add foreign key constraint
ALTER TABLE audits ADD FOREIGN KEY (audit_result_id) REFERENCES audit_results(id) ON DELETE SET NULL;

-- Step 6: Add index for audit_result_id
CREATE INDEX idx_audit_result_id ON audits(audit_result_id);

-- Step 7: Drop the old result enum column
ALTER TABLE audits DROP COLUMN result;
