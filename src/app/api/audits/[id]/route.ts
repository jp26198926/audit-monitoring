import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/middleware/auth.middleware";
import { AuditController } from "@/controllers/audit.controller";
import { updateAuditSchema } from "@/validators/schemas";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { generateUniqueFilename } from "@/utils/helpers";

// GET /api/audits/[id] - Get audit by ID
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
    const id = parseInt(paramId);
    const result = await AuditController.getAuditById(id);

    return NextResponse.json(result, {
      status: result.success ? 200 : 404,
    });
  } catch (error) {
    console.error("Get audit API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PUT /api/audits/[id] - Update audit (Encoder, Admin)
export async function PUT(
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
    const id = parseInt(paramId);
    const contentType = request.headers.get("content-type") || "";

    // Handle file upload (multipart/form-data)
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File;

      if (!file) {
        return NextResponse.json(
          { success: false, error: "No file provided" },
          { status: 400 },
        );
      }

      // Validate file type
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ];

      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid file type. Only PDF, DOC, DOCX, XLS, XLSX allowed",
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

      // Generate unique filename
      const uniqueFilename = generateUniqueFilename(file.name);
      const filePath = path.join(uploadDir, uniqueFilename);

      // Save file
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filePath, buffer);

      // Update audit with file path
      const fileUrl = `/uploads/${uniqueFilename}`;
      const result = await AuditController.updateAudit(id, {
        report_file_path: fileUrl,
      });

      return NextResponse.json(result, {
        status: result.success ? 200 : 400,
      });
    }

    // Handle JSON update
    const body = await request.json();

    // Validate input
    const validation = updateAuditSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: validation.error.errors,
        },
        { status: 400 },
      );
    }

    const result = await AuditController.updateAudit(id, validation.data);

    return NextResponse.json(result, {
      status: result.success ? 200 : 400,
    });
  } catch (error) {
    console.error("Update audit API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE /api/audits/[id] - Soft delete audit (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAuthUser(request);

    if (!user || user.role !== "Admin") {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 },
      );
    }

    const { id: paramId } = await params;
    const id = parseInt(paramId);
    const result = await AuditController.deleteAudit(id, user.userId);

    return NextResponse.json(result, {
      status: result.success ? 200 : 400,
    });
  } catch (error) {
    console.error("Delete audit API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
