export interface FeedHistoryRow {
  cameraId: string;
  status: "normal" | "warning" | "alert" | "offline";
  isLive: boolean;
  recordedAt: string;
  sourceType: "snapshot" | "local-device" | "remote-stream";
}

export interface FeedHealthEvent {
  cameraId: string;
  eventType: "live" | "offline" | "status_change";
  status: "normal" | "warning" | "alert" | "offline";
  recordedAt: string;
  ageSeconds: number;
}

export function deriveFeedHealthEvents(
  rows: FeedHistoryRow[],
  nowMs: number,
): FeedHealthEvent[] {
  const historyByCamera = new Map<string, FeedHistoryRow[]>();
  for (const row of rows) {
    if (row.sourceType === "snapshot") continue;
    const bucket = historyByCamera.get(row.cameraId) ?? [];
    bucket.push(row);
    historyByCamera.set(row.cameraId, bucket);
  }

  const events: FeedHealthEvent[] = [];
  for (const cameraRows of historyByCamera.values()) {
    const sorted = [...cameraRows].sort(
      (a, b) => Date.parse(a.recordedAt) - Date.parse(b.recordedAt),
    );

    let prev: FeedHistoryRow | null = null;
    for (const row of sorted) {
      let eventType: FeedHealthEvent["eventType"] | null = null;
      if (!prev) {
        eventType = row.status === "offline" || !row.isLive ? "offline" : "live";
      } else if ((prev.status === "offline" || !prev.isLive) && row.isLive) {
        eventType = "live";
      } else if (prev.isLive && (row.status === "offline" || !row.isLive)) {
        eventType = "offline";
      } else if (prev.status !== row.status) {
        eventType = "status_change";
      }

      if (eventType) {
        const recordedMs = Date.parse(row.recordedAt);
        const ageSeconds = Number.isNaN(recordedMs)
          ? 0
          : Math.max(0, Math.floor((nowMs - recordedMs) / 1000));
        events.push({
          cameraId: row.cameraId,
          eventType,
          status: row.status,
          recordedAt: row.recordedAt,
          ageSeconds,
        });
      }
      prev = row;
    }
  }

  events.sort((a, b) => Date.parse(b.recordedAt) - Date.parse(a.recordedAt));
  return events;
}
