import type {
  CameraFeed,
  CameraSourceType,
  CameraStatus,
} from "@/lib/types/camera";

const CAMERA_STATUSES: CameraStatus[] = ["normal", "warning", "alert", "offline"];
const CAMERA_SOURCE_TYPES: CameraSourceType[] = [
  "snapshot",
  "local-device",
  "remote-stream",
];

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isIsoDateString(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return false;
  return value.includes("T");
}

interface ValidateCameraFeedOptions {
  allowedSourceTypes: CameraSourceType[];
  localCameraIdPrefix?: string;
}

export function validateCameraFeed(
  input: unknown,
  options: ValidateCameraFeedOptions,
): { valid: true; feed: CameraFeed } | { valid: false; errors: string[] } {
  const errors: string[] = [];
  if (!isObject(input)) {
    return { valid: false, errors: ["feed must be an object"] };
  }

  const sourceType = input.sourceType;
  const status = input.status;
  const cameraId = input.cameraId;

  if (!CAMERA_SOURCE_TYPES.includes(sourceType as CameraSourceType)) {
    errors.push("sourceType must be one of snapshot|local-device|remote-stream");
  } else if (!options.allowedSourceTypes.includes(sourceType as CameraSourceType)) {
    errors.push(
      `sourceType ${String(sourceType)} is not allowed for this endpoint`,
    );
  }

  if (typeof cameraId !== "string" || cameraId.trim().length === 0) {
    errors.push("cameraId must be a non-empty string");
  } else if (
    options.localCameraIdPrefix &&
    !cameraId.startsWith(options.localCameraIdPrefix)
  ) {
    errors.push(`cameraId must start with ${options.localCameraIdPrefix}`);
  }

  if (!isFiniteNumber(input.id) || input.id < 0) {
    errors.push("id must be a non-negative number");
  }

  if (typeof input.name !== "string" || input.name.trim().length === 0) {
    errors.push("name must be a non-empty string");
  }

  if (typeof input.zone !== "string" || input.zone.trim().length === 0) {
    errors.push("zone must be a non-empty string");
  }

  if (!CAMERA_STATUSES.includes(status as CameraStatus)) {
    errors.push("status must be one of normal|warning|alert|offline");
  }

  if (!isFiniteNumber(input.occupancy) || input.occupancy < 0) {
    errors.push("occupancy must be a non-negative number");
  }

  if (!isFiniteNumber(input.capacity) || input.capacity <= 0) {
    errors.push("capacity must be a positive number");
  }

  if (
    isFiniteNumber(input.occupancy) &&
    isFiniteNumber(input.capacity) &&
    input.occupancy > input.capacity
  ) {
    errors.push("occupancy cannot be greater than capacity");
  }

  if (typeof input.imageUrl !== "string" || input.imageUrl.trim().length === 0) {
    errors.push("imageUrl must be a non-empty string");
  }

  if (!isIsoDateString(input.lastUpdated)) {
    errors.push("lastUpdated must be a valid ISO timestamp");
  }

  if (input.streamUrl != null && typeof input.streamUrl !== "string") {
    errors.push("streamUrl must be a string when provided");
  }

  if (input.frameDataUrl != null && typeof input.frameDataUrl !== "string") {
    errors.push("frameDataUrl must be a string when provided");
  }

  if (input.isLive != null && typeof input.isLive !== "boolean") {
    errors.push("isLive must be a boolean when provided");
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    feed: {
      id: Number(input.id),
      cameraId: String(input.cameraId),
      name: String(input.name),
      zone: String(input.zone),
      sourceType: input.sourceType as CameraSourceType,
      status: input.status as CameraStatus,
      occupancy: Number(input.occupancy),
      capacity: Number(input.capacity),
      imageUrl: String(input.imageUrl),
      frameDataUrl:
        typeof input.frameDataUrl === "string" ? input.frameDataUrl : undefined,
      streamUrl:
        typeof input.streamUrl === "string" ? input.streamUrl : undefined,
      isLive:
        typeof input.isLive === "boolean"
          ? input.isLive
          : input.status !== "offline",
      lastUpdated: String(input.lastUpdated),
    },
  };
}
