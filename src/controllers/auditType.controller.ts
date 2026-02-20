import { query } from "@/lib/db";
import { AuditType } from "@/types";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export class AuditTypeController {
  /**
   * Get all audit types
   */
  static async getAllAuditTypes(
    activeOnly: boolean = false,
    includeDeleted: boolean = false,
  ) {
    try {
      let sql = "";
      if (activeOnly) {
        sql = includeDeleted
          ? "SELECT * FROM audit_types WHERE is_active = TRUE ORDER BY type_name"
          : "SELECT * FROM audit_types WHERE is_active = TRUE AND deleted_at IS NULL ORDER BY type_name";
      } else {
        sql = includeDeleted
          ? "SELECT * FROM audit_types ORDER BY type_name"
          : "SELECT * FROM audit_types WHERE deleted_at IS NULL ORDER BY type_name";
      }

      const types = await query<(AuditType & RowDataPacket)[]>(sql);

      return {
        success: true,
        data: types,
      };
    } catch (error) {
      console.error("Get audit types error:", error);
      return {
        success: false,
        error: "Failed to fetch audit types",
      };
    }
  }

  /**
   * Get audit type by ID
   */
  static async getAuditTypeById(id: number) {
    try {
      const types = await query<(AuditType & RowDataPacket)[]>(
        "SELECT * FROM audit_types WHERE id = ? AND deleted_at IS NULL",
        [id],
      );

      if (types.length === 0) {
        return {
          success: false,
          error: "Audit type not found",
        };
      }

      return {
        success: true,
        data: types[0],
      };
    } catch (error) {
      console.error("Get audit type error:", error);
      return {
        success: false,
        error: "Failed to fetch audit type",
      };
    }
  }

  /**
   * Create audit type
   */
  static async createAuditType(data: {
    type_name: string;
    description?: string;
    is_active?: boolean;
  }) {
    try {
      const result = await query<ResultSetHeader>(
        "INSERT INTO audit_types (type_name, description, is_active) VALUES (?, ?, ?)",
        [data.type_name, data.description || null, data.is_active ?? true],
      );

      return {
        success: true,
        data: { id: result.insertId },
        message: "Audit type created successfully",
      };
    } catch (error: any) {
      console.error("Create audit type error:", error);
      if (error.code === "ER_DUP_ENTRY") {
        return {
          success: false,
          error: "Audit type name already exists",
        };
      }
      return {
        success: false,
        error: "Failed to create audit type",
      };
    }
  }

  /**
   * Update audit type
   */
  static async updateAuditType(
    id: number,
    data: {
      type_name?: string;
      description?: string;
      is_active?: boolean;
    },
  ) {
    try {
      const updates: string[] = [];
      const values: any[] = [];

      if (data.type_name) {
        updates.push("type_name = ?");
        values.push(data.type_name);
      }
      if (data.description !== undefined) {
        updates.push("description = ?");
        values.push(data.description || null);
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
        `UPDATE audit_types SET ${updates.join(", ")} WHERE id = ?`,
        values,
      );

      return {
        success: true,
        message: "Audit type updated successfully",
      };
    } catch (error: any) {
      console.error("Update audit type error:", error);
      if (error.code === "ER_DUP_ENTRY") {
        return {
          success: false,
          error: "Audit type name already exists",
        };
      }
      return {
        success: false,
        error: "Failed to update audit type",
      };
    }
  }

  /**
   * Delete audit type (soft delete)
   */
  static async deleteAuditType(id: number, deletedBy: number) {
    try {
      // Check if audit type exists and is not already deleted
      const [auditType] = await query<RowDataPacket[]>(
        "SELECT id FROM audit_types WHERE id = ? AND deleted_at IS NULL",
        [id],
      );

      if (!auditType) {
        return {
          success: false,
          error: "Audit type not found or already deleted",
        };
      }

      // Soft delete the audit type
      await query(
        "UPDATE audit_types SET deleted_at = NOW(), deleted_by = ? WHERE id = ?",
        [deletedBy, id],
      );

      return {
        success: true,
        message: "Audit type deleted successfully",
      };
    } catch (error) {
      console.error("Delete audit type error:", error);
      return {
        success: false,
        error: "Failed to delete audit type",
      };
    }
  }

  /**
   * Restore deleted audit type
   */
  static async restoreAuditType(id: number) {
    try {
      // Check if audit type exists and is deleted
      const [auditType] = await query<RowDataPacket[]>(
        "SELECT id FROM audit_types WHERE id = ? AND deleted_at IS NOT NULL",
        [id],
      );

      if (!auditType) {
        return {
          success: false,
          error: "Audit type not found or not deleted",
        };
      }

      // Restore the audit type
      await query(
        "UPDATE audit_types SET deleted_at = NULL, deleted_by = NULL WHERE id = ?",
        [id],
      );

      return {
        success: true,
        message: "Audit type restored successfully",
      };
    } catch (error) {
      console.error("Restore audit type error:", error);
      return {
        success: false,
        error: "Failed to restore audit type",
      };
    }
  }
}
