import { query } from "@/lib/db";
import { comparePassword, generateToken } from "@/lib/auth";
import { User } from "@/types";
import { RowDataPacket } from "mysql2";

export class AuthController {
  /**
   * Login user
   */
  static async login(email: string, password: string) {
    try {
      // Find user by email with role information
      const users = await query<(User & RowDataPacket)[]>(
        `SELECT u.*, r.name as role_name 
         FROM users u
         INNER JOIN roles r ON u.role_id = r.id
         WHERE u.email = ? AND u.is_active = TRUE`,
        [email],
      );

      if (users.length === 0) {
        return {
          success: false,
          error: "Invalid email or password",
        };
      }

      const user = users[0];

      // Verify password
      const isValidPassword = await comparePassword(
        password,
        user.password_hash,
      );

      if (!isValidPassword) {
        return {
          success: false,
          error: "Invalid email or password",
        };
      }

      // Generate JWT token
      const token = generateToken({
        userId: user.id,
        email: user.email,
        role_id: user.role_id,
        role_name: user.role_name!,
        name: user.name,
      });

      return {
        success: true,
        data: {
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role_id: user.role_id,
            role_name: user.role_name,
          },
        },
      };
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        error: "Login failed",
      };
    }
  }

  /**
   * Get current user details
   */
  static async getCurrentUser(userId: number) {
    try {
      const users = await query<(User & RowDataPacket)[]>(
        `SELECT u.id, u.name, u.email, u.role_id, r.name as role_name, u.is_active, u.created_at 
         FROM users u
         INNER JOIN roles r ON u.role_id = r.id
         WHERE u.id = ?`,
        [userId],
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
      console.error("Get current user error:", error);
      return {
        success: false,
        error: "Failed to get user details",
      };
    }
  }
}
