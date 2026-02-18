-- Migration: Create auditors and audit_auditors tables
-- Date: 2026-02-18
-- Description: Add support for tracking individual auditors who perform audits

-- Create auditors table
CREATE TABLE IF NOT EXISTS auditors (
    id INT PRIMARY KEY AUTO_INCREMENT,
    audit_company_id INT NOT NULL,
    auditor_name VARCHAR(150) NOT NULL,
    certification VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(50),
    specialization VARCHAR(200),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_auditors_company FOREIGN KEY (audit_company_id) 
        REFERENCES audit_companies(id) ON DELETE RESTRICT,
    INDEX idx_auditor_name (auditor_name),
    INDEX idx_audit_company_id (audit_company_id),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create audit_auditors junction table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS audit_auditors (
    id INT PRIMARY KEY AUTO_INCREMENT,
    audit_id INT NOT NULL,
    auditor_id INT NOT NULL,
    role VARCHAR(50) DEFAULT 'Auditor' COMMENT 'e.g., Lead Auditor, Auditor, Observer',
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_auditors_audit FOREIGN KEY (audit_id) 
        REFERENCES audits(id) ON DELETE CASCADE,
    CONSTRAINT fk_audit_auditors_auditor FOREIGN KEY (auditor_id) 
        REFERENCES auditors(id) ON DELETE CASCADE,
    UNIQUE KEY unique_audit_auditor (audit_id, auditor_id),
    INDEX idx_audit_id (audit_id),
    INDEX idx_auditor_id (auditor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample auditors for the existing companies
INSERT INTO auditors (audit_company_id, auditor_name, certification, email, phone, specialization) VALUES 
-- DNV GL auditors (company_id: 1)
(1, 'James Anderson', 'ISO 9001 Lead Auditor', 'j.anderson@dnvgl.com', '+1-234-567-8910', 'Quality Management Systems'),
(1, 'Emily Chen', 'ISO 14001 Auditor', 'e.chen@dnvgl.com', '+1-234-567-8911', 'Environmental Management'),
(1, 'Michael Brown', 'ISPS Code Auditor', 'm.brown@dnvgl.com', '+1-234-567-8912', 'Maritime Security'),

-- Bureau Veritas auditors (company_id: 2)
(2, 'Sophie Laurent', 'ISO 45001 Lead Auditor', 's.laurent@bureauveritas.com', '+1-234-567-8913', 'Occupational Health & Safety'),
(2, 'David Martinez', 'ISM Code Auditor', 'd.martinez@bureauveritas.com', '+1-234-567-8914', 'Safety Management Systems'),

-- Lloyd's Register auditors (company_id: 3)
(3, 'Thomas Wilson', 'IACS Auditor', 't.wilson@lr.org', '+1-234-567-8915', 'Ship Classification'),
(3, 'Rachel Green', 'ISO 27001 Auditor', 'r.green@lr.org', '+1-234-567-8916', 'Information Security'),

-- ABS auditors (company_id: 4)
(4, 'Christopher Lee', 'MLC Lead Auditor', 'c.lee@eagle.org', '+1-234-567-8917', 'Maritime Labour Convention'),
(4, 'Amanda Taylor', 'SOLAS Auditor', 'a.taylor@eagle.org', '+1-234-567-8918', 'Safety of Life at Sea'),

-- ClassNK auditors (company_id: 5)
(5, 'Yuki Tanaka', 'ISO 50001 Auditor', 'y.tanaka@classnk.com', '+81-3-5226-2010', 'Energy Management'),
(5, 'Hiroshi Sato', 'MARPOL Auditor', 'h.sato@classnk.com', '+81-3-5226-2011', 'Marine Pollution Prevention');
