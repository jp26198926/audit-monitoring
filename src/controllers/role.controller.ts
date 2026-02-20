import { query } from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export class RoleController {
  /**
   * Get all roles
   */
  static async getAllRoles(filters?: { is_active?: boolean }) {
    try {
      let sql = "SELECT * FROM roles";
      const conditions: string[] = [];
      const values: any[] = [];

      if (filters?.is_active !== undefined) {
        conditions.push("is_active = ?");
        values.push(filters.is_active);
      }

      if (conditions.length > 0) {
        sql += " WHERE " + conditions.join(" AND ");
      }

      sql += " ORDER BY name";

      const roles = await query<RowDataPacket[]>(sql, values);

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
   * Get role by ID with permissions
   */
  static async getRoleById(id: number) {
    try {
      const roles = await query<RowDataPacket[]>(
        "SELECT * FROM roles WHERE id = ?",
        [id],
      );

      if (roles.length === 0) {
        return {
          success: false,
          error: "Role not found",
        };
      }

      // Get role permissions
      const permissions = await query<RowDataPacket[]>(
        `SELECT 
          rp.*,
          p.name as page_name,
          p.path as page_path,
          perm.name as permission_name
        FROM role_permissions rp
        LEFT JOIN pages p ON rp.page_id = p.id
        LEFT JOIN permissions perm ON rp.permission_id = perm.id
        WHERE rp.role_id = ?
        ORDER BY p.display_order, p.name, perm.name`,
        [id],
      );

      return {
        success: true,
        data: {
          ...roles[0],
          permissions,
        },
      };
    } catch (error) {
      console.error("Get role error:", error);
      return {
        success: false,
        error: "Failed to fetch role",
      };
    }
  }

  /**
   * Create role
   */
  static async createRole(data: {
    name: string;
    description?: string;
    is_active?: boolean;
  }) {
    try {
      // Check for duplicate
      const existing = await query<RowDataPacket[]>(
        "SELECT id FROM roles WHERE name = ?",
        [data.name],
      );

      if (existing.length > 0) {
        return {
          success: false,
          error: "Role name already exists",
        };
      }

      const result = await query<ResultSetHeader>(
        "INSERT INTO roles (name, description, is_active) VALUES (?, ?, ?)",
        [
          data.name,
          data.description || null,
          data.is_active !== undefined ? data.is_active : true,
        ],
      );

      const newRole = await query<RowDataPacket[]>(
        "SELECT * FROM roles WHERE id = ?",
        [result.insertId],
      );

      return {
        success: true,
        data: newRole[0],
      };
    } catch (error) {
      console.error("Create role error:", error);
      return {
        success: false,
        error: "Failed to create role",
      };
    }
  }

  /**
   * Update role
   */
  static async updateRole(
    id: number,
    data: {
      name?: string;
      description?: string;
      is_active?: boolean;
    },
  ) {
    try {
      // Check if exists
      const existing = await query<RowDataPacket[]>(
        "SELECT id FROM roles WHERE id = ?",
        [id],
      );

      if (existing.length === 0) {
        return {
          success: false,
          error: "Role not found",
        };
      }

      // Check for duplicate name
      if (data.name) {
        const duplicate = await query<RowDataPacket[]>(
          "SELECT id FROM roles WHERE name = ? AND id != ?",
          [data.name, id],
        );

        if (duplicate.length > 0) {
          return {
            success: false,
            error: "Role name already exists",
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
        `UPDATE roles SET ${updates.join(", ")} WHERE id = ?`,
        values,
      );

      const updated = await query<RowDataPacket[]>(
        "SELECT * FROM roles WHERE id = ?",
        [id],
      );

      return {
        success: true,
        data: updated[0],
      };
    } catch (error) {
      console.error("Update role error:", error);
      return {
        success: false,
        error: "Failed to update role",
      };
    }
  }

  /**
   * Delete role
   */
  static async deleteRole(id: number) {
    try {
      const existing = await query<RowDataPacket[]>(
        "SELECT id FROM roles WHERE id = ?",
        [id],
      );

      if (existing.length === 0) {
        return {
          success: false,
          error: "Role not found",
        };
      }

      await query("DELETE FROM roles WHERE id = ?", [id]);

      return {
        success: true,
        message: "Role deleted successfully",
      };
    } catch (error) {
      console.error("Delete role error:", error);
      return {
        success: false,
        error: "Failed to delete role",
      };
    }
  }

  /**
   * Assign permissions to role
   */
  static async assignPermissions(
    roleId: number,
    permissions: Array<{ page_id: number; permission_id: number }>,
  ) {
    try {
      // Check if role exists
      const role = await query<RowDataPacket[]>(
        "SELECT id FROM roles WHERE id = ?",
        [roleId],
      );

      if (role.length === 0) {
        return {
          success: false,
          error: "Role not found",
        };
      }

      // Delete existing permissions
      await query("DELETE FROM role_permissions WHERE role_id = ?", [roleId]);

      // Insert new permissions
      if (permissions.length > 0) {
        // Build placeholders for bulk insert: (?, ?, ?), (?, ?, ?), ...
        const placeholders = permissions.map(() => "(?, ?, ?)").join(", ");

        // Flatten the values array
        const values: any[] = [];
        permissions.forEach((p) => {
          values.push(roleId, p.page_id, p.permission_id);
        });

        await query(
          `INSERT INTO role_permissions (role_id, page_id, permission_id) VALUES ${placeholders}`,
          values,
        );
      }

      return {
        success: true,
        message: "Permissions assigned successfully",
      };
    } catch (error) {
      console.error("Assign permissions error:", error);
      return {
        success: false,
        error: "Failed to assign permissions",
      };
    }
  }

  /**
   * Get all role permissions
   */
  static async getAllRolePermissions() {
    try {
      const rolePermissions = await query<RowDataPacket[]>(
        `SELECT 
          rp.*,
          r.name as role_name,
          p.name as page_name,
          p.path as page_path,
          perm.name as permission_name
        FROM role_permissions rp
        LEFT JOIN roles r ON rp.role_id = r.id
        LEFT JOIN pages p ON rp.page_id = p.id
        LEFT JOIN permissions perm ON rp.permission_id = perm.id
        ORDER BY r.name, p.display_order, p.name, perm.name`,
      );

      return {
        success: true,
        data: rolePermissions,
      };
    } catch (error) {
      console.error("Get role permissions error:", error);
      return {
        success: false,
        error: "Failed to fetch role permissions",
      };
    }
  }
}
