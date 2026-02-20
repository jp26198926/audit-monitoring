-- Migration: Remove role ENUM column from users table
-- Date: 2026-02-20
-- Description: Remove the role column and use role_id exclusively for RBAC

-- Step 1: Make sure all users have a role_id (update any that don't)
UPDATE users u
INNER JOIN roles r ON u.role = r.name
SET u.role_id = r.id
WHERE u.role_id IS NULL;

-- Step 2: Drop the existing foreign key constraint with ON DELETE SET NULL
ALTER TABLE users DROP FOREIGN KEY fk_users_role_id;

-- Step 3: Make role_id NOT NULL
ALTER TABLE users MODIFY COLUMN role_id INT NOT NULL;

-- Step 4: Recreate the foreign key with ON DELETE RESTRICT
ALTER TABLE users ADD CONSTRAINT fk_users_role_id 
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT;

-- Step 5: Drop the role column
ALTER TABLE users DROP COLUMN role;

