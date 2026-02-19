import type { IncidentEvent } from "@/lib/types/incident";

interface IncidentResponse {
  incidents: IncidentEvent[];
  count: number;
  generatedAt: string;
}

export async function fetchIncidents(options?: {
  status?: "active" | "resolved" | "all";
  limit?: number;
}): Promise<IncidentResponse> {
  const params = new URLSearchParams();
  if (options?.status) {
    params.set("status", options.status);
  }
  if (options?.limit) {
    params.set("limit", String(options.limit));
  }
  const query = params.toString();
  const response = await fetch(`/api/incidents${query ? `?${query}` : ""}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch incidents");
  }

  return response.json() as Promise<IncidentResponse>;
}
