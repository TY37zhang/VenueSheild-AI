import {
  getActiveIncidentsMap,
  listIncidentCountsPrevious24h,
  listIncidentCountsLast24h,
  listLastIncidentAtByCamera,
} from "@/lib/db/incidents";
import {
  listRecentCameraStateHistory,
  getLatestCameraStateMap,
  getPersistedCameraFeeds,
  insertCameraStateHistory,
  upsertLatestCameraState,
} from "@/lib/db/camera-state";
import { upsertCameras } from "@/lib/db/cameras";
import { getSnapshotCameraFeeds } from "@/lib/feed/source/snapshot";
import {
  deriveFeedHealthEvents,
  type FeedHealthEvent,
} from "@/lib/feed/health-events";
import { applyRulesForFeedBatch } from "@/lib/rules/incident-engine";
import type { CameraFeed } from "@/lib/types/camera";

export type { CameraFeed, CameraSourceType, CameraStatus } from "@/lib/types/camera";

export interface FeedHealthEntry {
  cameraId: string;
  name: string;
  sourceType: "local-device" | "remote-stream";
  status: "normal" | "warning" | "alert" | "offline";
  isLive: boolean;
  lastUpdated: string;
  ageSeconds: number;
  isStale: boolean;
  staleReason: string | null;
  incidentCount24h: number;
  incidentTrend: "rising" | "falling" | "stable";
  incidentTrendDelta: number;
  lastIncidentAt: string | null;
}

export interface FeedHealthSummary {
  total: number;
  live: number;
  offline: number;
  stale: number;
  generatedAt: string;
}

export async function ingestSnapshotFeedState() {
  const feeds = getSnapshotCameraFeeds();
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
}

export async function getCameraFeeds(): Promise<CameraFeed[]> {
  try {
    const persisted = await getPersistedCameraFeeds();
    // Only expose real active sources on /feed. Snapshot/demo feeds stay internal.
    return persisted.filter((feed) => feed.sourceType !== "snapshot");
  } catch (error) {
    console.warn("[feed] failed to fetch persisted feeds", error);
  }

  return [];
}

export function getSnapshotFallbackFeeds() {
  return [];
}

export async function getFeedHealth(): Promise<{
  summary: FeedHealthSummary;
  cameras: FeedHealthEntry[];
  events: FeedHealthEvent[];
}> {
  const feeds = await getCameraFeeds();
  const history = await listRecentCameraStateHistory(400);
  const incidentCounts = await listIncidentCountsLast24h();
  const previousIncidentCounts = await listIncidentCountsPrevious24h();
  const lastIncidentAtByCamera = await listLastIncidentAtByCamera();
  const staleThresholdSeconds = Number(
    process.env.REMOTE_STALE_THRESHOLD_MS
      ? Number(process.env.REMOTE_STALE_THRESHOLD_MS) / 1000
      : 15,
  );
  const nowMs = Date.now();

  const cameras = feeds
    .filter(
      (feed): feed is CameraFeed & { sourceType: "local-device" | "remote-stream" } =>
        feed.sourceType === "local-device" || feed.sourceType === "remote-stream",
    )
    .map((feed) => {
      const lastUpdatedMs = Number.isNaN(Date.parse(feed.lastUpdated))
        ? nowMs
        : Date.parse(feed.lastUpdated);
      const ageSeconds = Math.max(0, Math.floor((nowMs - lastUpdatedMs) / 1000));
      const isStale = ageSeconds > staleThresholdSeconds;
      const isOffline = feed.status === "offline" || !feed.isLive;

      let staleReason: string | null = null;
      if (isOffline) staleReason = "camera offline";
      else if (isStale) staleReason = `no heartbeat in ${ageSeconds}s`;

      const currentCount = incidentCounts.get(feed.cameraId) ?? 0;
      const previousCount = previousIncidentCounts.get(feed.cameraId) ?? 0;
      const incidentTrendDelta = currentCount - previousCount;
      const incidentTrend: FeedHealthEntry["incidentTrend"] =
        incidentTrendDelta > 0
          ? "rising"
          : incidentTrendDelta < 0
            ? "falling"
            : "stable";

      return {
        cameraId: feed.cameraId,
        name: feed.name,
        sourceType: feed.sourceType,
        status: feed.status,
        isLive: Boolean(feed.isLive),
        lastUpdated: feed.lastUpdated,
        ageSeconds,
        isStale: isStale || isOffline,
        staleReason,
        incidentCount24h: currentCount,
        incidentTrend,
        incidentTrendDelta,
        lastIncidentAt: lastIncidentAtByCamera.get(feed.cameraId) ?? null,
      };
    });

  const summary: FeedHealthSummary = {
    total: cameras.length,
    live: cameras.filter((camera) => !camera.isStale && camera.isLive).length,
    offline: cameras.filter(
      (camera) => camera.status === "offline" || !camera.isLive,
    ).length,
    stale: cameras.filter((camera) => camera.isStale).length,
    generatedAt: new Date().toISOString(),
  };

  const events = deriveFeedHealthEvents(history, Date.now());

  return {
    summary,
    cameras,
    events: events.slice(0, 25),
  };
}
