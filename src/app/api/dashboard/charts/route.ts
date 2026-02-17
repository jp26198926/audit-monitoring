import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/middleware/auth.middleware";
import { DashboardController } from "@/controllers/dashboard.controller";

// GET /api/dashboard/charts - Get chart data
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
      date_from: searchParams.get("date_from") || undefined,
      date_to: searchParams.get("date_to") || undefined,
    };

    const result = await DashboardController.getChartData(filters);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Get chart data API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
