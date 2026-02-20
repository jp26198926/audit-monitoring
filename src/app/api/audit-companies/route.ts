import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/middleware/auth.middleware";
import { AuditCompanyController } from "@/controllers/auditCompany.controller";
import { createAuditCompanySchema } from "@/validators/schemas";

// GET /api/audit-companies - Get all audit companies
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
    const active = searchParams.get("active");
    const includeDeleted = searchParams.get("includeDeleted");

    const filters = {
      ...(active !== null && { active: active === "true" }),
      ...(includeDeleted !== null && {
        includeDeleted: includeDeleted === "true",
      }),
    };

    const result = await AuditCompanyController.getAllAuditCompanies(filters);

    return NextResponse.json(result, {
      status: result.success ? 200 : 400,
    });
  } catch (error) {
    console.error("Get audit companies API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST /api/audit-companies - Create audit company (Admin, Encoder)
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

    // Validate input
    const validation = createAuditCompanySchema.safeParse(body);
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

    const result = await AuditCompanyController.createAuditCompany(
      validation.data,
    );

    return NextResponse.json(result, {
      status: result.success ? 201 : 400,
    });
  } catch (error) {
    console.error("Create audit company API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
