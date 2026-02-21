import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/middleware/auth.middleware";
import { FindingController } from "@/controllers/finding.controller";
import { createFindingSchema } from "@/validators/schemas";

// Helper to safely parse integers
const safeParseInt = (value: string | null, defaultValue: number): number => {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

// GET /api/findings - List findings with filters
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

    const auditIdParam = searchParams.get("audit_id");
    const parsedAuditId = auditIdParam ? parseInt(auditIdParam, 10) : undefined;

    const filters = {
      audit_id:
        parsedAuditId && !isNaN(parsedAuditId) ? parsedAuditId : undefined,
      category: searchParams.get("category") as any,
      status: searchParams.get("status") as any,
      includeDeleted: searchParams.get("includeDeleted") === "true",
      page: safeParseInt(searchParams.get("page"), 1),
      limit: safeParseInt(searchParams.get("limit"), 10),
    };

    console.log("Findings API - Filters:", filters);
    console.log("Findings API - User:", user.userId, user.role_name);
    console.log("Findings API - Request URL:", request.url);

    const result = await FindingController.getAllFindings(filters);

    console.log("Findings API - Controller result:", {
      success: result.success,
      dataLength: result.success && result.data ? result.data.length : 0,
      hasError: !!result.error,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Get findings API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST /api/findings - Create finding (Encoder, Admin)
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
    const validation = createFindingSchema.safeParse(body);
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

    const result = await FindingController.createFinding(validation.data);

    return NextResponse.json(result, {
      status: result.success ? 201 : 400,
    });
  } catch (error) {
    console.error("Create finding API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
