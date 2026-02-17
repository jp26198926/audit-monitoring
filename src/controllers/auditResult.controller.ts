import { Request, Response } from "express";
import { getPool } from "@/lib/db";
import { ResultSetHeader, RowDataPacket } from "mysql2";

const pool = getPool();

interface AuditResult extends RowDataPacket {
  id: number;
  result_name: string;
  description: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export const getAllAuditResults = async (req: Request, res: Response) => {
  try {
    const [results] = await pool.query<AuditResult[]>(
      "SELECT * FROM audit_results ORDER BY result_name",
    );
    res.json(results);
  } catch (error) {
    console.error("Error fetching audit results:", error);
    res.status(500).json({ message: "Failed to fetch audit results" });
  }
};

export const getActiveAuditResults = async (req: Request, res: Response) => {
  try {
    const [results] = await pool.query<AuditResult[]>(
      "SELECT * FROM audit_results WHERE is_active = TRUE ORDER BY result_name",
    );
    res.json(results);
  } catch (error) {
    console.error("Error fetching active audit results:", error);
    res.status(500).json({ message: "Failed to fetch active audit results" });
  }
};

export const getAuditResultById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const [results] = await pool.query<AuditResult[]>(
      "SELECT * FROM audit_results WHERE id = ?",
      [id],
    );

    if (results.length === 0) {
      return res.status(404).json({ message: "Audit result not found" });
    }

    res.json(results[0]);
  } catch (error) {
    console.error("Error fetching audit result:", error);
    res.status(500).json({ message: "Failed to fetch audit result" });
  }
};

export const createAuditResult = async (req: Request, res: Response) => {
  try {
    const { result_name, description, is_active } = req.body;

    // Check for duplicate result_name
    const [existing] = await pool.query<AuditResult[]>(
      "SELECT id FROM audit_results WHERE result_name = ?",
      [result_name],
    );

    if (existing.length > 0) {
      return res
        .status(409)
        .json({ message: "Audit result name already exists" });
    }

    const [result] = await pool.query<ResultSetHeader>(
      "INSERT INTO audit_results (result_name, description, is_active) VALUES (?, ?, ?)",
      [
        result_name,
        description || null,
        is_active !== undefined ? is_active : true,
      ],
    );

    const [newResult] = await pool.query<AuditResult[]>(
      "SELECT * FROM audit_results WHERE id = ?",
      [result.insertId],
    );

    res.status(201).json(newResult[0]);
  } catch (error) {
    console.error("Error creating audit result:", error);
    res.status(500).json({ message: "Failed to create audit result" });
  }
};

export const updateAuditResult = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { result_name, description, is_active } = req.body;

    // Check if audit result exists
    const [existing] = await pool.query<AuditResult[]>(
      "SELECT id FROM audit_results WHERE id = ?",
      [id],
    );

    if (existing.length === 0) {
      return res.status(404).json({ message: "Audit result not found" });
    }

    // Check for duplicate result_name (excluding current record)
    const [duplicate] = await pool.query<AuditResult[]>(
      "SELECT id FROM audit_results WHERE result_name = ? AND id != ?",
      [result_name, id],
    );

    if (duplicate.length > 0) {
      return res
        .status(409)
        .json({ message: "Audit result name already exists" });
    }

    await pool.query(
      "UPDATE audit_results SET result_name = ?, description = ?, is_active = ? WHERE id = ?",
      [
        result_name,
        description || null,
        is_active !== undefined ? is_active : true,
        id,
      ],
    );

    const [updated] = await pool.query<AuditResult[]>(
      "SELECT * FROM audit_results WHERE id = ?",
      [id],
    );

    res.json(updated[0]);
  } catch (error) {
    console.error("Error updating audit result:", error);
    res.status(500).json({ message: "Failed to update audit result" });
  }
};

export const deleteAuditResult = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if audit result exists
    const [existing] = await pool.query<AuditResult[]>(
      "SELECT id FROM audit_results WHERE id = ?",
      [id],
    );

    if (existing.length === 0) {
      return res.status(404).json({ message: "Audit result not found" });
    }

    // Check if audit result is being used
    const [auditsUsing] = await pool.query<RowDataPacket[]>(
      "SELECT COUNT(*) as count FROM audits WHERE audit_result_id = ?",
      [id],
    );

    if (auditsUsing[0].count > 0) {
      return res.status(409).json({
        message:
          "Cannot delete audit result as it is being used by existing audits",
      });
    }

    await pool.query("DELETE FROM audit_results WHERE id = ?", [id]);

    res.json({ message: "Audit result deleted successfully" });
  } catch (error) {
    console.error("Error deleting audit result:", error);
    res.status(500).json({ message: "Failed to delete audit result" });
  }
};
