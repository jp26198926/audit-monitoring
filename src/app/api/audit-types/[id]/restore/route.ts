import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { AuditTypeController } from "@/controllers/auditType.controller";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await verifyAuth(request);
    const { id } = await params;

    const result = await AuditTypeController.restoreAuditType(parseInt(id));

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Restore audit type API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to restore audit type" },
      { status: error.message === "Unauthorized" ? 401 : 500 },
    );
  }
}
