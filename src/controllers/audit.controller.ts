import { query } from "@/lib/db";
import { Audit, AuditStatus, AuditResult } from "@/types";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { getPaginationParams } from "@/utils/helpers";

export class AuditController {
  /**
   * Get all audits with filters and pagination
   */
  static async getAllAudits(filters?: {
    vessel_id?: number;
    audit_type_id?: number;
    audit_party_id?: number;
    status?: AuditStatus;
    date_from?: string;
    date_to?: string;
    page?: number;
    limit?: number;
  }) {
    try {
      const conditions: string[] = [];
      const values: any[] = [];

      if (filters?.vessel_id) {
        conditions.push("a.vessel_id = ?");
        values.push(filters.vessel_id);
      }
      if (filters?.audit_type_id) {
        conditions.push("a.audit_type_id = ?");
        values.push(filters.audit_type_id);
      }
      if (filters?.audit_party_id) {
        conditions.push("a.audit_party_id = ?");
        values.push(filters.audit_party_id);
      }
      if (filters?.status) {
        conditions.push("a.status = ?");
        values.push(filters.status);
      }
      if (filters?.date_from) {
        conditions.push("a.audit_start_date >= ?");
        values.push(filters.date_from);
      }
      if (filters?.date_to) {
        conditions.push("a.audit_start_date <= ?");
        values.push(filters.date_to);
      }

      const whereClause =
        conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

      // Get total count
      const countResult = await query<RowDataPacket[]>(
        `SELECT COUNT(*) as total FROM audits a ${whereClause}`,
        values,
      );
      const total = countResult[0].total;

      // Get paginated results
      const pagination = getPaginationParams(filters?.page, filters?.limit);
      const audits = await query<RowDataPacket[]>(
        `SELECT 
          a.*,
          v.vessel_name,
          v.registration_number,
          at.type_name as audit_type_name,
          ap.party_name as audit_party_name,
          ar.result_name,
          u.name as created_by_name,
          (SELECT COUNT(*) FROM findings WHERE audit_id = a.id) as findings_count
        FROM audits a
        LEFT JOIN vessels v ON a.vessel_id = v.id
        LEFT JOIN audit_types at ON a.audit_type_id = at.id
        LEFT JOIN audit_parties ap ON a.audit_party_id = ap.id
        LEFT JOIN audit_results ar ON a.audit_result_id = ar.id
        LEFT JOIN users u ON a.created_by = u.id
        ${whereClause}
        ORDER BY a.created_at DESC
        LIMIT ? OFFSET ?`,
        [...values, pagination.limit, pagination.offset],
      );

      return {
        success: true,
        data: audits,
        pagination: {
          total,
          page: filters?.page || 1,
          limit: pagination.limit,
          totalPages: Math.ceil(total / pagination.limit),
        },
      };
    } catch (error) {
      console.error("Get audits error:", error);
      return {
        success: false,
        error: "Failed to fetch audits",
      };
    }
  }

  /**
   * Get audit by ID with details
   */
  static async getAuditById(id: number) {
    try {
      const audits = await query<RowDataPacket[]>(
        `SELECT 
          a.*,
          v.vessel_name,
          v.registration_number,
          at.type_name as audit_type_name,
          ap.party_name as audit_party_name,
          ar.result_name,
          u.name as created_by_name
        FROM audits a
        LEFT JOIN vessels v ON a.vessel_id = v.id
        LEFT JOIN audit_types at ON a.audit_type_id = at.id
        LEFT JOIN audit_parties ap ON a.audit_party_id = ap.id
        LEFT JOIN audit_results ar ON a.audit_result_id = ar.id
        LEFT JOIN users u ON a.created_by = u.id
        WHERE a.id = ?`,
        [id],
      );

      if (audits.length === 0) {
        return {
          success: false,
          error: "Audit not found",
        };
      }

      // Get findings for this audit
      const findings = await query<RowDataPacket[]>(
        "SELECT * FROM findings WHERE audit_id = ? ORDER BY created_at DESC",
        [id],
      );

      return {
        success: true,
        data: {
          ...audits[0],
          findings,
        },
      };
    } catch (error) {
      console.error("Get audit error:", error);
      return {
        success: false,
        error: "Failed to fetch audit",
      };
    }
  }

  /**
   * Create audit
   */
  static async createAudit(
    data: {
      vessel_id: number;
      audit_type_id: number;
      audit_party_id: number;
      audit_reference?: string;
      audit_start_date: string;
      audit_end_date?: string | null;
      next_due_date?: string | null;
      location?: string | null;
      status?: AuditStatus;
      audit_result_id?: number | null;
      remarks?: string | null;
    },
    createdBy: number,
  ) {
    try {
      console.log("📝 Creating audit with data:", {
        vessel_id: data.vessel_id,
        audit_type_id: data.audit_type_id,
        audit_party_id: data.audit_party_id,
        audit_reference: data.audit_reference || null,
        audit_start_date: data.audit_start_date,
        audit_end_date: data.audit_end_date || null,
        next_due_date: data.next_due_date || null,
        location: data.location || null,
        status: data.status || "Planned",
        audit_result_id: data.audit_result_id || null,
        remarks: data.remarks || null,
        created_by: createdBy,
      });

      // Insert audit first to get the ID
      const result = await query<ResultSetHeader>(
        `INSERT INTO audits 
        (vessel_id, audit_type_id, audit_party_id, audit_reference, audit_start_date, 
         audit_end_date, next_due_date, location, status, audit_result_id, remarks, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.vessel_id,
          data.audit_type_id,
          data.audit_party_id,
          data.audit_reference || null,
          data.audit_start_date,
          data.audit_end_date || null,
          data.next_due_date || null,
          data.location || null,
          data.status || "Planned",
          data.audit_result_id || null,
          data.remarks || null,
          createdBy,
        ],
      );

      const auditId = result.insertId;

      // Auto-generate audit_reference if not provided
      // Format: AUD-[YY]-00000 (5-digit left-padded ID)
      if (!data.audit_reference) {
        const currentYear = new Date().getFullYear().toString().slice(-2);
        const generatedReference = `AUD-${currentYear}-${auditId.toString().padStart(5, "0")}`;

        // Update the audit with the generated reference
        await query(`UPDATE audits SET audit_reference = ? WHERE id = ?`, [
          generatedReference,
          auditId,
        ]);

        return {
          success: true,
          data: { id: auditId, audit_reference: generatedReference },
          message: "Audit created successfully",
        };
      }

      return {
        success: true,
        data: { id: auditId, audit_reference: data.audit_reference },
        message: "Audit created successfully",
      };
    } catch (error: any) {
      console.error("❌ Create audit error - Full details:", {
        message: error.message,
        code: error.code,
        sqlState: error.sqlState,
        sqlMessage: error.sqlMessage,
        sql: error.sql,
        errno: error.errno,
      });

      if (error.code === "ER_DUP_ENTRY") {
        return {
          success: false,
          error: "Audit reference already exists",
        };
      }

      // Return more specific error message
      return {
        success: false,
        error: error.sqlMessage || error.message || "Failed to create audit",
      };
    }
  }

  /**
   * Update audit
   */
  static async updateAudit(
    id: number,
    data: {
      vessel_id?: number;
      audit_type_id?: number;
      audit_party_id?: number;
      audit_reference?: string;
      audit_start_date?: string;
      audit_end_date?: string | null;
      next_due_date?: string | null;
      location?: string | null;
      status?: AuditStatus;
      audit_result_id?: number | null;
      remarks?: string | null;
    },
  ) {
    try {
      const updates: string[] = [];
      const values: any[] = [];

      if (data.vessel_id) {
        updates.push("vessel_id = ?");
        values.push(data.vessel_id);
      }
      if (data.audit_type_id) {
        updates.push("audit_type_id = ?");
        values.push(data.audit_type_id);
      }
      if (data.audit_party_id) {
        updates.push("audit_party_id = ?");
        values.push(data.audit_party_id);
      }
      if (data.audit_reference) {
        updates.push("audit_reference = ?");
        values.push(data.audit_reference);
      }
      if (data.audit_start_date) {
        updates.push("audit_start_date = ?");
        values.push(data.audit_start_date);
      }
      if (data.audit_end_date !== undefined) {
        updates.push("audit_end_date = ?");
        values.push(data.audit_end_date);
      }
      if (data.next_due_date !== undefined) {
        updates.push("next_due_date = ?");
        values.push(data.next_due_date);
      }
      if (data.location !== undefined) {
        updates.push("location = ?");
        values.push(data.location);
      }
      if (data.status) {
        updates.push("status = ?");
        values.push(data.status);
      }
      if (data.audit_result_id !== undefined) {
        updates.push("audit_result_id = ?");
        values.push(data.audit_result_id);
      }
      if (data.remarks !== undefined) {
        updates.push("remarks = ?");
        values.push(data.remarks);
      }

      if (updates.length === 0) {
        return {
          success: false,
          error: "No fields to update",
        };
      }

      values.push(id);
      await query(
        `UPDATE audits SET ${updates.join(", ")} WHERE id = ?`,
        values,
      );

      return {
        success: true,
        message: "Audit updated successfully",
      };
    } catch (error: any) {
      console.error("Update audit error:", error);
      if (error.code === "ER_DUP_ENTRY") {
        return {
          success: false,
          error: "Audit reference already exists",
        };
      }
      return {
        success: false,
        error: "Failed to update audit",
      };
    }
  }

  /**
   * Delete audit (Admin only)
   */
  static async deleteAudit(id: number) {
    try {
      // Findings will be cascade deleted due to foreign key constraint
      await query("DELETE FROM audits WHERE id = ?", [id]);

      return {
        success: true,
        message: "Audit deleted successfully",
      };
    } catch (error) {
      console.error("Delete audit error:", error);
      return {
        success: false,
        error: "Failed to delete audit",
      };
    }
  }

  /**
   * Upload audit report
   */
  static async uploadAuditReport(id: number, filePath: string) {
    try {
      await query("UPDATE audits SET report_file_path = ? WHERE id = ?", [
        filePath,
        id,
      ]);

      return {
        success: true,
        message: "Audit report uploaded successfully",
      };
    } catch (error) {
      console.error("Upload audit report error:", error);
      return {
        success: false,
        error: "Failed to upload audit report",
      };
    }
  }
}
