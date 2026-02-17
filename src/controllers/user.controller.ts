import { query } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { User } from "@/types";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export class UserController {
  /**
   * Get all users
   */
  static async getAllUsers() {
    try {
      const users = await query<(User & RowDataPacket)[]>(
        "SELECT id, name, email, role, is_active, created_at, updated_at FROM users ORDER BY created_at DESC",
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
  static async getUserById(id: number) {
    try {
      const users = await query<(User & RowDataPacket)[]>(
        "SELECT id, name, email, role, is_active, created_at, updated_at FROM users WHERE id = ?",
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
    role: "Admin" | "Encoder" | "Viewer";
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

      // Hash password
      const passwordHash = await hashPassword(data.password);

      // Insert user
      const result = await query<ResultSetHeader>(
        "INSERT INTO users (name, email, password_hash, role, is_active) VALUES (?, ?, ?, ?, ?)",
        [
          data.name,
          data.email,
          passwordHash,
          data.role,
          data.is_active ?? true,
        ],
      );

      return {
        success: true,
        data: {
          id: result.insertId,
          name: data.name,
          email: data.email,
          role: data.role,
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
      role?: "Admin" | "Encoder" | "Viewer";
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
      if (data.role) {
        updates.push("role = ?");
        values.push(data.role);
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
   * Delete user
   */
  static async deleteUser(id: number) {
    try {
      await query("DELETE FROM users WHERE id = ?", [id]);

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
}
