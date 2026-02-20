import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { getAuthUser } from "@/middleware/auth.middleware";

interface AuditResult extends RowDataPacket {
  id: number;
  result_name: string;
  description: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAuthUser(req);

    if (!user) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 },
      );
    }

    const pool = getPool();
    const { id } = await params;

    const [results] = await pool.query<AuditResult[]>(
      "SELECT * FROM audit_results WHERE id = ? AND deleted_at IS NULL",
      [id],
    );

    if (results.length === 0) {
      return NextResponse.json(
        { message: "Audit result not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(results[0]);
  } catch (error) {
    console.error("Error fetching audit result:", error);
    return NextResponse.json(
      { message: "Failed to fetch audit result" },
      { status: 500 },
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAuthUser(req);

    if (!user || (user.role_name !== "Admin" && user.role_name !== "Encoder")) {
      return NextResponse.json(
        { message: "Admin or Encoder access required" },
        { status: 403 },
      );
    }

    const pool = getPool();
    const { id } = await params;
    const body = await req.json();
    const { result_name, description, is_active } = body;

    // Check if audit result exists
    const [existing] = await pool.query<AuditResult[]>(
      "SELECT id FROM audit_results WHERE id = ?",
      [id],
    );

    if (existing.length === 0) {
      return NextResponse.json(
        { message: "Audit result not found" },
        { status: 404 },
      );
    }

    // Check for duplicate result_name (excluding current record)
    const [duplicate] = await pool.query<AuditResult[]>(
      "SELECT id FROM audit_results WHERE result_name = ? AND id != ?",
      [result_name, id],
    );

    if (duplicate.length > 0) {
      return NextResponse.json(
        { message: "Audit result name already exists" },
        { status: 409 },
      );
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

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error("Error updating audit result:", error);
    return NextResponse.json(
      { message: "Failed to update audit result" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAuthUser(req);

    if (!user || user.role_name !== "Admin") {
      return NextResponse.json(
        { message: "Admin access required" },
        { status: 403 },
      );
    }

    const pool = getPool();
    const { id } = await params;

    // Check if audit result exists and is not already deleted
    const [existing] = await pool.query<AuditResult[]>(
      "SELECT id FROM audit_results WHERE id = ? AND deleted_at IS NULL",
      [id],
    );

    if (existing.length === 0) {
      return NextResponse.json(
        { message: "Audit result not found or already deleted" },
        { status: 404 },
      );
    }

    // Soft delete the audit result
    await pool.query(
      "UPDATE audit_results SET deleted_at = NOW(), deleted_by = ? WHERE id = ?",
      [user.userId, id],
    );

    return NextResponse.json({ message: "Audit result deleted successfully" });
  } catch (error) {
    console.error("Error deleting audit result:", error);
    return NextResponse.json(
      { message: "Failed to delete audit result" },
      { status: 500 },
    );
  }
}
