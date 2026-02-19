import { NextRequest, NextResponse } from "next/server";
import { isInternalTokenValid } from "@/lib/auth/internal-session";
import type { CameraFeed } from "@/lib/types/camera";
import type { ShadowDetection, ShadowSeverity } from "@/lib/types/shadow";

interface AdapterRequest {
  generatedAt?: unknown;
  feeds?: unknown;
}

const MODEL_KEY = "venueshield-shadow-adapter";
const MODEL_VERSION = "0.2.0";

function isAuthorized(request: NextRequest) {
  const expectedToken = process.env.INTERNAL_API_TOKEN;
  if (!expectedToken) {
    return process.env.NODE_ENV !== "production";
  }

  const received = request.headers.get("x-internal-token");
  return isInternalTokenValid(received, expectedToken);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function severityFromScore(score: number): ShadowSeverity {
  if (score >= 0.88) return "critical";
  if (score >= 0.72) return "high";
  if (score >= 0.52) return "medium";
  return "low";
}

function parseFeeds(input: unknown): CameraFeed[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.filter((value): value is CameraFeed => {
    if (typeof value !== "object" || value === null) return false;
    const row = value as Record<string, unknown>;
    return (
      typeof row.cameraId === "string" &&
      (row.sourceType === "local-device" || row.sourceType === "remote-stream") &&
      typeof row.name === "string" &&
      typeof row.zone === "string" &&
      typeof row.status === "string" &&
      typeof row.occupancy === "number" &&
      typeof row.capacity === "number" &&
      typeof row.lastUpdated === "string"
    );
  });
}

type AdapterFeed = CameraFeed & { sourceType: "local-device" | "remote-stream" };

function infer(feed: AdapterFeed, generatedAt: string): ShadowDetection {
  const occupancyRatio = clamp(feed.occupancy / Math.max(feed.capacity, 1), 0, 2);
  const staleSeconds = Math.max(
    0,
    Math.floor((Date.now() - Date.parse(feed.lastUpdated || generatedAt)) / 1000),
  );

  const offlinePenalty = feed.isLive === false || feed.status === "offline" ? 0.32 : 0;
  const statusBoost =
    feed.status === "alert" ? 0.22 : feed.status === "warning" ? 0.12 : 0;
  const staleBoost = staleSeconds > 15 ? 0.14 : staleSeconds > 8 ? 0.06 : 0;

  const score = clamp(occupancyRatio + offlinePenalty + statusBoost + staleBoost, 0, 1);
  const severity = severityFromScore(score);
  const predictedRatio5m = clamp(
    occupancyRatio + (severity === "critical" ? 0.18 : severity === "high" ? 0.1 : 0.04),
    0,
    1.5,
  );
  const confidence = clamp(0.58 + occupancyRatio * 0.32 - (feed.isLive ? 0 : 0.1), 0.35, 0.99);

  const summary =
    severity === "critical"
      ? `Critical crowd risk or feed degradation detected for ${feed.name}.`
      : severity === "high"
        ? `Elevated crowd risk detected for ${feed.name}.`
        : severity === "medium"
          ? `Moderate risk trend detected for ${feed.name}.`
          : `${feed.name} is within expected risk envelope.`;

  const recommendedAction =
    severity === "critical"
      ? "Dispatch response team and rebalance crowd flow immediately."
      : severity === "high"
        ? "Prepare response team and monitor for escalation."
        : severity === "medium"
          ? "Increase observation cadence for this zone."
          : "Continue normal monitoring.";

  return {
    cameraId: feed.cameraId,
    sourceType: feed.sourceType,
    modelKey: MODEL_KEY,
    modelVersion: MODEL_VERSION,
    severity,
    confidence,
    summary,
    recommendedAction,
    tags: [
      `status:${feed.status}`,
      `stale:${staleSeconds}s`,
      feed.isLive ? "live" : "offline",
    ],
    metrics: {
      occupancyRatio,
      predictedRatio5m,
      feedLive: Boolean(feed.isLive),
    },
    generatedAt,
  };
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as AdapterRequest;
    const generatedAt =
      typeof body.generatedAt === "string" && !Number.isNaN(Date.parse(body.generatedAt))
        ? body.generatedAt
        : new Date().toISOString();
    const feeds = parseFeeds(body.feeds).filter(
      (feed): feed is AdapterFeed =>
        feed.sourceType === "local-device" || feed.sourceType === "remote-stream",
    );

    if (feeds.length === 0) {
      return NextResponse.json({ detections: [] }, { status: 200 });
    }

    const detections = feeds.map((feed) => infer(feed, generatedAt));

    return NextResponse.json(
      {
        detections,
        generatedAt,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Shadow adapter error:", error);
    return NextResponse.json(
      { error: "Failed to run shadow adapter" },
      { status: 500 },
    );
  }
}
