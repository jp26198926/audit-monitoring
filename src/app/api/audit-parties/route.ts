import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/middleware/auth.middleware";
import { AuditPartyController } from "@/controllers/auditParty.controller";
import { createAuditPartySchema } from "@/validators/schemas";

// GET /api/audit-parties - List all audit parties
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
    const includeDeleted = searchParams.get("includeDeleted") === "true";

    const result =
      await AuditPartyController.getAllAuditParties(includeDeleted);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Get audit parties API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST /api/audit-parties - Create audit party (Admin and Encoder)
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);

    if (!user || (user.role_name !== "Admin" && user.role_name !== "Encoder")) {
      return NextResponse.json(
        { success: false, error: "Admin or Encoder access required" },
        { status: 403 },
      );
    }

    const body = await request.json();

    // Validate input
    const validation = createAuditPartySchema.safeParse(body);
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

    const result = await AuditPartyController.createAuditParty(validation.data);

    return NextResponse.json(result, {
      status: result.success ? 201 : 400,
    });
  } catch (error) {
    console.error("Create audit party API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
