import { supabaseAdmin } from "@/lib/supabase";
import type { ShadowDetection } from "@/lib/types/shadow";

interface ShadowRow {
  camera_id: string;
  source_type: "local-device" | "remote-stream";
  model_key: string;
  model_version: string;
  severity: "low" | "medium" | "high" | "critical";
  confidence: number;
  summary: string;
  recommended_action: string;
  tags: string[] | null;
  metrics: Record<string, unknown> | null;
  generated_at: string;
  updated_at: string;
}

function mapRowToDetection(row: ShadowRow): ShadowDetection {
  const metrics = row.metrics ?? {};
  const frameShapeRaw = metrics.frameShape;
  const frameShape =
    frameShapeRaw &&
    typeof frameShapeRaw === "object" &&
    typeof (frameShapeRaw as { width?: unknown }).width === "number" &&
    typeof (frameShapeRaw as { height?: unknown }).height === "number"
      ? {
          width: Number((frameShapeRaw as { width: number }).width),
          height: Number((frameShapeRaw as { height: number }).height),
        }
      : null;
  const classCountsRaw = metrics.classCounts;
  const classCounts =
    classCountsRaw && typeof classCountsRaw === "object"
      ? Object.fromEntries(
          Object.entries(classCountsRaw).filter(
            ([, value]) => typeof value === "number",
          ),
        )
      : {};
  const detectionBoxesRaw = Array.isArray(metrics.detectionBoxes)
    ? metrics.detectionBoxes
    : [];
  const detectionBoxes = detectionBoxesRaw
    .map((box) => {
      if (!box || typeof box !== "object") {
        return null;
      }
      const typed = box as {
        classId?: unknown;
        classLabel?: unknown;
        confidence?: unknown;
        xyxy?: unknown;
      };
      if (
        typeof typed.classId !== "number" ||
        typeof typed.classLabel !== "string" ||
        typeof typed.confidence !== "number" ||
        !Array.isArray(typed.xyxy) ||
        typed.xyxy.length !== 4 ||
        typed.xyxy.some((value) => typeof value !== "number")
      ) {
        return null;
      }
      return {
        classId: typed.classId,
        classLabel: typed.classLabel,
        confidence: typed.confidence,
        xyxy: [
          typed.xyxy[0],
          typed.xyxy[1],
          typed.xyxy[2],
          typed.xyxy[3],
        ] as [number, number, number, number],
      };
    })
    .filter((box): box is NonNullable<typeof box> => box !== null);

  return {
    cameraId: row.camera_id,
    sourceType: row.source_type,
    modelKey: row.model_key,
    modelVersion: row.model_version,
    severity: row.severity,
    confidence: Number(row.confidence),
    summary: row.summary,
    recommendedAction: row.recommended_action,
    tags: Array.isArray(row.tags) ? row.tags : [],
    metrics: {
      occupancyRatio: Number(metrics.occupancyRatio ?? 0),
      predictedRatio5m: Number(metrics.predictedRatio5m ?? 0),
      feedLive: Boolean(metrics.feedLive),
      frameAvailable:
        typeof metrics.frameAvailable === "boolean"
          ? metrics.frameAvailable
          : undefined,
      frameShape,
      totalDetections:
        typeof metrics.totalDetections === "number"
          ? Number(metrics.totalDetections)
          : undefined,
      personCountTracked:
        typeof metrics.personCountTracked === "number"
          ? Number(metrics.personCountTracked)
          : undefined,
      visionConfidence:
        typeof metrics.visionConfidence === "number"
          ? Number(metrics.visionConfidence)
          : undefined,
      thresholdUsed:
        typeof metrics.thresholdUsed === "number"
          ? Number(metrics.thresholdUsed)
          : undefined,
      classCounts,
      detectionBoxes,
    },
    generatedAt: row.generated_at,
  };
}

export async function upsertShadowDetections(detections: ShadowDetection[]) {
  if (detections.length === 0) {
    return;
  }

  const rows = detections.map((detection) => ({
    camera_id: detection.cameraId,
    source_type: detection.sourceType,
    model_key: detection.modelKey,
    model_version: detection.modelVersion,
    severity: detection.severity,
    confidence: detection.confidence,
    summary: detection.summary,
    recommended_action: detection.recommendedAction,
    tags: detection.tags,
    metrics: detection.metrics,
    generated_at: detection.generatedAt,
    updated_at: detection.generatedAt,
  }));

  const { error } = await supabaseAdmin.from("ai_shadow_latest").upsert(rows, {
    onConflict: "camera_id,model_key",
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function listLatestShadowDetections(options?: {
  cameraIds?: string[];
  limit?: number;
}): Promise<ShadowDetection[]> {
  const limit = Math.min(Math.max(options?.limit ?? 100, 1), 250);

  let query = supabaseAdmin
    .from("ai_shadow_latest")
    .select(
      "camera_id,source_type,model_key,model_version,severity,confidence,summary,recommended_action,tags,metrics,generated_at,updated_at",
    )
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (options?.cameraIds && options.cameraIds.length > 0) {
    query = query.in("camera_id", options.cameraIds);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  return ((data as ShadowRow[] | null) ?? []).map(mapRowToDetection);
}
