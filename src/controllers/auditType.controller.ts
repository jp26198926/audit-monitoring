import { query } from "@/lib/db";
import { AuditType } from "@/types";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export class AuditTypeController {
  /**
   * Get all audit types
   */
  static async getAllAuditTypes(activeOnly: boolean = false) {
    try {
      const sql = activeOnly
        ? "SELECT * FROM audit_types WHERE is_active = TRUE ORDER BY type_name"
        : "SELECT * FROM audit_types ORDER BY type_name";

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
        "SELECT * FROM audit_types WHERE id = ?",
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
   * Delete audit type
   */
  static async deleteAuditType(id: number) {
    try {
      // Check if audit type is used in audits
      const audits = await query<RowDataPacket[]>(
        "SELECT id FROM audits WHERE audit_type_id = ? LIMIT 1",
        [id],
      );

      if (audits.length > 0) {
        return {
          success: false,
          error: "Cannot delete audit type with existing audits",
        };
      }

      await query("DELETE FROM audit_types WHERE id = ?", [id]);

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
}
