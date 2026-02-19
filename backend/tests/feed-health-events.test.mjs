import test from "node:test";
import assert from "node:assert/strict";
import { deriveFeedHealthEvents } from "../../lib/feed/health-events.ts";

test("deriveFeedHealthEvents emits live -> offline -> live transitions", () => {
  const now = Date.parse("2026-02-12T12:00:00.000Z");
  const events = deriveFeedHealthEvents(
    [
      {
        cameraId: "CAM-201",
        status: "normal",
        isLive: true,
        recordedAt: "2026-02-12T11:55:00.000Z",
        sourceType: "remote-stream",
      },
      {
        cameraId: "CAM-201",
        status: "offline",
        isLive: false,
        recordedAt: "2026-02-12T11:56:00.000Z",
        sourceType: "remote-stream",
      },
      {
        cameraId: "CAM-201",
        status: "normal",
        isLive: true,
        recordedAt: "2026-02-12T11:57:00.000Z",
        sourceType: "remote-stream",
      },
    ],
    now,
  );

  const ordered = [...events].sort(
    (a, b) => Date.parse(a.recordedAt) - Date.parse(b.recordedAt),
  );

  assert.equal(ordered.length, 3);
  assert.deepEqual(
    ordered.map((event) => event.eventType),
    ["live", "offline", "live"],
  );
  assert.deepEqual(
    ordered.map((event) => event.status),
    ["normal", "offline", "normal"],
  );
});

test("deriveFeedHealthEvents ignores snapshot source rows", () => {
  const events = deriveFeedHealthEvents(
    [
      {
        cameraId: "CAM-01",
        status: "normal",
        isLive: true,
        recordedAt: "2026-02-12T11:55:00.000Z",
        sourceType: "snapshot",
      },
    ],
    Date.now(),
  );

  assert.equal(events.length, 0);
});
