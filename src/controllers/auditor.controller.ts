import { query } from "@/lib/db";
import { Auditor, AuditAuditor } from "@/types";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export class AuditorController {
  /**
   * Get all auditors with optional filters
   */
  static async getAllAuditors(filters?: {
    active?: boolean;
    company_id?: number;
  }) {
    try {
      const conditions: string[] = [];
      const values: any[] = [];

      if (filters?.active !== undefined) {
        conditions.push("a.is_active = ?");
        values.push(filters.active);
      }

      if (filters?.company_id) {
        conditions.push("a.audit_company_id = ?");
        values.push(filters.company_id);
      }

      const whereClause =
        conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

      const auditors = await query<RowDataPacket[]>(
        `SELECT a.*, 
          c.company_name as company_name
        FROM auditors a
        LEFT JOIN audit_companies c ON a.audit_company_id = c.id
        ${whereClause} 
        ORDER BY a.auditor_name ASC`,
        values,
      );

      return {
        success: true,
        data: auditors,
      };
    } catch (error) {
      console.error("Get auditors error:", error);
      return {
        success: false,
        error: "Failed to fetch auditors",
      };
    }
  }

  /**
   * Get auditor by ID
   */
  static async getAuditorById(id: number) {
    try {
      const [auditor] = await query<RowDataPacket[]>(
        `SELECT a.*, 
          c.company_name as company_name
        FROM auditors a
        LEFT JOIN audit_companies c ON a.audit_company_id = c.id
        WHERE a.id = ?`,
        [id],
      );

      if (!auditor) {
        return {
          success: false,
          error: "Auditor not found",
        };
      }

      return {
        success: true,
        data: auditor,
      };
    } catch (error) {
      console.error("Get auditor error:", error);
      return {
        success: false,
        error: "Failed to fetch auditor",
      };
    }
  }

  /**
   * Create new auditor
   */
  static async createAuditor(data: {
    audit_company_id: number;
    auditor_name: string;
    certification?: string;
    email?: string;
    phone?: string;
    specialization?: string;
    is_active?: boolean;
  }) {
    try {
      // Check if company exists
      const [company] = await query<RowDataPacket[]>(
        "SELECT id FROM audit_companies WHERE id = ?",
        [data.audit_company_id],
      );

      if (!company) {
        return {
          success: false,
          error: "Audit company not found",
        };
      }

      const result = await query<ResultSetHeader>(
        `INSERT INTO auditors 
          (audit_company_id, auditor_name, certification, email, phone, specialization, is_active) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          data.audit_company_id,
          data.auditor_name,
          data.certification || null,
          data.email || null,
          data.phone || null,
          data.specialization || null,
          data.is_active !== undefined ? data.is_active : true,
        ],
      );

      return {
        success: true,
        data: { id: result.insertId },
        message: "Auditor created successfully",
      };
    } catch (error: any) {
      console.error("Create auditor error:", error);
      return {
        success: false,
        error: error.message || "Failed to create auditor",
      };
    }
  }

  /**
   * Update auditor
   */
  static async updateAuditor(
    id: number,
    data: Partial<{
      audit_company_id: number;
      auditor_name: string;
      certification: string;
      email: string;
      phone: string;
      specialization: string;
      is_active: boolean;
    }>,
  ) {
    try {
      // Check if auditor exists
      const [existing] = await query<RowDataPacket[]>(
        "SELECT id FROM auditors WHERE id = ?",
        [id],
      );

      if (!existing) {
        return {
          success: false,
          error: "Auditor not found",
        };
      }

      // Check if company exists if company_id is being updated
      if (data.audit_company_id) {
        const [company] = await query<RowDataPacket[]>(
          "SELECT id FROM audit_companies WHERE id = ?",
          [data.audit_company_id],
        );

        if (!company) {
          return {
            success: false,
            error: "Audit company not found",
          };
        }
      }

      const fields: string[] = [];
      const values: any[] = [];

      if (data.audit_company_id !== undefined) {
        fields.push("audit_company_id = ?");
        values.push(data.audit_company_id);
      }
      if (data.auditor_name !== undefined) {
        fields.push("auditor_name = ?");
        values.push(data.auditor_name);
      }
      if (data.certification !== undefined) {
        fields.push("certification = ?");
        values.push(data.certification || null);
      }
      if (data.email !== undefined) {
        fields.push("email = ?");
        values.push(data.email || null);
      }
      if (data.phone !== undefined) {
        fields.push("phone = ?");
        values.push(data.phone || null);
      }
      if (data.specialization !== undefined) {
        fields.push("specialization = ?");
        values.push(data.specialization || null);
      }
      if (data.is_active !== undefined) {
        fields.push("is_active = ?");
        values.push(data.is_active);
      }

      if (fields.length === 0) {
        return {
          success: false,
          error: "No fields to update",
        };
      }

      values.push(id);

      await query(
        `UPDATE auditors SET ${fields.join(", ")} WHERE id = ?`,
        values,
      );

      return {
        success: true,
        message: "Auditor updated successfully",
      };
    } catch (error: any) {
      console.error("Update auditor error:", error);
      return {
        success: false,
        error: error.message || "Failed to update auditor",
      };
    }
  }

  /**
   * Delete auditor
   */
  static async deleteAuditor(id: number) {
    try {
      // Check if auditor is assigned to any audits
      const [assignments] = await query<RowDataPacket[]>(
        "SELECT COUNT(*) as count FROM audit_auditors WHERE auditor_id = ?",
        [id],
      );

      if (assignments.count > 0) {
        return {
          success: false,
          error: `Cannot delete auditor. They are assigned to ${assignments.count} audit(s).`,
        };
      }

      const result = await query<ResultSetHeader>(
        "DELETE FROM auditors WHERE id = ?",
        [id],
      );

      if (result.affectedRows === 0) {
        return {
          success: false,
          error: "Auditor not found",
        };
      }

      return {
        success: true,
        message: "Auditor deleted successfully",
      };
    } catch (error) {
      console.error("Delete auditor error:", error);
      return {
        success: false,
        error: "Failed to delete auditor",
      };
    }
  }

  /**
   * Get auditors assigned to an audit
   */
  static async getAuditAuditors(auditId: number) {
    try {
      const auditors = await query<RowDataPacket[]>(
        `SELECT aa.*, 
          a.auditor_name, a.certification, a.email, a.phone, a.specialization,
          c.company_name
        FROM audit_auditors aa
        INNER JOIN auditors a ON aa.auditor_id = a.id
        LEFT JOIN audit_companies c ON a.audit_company_id = c.id
        WHERE aa.audit_id = ?
        ORDER BY aa.role ASC, a.auditor_name ASC`,
        [auditId],
      );

      return {
        success: true,
        data: auditors,
      };
    } catch (error) {
      console.error("Get audit auditors error:", error);
      return {
        success: false,
        error: "Failed to fetch audit auditors",
      };
    }
  }

  /**
   * Assign auditor to audit
   */
  static async assignAuditorToAudit(data: {
    audit_id: number;
    auditor_id: number;
    role?: string;
  }) {
    try {
      // Check if audit exists
      const [audit] = await query<RowDataPacket[]>(
        "SELECT id FROM audits WHERE id = ?",
        [data.audit_id],
      );

      if (!audit) {
        return {
          success: false,
          error: "Audit not found",
        };
      }

      // Check if auditor exists
      const [auditor] = await query<RowDataPacket[]>(
        "SELECT id FROM auditors WHERE id = ?",
        [data.auditor_id],
      );

      if (!auditor) {
        return {
          success: false,
          error: "Auditor not found",
        };
      }

      // Check if already assigned
      const [existing] = await query<RowDataPacket[]>(
        "SELECT id FROM audit_auditors WHERE audit_id = ? AND auditor_id = ?",
        [data.audit_id, data.auditor_id],
      );

      if (existing) {
        return {
          success: false,
          error: "Auditor is already assigned to this audit",
        };
      }

      const result = await query<ResultSetHeader>(
        `INSERT INTO audit_auditors (audit_id, auditor_id, role) 
        VALUES (?, ?, ?)`,
        [data.audit_id, data.auditor_id, data.role || "Auditor"],
      );

      return {
        success: true,
        data: { id: result.insertId },
        message: "Auditor assigned successfully",
      };
    } catch (error: any) {
      console.error("Assign auditor error:", error);
      return {
        success: false,
        error: error.message || "Failed to assign auditor",
      };
    }
  }

  /**
   * Update auditor assignment role
   */
  static async updateAuditorAssignment(
    assignmentId: number,
    data: { role: string },
  ) {
    try {
      const result = await query<ResultSetHeader>(
        "UPDATE audit_auditors SET role = ? WHERE id = ?",
        [data.role, assignmentId],
      );

      if (result.affectedRows === 0) {
        return {
          success: false,
          error: "Assignment not found",
        };
      }

      return {
        success: true,
        message: "Auditor role updated successfully",
      };
    } catch (error) {
      console.error("Update auditor assignment error:", error);
      return {
        success: false,
        error: "Failed to update auditor assignment",
      };
    }
  }

  /**
   * Remove auditor from audit
   */
  static async removeAuditorFromAudit(assignmentId: number) {
    try {
      const result = await query<ResultSetHeader>(
        "DELETE FROM audit_auditors WHERE id = ?",
        [assignmentId],
      );

      if (result.affectedRows === 0) {
        return {
          success: false,
          error: "Assignment not found",
        };
      }

      return {
        success: true,
        message: "Auditor removed from audit successfully",
      };
    } catch (error) {
      console.error("Remove auditor error:", error);
      return {
        success: false,
        error: "Failed to remove auditor",
      };
    }
  }
}
