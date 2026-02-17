import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

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
    const pool = getPool();
    const searchParams = req.nextUrl.searchParams;
    const activeOnly = searchParams.get("active");

    let query = "SELECT * FROM audit_results";
    if (activeOnly === "true") {
      query += " WHERE is_active = TRUE";
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
