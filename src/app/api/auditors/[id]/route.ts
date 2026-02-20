import { NextRequest, NextResponse } from "next/server";
import { AuditorController } from "@/controllers/auditor.controller";
import { updateAuditorSchema } from "@/validators/schemas";
import { getAuthUser } from "@/middleware/auth.middleware";

// GET /api/auditors/[id] - Get auditor by ID
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
    const auditorId = parseInt(id);

    if (isNaN(auditorId)) {
      return NextResponse.json(
        { error: "Invalid auditor ID" },
        { status: 400 },
      );
    }

    const result = await AuditorController.getAuditorById(auditorId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === "Auditor not found" ? 404 : 500 },
      );
    }

    return NextResponse.json(result.data, { status: 200 });
  } catch (error) {
    console.error("GET /api/auditors/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PUT /api/auditors/[id] - Update auditor
export async function PUT(
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

    // Check if user has Admin or Encoder role
    if (!["Admin", "Encoder"].includes(user.role_name)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const auditorId = parseInt(id);

    if (isNaN(auditorId)) {
      return NextResponse.json(
        { error: "Invalid auditor ID" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const validatedData = updateAuditorSchema.parse(body);

    const result = await AuditorController.updateAuditor(
      auditorId,
      validatedData,
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error?.includes("not found") ? 404 : 400 },
      );
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("PUT /api/auditors/[id] error:", error);
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE /api/auditors/[id] - Delete auditor
export async function DELETE(
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

    // Check if user has Admin or Encoder role
    if (!["Admin", "Encoder"].includes(user.role_name)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const auditorId = parseInt(id);

    if (isNaN(auditorId)) {
      return NextResponse.json(
        { error: "Invalid auditor ID" },
        { status: 400 },
      );
    }

    const result = await AuditorController.deleteAuditor(
      auditorId,
      user.userId,
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        {
          status:
            result.error === "Auditor not found"
              ? 404
              : result.error?.includes("Cannot delete")
                ? 409
                : 500,
        },
      );
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("DELETE /api/auditors/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
