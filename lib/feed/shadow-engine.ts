import type { CameraFeed } from "@/lib/types/camera";
import type { ShadowDetection, ShadowModelMode, ShadowRunMeta } from "@/lib/types/shadow";
import { runAdapterShadowInference } from "@/lib/feed/shadow-adapter";
import { runHeuristicShadowInference } from "@/lib/feed/shadow-inference";

interface ShadowRunResult {
  detections: ShadowDetection[];
  meta: ShadowRunMeta;
}

function configuredMode(): ShadowModelMode {
  const raw = (process.env.SHADOW_MODEL_MODE ?? "heuristic").toLowerCase();
  return raw === "adapter" ? "adapter" : "heuristic";
}

export async function runShadowMode(feeds: CameraFeed[]): Promise<ShadowRunResult> {
  const start = Date.now();
  const mode = configuredMode();
  const fallbackAllowed = process.env.SHADOW_MODEL_FALLBACK_TO_HEURISTIC !== "false";

  if (mode === "heuristic") {
    const detections = runHeuristicShadowInference(feeds);
    return {
      detections,
      meta: {
        mode,
        fallbackUsed: false,
        latencyMs: Date.now() - start,
        detectionCount: detections.length,
        sourceCount: feeds.length,
      },
    };
  }

  try {
    const detections = await runAdapterShadowInference(feeds);
    return {
      detections,
      meta: {
        mode,
        fallbackUsed: false,
        latencyMs: Date.now() - start,
        detectionCount: detections.length,
        sourceCount: feeds.length,
      },
    };
  } catch (error) {
    if (!fallbackAllowed) {
      throw error;
    }

    console.warn("[shadow-mode] adapter failed, using heuristic fallback", error);
    const detections = runHeuristicShadowInference(feeds);
    return {
      detections,
      meta: {
        mode,
        fallbackUsed: true,
        latencyMs: Date.now() - start,
        detectionCount: detections.length,
        sourceCount: feeds.length,
      },
    };
  }
}
