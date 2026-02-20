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

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);

    if (!user) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 },
      );
    }

    const pool = getPool();
    const searchParams = req.nextUrl.searchParams;
    const activeOnly = searchParams.get("active");
    const includeDeleted = searchParams.get("includeDeleted");

    let query = "SELECT * FROM audit_results";
    const conditions: string[] = [];

    // Default: only show non-deleted results
    if (includeDeleted !== "true") {
      conditions.push("deleted_at IS NULL");
    }

    if (activeOnly === "true") {
      conditions.push("is_active = TRUE");
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY result_name";

    const [results] = await pool.query<AuditResult[]>(query);
    return NextResponse.json(results);
  } catch (error) {
    console.error("Error fetching audit results:", error);
    return NextResponse.json(
      { message: "Failed to fetch audit results" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);

    if (!user || (user.role_name !== "Admin" && user.role_name !== "Encoder")) {
      return NextResponse.json(
        { message: "Admin or Encoder access required" },
        { status: 403 },
      );
    }

    const pool = getPool();
    const body = await req.json();
    const { result_name, description, is_active } = body;

    // Check for duplicate result_name
    const [existing] = await pool.query<AuditResult[]>(
      "SELECT id FROM audit_results WHERE result_name = ?",
      [result_name],
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { message: "Audit result name already exists" },
        { status: 409 },
      );
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

    return NextResponse.json(newResult[0], { status: 201 });
  } catch (error) {
    console.error("Error creating audit result:", error);
    return NextResponse.json(
      { message: "Failed to create audit result" },
      { status: 500 },
    );
  }
}
