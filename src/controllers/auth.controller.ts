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
      // Find user by email
      const users = await query<(User & RowDataPacket)[]>(
        "SELECT * FROM users WHERE email = ? AND is_active = TRUE",
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
        role: user.role,
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
            role: user.role,
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
        "SELECT id, name, email, role, is_active, created_at FROM users WHERE id = ?",
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
