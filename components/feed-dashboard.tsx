"use client";

import { useEffect, useRef, useState } from "react";
import { Activity, AlertTriangle, Camera, Maximize2 } from "lucide-react";
import Image from "next/image";
import type { CameraFeed } from "@/lib/feed";
import type { ShadowDetection } from "@/lib/types/shadow";
import { useRouter, useSearchParams } from "next/navigation";
import {
  LocalCameraTile,
  type LocalCameraRuntimeState,
} from "@/components/local-camera-tile";

interface FeedApiResponse {
  feeds: CameraFeed[];
  shadowByCamera?: Record<string, ShadowDetection>;
  generatedAt: string;
}

interface FeedHealthEntry {
  cameraId: string;
  name: string;
  sourceType: "local-device" | "remote-stream";
  status: "normal" | "warning" | "alert" | "offline";
  isLive: boolean;
  lastUpdated: string;
  ageSeconds: number;
  isStale: boolean;
  staleReason: string | null;
  incidentCount24h: number;
  incidentTrend: "rising" | "falling" | "stable";
  incidentTrendDelta: number;
  lastIncidentAt: string | null;
}

interface FeedHealthApiResponse {
  summary: {
    total: number;
    live: number;
    offline: number;
    stale: number;
    generatedAt: string;
  };
  cameras: FeedHealthEntry[];
  events: {
    cameraId: string;
    eventType: "live" | "offline" | "status_change";
    status: "normal" | "warning" | "alert" | "offline";
    recordedAt: string;
    ageSeconds: number;
  }[];
}

export default function FeedDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedCamera, setSelectedCamera] = useState<
    string | "local" | "local-2" | null
  >(null);
  const [cameraFeeds, setCameraFeeds] = useState<CameraFeed[]>([]);
  const [shadowByCamera, setShadowByCamera] = useState<
    Record<string, ShadowDetection>
  >({});
  const [cameraInputs, setCameraInputs] = useState<MediaDeviceInfo[]>([]);
  const [localPrimaryDeviceId, setLocalPrimaryDeviceId] = useState<string>("");
  const [localSecondaryDeviceId, setLocalSecondaryDeviceId] = useState<string>("");
  const [localPrimaryState, setLocalPrimaryState] =
    useState<LocalCameraRuntimeState | null>(null);
  const [localSecondaryState, setLocalSecondaryState] =
    useState<LocalCameraRuntimeState | null>(null);
  const [localSessionReady, setLocalSessionReady] = useState(false);
  const [feedHealth, setFeedHealth] = useState<FeedHealthApiResponse | null>(null);
  const [diagnosticCameraId, setDiagnosticCameraId] = useState<string | null>(null);
  const [healthAlerts, setHealthAlerts] = useState<
    { id: string; type: "critical" | "recovery"; message: string }[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastPostedStateRef = useRef<Record<string, "live" | "offline">>({});
  const latestFrameDataRef = useRef<Record<"LOCAL-1" | "LOCAL-2", string | null>>({
    "LOCAL-1": null,
    "LOCAL-2": null,
  });
  const previousHealthSeverityRef = useRef<string | null>(null);
  const previousOfflineSetRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    let isMounted = true;

    const fetchFeeds = async () => {
      try {
        const response = await fetch("/api/feed", { cache: "no-store" });
        const payload: FeedApiResponse = await response.json();

        if (!response.ok) {
          throw new Error("Failed to fetch feed data");
        }

        if (!isMounted) return;
        setCameraFeeds(payload.feeds ?? []);
        setShadowByCamera(payload.shadowByCamera ?? {});
        setError(null);
      } catch {
        if (!isMounted) return;
        setError("Could not load camera feeds. Please retry.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchFeeds();
    const interval = setInterval(fetchFeeds, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const fetchHealth = async () => {
      try {
        const response = await fetch("/api/feed/health", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Failed to fetch feed health");
        }
        const payload: FeedHealthApiResponse = await response.json();
        if (!mounted) return;
        setFeedHealth(payload);
      } catch (err) {
        console.warn("[feed] failed to fetch feed health", err);
      }
    };

    void fetchHealth();
    const timer = setInterval(() => {
      void fetchHealth();
    }, 5000);

    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.enumerateDevices) {
      return;
    }

    const syncCameraInputs = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((device) => device.kind === "videoinput");
        setCameraInputs(videoInputs);
      } catch (err) {
        console.warn("[feed] failed to enumerate video inputs", err);
        setCameraInputs([]);
      }
    };

    void syncCameraInputs();
    navigator.mediaDevices.addEventListener("devicechange", syncCameraInputs);

    return () => {
      navigator.mediaDevices.removeEventListener("devicechange", syncCameraInputs);
    };
  }, []);

  useEffect(() => {
    if (cameraInputs.length === 0) {
      setLocalPrimaryDeviceId("");
      setLocalSecondaryDeviceId("");
      return;
    }

    if (!localPrimaryDeviceId || !cameraInputs.some((d) => d.deviceId === localPrimaryDeviceId)) {
      setLocalPrimaryDeviceId(cameraInputs[0].deviceId);
    }

    if (
      cameraInputs.length > 1 &&
      (!localSecondaryDeviceId ||
        !cameraInputs.some((d) => d.deviceId === localSecondaryDeviceId) ||
        localSecondaryDeviceId === localPrimaryDeviceId)
    ) {
      const secondary = cameraInputs.find((d) => d.deviceId !== localPrimaryDeviceId);
      if (secondary) {
        setLocalSecondaryDeviceId(secondary.deviceId);
      }
    } else if (cameraInputs.length <= 1 && localSecondaryDeviceId) {
      setLocalSecondaryDeviceId("");
    }
  }, [cameraInputs, localPrimaryDeviceId, localSecondaryDeviceId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "alert":
        return "bg-red-500";
      case "warning":
        return "bg-amber-500";
      default:
        return "bg-emerald-500";
    }
  };

  useEffect(() => {
    let mounted = true;

    const ensureLocalSession = async () => {
      try {
        const response = await fetch("/api/feed/local-state/session", {
          method: "POST",
          cache: "no-store",
          credentials: "same-origin",
        });
        if (!mounted) return;
        if (!response.ok) {
          setLocalSessionReady(false);
          return;
        }
        setLocalSessionReady(true);
      } catch (err) {
        console.warn("[feed] failed to initialize local ingest session", err);
        if (!mounted) return;
        setLocalSessionReady(false);
      }
    };

    void ensureLocalSession();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!localSessionReady) {
      return;
    }

    const buildLocalFeed = (
      cameraId: "LOCAL-1" | "LOCAL-2",
      numericId: number,
      title: string,
      state: LocalCameraRuntimeState | null,
    ): CameraFeed => {
      const isLive = state?.isLive ?? false;
      return {
        id: numericId,
        cameraId,
        name: state?.selectedDeviceLabel || title,
        zone: "Local Device",
        sourceType: "local-device",
        status: isLive ? "normal" : "offline",
        occupancy: 0,
        capacity: 12,
        imageUrl: "/placeholder.jpg",
        frameDataUrl: isLive ? (latestFrameDataRef.current[cameraId] ?? undefined) : undefined,
        isLive,
        lastUpdated: new Date().toISOString(),
      };
    };

    const queueFeedIfNeeded = (
      nextFeeds: CameraFeed[],
      cameraId: "LOCAL-1" | "LOCAL-2",
      numericId: number,
      title: string,
      state: LocalCameraRuntimeState | null,
    ) => {
      const previous = lastPostedStateRef.current[cameraId];
      const isLive = state?.isLive === true;

      if (isLive) {
        nextFeeds.push(buildLocalFeed(cameraId, numericId, title, state));
        return;
      }

      // Emit a single offline transition after a previously live stream stops.
      if (previous === "live") {
        nextFeeds.push({
          ...buildLocalFeed(cameraId, numericId, title, state),
          status: "offline",
          occupancy: 0,
          isLive: false,
        });
      }
    };

    const pushLocalState = async () => {
      const feeds: CameraFeed[] = [];
      queueFeedIfNeeded(
        feeds,
        "LOCAL-1",
        1001,
        "Local Camera 1",
        localPrimaryState,
      );

      if (cameraInputs.length > 1) {
        queueFeedIfNeeded(
          feeds,
          "LOCAL-2",
          1002,
          "Local Camera 2",
          localSecondaryState,
        );
      } else if (lastPostedStateRef.current["LOCAL-2"] === "live") {
        feeds.push({
          ...buildLocalFeed("LOCAL-2", 1002, "Local Camera 2", null),
          status: "offline",
          occupancy: 0,
          isLive: false,
        });
      }

      if (feeds.length === 0) {
        return;
      }

      try {
        const response = await fetch("/api/feed/local-state", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "same-origin",
          body: JSON.stringify({ feeds }),
        });
        if (!response.ok) {
          const message = await response.text();
          console.warn("[feed] local state push rejected", {
            status: response.status,
            message,
          });
          return;
        }

        for (const feed of feeds) {
          lastPostedStateRef.current[feed.cameraId] = feed.isLive
            ? "live"
            : "offline";
        }
      } catch (err) {
        console.warn("[feed] failed to push local camera state", err);
      }
    };

    void pushLocalState();
    const timer = setInterval(() => {
      void pushLocalState();
    }, 3000);

    return () => clearInterval(timer);
  }, [cameraInputs.length, localPrimaryState, localSecondaryState, localSessionReady]);

  const remoteFeeds = cameraFeeds.filter(
    (feed) => feed.sourceType === "remote-stream",
  );
  const incidentCountByCamera = new Map(
    (feedHealth?.cameras ?? []).map((camera) => [
      camera.cameraId,
      camera.incidentCount24h,
    ]),
  );

  const maxAgeSeconds = Math.max(
    0,
    ...(feedHealth?.cameras?.map((camera) => camera.ageSeconds) ?? [0]),
  );
  const HEALTHY_SLA_SECONDS = 8;
  const DEGRADED_SLA_SECONDS = 15;
  const healthSeverity = !feedHealth
    ? "unknown"
    : feedHealth.summary.offline > 0 || maxAgeSeconds > DEGRADED_SLA_SECONDS
      ? "critical"
      : feedHealth.summary.stale > 0 || maxAgeSeconds > HEALTHY_SLA_SECONDS
        ? "degraded"
        : "healthy";
  const severityStyles =
    healthSeverity === "critical"
      ? "border-red-500/40 bg-red-500/10 text-red-300"
      : healthSeverity === "degraded"
        ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
        : "border-emerald-500/40 bg-emerald-500/10 text-emerald-300";

  const diagnosticsCamera =
    feedHealth?.cameras.find((camera) => camera.cameraId === diagnosticCameraId) ??
    null;
  const diagnosticsEvents = feedHealth
    ? feedHealth.events.filter((event) => event.cameraId === diagnosticCameraId)
    : [];

  useEffect(() => {
    if (!feedHealth) return;

    const nowId = Date.now().toString();
    if (
      previousHealthSeverityRef.current &&
      previousHealthSeverityRef.current !== "critical" &&
      healthSeverity === "critical"
    ) {
      setHealthAlerts((prev) => [
        ...prev,
        {
          id: `${nowId}-critical`,
          type: "critical",
          message:
            "Feed health entered CRITICAL. Check offline/stale cameras immediately.",
        },
      ]);
    }
    previousHealthSeverityRef.current = healthSeverity;

    const currentOfflineSet = new Set(
      feedHealth.cameras
        .filter((camera) => camera.status === "offline" || !camera.isLive)
        .map((camera) => camera.cameraId),
    );
    for (const cameraId of previousOfflineSetRef.current) {
      if (!currentOfflineSet.has(cameraId)) {
        setHealthAlerts((prev) => [
          ...prev,
          {
            id: `${nowId}-recovery-${cameraId}`,
            type: "recovery",
            message: `${cameraId} recovered and is reporting live again.`,
          },
        ]);
      }
    }
    previousOfflineSetRef.current = currentOfflineSet;
  }, [feedHealth, healthSeverity]);

  useEffect(() => {
    if (healthAlerts.length === 0) return;
    const timer = setTimeout(() => {
      setHealthAlerts((prev) => prev.slice(1));
    }, 6000);
    return () => clearTimeout(timer);
  }, [healthAlerts]);

  const placeholderCount = Math.max(0, 4 - remoteFeeds.length);
  const debugDetections = Object.entries(shadowByCamera)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(0, 6);

  useEffect(() => {
    const targetCameraId = searchParams.get("cameraId")?.trim();
    if (!targetCameraId) return;

    if (targetCameraId === "LOCAL-1") {
      setSelectedCamera("local");
      return;
    }

    if (targetCameraId === "LOCAL-2") {
      setSelectedCamera("local-2");
      return;
    }

    setSelectedCamera(targetCameraId);
  }, [searchParams]);

  return (
    <div className="p-4 lg:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Camera className="w-5 h-5 text-slate-400" />
          <h1 className="text-3xl font-bold">Live Camera Feeds</h1>
        </div>
        <p className="text-slate-400 text-sm">
          Real-time surveillance feeds from all monitored zones
        </p>
      </div>

      {isLoading && (
        <div className="mb-4 rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-3 text-sm text-slate-300">
          Loading camera feeds...
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {healthAlerts.length > 0 && (
        <div className="mb-4 space-y-2">
          {healthAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`rounded-lg border px-3 py-2 text-xs ${
                alert.type === "critical"
                  ? "border-red-500/40 bg-red-500/10 text-red-300"
                  : "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
              }`}
            >
              {alert.message}
            </div>
          ))}
        </div>
      )}

      {/* Camera Grid */}
      {feedHealth && (
        <div className="mb-4 rounded-lg border border-slate-700 bg-slate-900/50 p-3">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-200">
            <Activity className="h-4 w-4 text-slate-400" />
            Ingest Health
            <span className={`rounded border px-2 py-0.5 text-[10px] ${severityStyles}`}>
              {healthSeverity.toUpperCase()}
            </span>
          </div>
          <div className="mb-2 text-[11px] text-slate-400">
            SLA heartbeat targets: healthy ≤ {HEALTHY_SLA_SECONDS}s, degraded{" "}
            {HEALTHY_SLA_SECONDS + 1}-{DEGRADED_SLA_SECONDS}s, critical &gt;{" "}
            {DEGRADED_SLA_SECONDS}s or any offline camera.
          </div>
          <div className="mb-3 grid grid-cols-2 gap-2 text-xs text-slate-300 md:grid-cols-4">
            <div className="rounded bg-slate-800/80 px-2 py-1">Total: {feedHealth.summary.total}</div>
            <div className="rounded bg-slate-800/80 px-2 py-1 text-emerald-300">Live: {feedHealth.summary.live}</div>
            <div className="rounded bg-slate-800/80 px-2 py-1 text-amber-300">Stale: {feedHealth.summary.stale}</div>
            <div className="rounded bg-slate-800/80 px-2 py-1 text-red-300">Offline: {feedHealth.summary.offline}</div>
          </div>
          <div className="flex flex-wrap gap-2">
            {feedHealth.cameras.map((camera) => (
              <button
                key={`health-${camera.cameraId}`}
                type="button"
                onClick={() => setDiagnosticCameraId(camera.cameraId)}
                className={`rounded border px-2 py-1 text-[11px] ${
                  camera.isStale
                    ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
                    : "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                }`}
              >
                {camera.cameraId} • {camera.ageSeconds}s
                {camera.staleReason ? ` • ${camera.staleReason}` : ""}
              </button>
            ))}
          </div>
          {feedHealth.events.length > 0 && (
            <div className="mt-3 rounded border border-slate-700 bg-slate-950/40 p-2">
              <div className="mb-2 text-xs font-medium text-slate-300">
                Recent Camera Events
              </div>
              <div className="space-y-1">
                {feedHealth.events.slice(0, 8).map((event) => (
                  <button
                    key={`${event.cameraId}-${event.recordedAt}-${event.eventType}`}
                    type="button"
                    onClick={() =>
                      router.push(
                        `/feed/incident?cameraId=${encodeURIComponent(event.cameraId)}`,
                      )
                    }
                    className="flex w-full items-center justify-between rounded px-2 py-1 text-left text-[11px] hover:bg-slate-800/70"
                  >
                    <span className="text-slate-300">
                      {event.cameraId} • {event.eventType.replace("_", " ")} • {event.status}
                    </span>
                    <span className="text-slate-500">{event.ageSeconds}s ago</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {diagnosticsCamera && (
            <div className="mt-3 rounded border border-slate-700 bg-slate-950/40 p-3">
              <div className="mb-2 text-xs font-medium text-slate-300">
                Diagnostics: {diagnosticsCamera.cameraId}
              </div>
              <div className="grid grid-cols-1 gap-2 text-[11px] text-slate-300 md:grid-cols-2">
                <div>Last heartbeat age: {diagnosticsCamera.ageSeconds}s</div>
                <div>Status: {diagnosticsCamera.status.toUpperCase()}</div>
                <div>
                  Last incident:{" "}
                  {diagnosticsCamera.lastIncidentAt
                    ? `${Math.max(0, Math.floor((Date.now() - Date.parse(diagnosticsCamera.lastIncidentAt)) / 1000))}s ago`
                    : "none in 30d"}
                </div>
                <div>
                  Incident trend (24h): {diagnosticsCamera.incidentTrend}{" "}
                  ({diagnosticsCamera.incidentTrendDelta >= 0 ? "+" : ""}
                  {diagnosticsCamera.incidentTrendDelta})
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      `/feed/incident?cameraId=${encodeURIComponent(
                        diagnosticsCamera.cameraId,
                      )}`,
                    )
                  }
                  className="rounded border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-emerald-300 hover:bg-emerald-500/20"
                >
                  View Incidents
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedCamera(
                      diagnosticsCamera.cameraId === "LOCAL-1"
                        ? "local"
                        : diagnosticsCamera.cameraId === "LOCAL-2"
                          ? "local-2"
                          : diagnosticsCamera.cameraId,
                    )
                  }
                  className="rounded border border-slate-600 bg-slate-800 px-2 py-1 text-slate-300 hover:bg-slate-700"
                >
                  Focus Camera Tile
                </button>
              </div>
              {diagnosticsEvents.length > 0 && (
                <div className="mt-2 space-y-1">
                  {diagnosticsEvents.slice(0, 5).map((event) => (
                    <div
                      key={`${event.cameraId}-${event.recordedAt}-${event.eventType}-diag`}
                      className="text-[11px] text-slate-400"
                    >
                      {event.eventType.replace("_", " ")} • {event.status} •{" "}
                      {event.ageSeconds}s ago
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="mb-4 rounded-lg border border-slate-700 bg-slate-900/50 p-3">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-sm font-medium text-slate-200">AI Debug (Live)</div>
          <div className="text-[11px] text-slate-400">Latest shadow inference output</div>
        </div>
        {debugDetections.length === 0 ? (
          <div className="text-xs text-slate-400">
            No detections yet. Start a live camera and wait for ingest.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {debugDetections.map(([cameraId, detection]) => {
              const boxes = detection.metrics.detectionBoxes ?? [];
              const classCounts = detection.metrics.classCounts ?? {};
              return (
                <div
                  key={`debug-${cameraId}`}
                  className="rounded border border-slate-700 bg-slate-950/40 p-2"
                >
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <div className="font-medium text-slate-200">{cameraId}</div>
                    <div className="text-slate-400">
                      {detection.severity.toUpperCase()} •{" "}
                      {Math.round(detection.confidence * 100)}%
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                    <div>
                      Frame: {detection.metrics.frameAvailable ? "yes" : "no"}{" "}
                      {detection.metrics.frameShape
                        ? `(${detection.metrics.frameShape.width}x${detection.metrics.frameShape.height})`
                        : ""}
                    </div>
                    <div>
                      Persons: {detection.metrics.personCountTracked ?? 0} / Total det:{" "}
                      {detection.metrics.totalDetections ?? 0}
                    </div>
                  </div>
                  <div className="mt-1 text-[11px] text-slate-400">
                    Confidence threshold: {detection.metrics.thresholdUsed ?? "n/a"}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-400">
                    Classes:{" "}
                    {Object.keys(classCounts).length === 0
                      ? "none"
                      : Object.entries(classCounts)
                          .map(([label, count]) => `${label}:${count}`)
                          .join(", ")}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-400">
                    Boxes:{" "}
                    {boxes.length === 0
                      ? "none"
                      : boxes
                          .slice(0, 3)
                          .map(
                            (box) =>
                              `${box.classLabel} ${Math.round(box.confidence * 100)}% [${box.xyxy
                                .map((value) => Math.round(value))
                                .join(",")}]`,
                          )
                          .join(" | ")}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <LocalCameraTile
          selected={selectedCamera === "local"}
          onSelect={() =>
            setSelectedCamera((current) => (current === "local" ? null : "local"))
          }
          devices={cameraInputs}
          selectedDeviceId={localPrimaryDeviceId}
          onDeviceChange={setLocalPrimaryDeviceId}
          onStateChange={setLocalPrimaryState}
          onViewIncidents={() => router.push("/feed/incident?cameraId=LOCAL-1")}
          incidentCount24h={incidentCountByCamera.get("LOCAL-1") ?? 0}
          incidentTrend={
            feedHealth?.cameras.find((camera) => camera.cameraId === "LOCAL-1")
              ?.incidentTrend ?? "stable"
          }
          incidentTrendDelta={
            feedHealth?.cameras.find((camera) => camera.cameraId === "LOCAL-1")
              ?.incidentTrendDelta ?? 0
          }
          onOpenDiagnostics={() => setDiagnosticCameraId("LOCAL-1")}
          shadowDetection={shadowByCamera["LOCAL-1"] ?? null}
          onFrameData={(frameDataUrl) => {
            latestFrameDataRef.current["LOCAL-1"] = frameDataUrl;
          }}
        />

        {cameraInputs.length > 1 && (
          <LocalCameraTile
            title="Local Camera 2"
            cameraCode="CAM LOCAL 2"
            selected={selectedCamera === "local-2"}
            onSelect={() =>
              setSelectedCamera((current) =>
                current === "local-2" ? null : ("local-2" as const),
              )
            }
            devices={cameraInputs.filter(
              (device) => device.deviceId !== localPrimaryDeviceId,
            )}
            selectedDeviceId={localSecondaryDeviceId}
            onDeviceChange={setLocalSecondaryDeviceId}
            onStateChange={setLocalSecondaryState}
            onViewIncidents={() => router.push("/feed/incident?cameraId=LOCAL-2")}
            incidentCount24h={incidentCountByCamera.get("LOCAL-2") ?? 0}
            incidentTrend={
              feedHealth?.cameras.find((camera) => camera.cameraId === "LOCAL-2")
                ?.incidentTrend ?? "stable"
            }
            incidentTrendDelta={
              feedHealth?.cameras.find((camera) => camera.cameraId === "LOCAL-2")
                ?.incidentTrendDelta ?? 0
            }
            onOpenDiagnostics={() => setDiagnosticCameraId("LOCAL-2")}
            shadowDetection={shadowByCamera["LOCAL-2"] ?? null}
            onFrameData={(frameDataUrl) => {
              latestFrameDataRef.current["LOCAL-2"] = frameDataUrl;
            }}
          />
        )}

        {cameraInputs.length <= 1 && (
          <div className="rounded-lg border border-slate-700 bg-slate-900/40 p-4">
            <div className="text-sm font-medium text-slate-200">
              Secondary Camera Slot
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Connect another camera input to enable a second local feed tile.
            </p>
          </div>
        )}

        {remoteFeeds.map((camera) => (
          <div
            key={camera.cameraId}
            className={`relative bg-slate-800 rounded-lg overflow-hidden cursor-pointer transition-all hover:ring-2 hover:ring-slate-600 ${
              selectedCamera === camera.cameraId ? "ring-2 ring-emerald-500" : ""
            }`}
            onClick={() =>
              setSelectedCamera(
                camera.cameraId === selectedCamera ? null : camera.cameraId,
              )
            }
          >
            {/* Camera Image */}
            <div className="aspect-video relative">
              <Image
                src={camera.imageUrl}
                alt={camera.name}
                fill
                className="object-cover opacity-80"
              />
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

              {/* Status indicator */}
              <div className="absolute top-2 left-2 flex items-center gap-1.5">
                <div
                  className={`w-2 h-2 rounded-full ${getStatusColor(camera.status)} animate-pulse`}
                />
                <span className="text-xs font-medium bg-black/50 px-1.5 py-0.5 rounded">
                  CAM {camera.id}
                </span>
              </div>

              {/* Camera controls */}
              <div className="absolute top-2 right-2 flex items-center gap-1">
                <button className="p-1 bg-black/50 rounded hover:bg-black/70 transition-colors">
                  <Maximize2 className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    router.push(
                      `/feed/incident?cameraId=${encodeURIComponent(camera.cameraId)}`,
                    );
                  }}
                  className="p-1 bg-emerald-500/20 text-emerald-300 rounded hover:bg-emerald-500/30 transition-colors"
                  aria-label={`View incidents for ${camera.cameraId}`}
                >
                  <AlertTriangle className="w-3 h-3" />
                </button>
              </div>

              {/* Camera info */}
              <div className="absolute bottom-0 left-0 right-0 p-2">
                <div className="text-xs font-medium truncate">
                  {camera.name}
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-slate-400">
                    {camera.zone}
                  </span>
                  <span
                    className={`text-[10px] font-medium ${
                      camera.occupancy / camera.capacity > 0.9
                        ? "text-red-400"
                        : camera.occupancy / camera.capacity > 0.7
                          ? "text-amber-400"
                          : "text-emerald-400"
                    }`}
                  >
                    {Math.round((camera.occupancy / camera.capacity) * 100)}%
                  </span>
                </div>
                <div className="mt-1 text-[10px] text-slate-300">
                  Incidents (24h): {incidentCountByCamera.get(camera.cameraId) ?? 0}
                </div>
                <div className="text-[10px] text-slate-400">
                  Trend:{" "}
                  {feedHealth?.cameras.find((entry) => entry.cameraId === camera.cameraId)
                    ?.incidentTrend ?? "stable"}{" "}
                  (
                  {(feedHealth?.cameras.find((entry) => entry.cameraId === camera.cameraId)
                    ?.incidentTrendDelta ?? 0) >= 0
                    ? "+"
                    : ""}
                  {feedHealth?.cameras.find((entry) => entry.cameraId === camera.cameraId)
                    ?.incidentTrendDelta ?? 0}
                  )
                </div>
                {shadowByCamera[camera.cameraId] && (
                  <div
                    className={`text-[10px] ${
                      shadowByCamera[camera.cameraId].severity === "critical"
                        ? "text-red-300"
                        : shadowByCamera[camera.cameraId].severity === "high"
                          ? "text-amber-300"
                          : shadowByCamera[camera.cameraId].severity === "medium"
                            ? "text-blue-300"
                            : "text-emerald-300"
                    }`}
                  >
                    Shadow: {shadowByCamera[camera.cameraId].severity.toUpperCase()} (
                    {Math.round(shadowByCamera[camera.cameraId].confidence * 100)}%)
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {Array.from({ length: placeholderCount }).map((_, index) => (
          <div
            key={`placeholder-${index + 1}`}
            className="rounded-lg border border-slate-700 bg-slate-900/40 p-4"
          >
            <div className="aspect-video rounded-md border border-dashed border-slate-700 bg-slate-900/50 flex items-center justify-center">
              <span className="text-xs text-slate-500">
                Camera Slot {index + 1} Placeholder
              </span>
            </div>
            <div className="mt-3 text-sm font-medium text-slate-200">
              Unassigned Camera Slot
            </div>
            <p className="mt-1 text-xs text-slate-400">
              This slot is static. It will activate only when a real camera source
              is connected.
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
