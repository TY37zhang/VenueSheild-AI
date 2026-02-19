import { randomUUID } from "crypto";
import { supabaseAdmin } from "@/lib/supabase";
import type {
  IncidentEvent,
  IncidentSeverity,
  IncidentStatus,
  IncidentType,
} from "@/lib/types/incident";

interface IncidentRow {
  id: string;
  camera_id: string;
  type: IncidentType;
  severity: IncidentSeverity;
  status: IncidentStatus;
  title: string;
  description: string;
  trigger_value: number | null;
  threshold_value: number | null;
  source: "rule-engine";
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  cameras?: {
    zone: string;
    name: string;
    source_type: "snapshot" | "local-device" | "remote-stream";
  }[] | null;
}

function isMissingAcknowledgeColumn(message: string) {
  return (
    message.includes("incident_events.acknowledged_by") ||
    message.includes("incident_events.acknowledged_at")
  );
}

export async function getActiveIncidentsMap() {
  const { data, error } = await supabaseAdmin
    .from("incident_events")
    .select("id,camera_id,type,status")
    .eq("status", "active");

  if (error) {
    throw new Error(error.message);
  }

  const active = new Map<string, string>();
  for (const row of data ?? []) {
    const key = `${row.camera_id}::${row.type}`;
    active.set(key, String(row.id));
  }

  return active;
}

export async function createIncident(params: {
  cameraId: string;
  type: IncidentType;
  severity: IncidentSeverity;
  title: string;
  description: string;
  triggerValue?: number;
  thresholdValue?: number;
  status?: IncidentStatus;
  resolvedAt?: string | null;
}) {
  const now = new Date().toISOString();
  const id = randomUUID();
  const row = {
    id,
    camera_id: params.cameraId,
    type: params.type,
    severity: params.severity,
    status: params.status ?? "active",
    title: params.title,
    description: params.description,
    trigger_value: params.triggerValue ?? null,
    threshold_value: params.thresholdValue ?? null,
    source: "rule-engine" as const,
    created_at: now,
    updated_at: now,
    resolved_at: params.resolvedAt ?? null,
  };

  const { error } = await supabaseAdmin.from("incident_events").insert(row);
  if (error) {
    throw new Error(error.message);
  }

  return id;
}

export async function resolveIncidentById(id: string) {
  const now = new Date().toISOString();
  const { error } = await supabaseAdmin
    .from("incident_events")
    .update({
      status: "resolved",
      resolved_at: now,
      updated_at: now,
    })
    .eq("id", id)
    .eq("status", "active");

  if (error) {
    throw new Error(error.message);
  }
}

export async function listIncidents(options?: {
  status?: "active" | "resolved" | "all";
  limit?: number;
}): Promise<IncidentEvent[]> {
  const status = options?.status ?? "active";
  const limit = options?.limit ?? 50;

  const runQuery = async (includeAckFields: boolean) => {
    const select = includeAckFields
      ? "id,camera_id,type,severity,status,title,description,trigger_value,threshold_value,source,created_at,updated_at,resolved_at,acknowledged_by,acknowledged_at,cameras(zone,name,source_type)"
      : "id,camera_id,type,severity,status,title,description,trigger_value,threshold_value,source,created_at,updated_at,resolved_at,cameras(zone,name,source_type)";

    let query = supabaseAdmin
      .from("incident_events")
      .select(select)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (status !== "all") {
      query = query.eq("status", status);
    }

    return query;
  };

  const first = await runQuery(true);
  let data = first.data;
  let error = first.error;

  if (error && isMissingAcknowledgeColumn(error.message)) {
    const fallback = await runQuery(false);
    data = fallback.data;
    error = fallback.error;
  }

  if (error) {
    throw new Error(error.message);
  }

  return (
    (data as IncidentRow[] | null | undefined)
      ?.filter((row) => {
        const sourceType = row.cameras?.[0]?.source_type;
        return sourceType === "local-device" || sourceType === "remote-stream";
      })
      .map((row) => ({
        id: row.id,
        cameraId: row.camera_id,
        type: row.type,
        severity: row.severity,
        status: row.status,
        title: row.title,
        description: row.description,
        triggerValue: row.trigger_value,
        thresholdValue: row.threshold_value,
        source: row.source,
        zone: row.cameras?.[0]?.zone ?? null,
        cameraName: row.cameras?.[0]?.name ?? null,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        resolvedAt: row.resolved_at,
        acknowledgedBy: row.acknowledged_by ?? null,
        acknowledgedAt: row.acknowledged_at ?? null,
      })) ?? []
  );
}

export async function listIncidentCountsLast24h(): Promise<Map<string, number>> {
  const sinceIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabaseAdmin
    .from("incident_events")
    .select("camera_id,cameras!inner(source_type),created_at")
    .gte("created_at", sinceIso);

  if (error) {
    throw new Error(error.message);
  }

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    const relation = (row as { cameras?: Record<string, unknown>[] }).cameras ?? [];
    const sourceType = String(relation[0]?.source_type ?? "snapshot");
    if (sourceType !== "local-device" && sourceType !== "remote-stream") {
      continue;
    }

    const cameraId = String(row.camera_id);
    counts.set(cameraId, (counts.get(cameraId) ?? 0) + 1);
  }

  return counts;
}

async function listIncidentCountsBetween(startIso: string, endIso: string) {
  const { data, error } = await supabaseAdmin
    .from("incident_events")
    .select("camera_id,cameras!inner(source_type),created_at")
    .gte("created_at", startIso)
    .lt("created_at", endIso);

  if (error) {
    throw new Error(error.message);
  }

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    const relation = (row as { cameras?: Record<string, unknown>[] }).cameras ?? [];
    const sourceType = String(relation[0]?.source_type ?? "snapshot");
    if (sourceType !== "local-device" && sourceType !== "remote-stream") {
      continue;
    }
    const cameraId = String(row.camera_id);
    counts.set(cameraId, (counts.get(cameraId) ?? 0) + 1);
  }
  return counts;
}

export async function listIncidentCountsPrevious24h(): Promise<Map<string, number>> {
  const now = Date.now();
  const currentWindowStartIso = new Date(now - 24 * 60 * 60 * 1000).toISOString();
  const previousWindowStartIso = new Date(now - 48 * 60 * 60 * 1000).toISOString();
  return listIncidentCountsBetween(previousWindowStartIso, currentWindowStartIso);
}

export async function listLastIncidentAtByCamera(): Promise<Map<string, string>> {
  const sinceIso = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabaseAdmin
    .from("incident_events")
    .select("camera_id,cameras!inner(source_type),created_at")
    .gte("created_at", sinceIso)
    .order("created_at", { ascending: false })
    .limit(2000);

  if (error) {
    throw new Error(error.message);
  }

  const byCamera = new Map<string, string>();
  for (const row of data ?? []) {
    const relation = (row as { cameras?: Record<string, unknown>[] }).cameras ?? [];
    const sourceType = String(relation[0]?.source_type ?? "snapshot");
    if (sourceType !== "local-device" && sourceType !== "remote-stream") {
      continue;
    }
    const cameraId = String(row.camera_id);
    if (!byCamera.has(cameraId)) {
      byCamera.set(cameraId, String(row.created_at));
    }
  }

  return byCamera;
}
