import { upsertCameras } from "@/lib/db/cameras";
import {
  getLatestCameraStateMap,
  insertCameraStateHistory,
  upsertLatestCameraState,
} from "@/lib/db/camera-state";
import { getActiveIncidentsMap } from "@/lib/db/incidents";
import { upsertShadowDetections } from "@/lib/db/shadow-detections";
import { runShadowMode } from "@/lib/feed/shadow-engine";
import { applyRulesForFeedBatch } from "@/lib/rules/incident-engine";
import type { CameraFeed } from "@/lib/types/camera";

export async function ingestFeeds(feeds: CameraFeed[]) {
  await upsertCameras(feeds);
  const previousState = await getLatestCameraStateMap();
  const activeIncidents = await getActiveIncidentsMap();
  await upsertLatestCameraState(feeds);
  await insertCameraStateHistory(feeds);
  await applyRulesForFeedBatch({
    feeds,
    previousState,
    activeIncidents,
  });

  const shadowModeEnabled = process.env.SHADOW_MODE_ENABLED !== "false";
  if (!shadowModeEnabled) {
    return;
  }

  try {
    const run = await runShadowMode(feeds);
    await upsertShadowDetections(run.detections);
    console.info(
      `[shadow-mode] mode=${run.meta.mode} fallback=${run.meta.fallbackUsed} latencyMs=${run.meta.latencyMs} detections=${run.meta.detectionCount} sources=${run.meta.sourceCount}`,
    );
    if (process.env.SHADOW_DEBUG_VERBOSE === "true") {
      console.info("[shadow-mode-detail]", run.meta);
    }
  } catch (error) {
    // Shadow mode is advisory and must never block ingest/rules.
    console.warn("[shadow-mode] failed to persist detections", error);
  }
}
