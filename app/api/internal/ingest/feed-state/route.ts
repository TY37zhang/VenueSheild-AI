import { NextRequest, NextResponse } from "next/server";
import { ingestFeeds } from "@/lib/feed/ingest";
import { isInternalTokenValid } from "@/lib/auth/internal-session";
import { validateCameraFeed } from "@/lib/feed/validation";

interface IngestPayload {
  feeds?: unknown[];
}

function isAuthorized(request: NextRequest) {
  const expectedToken = process.env.INTERNAL_API_TOKEN;
  if (!expectedToken) {
    return process.env.NODE_ENV !== "production";
  }

  const received = request.headers.get("x-internal-token");
  return isInternalTokenValid(received, expectedToken);
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as IngestPayload;
    const feeds = body.feeds;

    if (!Array.isArray(feeds) || feeds.length === 0) {
      return NextResponse.json({
        error: "feeds array is required",
      }, { status: 400 });
    }

    const validatedFeeds = [];
    const errors: string[] = [];
    for (const [index, feed] of feeds.entries()) {
      const validated = validateCameraFeed(feed, {
        allowedSourceTypes: ["local-device", "remote-stream"],
      });
      if (!validated.valid) {
        errors.push(`feeds[${index}]: ${validated.errors.join("; ")}`);
        continue;
      }
      validatedFeeds.push(validated.feed);
    }

    if (errors.length > 0) {
      return NextResponse.json(
        {
          error: "Invalid feed payload",
          details: errors,
        },
        { status: 400 },
      );
    }

    await ingestFeeds(validatedFeeds);
    console.info("[ingest] accepted feed batch", {
      ingested: validatedFeeds.length,
      sourceTypes: [...new Set(validatedFeeds.map((feed) => feed.sourceType))],
      cameraIds: validatedFeeds.map((feed) => feed.cameraId),
    });

    return NextResponse.json({
      success: true,
      mode: "custom",
      ingested: validatedFeeds.length,
    });
  } catch (error) {
    console.error("Feed ingest error:", error);
    return NextResponse.json(
      { error: "Failed to ingest feed state" },
      { status: 500 },
    );
  }
}
