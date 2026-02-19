import { supabaseAdmin } from "@/lib/supabase";
import type { CameraFeed } from "@/lib/types/camera";

export interface PersistedCameraState {
  cameraId: string;
  id: number;
  name: string;
  zone: string;
  sourceType: "snapshot" | "local-device" | "remote-stream";
  status: "normal" | "warning" | "alert" | "offline";
  occupancy: number;
  capacity: number;
  imageUrl: string;
  streamUrl?: string;
  isLive: boolean;
  lastUpdated: string;
}

export interface CameraStateHistoryRow {
  cameraId: string;
  status: "normal" | "warning" | "alert" | "offline";
  isLive: boolean;
  recordedAt: string;
  sourceType: "snapshot" | "local-device" | "remote-stream";
}

function numericIdFromCameraId(cameraId: string): number {
  const matches = cameraId.match(/\d+/);
  if (!matches) return 0;
  const parsed = Number(matches[0]);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function upsertLatestCameraState(feeds: CameraFeed[]) {
  const rows = feeds.map((feed) => ({
    camera_id: feed.cameraId,
    status: feed.status,
    occupancy: feed.occupancy,
    capacity: feed.capacity,
    is_live: feed.isLive ?? true,
    image_url: feed.imageUrl,
    last_updated: feed.lastUpdated,
  }));

  const { error } = await supabaseAdmin.from("camera_state_latest").upsert(rows, {
    onConflict: "camera_id",
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function insertCameraStateHistory(feeds: CameraFeed[]) {
  const rows = feeds.map((feed) => ({
    camera_id: feed.cameraId,
    status: feed.status,
    occupancy: feed.occupancy,
    capacity: feed.capacity,
    is_live: feed.isLive ?? true,
    image_url: feed.imageUrl,
    recorded_at: feed.lastUpdated,
  }));

  const { error } = await supabaseAdmin.from("camera_state_history").insert(rows);

  if (error) {
    throw new Error(error.message);
  }
}

export async function getLatestCameraStateMap(): Promise<
  Map<string, PersistedCameraState>
> {
  const { data, error } = await supabaseAdmin.from("camera_state_latest").select(`
      camera_id,
      status,
      occupancy,
      capacity,
      is_live,
      image_url,
      last_updated,
      cameras!inner (
        numeric_id,
        name,
        zone,
        source_type,
        stream_url
      )
    `);

  if (error) {
    throw new Error(error.message);
  }

  const map = new Map<string, PersistedCameraState>();
  for (const row of data ?? []) {
    const relation = (row as { cameras?: Record<string, unknown>[] }).cameras ?? [];
    const camera = relation[0] ?? {};

    map.set(String(row.camera_id), {
      cameraId: String(row.camera_id),
      id: Number(camera.numeric_id ?? numericIdFromCameraId(String(row.camera_id))),
      name: String(camera.name ?? ""),
      zone: String(camera.zone ?? ""),
      sourceType: String(camera.source_type ?? "snapshot") as PersistedCameraState["sourceType"],
      status: String(row.status) as PersistedCameraState["status"],
      occupancy: Number(row.occupancy ?? 0),
      capacity: Number(row.capacity ?? 0),
      imageUrl: String(row.image_url ?? "/placeholder.jpg"),
      streamUrl: camera.stream_url ? String(camera.stream_url) : undefined,
      isLive: Boolean(row.is_live),
      lastUpdated: String(row.last_updated),
    });
  }

  return map;
}

export async function getPersistedCameraFeeds(): Promise<CameraFeed[]> {
  const stateMap = await getLatestCameraStateMap();
  return [...stateMap.values()].map((row) => ({
    id: row.id,
    cameraId: row.cameraId,
    name: row.name,
    zone: row.zone,
    sourceType: row.sourceType,
    status: row.status,
    occupancy: row.occupancy,
    capacity: row.capacity,
    imageUrl: row.imageUrl,
    streamUrl: row.streamUrl,
    isLive: row.isLive,
    lastUpdated: row.lastUpdated,
  }));
}

export async function listRecentCameraStateHistory(limit = 300): Promise<
  CameraStateHistoryRow[]
> {
  const { data, error } = await supabaseAdmin
    .from("camera_state_history")
    .select(
      "camera_id,status,is_live,recorded_at,cameras!inner(source_type)",
    )
    .order("recorded_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => {
    const relation = (row as { cameras?: Record<string, unknown>[] }).cameras ?? [];
    const camera = relation[0] ?? {};
    return {
      cameraId: String(row.camera_id),
      status: String(row.status) as CameraStateHistoryRow["status"],
      isLive: Boolean(row.is_live),
      recordedAt: String(row.recorded_at),
      sourceType: String(
        camera.source_type ?? "snapshot",
      ) as CameraStateHistoryRow["sourceType"],
    };
  });
}
