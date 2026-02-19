import { NextRequest, NextResponse } from "next/server";
import { ingestFeeds } from "@/lib/feed/ingest";
import {
  isInternalTokenValid,
  verifyLocalFeedSessionToken,
} from "@/lib/auth/internal-session";
import { validateCameraFeed } from "@/lib/feed/validation";

const LOCAL_SESSION_COOKIE = "vs_local_feed_session";

function isAuthorized(request: NextRequest) {
  const secret = process.env.INTERNAL_API_TOKEN;
  if (!secret) {
    return process.env.NODE_ENV !== "production";
  }

  const headerToken = request.headers.get("x-internal-token");
  if (isInternalTokenValid(headerToken, secret)) {
    return true;
  }

  const cookieToken = request.cookies.get(LOCAL_SESSION_COOKIE)?.value ?? "";
  return verifyLocalFeedSessionToken(cookieToken, secret);
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      feeds?: unknown[];
    };
    const feeds = body.feeds;

    if (!Array.isArray(feeds) || feeds.length === 0) {
      return NextResponse.json(
        { error: "feeds array is required" },
        { status: 400 },
      );
    }

    if (feeds.length > 10) {
      return NextResponse.json(
        { error: "Too many feeds in one request" },
        { status: 400 },
      );
    }

    const validatedFeeds = [];
    const errors: string[] = [];
    for (const [index, feed] of feeds.entries()) {
      const validated = validateCameraFeed(feed, {
        allowedSourceTypes: ["local-device"],
        localCameraIdPrefix: "LOCAL-",
      });
      if (!validated.valid) {
        errors.push(
          `feeds[${index}]: ${validated.errors.join("; ")}`,
        );
        continue;
      }
      validatedFeeds.push(validated.feed);
    }

    if (errors.length > 0) {
      return NextResponse.json(
        {
          error: "Invalid local feed payload",
          details: errors,
        },
        { status: 400 },
      );
    }

    await ingestFeeds(validatedFeeds);

    return NextResponse.json({
      success: true,
      ingested: validatedFeeds.length,
      source: "local-device",
    });
  } catch (error) {
    console.error("Local state ingest error:", error);
    return NextResponse.json(
      { error: "Failed to ingest local camera state" },
      { status: 500 },
    );
  }
}
