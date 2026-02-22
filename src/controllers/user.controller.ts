import { query } from "@/lib/db";
import { hashPassword, comparePassword } from "@/lib/auth";
import { User } from "@/types";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export class UserController {
  /**
   * Get all users (with optional deleted users)
   */
  static async getAllUsers(includeDeleted: boolean = false) {
    try {
      const whereClause = includeDeleted ? "" : "WHERE u.deleted_at IS NULL";

      const users = await query<(User & RowDataPacket)[]>(
        `SELECT u.id, u.name, u.email, u.role_id, u.is_active, u.created_at, u.updated_at, 
                u.deleted_at, u.deleted_by, r.name as role_name
         FROM users u
         INNER JOIN roles r ON u.role_id = r.id
         ${whereClause}
         ORDER BY u.created_at DESC`,
      );

      return {
        success: true,
        data: users,
      };
    } catch (error) {
      console.error("Get users error:", error);
      return {
        success: false,
        error: "Failed to fetch users",
      };
    }
  }

  /**
   * Get user by ID
   */
  static async getUserById(id: number, includeDeleted: boolean = false) {
    try {
      const whereClause = includeDeleted
        ? "WHERE u.id = ?"
        : "WHERE u.id = ? AND u.deleted_at IS NULL";

      const users = await query<(User & RowDataPacket)[]>(
        `SELECT u.id, u.name, u.email, u.role_id, u.is_active, u.created_at, u.updated_at,
                u.deleted_at, u.deleted_by, r.name as role_name
         FROM users u
         INNER JOIN roles r ON u.role_id = r.id
         ${whereClause}`,
        [id],
      );

      if (users.length === 0) {
        return {
          success: false,
          error: "User not found",
        };
      }

      return {
        success: true,
        data: users[0],
      };
    } catch (error) {
      console.error("Get user error:", error);
      return {
        success: false,
        error: "Failed to fetch user",
      };
    }
  }

  /**
   * Create new user
   */
  static async createUser(data: {
    name: string;
    email: string;
    password: string;
    role_id: number;
    is_active?: boolean;
  }) {
    try {
      // Check if email already exists
      const existing = await query<RowDataPacket[]>(
        "SELECT id FROM users WHERE email = ?",
        [data.email],
      );

      if (existing.length > 0) {
        return {
          success: false,
          error: "Email already exists",
        };
      }

      // Validate role_id exists
      const roleCheck = await query<RowDataPacket[]>(
        "SELECT id FROM roles WHERE id = ?",
        [data.role_id],
      );

      if (roleCheck.length === 0) {
        return {
          success: false,
          error: "Invalid role_id",
        };
      }

      // Hash password
      const passwordHash = await hashPassword(data.password);

      // Insert user
      const result = await query<ResultSetHeader>(
        "INSERT INTO users (name, email, password_hash, role_id, is_active) VALUES (?, ?, ?, ?, ?)",
        [
          data.name,
          data.email,
          passwordHash,
          data.role_id,
          data.is_active ?? true,
        ],
      );

      return {
        success: true,
        data: {
          id: result.insertId,
          name: data.name,
          email: data.email,
          role_id: data.role_id,
        },
        message: "User created successfully",
      };
    } catch (error) {
      console.error("Create user error:", error);
      return {
        success: false,
        error: "Failed to create user",
      };
    }
  }

  /**
   * Update user
   */
  static async updateUser(
    id: number,
    data: {
      name?: string;
      email?: string;
      password?: string;
      role_id?: number;
      is_active?: boolean;
    },
  ) {
    try {
      const updates: string[] = [];
      const values: any[] = [];

      if (data.name) {
        updates.push("name = ?");
        values.push(data.name);
      }
      if (data.email) {
        updates.push("email = ?");
        values.push(data.email);
      }
      if (data.password) {
        const passwordHash = await hashPassword(data.password);
        updates.push("password_hash = ?");
        values.push(passwordHash);
      }

      // Handle role_id update
      if (data.role_id !== undefined) {
        // Validate role_id exists
        const roleCheck = await query<RowDataPacket[]>(
          "SELECT id FROM roles WHERE id = ?",
          [data.role_id],
        );

        if (roleCheck.length === 0) {
          return {
            success: false,
            error: "Invalid role_id",
          };
        }

        updates.push("role_id = ?");
        values.push(data.role_id);
      }

      if (data.is_active !== undefined) {
        updates.push("is_active = ?");
        values.push(data.is_active);
      }

      if (updates.length === 0) {
        return {
          success: false,
          error: "No fields to update",
        };
      }

      values.push(id);
      await query(
        `UPDATE users SET ${updates.join(", ")} WHERE id = ?`,
        values,
      );

      return {
        success: true,
        message: "User updated successfully",
      };
    } catch (error) {
      console.error("Update user error:", error);
      return {
        success: false,
        error: "Failed to update user",
      };
    }
  }

  /**
   * Soft delete user
   */
  static async deleteUser(id: number, deletedBy: number) {
    try {
      // Check if user exists and is not already deleted
      const users = await query<RowDataPacket[]>(
        "SELECT id FROM users WHERE id = ? AND deleted_at IS NULL",
        [id],
      );

      if (users.length === 0) {
        return {
          success: false,
          error: "User not found or already deleted",
        };
      }

      // Soft delete the user
      await query(
        "UPDATE users SET deleted_at = NOW(), deleted_by = ? WHERE id = ?",
        [deletedBy, id],
      );

      return {
        success: true,
        message: "User deleted successfully",
      };
    } catch (error) {
      console.error("Delete user error:", error);
      return {
        success: false,
        error: "Failed to delete user",
      };
    }
  }

  /**
   * Restore soft-deleted user
   */
  static async restoreUser(id: number) {
    try {
      // Check if user exists and is deleted
      const users = await query<RowDataPacket[]>(
        "SELECT id FROM users WHERE id = ? AND deleted_at IS NOT NULL",
        [id],
      );

      if (users.length === 0) {
        return {
          success: false,
          error: "User not found or not deleted",
        };
      }

      // Restore the user
      await query(
        "UPDATE users SET deleted_at = NULL, deleted_by = NULL WHERE id = ?",
        [id],
      );

      return {
        success: true,
        message: "User restored successfully",
      };
    } catch (error) {
      console.error("Restore user error:", error);
      return {
        success: false,
        error: "Failed to restore user",
      };
    }
  }

  /**
   * Get all active roles for dropdown
   */
  static async getRoles() {
    try {
      const roles = await query<RowDataPacket[]>(
        "SELECT id, name, description FROM roles WHERE is_active = TRUE ORDER BY name",
      );

      return {
        success: true,
        data: roles,
      };
    } catch (error) {
      console.error("Get roles error:", error);
      return {
        success: false,
        error: "Failed to fetch roles",
      };
    }
  }

  /**
   * Change user password (for logged-in user)
   */
  static async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string,
  ) {
    try {
      // Get user's current password hash
      const users = await query<RowDataPacket[]>(
        "SELECT password_hash FROM users WHERE id = ? AND deleted_at IS NULL",
        [userId],
      );

      if (users.length === 0) {
        return {
          success: false,
          error: "User not found",
        };
      }

      const user = users[0];

      // Verify current password
      const isValidPassword = await comparePassword(
        currentPassword,
        user.password_hash,
      );

      if (!isValidPassword) {
        return {
          success: false,
          error: "Current password is incorrect",
        };
      }

      // Hash new password
      const newPasswordHash = await hashPassword(newPassword);

      // Update password
      await query(
        "UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?",
        [newPasswordHash, userId],
      );

      return {
        success: true,
        message: "Password changed successfully",
      };
    } catch (error) {
      console.error("Change password error:", error);
      return {
        success: false,
        error: "Failed to change password",
      };
    }
  }
}
