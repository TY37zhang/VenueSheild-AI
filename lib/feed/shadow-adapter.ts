import type { CameraFeed } from "@/lib/types/camera";
import type { ShadowDetection, ShadowSeverity } from "@/lib/types/shadow";

interface ShadowAdapterDetectionRaw {
  cameraId?: unknown;
  sourceType?: unknown;
  modelKey?: unknown;
  modelVersion?: unknown;
  severity?: unknown;
  confidence?: unknown;
  summary?: unknown;
  recommendedAction?: unknown;
  tags?: unknown;
  metrics?: unknown;
  generatedAt?: unknown;
}

interface ShadowAdapterResponse {
  detections?: ShadowAdapterDetectionRaw[];
}

const SEVERITIES: ShadowSeverity[] = ["low", "medium", "high", "critical"];

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isSourceType(
  value: unknown,
): value is "local-device" | "remote-stream" {
  return value === "local-device" || value === "remote-stream";
}

function normalizeDetection(
  raw: ShadowAdapterDetectionRaw,
  fallbackFeedMap: Map<string, CameraFeed>,
  generatedAt: string,
): ShadowDetection | null {
  if (!raw || typeof raw.cameraId !== "string") {
    return null;
  }

  const feed = fallbackFeedMap.get(raw.cameraId);
  if (!feed) {
    return null;
  }

  const sourceType = isSourceType(raw.sourceType) ? raw.sourceType : feed.sourceType;
  if (!isSourceType(sourceType)) {
    return null;
  }

  const severity = SEVERITIES.includes(raw.severity as ShadowSeverity)
    ? (raw.severity as ShadowSeverity)
    : "low";

  const confidence =
    typeof raw.confidence === "number" && Number.isFinite(raw.confidence)
      ? Math.min(1, Math.max(0, raw.confidence))
      : 0.5;

  const metrics = isObject(raw.metrics) ? raw.metrics : {};
  const frameShapeRaw = isObject(metrics.frameShape)
    ? (metrics.frameShape as Record<string, unknown>)
    : null;
  const frameShape =
    frameShapeRaw &&
    typeof frameShapeRaw.width === "number" &&
    typeof frameShapeRaw.height === "number"
      ? { width: frameShapeRaw.width, height: frameShapeRaw.height }
      : null;
  const classCountsRaw = isObject(metrics.classCounts)
    ? (metrics.classCounts as Record<string, unknown>)
    : {};
  const classCounts: Record<string, number> = {};
  for (const [label, value] of Object.entries(classCountsRaw)) {
    if (typeof value === "number") {
      classCounts[label] = value;
    }
  }
  const detectionBoxesRaw = Array.isArray(metrics.detectionBoxes)
    ? metrics.detectionBoxes
    : [];
  const detectionBoxes = detectionBoxesRaw
    .map((box) => {
      if (!isObject(box)) return null;
      const classId = box.classId;
      const classLabel = box.classLabel;
      const confidence = box.confidence;
      const xyxy = box.xyxy;
      if (
        typeof classId !== "number" ||
        typeof classLabel !== "string" ||
        typeof confidence !== "number" ||
        !Array.isArray(xyxy) ||
        xyxy.length !== 4 ||
        xyxy.some((value) => typeof value !== "number")
      ) {
        return null;
      }
      return {
        classId,
        classLabel,
        confidence,
        xyxy: [xyxy[0], xyxy[1], xyxy[2], xyxy[3]] as [
          number,
          number,
          number,
          number,
        ],
      };
    })
    .filter((box): box is NonNullable<typeof box> => box !== null);

  return {
    cameraId: raw.cameraId,
    sourceType,
    modelKey:
      typeof raw.modelKey === "string" && raw.modelKey.trim().length > 0
        ? raw.modelKey
        : "adapter-shadow-model",
    modelVersion:
      typeof raw.modelVersion === "string" && raw.modelVersion.trim().length > 0
        ? raw.modelVersion
        : "unknown",
    severity,
    confidence,
    summary:
      typeof raw.summary === "string" && raw.summary.trim().length > 0
        ? raw.summary
        : "Model returned no summary.",
    recommendedAction:
      typeof raw.recommendedAction === "string" &&
      raw.recommendedAction.trim().length > 0
        ? raw.recommendedAction
        : "Review camera manually.",
    tags: Array.isArray(raw.tags)
      ? raw.tags.filter((tag: unknown): tag is string => typeof tag === "string")
      : [],
    metrics: {
      occupancyRatio:
        typeof metrics.occupancyRatio === "number" ? metrics.occupancyRatio : 0,
      predictedRatio5m:
        typeof metrics.predictedRatio5m === "number" ? metrics.predictedRatio5m : 0,
      feedLive: typeof metrics.feedLive === "boolean" ? metrics.feedLive : !!feed.isLive,
      frameAvailable:
        typeof metrics.frameAvailable === "boolean"
          ? metrics.frameAvailable
          : undefined,
      frameShape,
      totalDetections:
        typeof metrics.totalDetections === "number"
          ? metrics.totalDetections
          : undefined,
      personCountTracked:
        typeof metrics.personCountTracked === "number"
          ? metrics.personCountTracked
          : undefined,
      visionConfidence:
        typeof metrics.visionConfidence === "number"
          ? metrics.visionConfidence
          : undefined,
      thresholdUsed:
        typeof metrics.thresholdUsed === "number"
          ? metrics.thresholdUsed
          : undefined,
      classCounts,
      detectionBoxes,
    },
    generatedAt:
      typeof raw.generatedAt === "string" && !Number.isNaN(Date.parse(raw.generatedAt))
        ? raw.generatedAt
        : generatedAt,
  };
}

export async function runAdapterShadowInference(
  feeds: CameraFeed[],
): Promise<ShadowDetection[]> {
  const endpoint = process.env.SHADOW_MODEL_ADAPTER_URL;
  if (!endpoint) {
    throw new Error("SHADOW_MODEL_ADAPTER_URL is not set");
  }

  const modelFeeds = feeds.filter(
    (feed): feed is CameraFeed & { sourceType: "local-device" | "remote-stream" } =>
      feed.sourceType === "local-device" || feed.sourceType === "remote-stream",
  );

  const timeoutMs = Number(process.env.SHADOW_MODEL_TIMEOUT_MS ?? 2500);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  const generatedAt = new Date().toISOString();

  try {
    const internalToken = process.env.INTERNAL_API_TOKEN;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(internalToken ? { "x-internal-token": internalToken } : {}),
      },
      body: JSON.stringify({
        generatedAt,
        feeds: modelFeeds,
      }),
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Adapter failed (${response.status}): ${text}`);
    }

    const payload = (await response.json()) as ShadowAdapterResponse;
    const fallbackFeedMap = new Map(modelFeeds.map((feed) => [feed.cameraId, feed]));

    return (payload.detections ?? [])
      .map((raw) => normalizeDetection(raw, fallbackFeedMap, generatedAt))
      .filter((detection): detection is ShadowDetection => detection !== null);
  } finally {
    clearTimeout(timeout);
  }
}
