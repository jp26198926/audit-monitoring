import { NextRequest, NextResponse } from "next/server";
import { AuditorController } from "@/controllers/auditor.controller";
import { assignAuditorSchema } from "@/validators/schemas";
import { getAuthUser } from "@/middleware/auth.middleware";

// GET /api/audits/[id]/auditors - Get auditors for an audit
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
    const auditId = parseInt(id);

    if (isNaN(auditId)) {
      return NextResponse.json({ error: "Invalid audit ID" }, { status: 400 });
    }

    const result = await AuditorController.getAuditAuditors(auditId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result.data, { status: 200 });
  } catch (error) {
    console.error("GET /api/audits/[id]/auditors error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST /api/audits/[id]/auditors - Assign auditor to audit
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

    // Check if user has Admin or Encoder role
    if (!["Admin", "Encoder"].includes(user.role_name)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const auditId = parseInt(id);

    if (isNaN(auditId)) {
      return NextResponse.json({ error: "Invalid audit ID" }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = assignAuditorSchema.parse({
      ...body,
      audit_id: auditId,
    });

    const result = await AuditorController.assignAuditorToAudit(validatedData);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        {
          status: result.error?.includes("not found")
            ? 404
            : result.error?.includes("already assigned")
              ? 409
              : 400,
        },
      );
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/audits/[id]/auditors error:", error);
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
