"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Maximize2, Video, VideoOff } from "lucide-react";
import type { ShadowDetection } from "@/lib/types/shadow";

type CameraState = "idle" | "requesting" | "live" | "denied" | "unavailable";

export interface LocalCameraRuntimeState {
  status: CameraState;
  isLive: boolean;
  selectedDeviceId?: string;
  selectedDeviceLabel?: string;
}

interface LocalCameraTileProps {
  title?: string;
  cameraCode?: string;
  selected?: boolean;
  onSelect?: () => void;
  devices?: MediaDeviceInfo[];
  selectedDeviceId?: string;
  onDeviceChange?: (deviceId: string) => void;
  onStateChange?: (state: LocalCameraRuntimeState) => void;
  onViewIncidents?: () => void;
  incidentCount24h?: number;
  incidentTrend?: "rising" | "falling" | "stable";
  incidentTrendDelta?: number;
  onOpenDiagnostics?: () => void;
  shadowDetection?: ShadowDetection | null;
  onFrameData?: (frameDataUrl: string | null) => void;
}

export function LocalCameraTile({
  title = "Local Camera",
  cameraCode = "CAM LOCAL",
  selected = false,
  onSelect,
  devices = [],
  selectedDeviceId,
  onDeviceChange,
  onStateChange,
  onViewIncidents,
  incidentCount24h = 0,
  incidentTrend = "stable",
  incidentTrendDelta = 0,
  onOpenDiagnostics,
  shadowDetection = null,
  onFrameData,
}: LocalCameraTileProps) {
  const [cameraState, setCameraState] = useState<CameraState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastEmittedStateRef = useRef<string>("");

  const stopStream = useCallback(() => {
    if (!streamRef.current) return;
    streamRef.current.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopStream();
    };
  }, [stopStream]);

  const startCamera = async (deviceId?: string) => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setCameraState("unavailable");
      setErrorMessage("Camera access is not supported in this browser.");
      return;
    }

    setCameraState("requesting");
    setErrorMessage(null);

    try {
      stopStream();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: deviceId ? { deviceId: { exact: deviceId } } : true,
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraState("live");
    } catch (error) {
      const denied =
        error instanceof DOMException &&
        (error.name === "NotAllowedError" || error.name === "PermissionDeniedError");

      if (denied) {
        console.warn("[feed] local camera permission denied");
        setCameraState("denied");
        setErrorMessage("Permission denied. Please allow camera access and retry.");
        return;
      }

      console.warn("[feed] local camera stream start failed", error);
      setCameraState("unavailable");
      setErrorMessage("Could not start camera stream. Please retry.");
    }
  };

  useEffect(() => {
    if (cameraState !== "live") return;
    void startCamera(selectedDeviceId);
    // Intentionally only react to selected camera changes while stream is live.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDeviceId]);

  useEffect(() => {
    if (cameraState !== "live") {
      onFrameData?.(null);
      return;
    }

    const captureFrame = () => {
      const video = videoRef.current;
      if (!video || video.readyState < 2 || video.videoWidth <= 0 || video.videoHeight <= 0) {
        return;
      }

      let canvas = captureCanvasRef.current;
      if (!canvas) {
        canvas = document.createElement("canvas");
        captureCanvasRef.current = canvas;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return;
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const jpeg = canvas.toDataURL("image/jpeg", 0.65);
      onFrameData?.(jpeg);
    };

    captureFrame();
    const interval = window.setInterval(captureFrame, 2000);
    return () => {
      window.clearInterval(interval);
    };
  }, [cameraState, onFrameData]);

  useEffect(() => {
    const selectedDeviceLabel = devices.find(
      (device) => device.deviceId === selectedDeviceId,
    )?.label;

    const nextState: LocalCameraRuntimeState = {
      status: cameraState,
      isLive: cameraState === "live",
      selectedDeviceId,
      selectedDeviceLabel: selectedDeviceLabel || undefined,
    };

    const fingerprint = JSON.stringify(nextState);
    if (lastEmittedStateRef.current === fingerprint) {
      return;
    }

    lastEmittedStateRef.current = fingerprint;
    onStateChange?.(nextState);
  }, [cameraState, selectedDeviceId, devices, onStateChange]);

  const showFallback = cameraState !== "live";

  return (
    <div
      className={`relative bg-slate-800 rounded-lg overflow-hidden transition-all hover:ring-2 hover:ring-slate-600 ${
        selected ? "ring-2 ring-emerald-500" : ""
      }`}
      onClick={onSelect}
    >
      <div className="aspect-video relative">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`absolute inset-0 h-full w-full object-cover ${showFallback ? "hidden" : "block"}`}
        />

        {showFallback && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-slate-900/90 px-4 text-center">
            <div className="mb-2 rounded-full bg-slate-700/60 p-2 text-slate-300">
              {cameraState === "requesting" ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : cameraState === "denied" || cameraState === "unavailable" ? (
                <VideoOff className="h-5 w-5" />
              ) : (
                <Video className="h-5 w-5" />
              )}
            </div>

            <p className="mb-3 text-xs text-slate-300">
              {errorMessage ?? "Use your laptop camera as a live feed source."}
            </p>

            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                void startCamera(selectedDeviceId);
              }}
              className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-500/20"
            >
              {cameraState === "requesting" ? "Starting..." : "Start Camera"}
            </button>
          </div>
        )}
      </div>

      <div className="border-t border-slate-700/70 bg-slate-900/70 p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <div
              className={`h-2.5 w-2.5 rounded-full ${
                cameraState === "live" ? "bg-emerald-500 animate-pulse" : "bg-slate-500"
              }`}
            />
            <span className="rounded bg-slate-700 px-2 py-0.5 text-xs font-medium text-slate-100">
              {cameraCode}
            </span>
            <span className="truncate text-sm font-medium text-slate-100">{title}</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-medium ${
                cameraState === "live" ? "text-emerald-400" : "text-slate-400"
              }`}
            >
              {cameraState === "live" ? "LIVE" : "OFFLINE"}
            </span>
            <button
              type="button"
              onClick={(event) => event.stopPropagation()}
              className="rounded bg-slate-700 p-1 text-slate-200 hover:bg-slate-600"
              aria-label="Expand camera"
            >
              <Maximize2 className="h-3 w-3" />
            </button>
          </div>
        </div>

        <div className="mb-2 text-xs text-slate-300">Local Device</div>
        <div className="text-xs text-slate-400">Incidents (24h): {incidentCount24h}</div>
        <div className="mt-1 text-xs text-slate-400">
          Trend: {incidentTrend} ({incidentTrendDelta >= 0 ? "+" : ""}
          {incidentTrendDelta})
        </div>
        {shadowDetection && (
          <div
            className={`mt-1 text-xs ${
              shadowDetection.severity === "critical"
                ? "text-red-300"
                : shadowDetection.severity === "high"
                  ? "text-amber-300"
                  : shadowDetection.severity === "medium"
                    ? "text-blue-300"
                    : "text-emerald-300"
            }`}
          >
            Shadow: {shadowDetection.severity.toUpperCase()} (
            {Math.round(shadowDetection.confidence * 100)}%)
          </div>
        )}

        <div className="mt-3 flex items-center gap-2">
          <select
            value={selectedDeviceId ?? ""}
            onClick={(event) => event.stopPropagation()}
            onChange={(event) => onDeviceChange?.(event.target.value)}
            className="min-w-0 flex-1 rounded border border-slate-600 bg-slate-950 px-2 py-1 text-xs text-slate-200"
          >
            {devices.length === 0 && <option value="">No camera inputs</option>}
            {devices.map((device, index) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Camera ${index + 1}`}
              </option>
            ))}
          </select>

          {cameraState === "live" && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                stopStream();
                setCameraState("idle");
              }}
              className="rounded border border-slate-500 bg-slate-900 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800"
            >
              Stop
            </button>
          )}
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onViewIncidents?.();
            }}
            className="rounded border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-300 hover:bg-emerald-500/20"
          >
            Incidents
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onOpenDiagnostics?.();
            }}
            className="rounded border border-slate-500 bg-slate-900 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800"
          >
            Diagnose
          </button>
        </div>
      </div>
    </div>
  );
}
