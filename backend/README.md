# Backend Ingest Runner

This backend folder now includes an ingest runner that pushes camera state into:

- `POST /api/internal/ingest/feed-state`

The runner is intended to be the write path for camera state/incident generation.

## Run

1. Start your Next app:

```bash
pnpm dev
```

2. In another terminal, start the ingest runner:

```bash
pnpm ingest:runner
```

## Configuration

Set these in `.env.local` (or `.env`):

- `INTERNAL_API_TOKEN`: must match your internal ingest API token.
- `INGEST_ENDPOINT_URL`: defaults to `http://localhost:3000/api/internal/ingest/feed-state`
- `INGEST_INTERVAL_MS`: defaults to `3000`
- `CAMERA_SOURCE_MODE`: must be `url`
- `CAMERA_SOURCE_URL`: required if `CAMERA_SOURCE_MODE=url`
- `REMOTE_STALE_THRESHOLD_MS`: optional, defaults to `15000`
- `SHADOW_MODE_ENABLED`: optional, defaults to `true` (set `false` to disable advisory AI shadow outputs)
- `SHADOW_MODEL_MODE`: `heuristic` or `adapter` (recommended)
- `SHADOW_MODEL_ADAPTER_URL`: required when `SHADOW_MODEL_MODE=adapter` (default local MVP: `http://localhost:5050/shadow/infer`)
- `SHADOW_MODEL_TIMEOUT_MS`: adapter request timeout in ms, defaults to `2500`
- `SHADOW_MODEL_FALLBACK_TO_HEURISTIC`: defaults to `true`; when `adapter` fails, fallback to heuristic
- `SHADOW_CAMERA_SOURCES`: optional JSON map of camera IDs to sources for local adapter (`0`, `1`, `rtsp://...`, file path)
- `SHADOW_YOLO_MODEL`: path to YOLO model file (defaults to `yolo26m.pt`, with fallback to `backend/yolo26m.pt` then `backend/best.pt`)
- `SHADOW_YOLO_CONF`: YOLO confidence threshold (default `0.25`)
- `SHADOW_PERSON_CLASS_NAMES`: comma-separated class names to treat as people (default `person,pedestrian`)
- `SHADOW_PERSON_CLASS_IDS`: optional comma-separated class IDs override for person tracking/filtering
- `SHADOW_YOLO_IMGSZ`: YOLO inference size (default `640`)
- `SHADOW_CAPTURE_LOCAL_DEVICE`: defaults to `false`; keep disabled so browser webcam on `/feed` is not blocked by backend capture
- `SHADOW_DEBUG_LOGS`: set `true` to print per-inference YOLO debug output in adapter logs
- `SHADOW_DEBUG_MAX_BOXES`: maximum number of per-frame detection boxes to print (default `12`)

## Modes

### `url`

Fetches payload from `CAMERA_SOURCE_URL`, validates/normalizes it, marks stale cameras offline once, and forwards `payload.feeds` to ingest API.
Expected shape:

```json
{
  "feeds": [
    {
      "id": 201,
      "cameraId": "CAM-201",
      "name": "North Gate",
      "zone": "Zone A",
      "status": "normal",
      "sourceType": "remote-stream",
      "occupancy": 42,
      "capacity": 120,
      "imageUrl": "https://cdn.example.com/cam-201/latest.jpg",
      "streamUrl": "https://stream.example.com/cam-201/index.m3u8",
      "isLive": true,
      "lastUpdated": "2026-02-12T00:00:00.000Z"
    }
  ]
}
```

Required fields are validated: `id`, `cameraId`, `name`, `zone`, `sourceType`, `status`, `occupancy`, `capacity`, `imageUrl`, `lastUpdated`.

## Shadow Adapter Output

When shadow mode is enabled, ingest calls `SHADOW_MODEL_ADAPTER_URL` and expects:

```json
{
  "detections": [
    {
      "cameraId": "LOCAL-1",
      "sourceType": "local-device",
      "modelKey": "venueshield-shadow-adapter",
      "modelVersion": "0.2.0",
      "severity": "high",
      "confidence": 0.83,
      "summary": "Elevated crowd risk detected for Local Camera 1.",
      "recommendedAction": "Prepare response team and monitor for escalation.",
      "tags": ["status:warning", "stale:3s", "live"],
      "metrics": {
        "occupancyRatio": 0.81,
        "predictedRatio5m": 0.91,
        "feedLive": true
      },
      "generatedAt": "2026-02-12T23:59:59.000Z"
    }
  ]
}
```

## Local Adapter MVP (YOLO + optional ByteTrack)

Use this to showcase real detections from your local camera inputs before AWS:

1. Install Python deps:

```bash
python3 -m pip install -r backend/requirements-shadow.txt
```

2. In `.env.local`, set:

```env
SHADOW_MODEL_MODE=adapter
SHADOW_MODEL_ADAPTER_URL=http://localhost:5050/shadow/infer
SHADOW_YOLO_MODEL=yolo26m.pt
SHADOW_PERSON_CLASS_NAMES=person,pedestrian
```

If you use browser-local cameras (`LOCAL-*` on `/feed`), do **not** map them to `0/1` in `SHADOW_CAMERA_SOURCES` unless you intentionally want backend OpenCV to own the webcam device.

3. Run services:

```bash
npm run dev
npm run ingest:runner
npm run shadow:adapter
```

4. Open:
   - `/feed` for live camera tiles and shadow severity
   - `/feed/incident` for advisory details per active camera
