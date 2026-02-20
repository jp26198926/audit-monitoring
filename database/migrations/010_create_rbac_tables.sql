-- Migration: Create RBAC (Role-Based Access Control) tables
-- Date: 2026-02-20
-- Description: Create tables for permissions, pages, roles, and role_permissions junction table

-- Step 1: Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 2: Create pages table
CREATE TABLE IF NOT EXISTS pages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    path VARCHAR(200) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_path (path),
    INDEX idx_is_active (is_active),
    INDEX idx_display_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 3: Create roles table (if not exists, since we have role in users table)
CREATE TABLE IF NOT EXISTS roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 4: Create role_permissions junction table (role + page + permission)
CREATE TABLE IF NOT EXISTS role_permissions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    role_id INT NOT NULL,
    page_id INT NOT NULL,
    permission_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    UNIQUE KEY unique_role_page_permission (role_id, page_id, permission_id),
    INDEX idx_role_id (role_id),
    INDEX idx_page_id (page_id),
    INDEX idx_permission_id (permission_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 5: Insert default permissions
INSERT INTO permissions (name, description) VALUES
('create', 'Create new records'),
('read', 'View records'),
('update', 'Edit existing records'),
('delete', 'Delete records'),
('export', 'Export data');

-- Step 6: Insert default roles
INSERT INTO roles (name, description) VALUES
('Admin', 'Full system access with all permissions'),
('Encoder', 'Can create and edit records'),
('Viewer', 'Read-only access to view records');

-- Step 7: Insert default pages
INSERT INTO pages (name, path, description, icon, display_order) VALUES
('Dashboard', '/dashboard', 'System dashboard and analytics', 'ChartBarIcon', 1),
('Audits', '/audits', 'Manage vessel audits', 'DocumentTextIcon', 2),
('Findings', '/findings', 'Manage audit findings', 'ExclamationTriangleIcon', 3),
('Vessels', '/vessels', 'Manage vessels', 'TruckIcon', 4),
('Audit Types', '/audit-types', 'Manage audit types', 'TagIcon', 5),
('Audit Parties', '/audit-parties', 'Manage audit parties', 'UserGroupIcon', 6),
('Audit Companies', '/audit-companies', 'Manage audit companies', 'BuildingOfficeIcon', 7),
('Auditors', '/auditors', 'Manage auditors', 'UserIcon', 8),
('Audit Results', '/audit-results', 'Manage audit results', 'CheckCircleIcon', 9),
('Users', '/users', 'Manage system users', 'UsersIcon', 10),
('Roles', '/roles', 'Manage user roles', 'ShieldCheckIcon', 11),
('Permissions', '/permissions', 'Manage permissions', 'KeyIcon', 12),
('Pages', '/pages', 'Manage system pages', 'RectangleStackIcon', 13),
('Settings', '/settings', 'System settings', 'Cog6ToothIcon', 14);

-- Step 8: Grant Admin full permissions to all pages
INSERT INTO role_permissions (role_id, page_id, permission_id)
SELECT r.id, p.id, perm.id
FROM roles r
CROSS JOIN pages p
CROSS JOIN permissions perm
WHERE r.name = 'Admin';

-- Step 9: Grant Encoder permissions (create, read, update on most pages)
INSERT INTO role_permissions (role_id, page_id, permission_id)
SELECT r.id, p.id, perm.id
FROM roles r
CROSS JOIN pages p
CROSS JOIN permissions perm
WHERE r.name = 'Encoder'
  AND p.name NOT IN ('Users', 'Roles', 'Permissions', 'Pages', 'Settings')
  AND perm.name IN ('create', 'read', 'update');

-- Step 10: Grant Viewer read-only permissions
INSERT INTO role_permissions (role_id, page_id, permission_id)
SELECT r.id, p.id, perm.id
FROM roles r
CROSS JOIN pages p
CROSS JOIN permissions perm
WHERE r.name = 'Viewer'
  AND perm.name = 'read';

-- Step 11: Add role_id to users table if it doesn't exist
-- (We'll use the existing role ENUM for now, but add a column for future use)
ALTER TABLE users ADD COLUMN role_id INT NULL AFTER role;
ALTER TABLE users ADD CONSTRAINT fk_users_role_id FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL;

-- Step 12: Update users table to link existing roles
UPDATE users u
INNER JOIN roles r ON u.role = r.name
SET u.role_id = r.id;

