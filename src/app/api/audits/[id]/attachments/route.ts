import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/middleware/auth.middleware";
import { AuditAttachmentController } from "@/controllers/auditAttachment.controller";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { generateUniqueFilename } from "@/utils/helpers";

// GET /api/audits/[id]/attachments - Get all attachments for an audit
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAuthUser(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      );
    }

    const { id: paramId } = await params;
    const auditId = parseInt(paramId);

    const result = await AuditAttachmentController.getAuditAttachments(auditId);

    return NextResponse.json(result, {
      status: result.success ? 200 : 400,
    });
  } catch (error) {
    console.error("Get audit attachments API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST /api/audits/[id]/attachments - Upload attachments
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAuthUser(request);

    if (!user || !["Admin", "Encoder", "Auditor"].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions" },
        { status: 403 },
      );
    }

    const { id: paramId } = await params;
    const auditId = parseInt(paramId);

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: "No files provided" },
        { status: 400 },
      );
    }

    // Validate file types
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "image/jpeg",
      "image/png",
      "image/jpg",
    ];

    const invalidFiles = files.filter(
      (file) => !allowedTypes.includes(file.type),
    );
    if (invalidFiles.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid file type(s). Only PDF, DOC, DOCX, XLS, XLSX, JPG, PNG allowed",
        },
        { status: 400 },
      );
    }

    // Create upload directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    // Upload all files and create records
    const uploadedFiles = [];
    for (const file of files) {
      try {
        // Generate unique filename
        const uniqueFilename = generateUniqueFilename(file.name);
        const filePath = path.join(uploadDir, uniqueFilename);

        // Save file
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filePath, buffer);

        // Create database record
        const fileUrl = `/uploads/${uniqueFilename}`;
        const result = await AuditAttachmentController.createAttachment({
          audit_id: auditId,
          file_path: fileUrl,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          uploaded_by: user.userId,
        });

        if (result.success) {
          uploadedFiles.push({
            id: result.data?.id,
            file_name: file.name,
            file_path: fileUrl,
          });
        }
      } catch (error) {
        console.error(`Failed to upload file ${file.name}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      data: uploadedFiles,
      message: `${uploadedFiles.length} file(s) uploaded successfully`,
    });
  } catch (error) {
    console.error("Upload attachments API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
