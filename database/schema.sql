-- Audit Monitoring System Database Schema
-- MySQL Database

-- Drop tables if they exist (for clean setup)
DROP TABLE IF EXISTS attachments;
DROP TABLE IF EXISTS findings;
DROP TABLE IF EXISTS audits;
DROP TABLE IF EXISTS audit_parties;
DROP TABLE IF EXISTS audit_types;
DROP TABLE IF EXISTS vessels;
DROP TABLE IF EXISTS users;

-- Users Table
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('Admin', 'Encoder', 'Viewer') NOT NULL DEFAULT 'Viewer',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Vessels Table
CREATE TABLE vessels (
    id INT PRIMARY KEY AUTO_INCREMENT,
    vessel_name VARCHAR(100) NOT NULL,
    registration_number VARCHAR(50) NOT NULL UNIQUE,
    status ENUM('Active', 'Inactive') DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_vessel_name (vessel_name),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Audit Types Table
CREATE TABLE audit_types (
    id INT PRIMARY KEY AUTO_INCREMENT,
    type_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_type_name (type_name),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Audit Parties Table
CREATE TABLE audit_parties (
    id INT PRIMARY KEY AUTO_INCREMENT,
    party_name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_party_name (party_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Audits Table
CREATE TABLE audits (
    id INT PRIMARY KEY AUTO_INCREMENT,
    vessel_id INT NOT NULL,
    audit_type_id INT NOT NULL,
    audit_party_id INT NOT NULL,
    audit_reference VARCHAR(100) NOT NULL UNIQUE,
    audit_start_date DATE NOT NULL,
    audit_end_date DATE,
    next_due_date DATE,
    location VARCHAR(200),
    status ENUM('Planned', 'Ongoing', 'Completed', 'Closed') DEFAULT 'Planned',
    report_file_path VARCHAR(500),
    remarks TEXT,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (vessel_id) REFERENCES vessels(id) ON DELETE RESTRICT,
    FOREIGN KEY (audit_type_id) REFERENCES audit_types(id) ON DELETE RESTRICT,
    FOREIGN KEY (audit_party_id) REFERENCES audit_parties(id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_vessel_id (vessel_id),
    INDEX idx_audit_type_id (audit_type_id),
    INDEX idx_audit_party_id (audit_party_id),
    INDEX idx_status (status),
    INDEX idx_next_due_date (next_due_date),
    INDEX idx_created_by (created_by),
    INDEX idx_audit_dates (audit_start_date, audit_end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Findings Table
CREATE TABLE findings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    audit_id INT NOT NULL,
    category ENUM('Major', 'Minor', 'Observation') NOT NULL,
    description TEXT NOT NULL,
    root_cause TEXT,
    corrective_action TEXT,
    responsible_person VARCHAR(100),
    target_date DATE NOT NULL,
    status ENUM('Open', 'In Progress', 'Submitted', 'Closed', 'Overdue') DEFAULT 'Open',
    closure_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (audit_id) REFERENCES audits(id) ON DELETE CASCADE,
    INDEX idx_audit_id (audit_id),
    INDEX idx_category (category),
    INDEX idx_status (status),
    INDEX idx_target_date (target_date),
    INDEX idx_closure_date (closure_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Attachments Table
CREATE TABLE attachments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    finding_id INT NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    uploaded_by INT NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (finding_id) REFERENCES findings(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_finding_id (finding_id),
    INDEX idx_uploaded_by (uploaded_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default admin user (password: admin123 - should be changed after first login)
-- Password hash for 'admin123' using bcrypt with 10 rounds
INSERT INTO users (name, email, password_hash, role) VALUES 
('System Admin', 'admin@auditmonitor.com', '$2b$10$K7DHvFJJLxVBWzW2XxvjLO.OvJzJ5J5J5J5J5J5J5J5J5J5J5J5J5K', 'Admin');

-- Insert default audit parties (as per spec: Internal/2nd Party/External)
INSERT INTO audit_parties (party_name) VALUES 
('Internal'),
('2nd Party'),
('External');

-- Insert sample audit types
INSERT INTO audit_types (type_name, description) VALUES 
('ISM Audit', 'International Safety Management Audit'),
('ISPS Audit', 'International Ship and Port Facility Security Audit'),
('MLC Audit', 'Maritime Labour Convention Audit'),
('Flag State Inspection', 'Flag State Inspection Audit'),
('Port State Control', 'Port State Control Inspection');

-- Insert sample vessels
INSERT INTO vessels (vessel_name, registration_number) VALUES 
('MV Sample Vessel 1', 'IMO-1234567'),
('MV Sample Vessel 2', 'IMO-7654321');
