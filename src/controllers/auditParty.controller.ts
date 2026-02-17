import { query } from "@/lib/db";
import { AuditParty } from "@/types";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export class AuditPartyController {
  /**
   * Get all audit parties
   */
  static async getAllAuditParties() {
    try {
      const parties = await query<(AuditParty & RowDataPacket)[]>(
        "SELECT * FROM audit_parties ORDER BY party_name",
      );

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
        "SELECT * FROM audit_parties WHERE id = ?",
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
   * Delete audit party
   */
  static async deleteAuditParty(id: number) {
    try {
      // Check if audit party is used in audits
      const audits = await query<RowDataPacket[]>(
        "SELECT id FROM audits WHERE audit_party_id = ? LIMIT 1",
        [id],
      );

      if (audits.length > 0) {
        return {
          success: false,
          error: "Cannot delete audit party with existing audits",
        };
      }

      await query("DELETE FROM audit_parties WHERE id = ?", [id]);

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
}
