import { query } from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export class PermissionController {
  /**
   * Get all permissions
   */
  static async getAllPermissions() {
    try {
      const permissions = await query<RowDataPacket[]>(
        "SELECT * FROM permissions ORDER BY name",
      );

      return {
        success: true,
        data: permissions,
      };
    } catch (error) {
      console.error("Get permissions error:", error);
      return {
        success: false,
        error: "Failed to fetch permissions",
      };
    }
  }

  /**
   * Get permission by ID
   */
  static async getPermissionById(id: number) {
    try {
      const permissions = await query<RowDataPacket[]>(
        "SELECT * FROM permissions WHERE id = ?",
        [id],
      );

      if (permissions.length === 0) {
        return {
          success: false,
          error: "Permission not found",
        };
      }

      return {
        success: true,
        data: permissions[0],
      };
    } catch (error) {
      console.error("Get permission error:", error);
      return {
        success: false,
        error: "Failed to fetch permission",
      };
    }
  }

  /**
   * Create permission
   */
  static async createPermission(data: { name: string; description?: string }) {
    try {
      // Check for duplicate
      const existing = await query<RowDataPacket[]>(
        "SELECT id FROM permissions WHERE name = ?",
        [data.name],
      );

      if (existing.length > 0) {
        return {
          success: false,
          error: "Permission name already exists",
        };
      }

      const result = await query<ResultSetHeader>(
        "INSERT INTO permissions (name, description) VALUES (?, ?)",
        [data.name, data.description || null],
      );

      const newPermission = await query<RowDataPacket[]>(
        "SELECT * FROM permissions WHERE id = ?",
        [result.insertId],
      );

      return {
        success: true,
        data: newPermission[0],
      };
    } catch (error) {
      console.error("Create permission error:", error);
      return {
        success: false,
        error: "Failed to create permission",
      };
    }
  }

  /**
   * Update permission
   */
  static async updatePermission(
    id: number,
    data: {
      name?: string;
      description?: string;
    },
  ) {
    try {
      // Check if exists
      const existing = await query<RowDataPacket[]>(
        "SELECT id FROM permissions WHERE id = ?",
        [id],
      );

      if (existing.length === 0) {
        return {
          success: false,
          error: "Permission not found",
        };
      }

      // Check for duplicate name
      if (data.name) {
        const duplicate = await query<RowDataPacket[]>(
          "SELECT id FROM permissions WHERE name = ? AND id != ?",
          [data.name, id],
        );

        if (duplicate.length > 0) {
          return {
            success: false,
            error: "Permission name already exists",
          };
        }
      }

      const updates: string[] = [];
      const values: any[] = [];

      if (data.name !== undefined) {
        updates.push("name = ?");
        values.push(data.name);
      }
      if (data.description !== undefined) {
        updates.push("description = ?");
        values.push(data.description);
      }

      if (updates.length === 0) {
        return {
          success: false,
          error: "No fields to update",
        };
      }

      values.push(id);

      await query(
        `UPDATE permissions SET ${updates.join(", ")} WHERE id = ?`,
        values,
      );

      const updated = await query<RowDataPacket[]>(
        "SELECT * FROM permissions WHERE id = ?",
        [id],
      );

      return {
        success: true,
        data: updated[0],
      };
    } catch (error) {
      console.error("Update permission error:", error);
      return {
        success: false,
        error: "Failed to update permission",
      };
    }
  }

  /**
   * Delete permission
   */
  static async deletePermission(id: number) {
    try {
      const existing = await query<RowDataPacket[]>(
        "SELECT id FROM permissions WHERE id = ?",
        [id],
      );

      if (existing.length === 0) {
        return {
          success: false,
          error: "Permission not found",
        };
      }

      await query("DELETE FROM permissions WHERE id = ?", [id]);

      return {
        success: true,
        message: "Permission deleted successfully",
      };
    } catch (error) {
      console.error("Delete permission error:", error);
      return {
        success: false,
        error: "Failed to delete permission",
      };
    }
  }
}
