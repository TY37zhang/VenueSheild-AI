import { NextRequest, NextResponse } from "next/server";
import { listLatestShadowDetections } from "@/lib/db/shadow-detections";

function parseLimit(value: string | null): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 100;
  }
  return Math.min(parsed, 250);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cameraId = searchParams.get("cameraId")?.trim() || null;
    const limit = parseLimit(searchParams.get("limit"));

    const detections = await listLatestShadowDetections({
      cameraIds: cameraId ? [cameraId] : undefined,
      limit,
    });

    return NextResponse.json(
      {
        detections,
        generatedAt: new Date().toISOString(),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Shadow detection fetch error:", error);
    return NextResponse.json(
      {
        detections: [],
        warning: "Failed to fetch shadow detections.",
        generatedAt: new Date().toISOString(),
      },
      { status: 200 },
    );
  }
}
