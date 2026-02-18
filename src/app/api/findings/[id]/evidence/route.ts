import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/middleware/auth.middleware";
import { query } from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

// GET /api/findings/[id]/evidence - Get all evidence for a finding
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const { id } = await params;
    const findingId = parseInt(id);

    if (isNaN(findingId)) {
      return NextResponse.json(
        { error: "Invalid finding ID" },
        { status: 400 },
      );
    }

    // Get attachments with uploader info
    const attachments = await query<RowDataPacket[]>(
      `SELECT a.*, u.name as uploader_name 
       FROM attachments a
       LEFT JOIN users u ON a.uploaded_by = u.id
       WHERE a.finding_id = ?
       ORDER BY a.uploaded_at DESC`,
      [findingId],
    );

    return NextResponse.json(
      { success: true, data: attachments },
      { status: 200 },
    );
  } catch (error) {
    console.error("GET /api/findings/[id]/evidence error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST /api/findings/[id]/evidence - Upload evidence files
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    // Check if user has permission to upload
    if (!["Admin", "Encoder", "Auditor"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const findingId = parseInt(id);

    if (isNaN(findingId)) {
      return NextResponse.json(
        { error: "Invalid finding ID" },
        { status: 400 },
      );
    }

    // Verify finding exists
    const [finding] = await query<RowDataPacket[]>(
      "SELECT id FROM findings WHERE id = ?",
      [findingId],
    );

    if (!finding) {
      return NextResponse.json({ error: "Finding not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    // Create upload directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), "public", "uploads", "findings");
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const uploadedFiles = [];

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Generate unique filename
      const timestamp = Date.now();
      const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const fileName = `finding_${findingId}_${timestamp}_${originalName}`;
      const filePath = path.join(uploadDir, fileName);

      // Write file
      await writeFile(filePath, buffer);

      // Save to database
      const result = await query<ResultSetHeader>(
        `INSERT INTO attachments (finding_id, file_path, uploaded_by) 
         VALUES (?, ?, ?)`,
        [findingId, `/uploads/findings/${fileName}`, user.userId],
      );

      uploadedFiles.push({
        id: result.insertId,
        file_name: originalName,
        file_path: `/uploads/findings/${fileName}`,
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: `${files.length} file(s) uploaded successfully`,
        data: uploadedFiles,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("POST /api/findings/[id]/evidence error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
