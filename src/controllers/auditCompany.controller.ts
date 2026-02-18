import { query } from "@/lib/db";
import { AuditCompany } from "@/types";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export class AuditCompanyController {
  /**
   * Get all audit companies
   */
  static async getAllAuditCompanies(filters?: { active?: boolean }) {
    try {
      const conditions: string[] = [];
      const values: any[] = [];

      if (filters?.active !== undefined) {
        conditions.push("is_active = ?");
        values.push(filters.active);
      }

      const whereClause =
        conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

      const companies = await query<RowDataPacket[]>(
        `SELECT * FROM audit_companies ${whereClause} ORDER BY company_name ASC`,
        values,
      );

      return {
        success: true,
        data: companies,
      };
    } catch (error) {
      console.error("Get audit companies error:", error);
      return {
        success: false,
        error: "Failed to fetch audit companies",
      };
    }
  }

  /**
   * Get audit company by ID
   */
  static async getAuditCompanyById(id: number) {
    try {
      const [company] = await query<RowDataPacket[]>(
        "SELECT * FROM audit_companies WHERE id = ?",
        [id],
      );

      if (!company) {
        return {
          success: false,
          error: "Audit company not found",
        };
      }

      return {
        success: true,
        data: company,
      };
    } catch (error) {
      console.error("Get audit company error:", error);
      return {
        success: false,
        error: "Failed to fetch audit company",
      };
    }
  }

  /**
   * Create new audit company
   */
  static async createAuditCompany(data: {
    company_name: string;
    contact_person?: string;
    email?: string;
    phone?: string;
    address?: string;
    is_active?: boolean;
  }) {
    try {
      const result = await query<ResultSetHeader>(
        `INSERT INTO audit_companies 
          (company_name, contact_person, email, phone, address, is_active) 
        VALUES (?, ?, ?, ?, ?, ?)`,
        [
          data.company_name,
          data.contact_person || null,
          data.email || null,
          data.phone || null,
          data.address || null,
          data.is_active !== undefined ? data.is_active : true,
        ],
      );

      return {
        success: true,
        data: { id: result.insertId },
        message: "Audit company created successfully",
      };
    } catch (error: any) {
      console.error("Create audit company error:", error);
      if (error.code === "ER_DUP_ENTRY") {
        return {
          success: false,
          error: "Company name already exists",
        };
      }
      return {
        success: false,
        error: "Failed to create audit company",
      };
    }
  }

  /**
   * Update audit company
   */
  static async updateAuditCompany(
    id: number,
    data: {
      company_name?: string;
      contact_person?: string;
      email?: string;
      phone?: string;
      address?: string;
      is_active?: boolean;
    },
  ) {
    try {
      const updates: string[] = [];
      const values: any[] = [];

      if (data.company_name !== undefined) {
        updates.push("company_name = ?");
        values.push(data.company_name);
      }
      if (data.contact_person !== undefined) {
        updates.push("contact_person = ?");
        values.push(data.contact_person || null);
      }
      if (data.email !== undefined) {
        updates.push("email = ?");
        values.push(data.email || null);
      }
      if (data.phone !== undefined) {
        updates.push("phone = ?");
        values.push(data.phone || null);
      }
      if (data.address !== undefined) {
        updates.push("address = ?");
        values.push(data.address || null);
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
        `UPDATE audit_companies SET ${updates.join(", ")} WHERE id = ?`,
        values,
      );

      return {
        success: true,
        message: "Audit company updated successfully",
      };
    } catch (error: any) {
      console.error("Update audit company error:", error);
      if (error.code === "ER_DUP_ENTRY") {
        return {
          success: false,
          error: "Company name already exists",
        };
      }
      return {
        success: false,
        error: "Failed to update audit company",
      };
    }
  }

  /**
   * Delete audit company
   */
  static async deleteAuditCompany(id: number) {
    try {
      // Check if company is being used in any audits
      const [auditCount] = await query<RowDataPacket[]>(
        "SELECT COUNT(*) as count FROM audits WHERE audit_company_id = ?",
        [id],
      );

      if (auditCount.count > 0) {
        return {
          success: false,
          error: `Cannot delete company. It is being used in ${auditCount.count} audit(s)`,
        };
      }

      await query("DELETE FROM audit_companies WHERE id = ?", [id]);

      return {
        success: true,
        message: "Audit company deleted successfully",
      };
    } catch (error) {
      console.error("Delete audit company error:", error);
      return {
        success: false,
        error: "Failed to delete audit company",
      };
    }
  }
}
