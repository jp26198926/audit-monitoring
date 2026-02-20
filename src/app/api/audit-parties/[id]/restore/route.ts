import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/middleware/auth.middleware";
import { AuditPartyController } from "@/controllers/auditParty.controller";

export async function POST(
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

    const { id } = await params;

    const result = await AuditPartyController.restoreAuditParty(parseInt(id));

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Restore audit party API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to restore audit party" },
      { status: error.message === "Unauthorized" ? 401 : 500 },
    );
  }
}
