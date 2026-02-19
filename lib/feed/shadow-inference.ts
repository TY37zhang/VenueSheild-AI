import type { CameraFeed } from "@/lib/types/camera";
import type { ShadowDetection, ShadowSeverity } from "@/lib/types/shadow";

export const HEURISTIC_MODEL_KEY = "venueshield-shadow-risk";
export const HEURISTIC_MODEL_VERSION = "0.1.0";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function severityFromScore(score: number): ShadowSeverity {
  if (score >= 0.9) return "critical";
  if (score >= 0.75) return "high";
  if (score >= 0.55) return "medium";
  return "low";
}

function summaryForSeverity(
  severity: ShadowSeverity,
  feed: CameraFeed,
  predictedRatio5m: number,
) {
  if (!feed.isLive || feed.status === "offline") {
    return "Feed offline, analytical confidence reduced until stream resumes.";
  }

  const percentNow = Math.round((feed.occupancy / Math.max(feed.capacity, 1)) * 100);
  const percentPredicted = Math.round(predictedRatio5m * 100);

  if (severity === "critical") {
    return `Crowd pressure is critical (${percentNow}% now, ${percentPredicted}% predicted in 5m).`;
  }
  if (severity === "high") {
    return `Crowd pressure is elevated (${percentNow}% now, ${percentPredicted}% predicted in 5m).`;
  }
  if (severity === "medium") {
    return `Crowd pressure is building (${percentNow}% now, ${percentPredicted}% predicted in 5m).`;
  }

  return `Crowd pressure is stable (${percentNow}% now, ${percentPredicted}% predicted in 5m).`;
}

function actionForSeverity(severity: ShadowSeverity, feed: CameraFeed) {
  if (!feed.isLive || feed.status === "offline") {
    return "Restore live stream and verify camera heartbeat before acting on analytics.";
  }

  if (severity === "critical") {
    return "Dispatch floor staff now and start crowd redirection at this zone.";
  }
  if (severity === "high") {
    return "Pre-position responders and prepare controlled flow diversion.";
  }
  if (severity === "medium") {
    return "Monitor closely and notify operations lead of upward crowd trend.";
  }

  return "Continue normal monitoring.";
}

function confidenceFor(feed: CameraFeed, occupancyRatio: number) {
  const statusBoost = feed.status === "normal" ? 0 : 0.05;
  const livePenalty = feed.isLive ? 0 : -0.15;
  return clamp(0.55 + occupancyRatio * 0.35 + statusBoost + livePenalty, 0.35, 0.99);
}

export function runHeuristicShadowInference(feeds: CameraFeed[]): ShadowDetection[] {
  const generatedAt = new Date().toISOString();

  return feeds
    .filter(
      (feed): feed is CameraFeed & { sourceType: "local-device" | "remote-stream" } =>
        feed.sourceType === "local-device" || feed.sourceType === "remote-stream",
    )
    .map((feed) => {
      const occupancyRatio = clamp(feed.occupancy / Math.max(feed.capacity, 1), 0, 2);
      const statusBoost =
        feed.status === "alert"
          ? 0.25
          : feed.status === "warning"
            ? 0.12
            : feed.status === "offline"
              ? 0.35
              : 0;
      const livePenalty = feed.isLive ? 0 : 0.3;

      const predictedGrowth =
        feed.status === "alert"
          ? 0.18
          : feed.status === "warning"
            ? 0.1
            : feed.status === "normal"
              ? 0.05
              : 0;

      const predictedRatio5m = clamp(occupancyRatio + predictedGrowth, 0, 1.5);
      const riskScore = clamp(occupancyRatio + statusBoost + livePenalty, 0, 1);
      const severity = severityFromScore(riskScore);

      return {
        cameraId: feed.cameraId,
        sourceType: feed.sourceType,
        modelKey: HEURISTIC_MODEL_KEY,
        modelVersion: HEURISTIC_MODEL_VERSION,
        severity,
        confidence: confidenceFor(feed, occupancyRatio),
        summary: summaryForSeverity(severity, feed, predictedRatio5m),
        recommendedAction: actionForSeverity(severity, feed),
        tags: [
          `status:${feed.status}`,
          `source:${feed.sourceType}`,
          feed.isLive ? "live" : "offline",
        ],
        metrics: {
          occupancyRatio,
          predictedRatio5m,
          feedLive: Boolean(feed.isLive),
        },
        generatedAt,
      } satisfies ShadowDetection;
    });
}
