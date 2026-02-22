import { query } from "@/lib/db";
import { Finding, FindingCategory, FindingStatus } from "@/types";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import {
  getPaginationParams,
  shouldMarkAsOverdue,
  formatDate,
} from "@/utils/helpers";

export class FindingController {
  /**
   * Get all findings with filters and pagination
   */
  static async getAllFindings(filters?: {
    audit_id?: number;
    category?: FindingCategory;
    status?: FindingStatus;
    page?: number;
    limit?: number;
    includeDeleted?: boolean;
  }) {
    try {
      const conditions: string[] = [];
      const values: any[] = [];

      // Default: only show non-deleted findings
      if (!filters?.includeDeleted) {
        conditions.push("f.deleted_at IS NULL");
      }

      if (filters?.audit_id) {
        conditions.push("f.audit_id = ?");
        values.push(filters.audit_id);
      }
      if (filters?.category) {
        conditions.push("f.category = ?");
        values.push(filters.category);
      }
      if (filters?.status) {
        conditions.push("f.status = ?");
        values.push(filters.status);
      }

      const whereClause =
        conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

      // Ensure all numeric values in conditions are proper integers
      const sanitizedValues = values.map((v) => {
        if (typeof v === "string") {
          const parsed = parseInt(v, 10);
          return isNaN(parsed) ? v : parsed;
        }
        return typeof v === "number" ? Math.floor(v) : v;
      });

      // Get total count
      const countResult = await query<RowDataPacket[]>(
        `SELECT COUNT(*) as total FROM findings f ${whereClause}`,
        sanitizedValues,
      );
      const total = countResult[0].total;

      // Get paginated results
      const pagination = getPaginationParams(filters?.page, filters?.limit);

      // Ensure limit and offset are integers (not NaN or undefined)
      const limit = Math.floor(pagination.limit) || 10;
      const offset = Math.floor(pagination.offset) || 0;

      // Ensure all numeric values are proper integers for MySQL
      const queryParams = [...sanitizedValues, limit, offset];

      const findings = await query<RowDataPacket[]>(
        `SELECT
        f.*,
        a.audit_reference,
        v.vessel_name,
        at.type_name as audit_type_name
      FROM findings f
      LEFT JOIN audits a ON f.audit_id = a.id
      LEFT JOIN vessels v ON a.vessel_id = v.id
      LEFT JOIN audit_types at ON a.audit_type_id = at.id
      ${whereClause}
      ORDER BY f.created_at DESC
      `,
        values,
      );

      return {
        success: true,
        data: findings,
        pagination: {
          total,
          page: filters?.page || 1,
          limit: pagination.limit,
          totalPages: Math.ceil(total / pagination.limit),
        },
      };
    } catch (error) {
      console.error("Get findings error:", error);
      console.error("Get findings error details:", {
        message: error instanceof Error ? error.message : "Unknown error",
        filters,
      });
      return {
        success: false,
        // error: "Failed to fetch findings",
        error: error,
      };
    }
  }

  /**
   * Get finding by ID with attachments
   */
  static async getFindingById(id: number) {
    try {
      const findings = await query<RowDataPacket[]>(
        `SELECT 
          f.*,
          a.audit_reference,
          v.vessel_name,
          at.type_name as audit_type_name
        FROM findings f
        LEFT JOIN audits a ON f.audit_id = a.id
        LEFT JOIN vessels v ON a.vessel_id = v.id
        LEFT JOIN audit_types at ON a.audit_type_id = at.id
        WHERE f.id = ? AND f.deleted_at IS NULL`,
        [id],
      );

      if (findings.length === 0) {
        return {
          success: false,
          error: "Finding not found",
        };
      }

      // Get attachments
      const attachments = await query<RowDataPacket[]>(
        `SELECT a.*, u.name as uploaded_by_name
        FROM attachments a
        LEFT JOIN users u ON a.uploaded_by = u.id
        WHERE a.finding_id = ?`,
        [id],
      );

      return {
        success: true,
        data: {
          ...findings[0],
          attachments,
        },
      };
    } catch (error) {
      console.error("Get finding error:", error);
      return {
        success: false,
        error: "Failed to fetch finding",
      };
    }
  }

  /**
   * Create finding
   */
  static async createFinding(data: {
    audit_id: number;
    category: FindingCategory;
    description: string;
    root_cause?: string | null;
    corrective_action?: string | null;
    responsible_person?: string | null;
    target_date: string;
    status?: FindingStatus;
  }) {
    try {
      // Check if should be marked as overdue immediately
      const status = shouldMarkAsOverdue(
        data.target_date,
        data.status || "Open",
      )
        ? "Overdue"
        : data.status || "Open";

      const result = await query<ResultSetHeader>(
        `INSERT INTO findings 
        (audit_id, category, description, root_cause, corrective_action, 
         responsible_person, target_date, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.audit_id,
          data.category,
          data.description,
          data.root_cause || null,
          data.corrective_action || null,
          data.responsible_person || null,
          data.target_date,
          status,
        ],
      );

      return {
        success: true,
        data: { id: result.insertId },
        message: "Finding created successfully",
      };
    } catch (error) {
      console.error("Create finding error:", error);
      return {
        success: false,
        error: "Failed to create finding",
      };
    }
  }

  /**
   * Update finding
   */
  static async updateFinding(
    id: number,
    data: {
      category?: FindingCategory;
      description?: string;
      root_cause?: string | null;
      corrective_action?: string | null;
      responsible_person?: string | null;
      target_date?: string;
      status?: FindingStatus;
    },
  ) {
    try {
      const updates: string[] = [];
      const values: any[] = [];

      if (data.category) {
        updates.push("category = ?");
        values.push(data.category);
      }
      if (data.description) {
        updates.push("description = ?");
        values.push(data.description);
      }
      if (data.root_cause !== undefined) {
        updates.push("root_cause = ?");
        values.push(data.root_cause);
      }
      if (data.corrective_action !== undefined) {
        updates.push("corrective_action = ?");
        values.push(data.corrective_action);
      }
      if (data.responsible_person !== undefined) {
        updates.push("responsible_person = ?");
        values.push(data.responsible_person);
      }
      if (data.target_date) {
        updates.push("target_date = ?");
        values.push(data.target_date);
      }
      if (data.status) {
        updates.push("status = ?");
        values.push(data.status);
      }

      if (updates.length === 0) {
        return {
          success: false,
          error: "No fields to update",
        };
      }

      values.push(id);
      await query(
        `UPDATE findings SET ${updates.join(", ")} WHERE id = ?`,
        values,
      );

      return {
        success: true,
        message: "Finding updated successfully",
      };
    } catch (error) {
      console.error("Update finding error:", error);
      return {
        success: false,
        error: "Failed to update finding",
      };
    }
  }

  /**
   * Close finding
   */
  static async closeFinding(id: number) {
    try {
      const closureDate = formatDate(new Date());

      await query(
        "UPDATE findings SET status = ?, closure_date = ? WHERE id = ?",
        ["Closed", closureDate, id],
      );

      return {
        success: true,
        message: "Finding closed successfully",
      };
    } catch (error) {
      console.error("Close finding error:", error);
      return {
        success: false,
        error: "Failed to close finding",
      };
    }
  }

  /**
   * Reopen finding (Admin only)
   */
  static async reopenFinding(id: number) {
    try {
      // Get current finding to check target date
      const findings = await query<(Finding & RowDataPacket)[]>(
        "SELECT target_date FROM findings WHERE id = ?",
        [id],
      );

      if (findings.length === 0) {
        return {
          success: false,
          error: "Finding not found",
        };
      }

      const status = shouldMarkAsOverdue(findings[0].target_date, "Open")
        ? "Overdue"
        : "Open";

      await query(
        "UPDATE findings SET status = ?, closure_date = NULL WHERE id = ?",
        [status, id],
      );

      return {
        success: true,
        message: "Finding reopened successfully",
      };
    } catch (error) {
      console.error("Reopen finding error:", error);
      return {
        success: false,
        error: "Failed to reopen finding",
      };
    }
  }

  /**
   * Delete finding (soft delete)
   */
  static async deleteFinding(id: number, deletedBy: number) {
    try {
      // Check if finding exists and is not already deleted
      const [finding] = await query<RowDataPacket[]>(
        "SELECT id FROM findings WHERE id = ? AND deleted_at IS NULL",
        [id],
      );

      if (!finding) {
        return {
          success: false,
          error: "Finding not found or already deleted",
        };
      }

      // Soft delete the finding
      await query(
        "UPDATE findings SET deleted_at = NOW(), deleted_by = ? WHERE id = ?",
        [deletedBy, id],
      );

      return {
        success: true,
        message: "Finding deleted successfully",
      };
    } catch (error) {
      console.error("Delete finding error:", error);
      return {
        success: false,
        error: "Failed to delete finding",
      };
    }
  }

  /**
   * Restore deleted finding
   */
  static async restoreFinding(id: number) {
    try {
      // Check if finding exists and is deleted
      const [finding] = await query<RowDataPacket[]>(
        "SELECT id FROM findings WHERE id = ? AND deleted_at IS NOT NULL",
        [id],
      );

      if (!finding) {
        return {
          success: false,
          error: "Finding not found or not deleted",
        };
      }

      // Restore the finding
      await query(
        "UPDATE findings SET deleted_at = NULL, deleted_by = NULL WHERE id = ?",
        [id],
      );

      return {
        success: true,
        message: "Finding restored successfully",
      };
    } catch (error) {
      console.error("Restore finding error:", error);
      return {
        success: false,
        error: "Failed to restore finding",
      };
    }
  }

  /**
   * Add attachment to finding
   */
  static async addAttachment(
    findingId: number,
    filePath: string,
    uploadedBy: number,
  ) {
    try {
      const result = await query<ResultSetHeader>(
        "INSERT INTO attachments (finding_id, file_path, uploaded_by) VALUES (?, ?, ?)",
        [findingId, filePath, uploadedBy],
      );

      return {
        success: true,
        data: { id: result.insertId },
        message: "Attachment uploaded successfully",
      };
    } catch (error) {
      console.error("Add attachment error:", error);
      return {
        success: false,
        error: "Failed to upload attachment",
      };
    }
  }

  /**
   * Update overdue findings (called by cron job)
   */
  static async updateOverdueFindings() {
    try {
      const today = formatDate(new Date());

      const result = await query<ResultSetHeader>(
        `UPDATE findings 
        SET status = 'Overdue' 
        WHERE target_date < ? 
        AND status NOT IN ('Closed', 'Overdue')`,
        [today],
      );

      return {
        success: true,
        data: { updatedCount: result.affectedRows },
      };
    } catch (error) {
      console.error("Update overdue findings error:", error);
      return {
        success: false,
        error: "Failed to update overdue findings",
      };
    }
  }
}
