import { query } from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export interface AuditAttachment {
  id: number;
  audit_id: number;
  file_path: string;
  file_name: string;
  file_type: string | null;
  file_size: number | null;
  uploaded_by: number;
  uploaded_at: Date | string;
  uploader_name?: string;
}

export class AuditAttachmentController {
  /**
   * Get all attachments for an audit
   */
  static async getAuditAttachments(auditId: number) {
    try {
      const attachments = await query<RowDataPacket[]>(
        `SELECT 
          aa.*,
          u.name as uploader_name
        FROM audit_attachments aa
        LEFT JOIN users u ON aa.uploaded_by = u.id
        WHERE aa.audit_id = ?
        ORDER BY aa.uploaded_at DESC`,
        [auditId],
      );

      return {
        success: true,
        data: attachments,
      };
    } catch (error) {
      console.error("Get audit attachments error:", error);
      return {
        success: false,
        error: "Failed to fetch attachments",
      };
    }
  }

  /**
   * Create a new attachment
   */
  static async createAttachment(data: {
    audit_id: number;
    file_path: string;
    file_name: string;
    file_type?: string;
    file_size?: number;
    uploaded_by: number;
  }) {
    try {
      const result = await query<ResultSetHeader>(
        `INSERT INTO audit_attachments 
          (audit_id, file_path, file_name, file_type, file_size, uploaded_by) 
        VALUES (?, ?, ?, ?, ?, ?)`,
        [
          data.audit_id,
          data.file_path,
          data.file_name,
          data.file_type || null,
          data.file_size || null,
          data.uploaded_by,
        ],
      );

      return {
        success: true,
        data: { id: result.insertId },
        message: "Attachment uploaded successfully",
      };
    } catch (error) {
      console.error("Create attachment error:", error);
      return {
        success: false,
        error: "Failed to upload attachment",
      };
    }
  }

  /**
   * Delete an attachment
   */
  static async deleteAttachment(id: number) {
    try {
      // Get file path before deletion for cleanup
      const [attachment] = await query<RowDataPacket[]>(
        `SELECT file_path FROM audit_attachments WHERE id = ?`,
        [id],
      );

      if (!attachment) {
        return {
          success: false,
          error: "Attachment not found",
        };
      }

      await query(`DELETE FROM audit_attachments WHERE id = ?`, [id]);

      return {
        success: true,
        data: { file_path: attachment.file_path },
        message: "Attachment deleted successfully",
      };
    } catch (error) {
      console.error("Delete attachment error:", error);
      return {
        success: false,
        error: "Failed to delete attachment",
      };
    }
  }

  /**
   * Get attachment by ID
   */
  static async getAttachmentById(id: number) {
    try {
      const [attachment] = await query<RowDataPacket[]>(
        `SELECT 
          aa.*,
          u.name as uploader_name
        FROM audit_attachments aa
        LEFT JOIN users u ON aa.uploaded_by = u.id
        WHERE aa.id = ?`,
        [id],
      );

      if (!attachment) {
        return {
          success: false,
          error: "Attachment not found",
        };
      }

      return {
        success: true,
        data: attachment,
      };
    } catch (error) {
      console.error("Get attachment error:", error);
      return {
        success: false,
        error: "Failed to fetch attachment",
      };
    }
  }
}
