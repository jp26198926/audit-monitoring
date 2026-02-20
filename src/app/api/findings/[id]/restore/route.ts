import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { FindingController } from "@/controllers/finding.controller";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await verifyAuth(request);
    const { id } = await params;

    const result = await FindingController.restoreFinding(parseInt(id));

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Restore finding API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to restore finding" },
      { status: error.message === "Unauthorized" ? 401 : 500 },
    );
  }
}
