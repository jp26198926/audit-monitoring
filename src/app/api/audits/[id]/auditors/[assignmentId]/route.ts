import { NextRequest, NextResponse } from "next/server";
import { AuditorController } from "@/controllers/auditor.controller";
import { updateAuditorRoleSchema } from "@/validators/schemas";
import { getAuthUser } from "@/middleware/auth.middleware";

// PUT /api/audits/[id]/auditors/[assignmentId] - Update auditor role
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; assignmentId: string }> },
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
    if (!["Admin", "Encoder"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { assignmentId } = await params;
    const assignId = parseInt(assignmentId);

    if (isNaN(assignId)) {
      return NextResponse.json(
        { error: "Invalid assignment ID" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const validatedData = updateAuditorRoleSchema.parse(body);

    const result = await AuditorController.updateAuditorAssignment(
      assignId,
      validatedData,
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === "Assignment not found" ? 404 : 400 },
      );
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("PUT /api/audits/[id]/auditors/[assignmentId] error:", error);
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

// DELETE /api/audits/[id]/auditors/[assignmentId] - Remove auditor from audit
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; assignmentId: string }> },
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
    if (!["Admin", "Encoder"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { assignmentId } = await params;
    const assignId = parseInt(assignmentId);

    if (isNaN(assignId)) {
      return NextResponse.json(
        { error: "Invalid assignment ID" },
        { status: 400 },
      );
    }

    const result = await AuditorController.removeAuditorFromAudit(assignId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === "Assignment not found" ? 404 : 500 },
      );
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error(
      "DELETE /api/audits/[id]/auditors/[assignmentId] error:",
      error,
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
