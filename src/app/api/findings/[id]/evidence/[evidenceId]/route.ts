import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/middleware/auth.middleware";
import { query } from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { unlink } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

// DELETE /api/findings/[id]/evidence/[evidenceId] - Delete an evidence file
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; evidenceId: string }> },
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    // Check if user has permission to delete
    if (!["Admin", "Encoder", "Auditor"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id, evidenceId } = await params;
    const findingId = parseInt(id);
    const attachmentId = parseInt(evidenceId);

    if (isNaN(findingId) || isNaN(attachmentId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    // Get attachment info
    const [attachment] = await query<RowDataPacket[]>(
      "SELECT * FROM attachments WHERE id = ? AND finding_id = ?",
      [attachmentId, findingId],
    );

    if (!attachment) {
      return NextResponse.json(
        { error: "Evidence not found" },
        { status: 404 },
      );
    }

    // Delete file from filesystem
    const filePath = path.join(process.cwd(), "public", attachment.file_path);
    if (existsSync(filePath)) {
      try {
        await unlink(filePath);
      } catch (error) {
        console.error("Error deleting file:", error);
        // Continue with database deletion even if file deletion fails
      }
    }

    // Delete from database
    await query<ResultSetHeader>("DELETE FROM attachments WHERE id = ?", [
      attachmentId,
    ]);

    return NextResponse.json(
      { success: true, message: "Evidence deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error(
      "DELETE /api/findings/[id]/evidence/[evidenceId] error:",
      error,
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
