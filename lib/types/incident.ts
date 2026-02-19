export type IncidentSeverity = "low" | "medium" | "high" | "critical";
export type IncidentStatus = "active" | "resolved";
export type IncidentType =
  | "capacity_warning"
  | "capacity_critical"
  | "camera_offline"
  | "camera_recovered";

export interface IncidentEvent {
  id: string;
  cameraId: string;
  type: IncidentType;
  severity: IncidentSeverity;
  status: IncidentStatus;
  title: string;
  description: string;
  triggerValue?: number | null;
  thresholdValue?: number | null;
  source: "rule-engine";
  zone?: string | null;
  cameraName?: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string | null;
  acknowledgedBy?: string | null;
  acknowledgedAt?: string | null;
}
