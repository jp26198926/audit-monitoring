-- Migration: Create company_settings table
-- Description: Store company/organization information for the audit monitoring system

CREATE TABLE IF NOT EXISTS company_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    company_name VARCHAR(255) NOT NULL,
    company_address TEXT,
    company_phone VARCHAR(50),
    company_email VARCHAR(255),
    contact_person VARCHAR(255),
    registration_number VARCHAR(100),
    tax_id VARCHAR(100),
    website VARCHAR(255),
    logo_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default/placeholder settings (optional)
INSERT INTO company_settings (company_name) 
VALUES ('Your Company Name') 
ON DUPLICATE KEY UPDATE company_name = company_name;
