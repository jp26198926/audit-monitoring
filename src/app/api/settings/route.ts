import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/middleware/auth.middleware";
import { SettingsController } from "@/controllers/settings.controller";

/**
 * GET /api/settings
 * Get company settings (accessible by all authenticated users)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const settings = await SettingsController.getSettings();

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error: any) {
    console.error("GET /api/settings error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch settings",
      },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/settings
 * Update company settings (Admin only)
 */
export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // Check if user is Admin
    if (user.role !== "Admin") {
      return NextResponse.json(
        { success: false, error: "Forbidden: Admin access required" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const settings = await SettingsController.updateSettings(body);

    return NextResponse.json({
      success: true,
      data: settings,
      message: "Settings updated successfully",
    });
  } catch (error: any) {
    console.error("PUT /api/settings error:", error);

    // Handle validation errors
    if (error.errors) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: error.errors,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update settings",
      },
      { status: 500 },
    );
  }
}
