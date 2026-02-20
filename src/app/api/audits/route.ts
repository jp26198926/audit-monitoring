import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/middleware/auth.middleware";
import { AuditController } from "@/controllers/audit.controller";
import { createAuditSchema } from "@/validators/schemas";

// GET /api/audits - List audits with filters
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);

    const filters = {
      vessel_id: searchParams.get("vessel_id")
        ? parseInt(searchParams.get("vessel_id")!)
        : undefined,
      audit_type_id: searchParams.get("audit_type_id")
        ? parseInt(searchParams.get("audit_type_id")!)
        : undefined,
      audit_party_id: searchParams.get("audit_party_id")
        ? parseInt(searchParams.get("audit_party_id")!)
        : undefined,
      status: searchParams.get("status") as any,
      date_from: searchParams.get("date_from") || undefined,
      date_to: searchParams.get("date_to") || undefined,
      page: searchParams.get("page") ? parseInt(searchParams.get("page")!) : 1,
      limit: searchParams.get("limit")
        ? parseInt(searchParams.get("limit")!)
        : 10,
      include_deleted: searchParams.get("include_deleted") === "true",
    };

    const result = await AuditController.getAllAudits(filters);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Get audits API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST /api/audits - Create audit (Encoder, Admin)
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);

    if (!user || !["Admin", "Encoder"].includes(user.role_name)) {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions" },
        { status: 403 },
      );
    }

    const body = await request.json();
    console.log("📝 Creating audit with data:", body);

    // Validate input
    const validation = createAuditSchema.safeParse(body);
    if (!validation.success) {
      console.error("❌ Validation failed:", validation.error.errors);
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: validation.error.errors,
        },
        { status: 400 },
      );
    }

    const result = await AuditController.createAudit(
      validation.data,
      user.userId,
    );

    return NextResponse.json(result, {
      status: result.success ? 201 : 400,
    });
  } catch (error) {
    console.error("Create audit API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
