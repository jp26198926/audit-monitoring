import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/middleware/auth.middleware";
import { VesselController } from "@/controllers/vessel.controller";
import { createVesselSchema } from "@/validators/schemas";

// GET /api/vessels - List all vessels
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
    const activeOnly = searchParams.get("active_only") === "true";
    const includeDeleted = searchParams.get("includeDeleted") === "true";

    const result = await VesselController.getAllVessels(
      activeOnly,
      includeDeleted,
    );

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Get vessels API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST /api/vessels - Create vessel (Admin only)
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
    const validation = createVesselSchema.safeParse(body);
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

    const result = await VesselController.createVessel(validation.data);

    return NextResponse.json(result, {
      status: result.success ? 201 : 400,
    });
  } catch (error) {
    console.error("Create vessel API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
