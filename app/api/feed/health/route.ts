import { NextResponse } from "next/server";
import { getFeedHealth } from "@/lib/feed";

export async function GET() {
  try {
    const health = await getFeedHealth();
    return NextResponse.json(health, { status: 200 });
  } catch (error) {
    console.error("Feed health error:", error);
    return NextResponse.json(
      {
        summary: {
          total: 0,
          live: 0,
          offline: 0,
          stale: 0,
          generatedAt: new Date().toISOString(),
        },
        cameras: [],
        warning: "Failed to fetch feed health.",
      },
      { status: 200 },
    );
  }
}
