import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/middleware/auth.middleware";
import { AuditAttachmentController } from "@/controllers/auditAttachment.controller";
import { unlink } from "fs/promises";
import path from "path";

// DELETE /api/audits/[id]/attachments/[attachmentId] - Delete an attachment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; attachmentId: string }> },
) {
  try {
    const user = await getAuthUser(request);

    if (!user || !["Admin", "Encoder", "Auditor"].includes(user.role_name)) {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions" },
        { status: 403 },
      );
    }

    const { attachmentId: paramAttachmentId } = await params;
    const attachmentId = parseInt(paramAttachmentId);

    const result =
      await AuditAttachmentController.deleteAttachment(attachmentId);

    // Delete physical file if deletion was successful
    if (result.success && result.data?.file_path) {
      try {
        const filePath = path.join(
          process.cwd(),
          "public",
          result.data.file_path,
        );
        await unlink(filePath);
      } catch (error) {
        console.error("Failed to delete physical file:", error);
        // Continue even if file deletion fails
      }
    }

    return NextResponse.json(result, {
      status: result.success ? 200 : 400,
    });
  } catch (error) {
    console.error("Delete attachment API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
