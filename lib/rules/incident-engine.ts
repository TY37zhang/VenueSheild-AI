import type { CameraFeed } from "@/lib/types/camera";
import type { IncidentType } from "@/lib/types/incident";
import {
  createIncident,
  resolveIncidentById,
  type getActiveIncidentsMap,
} from "@/lib/db/incidents";
import type { PersistedCameraState } from "@/lib/db/camera-state";

const WARNING_THRESHOLD = 80;
const CRITICAL_THRESHOLD = 90;
const CLEAR_THRESHOLD = 75;

type ActiveMap = Awaited<ReturnType<typeof getActiveIncidentsMap>>;

function activeKey(cameraId: string, type: IncidentType) {
  return `${cameraId}::${type}`;
}

function occupancyPct(feed: CameraFeed) {
  if (!feed.capacity) return 0;
  return (feed.occupancy / feed.capacity) * 100;
}

export async function applyRulesForFeedBatch(params: {
  feeds: CameraFeed[];
  previousState: Map<string, PersistedCameraState>;
  activeIncidents: ActiveMap;
}) {
  const { feeds, previousState, activeIncidents } = params;

  for (const feed of feeds) {
    const prev = previousState.get(feed.cameraId);
    const pct = occupancyPct(feed);
    const prevPct = prev ? (prev.occupancy / Math.max(1, prev.capacity)) * 100 : 0;
    const isOffline = feed.status === "offline" || !feed.isLive;
    const wasOffline = prev ? prev.status === "offline" || !prev.isLive : false;

    const offlineKey = activeKey(feed.cameraId, "camera_offline");
    const warningKey = activeKey(feed.cameraId, "capacity_warning");
    const criticalKey = activeKey(feed.cameraId, "capacity_critical");

    if (isOffline && !wasOffline && !activeIncidents.has(offlineKey)) {
      const newId = await createIncident({
        cameraId: feed.cameraId,
        type: "camera_offline",
        severity: "high",
        title: `Camera Offline - ${feed.name}`,
        description: `${feed.name} in ${feed.zone} is no longer live.`,
      });
      activeIncidents.set(offlineKey, newId);
    }

    if (!isOffline && wasOffline) {
      const existingOffline = activeIncidents.get(offlineKey);
      if (existingOffline) {
        await resolveIncidentById(existingOffline);
        activeIncidents.delete(offlineKey);
      }

      await createIncident({
        cameraId: feed.cameraId,
        type: "camera_recovered",
        severity: "low",
        title: `Camera Recovered - ${feed.name}`,
        description: `${feed.name} in ${feed.zone} is live again.`,
        status: "resolved",
        resolvedAt: new Date().toISOString(),
      });
    }

    if (isOffline) {
      continue;
    }

    if (pct >= CRITICAL_THRESHOLD) {
      const existingWarning = activeIncidents.get(warningKey);
      if (existingWarning) {
        await resolveIncidentById(existingWarning);
        activeIncidents.delete(warningKey);
      }

      if (!activeIncidents.has(criticalKey)) {
        const newId = await createIncident({
          cameraId: feed.cameraId,
          type: "capacity_critical",
          severity: "critical",
          title: `Critical Capacity - ${feed.name}`,
          description: `${feed.name} at ${pct.toFixed(1)}% capacity.`,
          triggerValue: feed.occupancy,
          thresholdValue: Math.round((feed.capacity * CRITICAL_THRESHOLD) / 100),
        });
        activeIncidents.set(criticalKey, newId);
      }
      continue;
    }

    if (pct >= WARNING_THRESHOLD && pct < CRITICAL_THRESHOLD) {
      const existingCritical = activeIncidents.get(criticalKey);
      if (existingCritical) {
        await resolveIncidentById(existingCritical);
        activeIncidents.delete(criticalKey);
      }

      if (!activeIncidents.has(warningKey)) {
        const newId = await createIncident({
          cameraId: feed.cameraId,
          type: "capacity_warning",
          severity: "high",
          title: `High Capacity - ${feed.name}`,
          description: `${feed.name} at ${pct.toFixed(1)}% capacity.`,
          triggerValue: feed.occupancy,
          thresholdValue: Math.round((feed.capacity * WARNING_THRESHOLD) / 100),
        });
        activeIncidents.set(warningKey, newId);
      }
      continue;
    }

    if (pct < CLEAR_THRESHOLD || prevPct >= WARNING_THRESHOLD) {
      const existingWarning = activeIncidents.get(warningKey);
      if (existingWarning) {
        await resolveIncidentById(existingWarning);
        activeIncidents.delete(warningKey);
      }

      const existingCritical = activeIncidents.get(criticalKey);
      if (existingCritical) {
        await resolveIncidentById(existingCritical);
        activeIncidents.delete(criticalKey);
      }
    }
  }
}
