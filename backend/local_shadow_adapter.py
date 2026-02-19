"""Local shadow-mode adapter MVP.

This service consumes feed metadata, grabs the latest frame per camera source,
runs YOLO (+ optional ByteTrack), and returns advisory detections in the
existing shadow contract used by the Next.js app.
"""

from __future__ import annotations

import json
import os
import threading
import time
from base64 import b64decode
from dataclasses import dataclass
from pathlib import Path
from typing import Any
from urllib.error import URLError
from urllib.request import urlopen

import cv2
import numpy as np
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field
from ultralytics import YOLO

try:
    import supervision as sv
except Exception:  # pragma: no cover - optional dependency
    sv = None


MODEL_KEY = "venueshield-local-yolo-bytetrack"
MODEL_VERSION = "0.1.0"


class FeedInput(BaseModel):
    cameraId: str
    sourceType: str
    name: str
    zone: str
    status: str
    occupancy: float
    capacity: float
    imageUrl: str
    frameDataUrl: str | None = None
    streamUrl: str | None = None
    isLive: bool | None = None
    lastUpdated: str


class InferRequest(BaseModel):
    generatedAt: str | None = None
    feeds: list[FeedInput] = Field(default_factory=list)


class DetectionResponse(BaseModel):
    detections: list[dict[str, Any]]
    generatedAt: str


@dataclass
class CameraRuntime:
    capture: cv2.VideoCapture | None = None
    tracker: Any = None
    last_seen: float = 0.0


def _clamp(value: float, minimum: float, maximum: float) -> float:
    return max(minimum, min(maximum, value))


def _load_env_map(name: str) -> dict[str, str]:
    raw = os.getenv(name, "{}").strip()
    if not raw:
        return {}
    try:
        parsed = json.loads(raw)
        if not isinstance(parsed, dict):
            return {}
        result: dict[str, str] = {}
        for key, value in parsed.items():
            if not isinstance(key, str):
                continue
            if isinstance(value, (str, int, float)):
                result[key] = str(value)
        return result
    except json.JSONDecodeError:
        return {}


def _resolve_model_path() -> str:
    configured = os.getenv("SHADOW_YOLO_MODEL", "").strip()
    candidates = []
    if configured:
        candidates.append(Path(configured))
    candidates.extend(
        [
            Path("backend") / "yolo26m.pt",
            Path("yolo26m.pt"),
            Path("backend") / "best.pt",
        ]
    )

    for candidate in candidates:
        if candidate.exists():
            return str(candidate)

    if configured:
        return configured
    return "yolo26m.pt"


def _parse_env_name_set(name: str, default: str) -> set[str]:
    raw = os.getenv(name, default)
    return {token.strip().lower() for token in raw.split(",") if token.strip()}


def _parse_env_int_set(name: str) -> set[int]:
    raw = os.getenv(name, "").strip()
    if not raw:
        return set()
    output: set[int] = set()
    for token in raw.split(","):
        token = token.strip()
        if not token:
            continue
        try:
            output.add(int(token))
        except ValueError:
            continue
    return output


def _compact_counts(counts: dict[str, int], max_items: int = 4) -> str:
    if not counts:
        return "-"
    items = sorted(counts.items(), key=lambda item: (-item[1], item[0]))
    rendered = [f"{label}:{count}" for label, count in items[:max_items]]
    if len(items) > max_items:
        rendered.append(f"+{len(items) - max_items}")
    return ",".join(rendered)


def _severity_from(score: float) -> str:
    if score >= 0.9:
        return "critical"
    if score >= 0.72:
        return "high"
    if score >= 0.52:
        return "medium"
    return "low"


def _action_for(severity: str, live: bool) -> str:
    if not live:
        return "Restore camera stream and verify source health before acting."
    if severity == "critical":
        return "Dispatch response team now and reduce crowd pressure immediately."
    if severity == "high":
        return "Stage responders and prepare controlled flow redirection."
    if severity == "medium":
        return "Increase monitoring cadence and alert operations lead."
    return "Continue normal monitoring."


def _summary_for(severity: str, person_count: int, occupancy_ratio: float, predicted_ratio: float) -> str:
    now_percent = round(occupancy_ratio * 100)
    future_percent = round(predicted_ratio * 100)
    if severity == "critical":
        return f"Critical pressure detected ({now_percent}% now, {future_percent}% predicted)."
    if severity == "high":
        return f"Elevated pressure detected ({now_percent}% now, {future_percent}% predicted)."
    if severity == "medium":
        return f"Moderate pressure trend detected ({now_percent}% now, {future_percent}% predicted)."
    if person_count == 0:
        return "No people currently detected in the active frame."
    return f"Stable activity ({now_percent}% now, {future_percent}% predicted)."


class AdapterEngine:
    def __init__(self) -> None:
        model_path = _resolve_model_path()
        self.model = YOLO(model_path)
        self.person_class_names = _parse_env_name_set(
            "SHADOW_PERSON_CLASS_NAMES", "person,pedestrian"
        )
        self.person_class_ids_override = _parse_env_int_set("SHADOW_PERSON_CLASS_IDS")
        self.person_class_ids = self._resolve_person_classes(self.model.names)
        self.conf_threshold = float(os.getenv("SHADOW_YOLO_CONF", "0.25"))
        self.retry_conf_threshold = float(os.getenv("SHADOW_YOLO_RETRY_CONF", "0.1"))
        self.input_size = int(os.getenv("SHADOW_YOLO_IMGSZ", "640"))
        self.source_map = _load_env_map("SHADOW_CAMERA_SOURCES")
        self.capture_local_device = (
            os.getenv("SHADOW_CAPTURE_LOCAL_DEVICE", "false").strip().lower() == "true"
        )
        self.debug_logs = os.getenv("SHADOW_DEBUG_LOGS", "false").strip().lower() == "true"
        self.debug_verbose = (
            os.getenv("SHADOW_DEBUG_VERBOSE", "false").strip().lower() == "true"
        )
        self.debug_max_boxes = int(os.getenv("SHADOW_DEBUG_MAX_BOXES", "12"))
        self._lock = threading.Lock()
        self._runtimes: dict[str, CameraRuntime] = {}
        print(
            "[shadow-adapter] model loaded",
            json.dumps(
                {
                    "modelPath": model_path,
                    "personClassIds": self.person_class_ids,
                    "personClassNames": sorted(self.person_class_names),
                }
            ),
            flush=True,
        )

    def _resolve_person_classes(self, names: Any) -> list[int] | None:
        resolved: set[int] = set()
        if self.person_class_ids_override:
            available_ids = set()
            if isinstance(names, dict):
                for key in names:
                    try:
                        available_ids.add(int(key))
                    except (TypeError, ValueError):
                        continue
            elif isinstance(names, (list, tuple)):
                available_ids = set(range(len(names)))

            for cls_id in self.person_class_ids_override:
                if not available_ids or cls_id in available_ids:
                    resolved.add(cls_id)
        elif isinstance(names, dict):
            for key, value in names.items():
                try:
                    cls_id = int(key)
                except (TypeError, ValueError):
                    continue
                if str(value).strip().lower() in self.person_class_names:
                    resolved.add(cls_id)
        elif isinstance(names, (list, tuple)):
            for index, value in enumerate(names):
                if str(value).strip().lower() in self.person_class_names:
                    resolved.add(index)

        if resolved:
            return sorted(resolved)
        return None

    def _get_runtime(self, camera_id: str) -> CameraRuntime:
        runtime = self._runtimes.get(camera_id)
        if runtime is None:
            runtime = CameraRuntime()
            self._runtimes[camera_id] = runtime
        runtime.last_seen = time.time()
        return runtime

    def _normalize_source(self, feed: FeedInput) -> Any:
        if feed.sourceType == "local-device" and not self.capture_local_device:
            # Browser-local webcam should not be opened by backend adapter by default.
            # This avoids webcam lock contention with getUserMedia on /feed.
            return None

        source = self.source_map.get(feed.cameraId) or feed.streamUrl or feed.imageUrl
        if source is None:
            return None
        source = str(source).strip()
        if source.isdigit():
            return int(source)
        return source

    def _frame_from_http_image(self, url: str) -> np.ndarray | None:
        try:
            with urlopen(url, timeout=2.0) as response:
                payload = response.read()
        except URLError:
            return None

        arr = np.frombuffer(payload, dtype=np.uint8)
        if arr.size == 0:
            return None
        return cv2.imdecode(arr, cv2.IMREAD_COLOR)

    def _frame_from_data_url(self, data_url: str) -> np.ndarray | None:
        if not data_url.startswith("data:image/"):
            return None
        marker = ";base64,"
        if marker not in data_url:
            return None
        _, encoded = data_url.split(marker, 1)
        try:
            payload = b64decode(encoded, validate=False)
        except Exception:
            return None

        arr = np.frombuffer(payload, dtype=np.uint8)
        if arr.size == 0:
            return None
        return cv2.imdecode(arr, cv2.IMREAD_COLOR)

    def _read_frame(self, feed: FeedInput) -> np.ndarray | None:
        if feed.frameDataUrl:
            frame = self._frame_from_data_url(feed.frameDataUrl)
            if frame is not None:
                return frame

        source = self._normalize_source(feed)
        if source is None:
            return None

        if isinstance(source, str) and source.startswith(("http://", "https://")) and source == feed.imageUrl:
            return self._frame_from_http_image(source)

        runtime = self._get_runtime(feed.cameraId)
        if runtime.capture is None:
            runtime.capture = cv2.VideoCapture(source)

        if runtime.capture is None or not runtime.capture.isOpened():
            runtime.capture = cv2.VideoCapture(source)

        if runtime.capture is None or not runtime.capture.isOpened():
            return None

        ok, frame = runtime.capture.read()
        if not ok:
            runtime.capture.release()
            runtime.capture = None
            return None

        return frame

    def _track_people(
        self, feed: FeedInput, result: Any, person_indices: list[int] | None
    ) -> tuple[int, float]:
        person_indices = person_indices or self._resolve_person_classes(result.names) or [0]

        boxes = result.boxes
        if boxes is None or len(boxes) == 0:
            return 0, 0.0

        detections = []
        confidences = []
        for box in boxes:
            cls_id = int(box.cls[0])
            conf = float(box.conf[0])
            if cls_id not in person_indices:
                continue
            detections.append(box)
            confidences.append(conf)

        if not detections:
            return 0, 0.0

        average_conf = float(sum(confidences) / max(1, len(confidences)))

        if sv is None:
            return len(detections), average_conf

        runtime = self._get_runtime(feed.cameraId)
        if runtime.tracker is None:
            runtime.tracker = sv.ByteTrack(frame_rate=10)

        full_detections = sv.Detections.from_ultralytics(result)
        if full_detections.class_id is None:
            return len(detections), average_conf

        person_mask = np.isin(full_detections.class_id, np.array(person_indices, dtype=int))
        filtered = full_detections[person_mask]
        tracked = runtime.tracker.update_with_detections(filtered)

        if tracked.tracker_id is None:
            return len(detections), average_conf

        active_tracks = {int(track_id) for track_id in tracked.tracker_id if track_id is not None}
        return len(active_tracks), average_conf

    def _run_predict(
        self, frame: np.ndarray, conf: float, person_indices: list[int] | None
    ) -> Any:
        kwargs: dict[str, Any] = {
            "imgsz": self.input_size,
            "conf": conf,
            "verbose": False,
        }
        if person_indices:
            kwargs["classes"] = person_indices
        return self.model.predict(frame, **kwargs)[0]

    def infer_feed(self, feed: FeedInput, generated_at: str) -> dict[str, Any]:
        frame = self._read_frame(feed)

        person_count = 0
        vision_conf = 0.4
        class_counts: dict[str, int] = {}
        total_detections = 0
        detection_boxes: list[dict[str, Any]] = []
        frame_shape: dict[str, int] | None = None
        threshold_used = self.conf_threshold
        if frame is not None:
            frame_shape = {"height": int(frame.shape[0]), "width": int(frame.shape[1])}
            result = self._run_predict(frame, self.conf_threshold, self.person_class_ids)
            if (
                result.boxes is not None
                and len(result.boxes) == 0
                and self.retry_conf_threshold < self.conf_threshold
            ):
                threshold_used = self.retry_conf_threshold
                result = self._run_predict(
                    frame, self.retry_conf_threshold, self.person_class_ids
                )
            person_count, vision_conf = self._track_people(
                feed, result, self.person_class_ids
            )
            boxes = result.boxes
            if boxes is not None:
                total_detections = len(boxes)
                for box in boxes:
                    cls_id = int(box.cls[0])
                    conf = float(box.conf[0])
                    label = str(result.names.get(cls_id, cls_id))
                    class_counts[label] = class_counts.get(label, 0) + 1
                    if len(detection_boxes) < max(0, self.debug_max_boxes):
                        xyxy = box.xyxy[0].tolist()
                        detection_boxes.append(
                            {
                                "classId": cls_id,
                                "classLabel": label,
                                "confidence": round(conf, 4),
                                "xyxy": [
                                    round(float(xyxy[0]), 2),
                                    round(float(xyxy[1]), 2),
                                    round(float(xyxy[2]), 2),
                                    round(float(xyxy[3]), 2),
                                ],
                            }
                        )

        capacity = max(1.0, float(feed.capacity))
        occupancy_ratio = _clamp(float(feed.occupancy) / capacity, 0.0, 2.0)

        inferred_ratio = _clamp(person_count / capacity, 0.0, 2.0)
        blended_ratio = _clamp(max(occupancy_ratio, inferred_ratio), 0.0, 2.0)

        live = bool(feed.isLive) if feed.isLive is not None else feed.status != "offline"
        status_boost = 0.2 if feed.status == "alert" else 0.1 if feed.status == "warning" else 0.0
        offline_boost = 0.25 if not live else 0.0

        score = _clamp(blended_ratio + status_boost + offline_boost, 0.0, 1.0)
        severity = _severity_from(score)

        predicted_ratio = _clamp(blended_ratio + (0.15 if severity in {"critical", "high"} else 0.05), 0.0, 1.5)
        confidence = _clamp((vision_conf * 0.6) + (0.35 if frame is not None else 0.15), 0.3, 0.99)

        if self.debug_logs:
            frame_label = (
                f"{frame_shape['width']}x{frame_shape['height']}"
                if frame_shape is not None
                else "-"
            )
            print(
                "[shadow-yolo]",
                (
                    f"cam={feed.cameraId} frame={frame_label} det={total_detections} "
                    f"people={person_count} classes={_compact_counts(class_counts)} "
                    f"vconf={vision_conf:.3f} occ={blended_ratio:.3f} pred={predicted_ratio:.3f} "
                    f"sev={severity} conf={confidence:.3f} thr={threshold_used:.3f}"
                ),
                flush=True,
            )
        if self.debug_logs and self.debug_verbose:
            print(
                "[shadow-yolo-detail]",
                json.dumps(
                    {
                        "cameraId": feed.cameraId,
                        "frameAvailable": frame is not None,
                        "frameShape": frame_shape,
                        "totalDetections": total_detections,
                        "classCounts": class_counts,
                        "detectionBoxes": detection_boxes,
                        "personCountTracked": person_count,
                        "visionConfidence": round(vision_conf, 4),
                        "occupancyRatio": round(blended_ratio, 4),
                        "predictedRatio5m": round(predicted_ratio, 4),
                        "severity": severity,
                        "confidence": round(confidence, 4),
                        "thresholdUsed": round(float(threshold_used), 4),
                    }
                ),
                flush=True,
            )

        return {
            "cameraId": feed.cameraId,
            "sourceType": feed.sourceType,
            "modelKey": MODEL_KEY,
            "modelVersion": MODEL_VERSION,
            "severity": severity,
            "confidence": confidence,
            "summary": _summary_for(severity, person_count, blended_ratio, predicted_ratio),
            "recommendedAction": _action_for(severity, live),
            "tags": [
                f"status:{feed.status}",
                f"source:{feed.sourceType}",
                "vision:frame" if frame is not None else "vision:none",
                "tracker:bytetrack" if sv is not None else "tracker:fallback",
            ],
            "metrics": {
                "occupancyRatio": round(blended_ratio, 4),
                "predictedRatio5m": round(predicted_ratio, 4),
                "feedLive": live,
                "frameAvailable": frame is not None,
                "frameShape": frame_shape,
                "totalDetections": total_detections,
                "personCountTracked": person_count,
                "visionConfidence": round(vision_conf, 4),
                "classCounts": class_counts,
                "detectionBoxes": detection_boxes,
                "thresholdUsed": round(float(threshold_used), 4),
            },
            "generatedAt": generated_at,
        }

    def infer(self, feeds: list[FeedInput], generated_at: str) -> list[dict[str, Any]]:
        output: list[dict[str, Any]] = []
        with self._lock:
            for feed in feeds:
                if feed.sourceType not in {"local-device", "remote-stream"}:
                    continue
                output.append(self.infer_feed(feed, generated_at))
        return output


app = FastAPI(title="VenueShield Local Shadow Adapter", version="0.1.0")
engine = AdapterEngine()


@app.get("/health")
def health() -> dict[str, Any]:
    return {
        "ok": True,
        "model": MODEL_KEY,
        "version": MODEL_VERSION,
        "bytetrack": sv is not None,
    }


@app.post("/shadow/infer", response_model=DetectionResponse)
def infer(
    payload: InferRequest,
    x_internal_token: str | None = Header(default=None),
) -> DetectionResponse:
    required = os.getenv("INTERNAL_API_TOKEN", "").strip()
    if required and x_internal_token != required:
        raise HTTPException(status_code=401, detail="Unauthorized")

    generated_at = payload.generatedAt or time.strftime("%Y-%m-%dT%H:%M:%S.000Z", time.gmtime())
    detections = engine.infer(payload.feeds, generated_at)
    return DetectionResponse(detections=detections, generatedAt=generated_at)
