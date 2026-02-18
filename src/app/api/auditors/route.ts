import { NextRequest, NextResponse } from "next/server";
import { AuditorController } from "@/controllers/auditor.controller";
import { createAuditorSchema } from "@/validators/schemas";
import { getAuthUser } from "@/middleware/auth.middleware";

// GET /api/auditors - Get all auditors
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const active = searchParams.get("active");
    const company_id = searchParams.get("company_id");

    const filters: any = {};
    if (active !== null) {
      filters.active = active === "true";
    }
    if (company_id) {
      filters.company_id = parseInt(company_id);
    }

    const result = await AuditorController.getAllAuditors(filters);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result.data, { status: 200 });
  } catch (error) {
    console.error("GET /api/auditors error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST /api/auditors - Create new auditor
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const validatedData = createAuditorSchema.parse(body);

    const result = await AuditorController.createAuditor(validatedData);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === "Audit company not found" ? 404 : 400 },
      );
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/auditors error:", error);
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
