import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/middleware/auth.middleware";
import { AuditPartyController } from "@/controllers/auditParty.controller";
import { updateAuditPartySchema } from "@/validators/schemas";

// GET /api/audit-parties/[id] - Get audit party by ID
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
    const result = await AuditPartyController.getAuditPartyById(id);

    return NextResponse.json(result, {
      status: result.success ? 200 : 404,
    });
  } catch (error) {
    console.error("Get audit party API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PUT /api/audit-parties/[id] - Update audit party (Admin and Encoder)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAuthUser(request);

    if (!user || (user.role !== "Admin" && user.role !== "Encoder")) {
      return NextResponse.json(
        { success: false, error: "Admin or Encoder access required" },
        { status: 403 },
      );
    }

    const { id: paramId } = await params;
    const id = parseInt(paramId);
    const body = await request.json();

    // Validate input
    const validation = updateAuditPartySchema.safeParse(body);
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

    const result = await AuditPartyController.updateAuditParty(
      id,
      validation.data,
    );

    return NextResponse.json(result, {
      status: result.success ? 200 : 400,
    });
  } catch (error) {
    console.error("Update audit party API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE /api/audit-parties/[id] - Delete audit party (Admin only)
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
    const result = await AuditPartyController.deleteAuditParty(id);

    return NextResponse.json(result, {
      status: result.success ? 200 : 400,
    });
  } catch (error) {
    console.error("Delete audit party API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
