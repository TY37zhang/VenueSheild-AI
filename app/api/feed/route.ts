import { NextResponse } from "next/server";
import { getCameraFeeds } from "@/lib/feed";
import { listLatestShadowDetections } from "@/lib/db/shadow-detections";

export async function GET() {
  try {
    const feeds = await getCameraFeeds();
    let shadowByCamera: Record<string, unknown> = {};

    try {
      const detections = await listLatestShadowDetections({
        cameraIds: feeds.map((feed) => feed.cameraId),
      });
      shadowByCamera = Object.fromEntries(
        detections.map((detection) => [detection.cameraId, detection]),
      );
    } catch (shadowError) {
      console.warn("[feed] shadow detections unavailable", shadowError);
    }

    return NextResponse.json(
      {
        feeds,
        shadowByCamera,
        generatedAt: new Date().toISOString(),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Feed fetch error:", error);
    return NextResponse.json(
      {
        warning: "Failed to fetch persisted camera feeds.",
        feeds: [],
        shadowByCamera: {},
        generatedAt: new Date().toISOString(),
      },
      { status: 200 },
    );
  }
}
