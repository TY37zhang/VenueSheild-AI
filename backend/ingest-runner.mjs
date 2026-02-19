import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const ROOT_DIR = path.resolve(path.dirname(__filename), "..");

function parseEnvFile(content) {
  const lines = content.split(/\r?\n/);
  const entries = {};

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx <= 0) continue;

    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    } else {
      // Support inline comments in .env values: KEY=value # comment
      value = value.split(/\s+#/, 1)[0].trim();
    }

    entries[key] = value;
  }

  return entries;
}

async function loadLocalEnv() {
  const files = [".env.local", ".env"];

  for (const file of files) {
    try {
      const raw = await fs.readFile(path.join(ROOT_DIR, file), "utf8");
      const parsed = parseEnvFile(raw);
      for (const [key, value] of Object.entries(parsed)) {
        if (process.env[key] === undefined) {
          process.env[key] = value;
        }
      }
    } catch {
      // Ignore missing env file.
    }
  }
}

function parseNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

async function readFeedsFromUrl(sourceUrl) {
  const response = await fetch(sourceUrl, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Camera source URL failed with ${response.status}`);
  }

  const payload = await response.json();
  if (!payload || !Array.isArray(payload.feeds)) {
    throw new Error("Camera source payload must include a feeds array.");
  }
  return payload.feeds;
}

const VALID_STATUSES = new Set(["normal", "warning", "alert", "offline"]);

function normalizeRemoteFeed(raw, nowIso, index) {
  const errors = [];
  if (!raw || typeof raw !== "object") {
    return { errors: [`feeds[${index}] must be an object`] };
  }

  const sourceType = raw.sourceType;
  if (sourceType !== "remote-stream") {
    errors.push("sourceType must be 'remote-stream'");
  }

  const cameraId = typeof raw.cameraId === "string" ? raw.cameraId.trim() : "";
  if (!cameraId) errors.push("cameraId must be a non-empty string");

  const id = Number(raw.id);
  if (!Number.isFinite(id) || id < 0) {
    errors.push("id must be a non-negative number");
  }

  const name = typeof raw.name === "string" ? raw.name.trim() : "";
  if (!name) errors.push("name must be a non-empty string");

  const zone = typeof raw.zone === "string" ? raw.zone.trim() : "";
  if (!zone) errors.push("zone must be a non-empty string");

  const status = String(raw.status ?? "");
  if (!VALID_STATUSES.has(status)) {
    errors.push("status must be one of normal|warning|alert|offline");
  }

  const occupancy = Number(raw.occupancy);
  if (!Number.isFinite(occupancy) || occupancy < 0) {
    errors.push("occupancy must be a non-negative number");
  }

  const capacity = Number(raw.capacity);
  if (!Number.isFinite(capacity) || capacity <= 0) {
    errors.push("capacity must be a positive number");
  }

  if (Number.isFinite(occupancy) && Number.isFinite(capacity) && occupancy > capacity) {
    errors.push("occupancy cannot be greater than capacity");
  }

  const imageUrl = typeof raw.imageUrl === "string" ? raw.imageUrl.trim() : "";
  if (!imageUrl) errors.push("imageUrl must be a non-empty string");

  const streamUrl =
    typeof raw.streamUrl === "string" && raw.streamUrl.trim().length > 0
      ? raw.streamUrl
      : undefined;

  let isLive = raw.isLive;
  if (typeof isLive !== "boolean") {
    isLive = status !== "offline";
  }

  const lastUpdated =
    typeof raw.lastUpdated === "string" && !Number.isNaN(Date.parse(raw.lastUpdated))
      ? raw.lastUpdated
      : nowIso;

  if (errors.length > 0) {
    return { errors };
  }

  return {
    feed: {
      id,
      cameraId,
      name,
      zone,
      sourceType: "remote-stream",
      status,
      occupancy,
      capacity,
      imageUrl,
      streamUrl,
      isLive,
      lastUpdated,
    },
  };
}

async function main() {
  await loadLocalEnv();

  const ingestUrl =
    process.env.INGEST_ENDPOINT_URL ??
    "http://localhost:3000/api/internal/ingest/feed-state";
  const intervalMs = parseNumber(process.env.INGEST_INTERVAL_MS, 3000);
  const sourceMode = process.env.CAMERA_SOURCE_MODE ?? "url";
  const sourceUrl = process.env.CAMERA_SOURCE_URL ?? "";
  const staleThresholdMs = parseNumber(process.env.REMOTE_STALE_THRESHOLD_MS, 15000);
  const internalToken =
    process.env.INGEST_INTERNAL_API_TOKEN ?? process.env.INTERNAL_API_TOKEN ?? "";

  if (!internalToken) {
    console.warn(
      "[ingest-runner] INTERNAL_API_TOKEN not set. This works only in non-production auth fallback mode.",
    );
  }

  console.log(
    `[ingest-runner] starting mode=${sourceMode} intervalMs=${intervalMs} ingestUrl=${ingestUrl}`,
  );

  if (sourceMode !== "url") {
    throw new Error(
      "CAMERA_SOURCE_MODE=sample is deprecated. Use CAMERA_SOURCE_MODE=url with remote-stream payloads.",
    );
  }

  if (sourceMode === "url" && !sourceUrl) {
    throw new Error(
      "CAMERA_SOURCE_MODE=url requires CAMERA_SOURCE_URL to be set.",
    );
  }

  const knownCameras = new Map();

  const tick = async () => {
    const started = Date.now();
    const now = Date.now();
    const nowIso = new Date(now).toISOString();

    try {
      const rawFeeds = await readFeedsFromUrl(sourceUrl);
      const accepted = [];
      const rejected = [];

      for (const [index, raw] of rawFeeds.entries()) {
        const normalized = normalizeRemoteFeed(raw, nowIso, index);
        if (normalized.errors) {
          rejected.push({
            index,
            errors: normalized.errors,
          });
          continue;
        }
        accepted.push(normalized.feed);
      }

      const seenIds = new Set(accepted.map((feed) => feed.cameraId));
      for (const feed of accepted) {
        knownCameras.set(feed.cameraId, {
          lastSeenMs: now,
          offlineSent: false,
          lastFeed: feed,
        });
      }

      const staleOfflineFeeds = [];
      for (const [cameraId, state] of knownCameras.entries()) {
        if (seenIds.has(cameraId)) continue;
        if (state.offlineSent) continue;
        const ageMs = now - state.lastSeenMs;
        if (ageMs < staleThresholdMs) continue;

        staleOfflineFeeds.push({
          ...state.lastFeed,
          status: "offline",
          occupancy: 0,
          isLive: false,
          lastUpdated: nowIso,
        });
        state.offlineSent = true;
      }

      const feeds = [...accepted, ...staleOfflineFeeds];
      if (feeds.length === 0) {
        console.log(
          `[ingest-runner] skip accepted=0 rejected=${rejected.length} stale=0`,
        );
        return;
      }

      const response = await fetch(ingestUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(internalToken ? { "x-internal-token": internalToken } : {}),
        },
        body: JSON.stringify({ feeds }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Ingest failed (${response.status}): ${text}`);
      }

      const payload = await response.json();
      const duration = Date.now() - started;
      console.log(
        `[ingest-runner] ok cameras=${feeds.length} accepted=${accepted.length} staleOffline=${staleOfflineFeeds.length} rejected=${rejected.length} mode=${payload.mode ?? "custom"} durationMs=${duration}`,
      );
      if (rejected.length > 0) {
        console.warn("[ingest-runner] rejected feeds", rejected);
      }
    } catch (error) {
      const duration = Date.now() - started;
      console.error(`[ingest-runner] error durationMs=${duration}`, error);
    }
  };

  await tick();
  const timer = setInterval(() => {
    void tick();
  }, intervalMs);

  process.on("SIGINT", () => {
    clearInterval(timer);
    console.log("[ingest-runner] stopped");
    process.exit(0);
  });
}

void main();
