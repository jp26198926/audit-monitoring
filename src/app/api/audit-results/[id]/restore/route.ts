import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { getAuthUser } from "@/middleware/auth.middleware";

interface AuditResult extends RowDataPacket {
  id: number;
  result_name: string;
  description: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export async function POST(
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

    // Check if audit result exists and is deleted
    const [existing] = await pool.query<AuditResult[]>(
      "SELECT id FROM audit_results WHERE id = ? AND deleted_at IS NOT NULL",
      [id],
    );

    if (existing.length === 0) {
      return NextResponse.json(
        { message: "Audit result not found or not deleted" },
        { status: 404 },
      );
    }

    // Restore the audit result
    await pool.query(
      "UPDATE audit_results SET deleted_at = NULL, deleted_by = NULL WHERE id = ?",
      [id],
    );

    return NextResponse.json({
      message: "Audit result restored successfully",
    });
  } catch (error) {
    console.error("Error restoring audit result:", error);
    return NextResponse.json(
      { message: "Failed to restore audit result" },
      { status: 500 },
    );
  }
}
