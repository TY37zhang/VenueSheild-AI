"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  Maximize2,
  X,
  Search,
  Filter,
  Grid3X3,
  LayoutGrid,
  Square,
  Play,
  Pause,
  Volume2,
  VolumeX,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Move,
  ChevronDown,
  AlertTriangle,
  CheckCircle,
  Circle,
  Wifi,
  WifiOff,
  VideoOff,
  Settings,
  Download,
  Share2,
  MoreVertical,
  Crosshair,
} from "lucide-react";
import Image from "next/image";

// Extended camera data - mapped to actual surveillance images
const allCameras = [
  {
    id: 1,
    name: "Main Gate",
    zone: "Zone A",
    status: "online",
    alertLevel: "warning",
    occupancy: 487,
    capacity: 500,
    recording: true,
    hasAudio: true,
    ptz: true,
    lastMotion: "Just now",
    resolution: "4K",
    fps: 30,
  },
  {
    id: 2,
    name: "Main Field",
    zone: "Zone B",
    status: "online",
    alertLevel: "normal",
    occupancy: 18500,
    capacity: 25000,
    recording: true,
    hasAudio: true,
    ptz: true,
    lastMotion: "Just now",
    resolution: "4K",
    fps: 30,
  },
  {
    id: 3,
    name: "North Hallway",
    zone: "Zone C",
    status: "online",
    alertLevel: "normal",
    occupancy: 0,
    capacity: 200,
    recording: true,
    hasAudio: false,
    ptz: true,
    lastMotion: "12 min ago",
    resolution: "1080p",
    fps: 30,
  },
  {
    id: 4,
    name: "Parking Lot B",
    zone: "Zone D",
    status: "online",
    alertLevel: "normal",
    occupancy: 127,
    capacity: 500,
    recording: true,
    hasAudio: false,
    ptz: true,
    lastMotion: "2 min ago",
    resolution: "4K",
    fps: 24,
  },
  {
    id: 5,
    name: "Backstage",
    zone: "Zone E",
    status: "online",
    alertLevel: "normal",
    occupancy: 3,
    capacity: 50,
    recording: true,
    hasAudio: true,
    ptz: false,
    lastMotion: "Just now",
    resolution: "4K",
    fps: 30,
  },
  {
    id: 6,
    name: "Food Court",
    zone: "Zone F",
    status: "online",
    alertLevel: "alert",
    occupancy: 89,
    capacity: 300,
    recording: true,
    hasAudio: true,
    ptz: true,
    lastMotion: "Just now",
    resolution: "4K",
    fps: 30,
  },
  {
    id: 7,
    name: "East Entrance",
    zone: "Zone G",
    status: "online",
    alertLevel: "normal",
    occupancy: 234,
    capacity: 500,
    recording: true,
    hasAudio: false,
    ptz: true,
    lastMotion: "23 sec ago",
    resolution: "1080p",
    fps: 24,
  },
  {
    id: 8,
    name: "VIP Lounge",
    zone: "Zone H",
    status: "offline",
    alertLevel: "warning",
    occupancy: 0,
    capacity: 100,
    recording: false,
    hasAudio: true,
    ptz: true,
    lastMotion: "N/A",
    resolution: "4K",
    fps: 30,
  },
  {
    id: 9,
    name: "Loading Dock",
    zone: "Zone I",
    status: "online",
    alertLevel: "normal",
    occupancy: 8,
    capacity: 30,
    recording: true,
    hasAudio: false,
    ptz: false,
    lastMotion: "3 min ago",
    resolution: "720p",
    fps: 24,
  },
  {
    id: 10,
    name: "Control Room",
    zone: "Zone J",
    status: "online",
    alertLevel: "normal",
    occupancy: 4,
    capacity: 10,
    recording: true,
    hasAudio: true,
    ptz: false,
    lastMotion: "Just now",
    resolution: "4K",
    fps: 30,
  },
  {
    id: 11,
    name: "West Entrance",
    zone: "Zone K",
    status: "online",
    alertLevel: "normal",
    occupancy: 189,
    capacity: 400,
    recording: true,
    hasAudio: true,
    ptz: true,
    lastMotion: "8 sec ago",
    resolution: "4K",
    fps: 30,
  },
  {
    id: 12,
    name: "Merchandise Area",
    zone: "Zone L",
    status: "offline",
    alertLevel: "warning",
    occupancy: 0,
    capacity: 200,
    recording: false,
    hasAudio: false,
    ptz: false,
    lastMotion: "N/A",
    resolution: "1080p",
    fps: 30,
  },
];

type LayoutType = "2x2" | "3x3" | "4x4";

const layoutOptions: {
  value: LayoutType;
  icon: React.ElementType;
  label: string;
}[] = [
  { value: "2x2", icon: Square, label: "2x2 Grid" },
  { value: "3x3", icon: Grid3X3, label: "3x3 Grid" },
  { value: "4x4", icon: LayoutGrid, label: "4x4 Grid" },
];

export default function CameraFeedsPage() {
  const [layout, setLayout] = useState<LayoutType>("3x3");
  const [selectedCamera, setSelectedCamera] = useState<
    (typeof allCameras)[0] | null
  >(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "online" | "offline" | "alert"
  >("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [cameraStates, setCameraStates] = useState<
    Record<number, { occupancy: number }>
  >({});

  // Update time
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Simulate camera data updates
  useEffect(() => {
    const interval = setInterval(() => {
      const updates: Record<number, { occupancy: number }> = {};
      allCameras.forEach((cam) => {
        if (cam.status === "online") {
          const baseOccupancy = cam.occupancy;
          const fluctuation = Math.floor(Math.random() * 20) - 10;
          updates[cam.id] = {
            occupancy: Math.max(
              0,
              Math.min(cam.capacity, baseOccupancy + fluctuation),
            ),
          };
        }
      });
      setCameraStates(updates);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const getCameraOccupancy = (camera: (typeof allCameras)[0]) => {
    return cameraStates[camera.id]?.occupancy ?? camera.occupancy;
  };

  const filteredCameras = allCameras.filter((camera) => {
    const matchesSearch =
      camera.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      camera.zone.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "online" && camera.status === "online") ||
      (filterStatus === "offline" && camera.status === "offline") ||
      (filterStatus === "alert" && camera.alertLevel !== "normal");
    return matchesSearch && matchesFilter;
  });

  const getAlertColor = (level: string) => {
    switch (level) {
      case "alert":
        return "bg-red-500";
      case "warning":
        return "bg-amber-500";
      default:
        return "bg-emerald-500";
    }
  };

  const getGridCols = () => {
    switch (layout) {
      case "2x2":
        return "grid-cols-1 sm:grid-cols-2";
      case "3x3":
        return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
      case "4x4":
        return "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4";
    }
  };

  const getVisibleCount = () => {
    switch (layout) {
      case "2x2":
        return 4;
      case "3x3":
        return 9;
      case "4x4":
        return 16;
    }
  };

  const displayedCameras = filteredCameras.slice(0, getVisibleCount());

  return (
    <div className="p-4 lg:p-6 h-[calc(100vh-60px)] flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Camera className="w-6 h-6 text-slate-400" />
            Camera Feeds
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {allCameras.filter((c) => c.status === "online").length} of{" "}
            {allCameras.length} cameras online
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search cameras..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
            />
          </div>

          {/* Filter */}
          <div className="relative">
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                filterStatus !== "all"
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
              }`}
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline text-sm">Filter</span>
              <ChevronDown className="w-4 h-4" />
            </button>

            <AnimatePresence>
              {filterOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setFilterOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 top-full mt-2 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden"
                  >
                    {[
                      {
                        value: "all",
                        label: "All Cameras",
                        count: allCameras.length,
                      },
                      {
                        value: "online",
                        label: "Online",
                        count: allCameras.filter((c) => c.status === "online")
                          .length,
                      },
                      {
                        value: "offline",
                        label: "Offline",
                        count: allCameras.filter((c) => c.status === "offline")
                          .length,
                      },
                      {
                        value: "alert",
                        label: "Has Alerts",
                        count: allCameras.filter(
                          (c) => c.alertLevel !== "normal",
                        ).length,
                      },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setFilterStatus(option.value as typeof filterStatus);
                          setFilterOpen(false);
                        }}
                        className={`w-full px-4 py-2.5 flex items-center justify-between text-sm transition-colors ${
                          filterStatus === option.value
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "text-slate-300 hover:bg-slate-700"
                        }`}
                      >
                        <span>{option.label}</span>
                        <span className="text-xs px-2 py-0.5 bg-slate-700 rounded-full">
                          {option.count}
                        </span>
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Layout Selector */}
          <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg p-1">
            {layoutOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setLayout(option.value)}
                className={`p-2 rounded transition-colors ${
                  layout === option.value
                    ? "bg-slate-700 text-white"
                    : "text-slate-500 hover:text-white"
                }`}
                title={option.label}
              >
                <option.icon className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Camera Grid */}
      <div className={`grid ${getGridCols()} gap-3 flex-1 overflow-auto`}>
        {displayedCameras.map((camera) => {
          const occupancy = getCameraOccupancy(camera);
          const occupancyPercent = Math.round(
            (occupancy / camera.capacity) * 100,
          );

          return (
            <motion.div
              key={camera.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative bg-slate-900 rounded-xl overflow-hidden border border-slate-800 group"
            >
              {/* Camera Feed */}
              <div
                className="aspect-video relative cursor-pointer"
                onClick={() => setSelectedCamera(camera)}
              >
                {camera.status === "online" ? (
                  <>
                    <Image
                      src={`/images/surveillance-${((camera.id - 1) % 6) + 1}.jpg`}
                      alt={camera.name}
                      fill
                      className="object-cover"
                    />
                    {/* Scan line effect */}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/5 to-transparent animate-scan" />
                  </>
                ) : (
                  <div className="absolute inset-0 bg-slate-800 flex flex-col items-center justify-center">
                    <VideoOff className="w-12 h-12 text-slate-600 mb-2" />
                    <span className="text-slate-500 text-sm">
                      Camera Offline
                    </span>
                  </div>
                )}

                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                {/* Top bar */}
                <div className="absolute top-0 left-0 right-0 p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${getAlertColor(camera.alertLevel)} animate-pulse`}
                    />
                    <span className="text-xs font-mono font-medium bg-black/60 px-2 py-1 rounded">
                      CAM-{camera.id.toString().padStart(2, "0")}
                    </span>
                    {camera.recording && camera.status === "online" && (
                      <span className="flex items-center gap-1 text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded">
                        <Circle className="w-2 h-2 fill-current" />
                        REC
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1.5 bg-black/60 rounded-lg hover:bg-black/80 transition-colors">
                      <Settings className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCamera(camera);
                      }}
                      className="p-1.5 bg-black/60 rounded-lg hover:bg-black/80 transition-colors"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Bottom info */}
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <div className="flex items-end justify-between">
                    <div>
                      <h3 className="font-medium text-white text-sm">
                        {camera.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] text-slate-400">
                          {camera.zone}
                        </span>
                        <span className="text-[11px] text-slate-600">•</span>
                        <span className="text-[11px] text-slate-400">
                          {camera.resolution} @ {camera.fps}fps
                        </span>
                      </div>
                    </div>

                    {camera.status === "online" && (
                      <div className="text-right">
                        <div
                          className={`text-sm font-bold ${
                            occupancyPercent > 90
                              ? "text-red-400"
                              : occupancyPercent > 70
                                ? "text-amber-400"
                                : "text-emerald-400"
                          }`}
                        >
                          {occupancy}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          of {camera.capacity}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Occupancy bar */}
                  {camera.status === "online" && (
                    <div className="mt-2 h-1 bg-slate-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: `${Math.min(100, occupancyPercent)}%`,
                        }}
                        transition={{ duration: 0.5 }}
                        className={`h-full rounded-full ${
                          occupancyPercent > 90
                            ? "bg-red-500"
                            : occupancyPercent > 70
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                        }`}
                      />
                    </div>
                  )}
                </div>

                {/* Connection status indicator */}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  {camera.status === "online" ? (
                    <Wifi className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <WifiOff className="w-4 h-4 text-red-400" />
                  )}
                </div>
              </div>

              {/* Camera quick stats */}
              <div className="p-3 bg-slate-800/50 border-t border-slate-800">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      {camera.status === "online" ? (
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      )}
                      <span
                        className={
                          camera.status === "online"
                            ? "text-emerald-400"
                            : "text-amber-400"
                        }
                      >
                        {camera.status === "online" ? "Online" : "Offline"}
                      </span>
                    </div>
                    {camera.hasAudio && (
                      <Volume2 className="w-3.5 h-3.5 text-slate-500" />
                    )}
                    {camera.ptz && (
                      <Move className="w-3.5 h-3.5 text-slate-500" />
                    )}
                  </div>
                  <span className="text-slate-500">
                    Motion: {camera.lastMotion}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Pagination / Info */}
      <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
        <span>
          Showing {displayedCameras.length} of {filteredCameras.length} cameras
          {filterStatus !== "all" && ` (filtered)`}
        </span>
        <span className="font-mono">
          {currentTime.toLocaleTimeString("en-US", { hour12: false })}
        </span>
      </div>

      {/* Fullscreen Camera Modal */}
      <AnimatePresence>
        {selectedCamera && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm"
          >
            <div className="h-full flex flex-col">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-800">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${getAlertColor(selectedCamera.alertLevel)} animate-pulse`}
                    />
                    <span className="font-mono font-medium">
                      CAM-{selectedCamera.id.toString().padStart(2, "0")}
                    </span>
                  </div>
                  <div className="h-4 w-px bg-slate-700" />
                  <div>
                    <h2 className="font-semibold text-white">
                      {selectedCamera.name}
                    </h2>
                    <p className="text-xs text-slate-400">
                      {selectedCamera.zone} • {selectedCamera.resolution} @{" "}
                      {selectedCamera.fps}fps
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors">
                    <Download className="w-4 h-4" />
                  </button>
                  <button className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors">
                    <Share2 className="w-4 h-4" />
                  </button>
                  <button className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setSelectedCamera(null)}
                    className="p-2 bg-slate-800 rounded-lg hover:bg-red-500/20 hover:text-red-400 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Camera Feed */}
              <div className="flex-1 relative flex items-center justify-center p-4">
                {selectedCamera.status === "online" ? (
                  <div
                    className="relative w-full max-w-6xl aspect-video rounded-xl overflow-hidden"
                    style={{ transform: `scale(${zoomLevel})` }}
                  >
                    <Image
                      src={`/images/surveillance-${((selectedCamera.id - 1) % 6) + 1}.jpg`}
                      alt={selectedCamera.name}
                      fill
                      className="object-cover"
                    />
                    {/* Scan line effect */}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/5 to-transparent animate-scan" />

                    {/* Crosshair overlay for PTZ */}
                    {selectedCamera.ptz && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
                        <Crosshair className="w-24 h-24 text-white" />
                      </div>
                    )}

                    {/* Recording indicator */}
                    {selectedCamera.recording && (
                      <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-500/20 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                        <Circle className="w-3 h-3 fill-red-500 text-red-500 animate-pulse" />
                        <span className="text-sm font-medium text-red-400">
                          Recording
                        </span>
                      </div>
                    )}

                    {/* Timestamp */}
                    <div className="absolute bottom-4 left-4 font-mono text-sm bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                      {currentTime.toLocaleString("en-US", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        hour12: false,
                      })}
                    </div>

                    {/* Occupancy indicator */}
                    <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm px-4 py-2 rounded-lg">
                      <div className="text-xs text-slate-400 mb-1">
                        Occupancy
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span
                          className={`text-2xl font-bold ${
                            getCameraOccupancy(selectedCamera) /
                              selectedCamera.capacity >
                            0.9
                              ? "text-red-400"
                              : getCameraOccupancy(selectedCamera) /
                                    selectedCamera.capacity >
                                  0.7
                                ? "text-amber-400"
                                : "text-emerald-400"
                          }`}
                        >
                          {getCameraOccupancy(selectedCamera)}
                        </span>
                        <span className="text-sm text-slate-500">
                          / {selectedCamera.capacity}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full max-w-6xl aspect-video rounded-xl bg-slate-900 flex flex-col items-center justify-center">
                    <VideoOff className="w-24 h-24 text-slate-700 mb-4" />
                    <span className="text-xl text-slate-500">
                      Camera Offline
                    </span>
                    <p className="text-slate-600 mt-2">
                      Connection lost. Attempting to reconnect...
                    </p>
                    <button className="mt-4 px-4 py-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-2">
                      <RotateCcw className="w-4 h-4" />
                      Retry Connection
                    </button>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="p-4 border-t border-slate-800">
                <div className="flex items-center justify-center gap-4">
                  {/* Playback controls */}
                  <div className="flex items-center gap-2 bg-slate-800 rounded-lg p-1">
                    <button
                      onClick={() => setIsPaused(!isPaused)}
                      className={`p-2 rounded transition-colors ${
                        isPaused
                          ? "bg-emerald-500 text-white"
                          : "hover:bg-slate-700"
                      }`}
                    >
                      {isPaused ? (
                        <Play className="w-5 h-5" />
                      ) : (
                        <Pause className="w-5 h-5" />
                      )}
                    </button>
                  </div>

                  {/* Audio controls */}
                  {selectedCamera.hasAudio && (
                    <div className="flex items-center gap-2 bg-slate-800 rounded-lg p-1">
                      <button
                        onClick={() => setIsMuted(!isMuted)}
                        className={`p-2 rounded transition-colors ${
                          !isMuted
                            ? "bg-emerald-500 text-white"
                            : "hover:bg-slate-700"
                        }`}
                      >
                        {isMuted ? (
                          <VolumeX className="w-5 h-5" />
                        ) : (
                          <Volume2 className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  )}

                  {/* Zoom controls */}
                  <div className="flex items-center gap-2 bg-slate-800 rounded-lg p-1">
                    <button
                      onClick={() =>
                        setZoomLevel(Math.max(0.5, zoomLevel - 0.25))
                      }
                      className="p-2 rounded hover:bg-slate-700 transition-colors disabled:opacity-50"
                      disabled={zoomLevel <= 0.5}
                    >
                      <ZoomOut className="w-5 h-5" />
                    </button>
                    <span className="px-2 text-sm font-mono min-w-[4rem] text-center">
                      {Math.round(zoomLevel * 100)}%
                    </span>
                    <button
                      onClick={() =>
                        setZoomLevel(Math.min(3, zoomLevel + 0.25))
                      }
                      className="p-2 rounded hover:bg-slate-700 transition-colors disabled:opacity-50"
                      disabled={zoomLevel >= 3}
                    >
                      <ZoomIn className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setZoomLevel(1)}
                      className="p-2 rounded hover:bg-slate-700 transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>

                  {/* PTZ controls */}
                  {selectedCamera.ptz && (
                    <div className="flex items-center gap-2 bg-slate-800 rounded-lg p-1">
                      <button className="p-2 rounded hover:bg-slate-700 transition-colors">
                        <Move className="w-5 h-5" />
                      </button>
                      <span className="text-xs text-slate-400 px-2">PTZ</span>
                    </div>
                  )}

                  {/* Fullscreen */}
                  <div className="flex items-center gap-2 bg-slate-800 rounded-lg p-1">
                    <button className="p-2 rounded hover:bg-slate-700 transition-colors">
                      <Maximize2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CSS for scan line animation */}
      <style jsx global>{`
        @keyframes scan {
          0% {
            transform: translateY(-100%);
          }
          100% {
            transform: translateY(100%);
          }
        }
        .animate-scan {
          animation: scan 3s linear infinite;
        }
      `}</style>
    </div>
  );
}
