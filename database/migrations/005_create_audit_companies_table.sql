-- Migration: Create audit_companies table and update audits table
-- Date: 2026-02-18
-- Description: Add support for tracking auditing companies (organizations that perform the audits)

-- Create audit_companies table
CREATE TABLE IF NOT EXISTS audit_companies (
    id INT PRIMARY KEY AUTO_INCREMENT,
    company_name VARCHAR(200) NOT NULL UNIQUE,
    contact_person VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(50),
    address TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_company_name (company_name),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add audit_company_id to audits table
ALTER TABLE audits 
ADD COLUMN audit_company_id INT NULL AFTER audit_party_id,
ADD CONSTRAINT fk_audits_audit_company 
    FOREIGN KEY (audit_company_id) REFERENCES audit_companies(id) ON DELETE RESTRICT,
ADD INDEX idx_audit_company_id (audit_company_id);

-- Insert some sample audit companies
INSERT INTO audit_companies (company_name, contact_person, email, phone) VALUES 
('DNV GL', 'John Smith', 'contact@dnvgl.com', '+1-234-567-8900'),
('Bureau Veritas', 'Jane Doe', 'info@bureauveritas.com', '+1-234-567-8901'),
('Lloyd\'s Register', 'Mike Johnson', 'enquiries@lr.org', '+1-234-567-8902'),
('American Bureau of Shipping (ABS)', 'Sarah Williams', 'abs@eagle.org', '+1-234-567-8903'),
('ClassNK', 'Robert Brown', 'info@classnk.com', '+81-3-5226-2000');
