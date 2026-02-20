import { query } from "@/lib/db";
import { AuditParty } from "@/types";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export class AuditPartyController {
  /**
   * Get all audit parties
   */
  static async getAllAuditParties(includeDeleted: boolean = false) {
    try {
      const sql = includeDeleted
        ? "SELECT * FROM audit_parties ORDER BY party_name"
        : "SELECT * FROM audit_parties WHERE deleted_at IS NULL ORDER BY party_name";

      const parties = await query<(AuditParty & RowDataPacket)[]>(sql);

      return {
        success: true,
        data: parties,
      };
    } catch (error) {
      console.error("Get audit parties error:", error);
      return {
        success: false,
        error: "Failed to fetch audit parties",
      };
    }
  }

  /**
   * Get audit party by ID
   */
  static async getAuditPartyById(id: number) {
    try {
      const parties = await query<(AuditParty & RowDataPacket)[]>(
        "SELECT * FROM audit_parties WHERE id = ? AND deleted_at IS NULL",
        [id],
      );

      if (parties.length === 0) {
        return {
          success: false,
          error: "Audit party not found",
        };
      }

      return {
        success: true,
        data: parties[0],
      };
    } catch (error) {
      console.error("Get audit party error:", error);
      return {
        success: false,
        error: "Failed to fetch audit party",
      };
    }
  }

  /**
   * Create audit party
   */
  static async createAuditParty(data: { party_name: string }) {
    try {
      const result = await query<ResultSetHeader>(
        "INSERT INTO audit_parties (party_name) VALUES (?)",
        [data.party_name],
      );

      return {
        success: true,
        data: { id: result.insertId },
        message: "Audit party created successfully",
      };
    } catch (error: any) {
      console.error("Create audit party error:", error);
      if (error.code === "ER_DUP_ENTRY") {
        return {
          success: false,
          error: "Audit party name already exists",
        };
      }
      return {
        success: false,
        error: "Failed to create audit party",
      };
    }
  }

  /**
   * Update audit party
   */
  static async updateAuditParty(id: number, data: { party_name?: string }) {
    try {
      // Build dynamic update query based on provided fields
      const updates: string[] = [];
      const values: any[] = [];

      if (data.party_name) {
        updates.push("party_name = ?");
        values.push(data.party_name);
      }

      if (updates.length === 0) {
        return {
          success: false,
          error: "No fields to update",
        };
      }

      values.push(id);
      await query(
        `UPDATE audit_parties SET ${updates.join(", ")} WHERE id = ?`,
        values,
      );

      return {
        success: true,
        message: "Audit party updated successfully",
      };
    } catch (error: any) {
      console.error("Update audit party error:", error);
      if (error.code === "ER_DUP_ENTRY") {
        return {
          success: false,
          error: "Audit party name already exists",
        };
      }
      return {
        success: false,
        error: "Failed to update audit party",
      };
    }
  }

  /**
   * Delete audit party (soft delete)
   */
  static async deleteAuditParty(id: number, deletedBy: number) {
    try {
      // Check if audit party exists and is not already deleted
      const [auditParty] = await query<RowDataPacket[]>(
        "SELECT id FROM audit_parties WHERE id = ? AND deleted_at IS NULL",
        [id],
      );

      if (!auditParty) {
        return {
          success: false,
          error: "Audit party not found or already deleted",
        };
      }

      // Soft delete the audit party
      await query(
        "UPDATE audit_parties SET deleted_at = NOW(), deleted_by = ? WHERE id = ?",
        [deletedBy, id],
      );

      return {
        success: true,
        message: "Audit party deleted successfully",
      };
    } catch (error) {
      console.error("Delete audit party error:", error);
      return {
        success: false,
        error: "Failed to delete audit party",
      };
    }
  }

  /**
   * Restore deleted audit party
   */
  static async restoreAuditParty(id: number) {
    try {
      // Check if audit party exists and is deleted
      const [auditParty] = await query<RowDataPacket[]>(
        "SELECT id FROM audit_parties WHERE id = ? AND deleted_at IS NOT NULL",
        [id],
      );

      if (!auditParty) {
        return {
          success: false,
          error: "Audit party not found or not deleted",
        };
      }

      // Restore the audit party
      await query(
        "UPDATE audit_parties SET deleted_at = NULL, deleted_by = NULL WHERE id = ?",
        [id],
      );

      return {
        success: true,
        message: "Audit party restored successfully",
      };
    } catch (error) {
      console.error("Restore audit party error:", error);
      return {
        success: false,
        error: "Failed to restore audit party",
      };
    }
  }
}
