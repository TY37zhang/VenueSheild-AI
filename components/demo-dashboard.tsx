"use client";

import { useState, useEffect } from "react";
import {
  Shield,
  Camera,
  Users,
  AlertTriangle,
  Bell,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  Eye,
  CheckCircle,
  XCircle,
  Maximize2,
} from "lucide-react";
import Image from "next/image";

// Mock camera feeds data - mapped to actual surveillance images
const cameraFeeds = [
  {
    id: 1,
    name: "Main Gate",
    zone: "Zone A",
    status: "warning",
    occupancy: 487,
    capacity: 500,
  },
  {
    id: 2,
    name: "Main Field",
    zone: "Zone B",
    status: "normal",
    occupancy: 18500,
    capacity: 25000,
  },
  {
    id: 3,
    name: "North Hallway",
    zone: "Zone C",
    status: "normal",
    occupancy: 0,
    capacity: 200,
  },
  {
    id: 4,
    name: "Parking Lot B",
    zone: "Zone D",
    status: "normal",
    occupancy: 127,
    capacity: 500,
  },
  {
    id: 5,
    name: "Backstage",
    zone: "Zone E",
    status: "normal",
    occupancy: 3,
    capacity: 50,
  },
  {
    id: 6,
    name: "Food Court",
    zone: "Zone F",
    status: "alert",
    occupancy: 89,
    capacity: 300,
  },
];

// Mock alerts data - mapped to actual camera locations
const initialAlerts = [
  {
    id: 1,
    type: "warning",
    title: "High Crowd Density",
    message: "Main Gate at 97% capacity - dense crowd flow",
    time: "2 min ago",
    zone: "Zone A",
    resolved: false,
  },
  {
    id: 2,
    type: "alert",
    title: "Crowd Gathering Detected",
    message: "Unusual clustering near Food Court tables",
    time: "5 min ago",
    zone: "Zone F",
    resolved: false,
  },
  {
    id: 3,
    type: "info",
    title: "Area Clear",
    message: "North Hallway - No occupants detected",
    time: "8 min ago",
    zone: "Zone C",
    resolved: true,
  },
  {
    id: 4,
    type: "info",
    title: "Backstage Check",
    message: "Single crew member verified on phone",
    time: "15 min ago",
    zone: "Zone E",
    resolved: true,
  },
];

// Mock crowd density forecast data
const forecastData = [
  { time: "Now", density: 72 },
  { time: "+15m", density: 78 },
  { time: "+30m", density: 85 },
  { time: "+45m", density: 92 },
  { time: "+1h", density: 88 },
  { time: "+1h15", density: 82 },
  { time: "+1h30", density: 75 },
  { time: "+1h45", density: 70 },
  { time: "+2h", density: 68 },
  { time: "+2h15", density: 78 },
  { time: "+2h30", density: 85 },
  { time: "+2h45", density: 76 },
  { time: "+3h", density: 65 },
];

// Mock zone data - mapped to actual camera locations
const zoneData = [
  { name: "Main Gate", current: 487, max: 500, trend: "up", change: 31 },
  {
    name: "Main Field",
    current: 18500,
    max: 25000,
    trend: "stable",
    change: 120,
  },
  { name: "North Hallway", current: 0, max: 200, trend: "down", change: 0 },
  { name: "Parking Lot B", current: 127, max: 500, trend: "down", change: 15 },
  { name: "Backstage", current: 3, max: 50, trend: "stable", change: 1 },
  { name: "Food Court", current: 89, max: 300, trend: "stable", change: 8 },
];

function generateSmoothPath(
  data: typeof forecastData,
  width: number,
  height: number,
): string {
  const points = data.map((point, i) => ({
    x: (i / (data.length - 1)) * width,
    y: height - point.density * (height / 100) * 0.9 - 10,
  }));

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const current = points[i];
    const next = points[i + 1];
    const controlX = (current.x + next.x) / 2;

    path += ` C ${controlX} ${current.y}, ${controlX} ${next.y}, ${next.x} ${next.y}`;
  }

  return path;
}

function getDensityColor(density: number): string {
  if (density >= 85) return "rgb(239, 68, 68)"; // red
  if (density >= 70) return "rgb(245, 158, 11)"; // amber
  return "rgb(16, 185, 129)"; // green
}

function CrowdForecastChart() {
  const linePath = generateSmoothPath(forecastData, 400, 120);
  const areaPath = `${linePath} L 400 120 L 0 120 Z`;

  const gradientStops = forecastData.map((point, i) => ({
    offset: `${(i / (forecastData.length - 1)) * 100}%`,
    color: getDensityColor(point.density),
  }));

  return (
    <div className="bg-slate-800/50 rounded-xl p-4 pl-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold">Crowd Density Forecast</h3>
        <span className="text-xs text-amber-400 bg-amber-400/10 px-2 py-1 rounded-full">
          Peak in 45 min
        </span>
      </div>

      {/* Chart area */}
      <div className="relative h-40">
        {/* Y-axis labels - positioned inside the container */}
        <div className="absolute -left-6 top-0 h-full flex flex-col justify-between text-xs text-slate-500">
          <span>100%</span>
          <span>50%</span>
          <span>0%</span>
        </div>

        {/* Chart area */}
        <div className="h-full">
          <svg
            viewBox="0 0 400 120"
            className="w-full h-full"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient
                id="lineGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                {gradientStops.map((stop, i) => (
                  <stop key={i} offset={stop.offset} stopColor={stop.color} />
                ))}
              </linearGradient>
              <linearGradient
                id="areaGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                {gradientStops.map((stop, i) => (
                  <stop
                    key={i}
                    offset={stop.offset}
                    stopColor={stop.color}
                    stopOpacity="0.2"
                  />
                ))}
              </linearGradient>
            </defs>

            {/* Grid lines */}
            <line
              x1="0"
              y1="30"
              x2="400"
              y2="30"
              stroke="rgb(51, 65, 85)"
              strokeWidth="1"
              strokeDasharray="4"
            />
            <line
              x1="0"
              y1="60"
              x2="400"
              y2="60"
              stroke="rgb(51, 65, 85)"
              strokeWidth="1"
              strokeDasharray="4"
            />
            <line
              x1="0"
              y1="90"
              x2="400"
              y2="90"
              stroke="rgb(51, 65, 85)"
              strokeWidth="1"
              strokeDasharray="4"
            />

            {/* Threshold lines */}
            <line
              x1="0"
              y1={120 - 80 * 0.9 - 10}
              x2="400"
              y2={120 - 80 * 0.9 - 10}
              stroke="rgb(245, 158, 11)"
              strokeWidth="1"
              strokeDasharray="2"
              strokeOpacity="0.5"
            />
            <line
              x1="0"
              y1={120 - 90 * 0.9 - 10}
              x2="400"
              y2={120 - 90 * 0.9 - 10}
              stroke="rgb(239, 68, 68)"
              strokeWidth="1"
              strokeDasharray="2"
              strokeOpacity="0.5"
            />

            <path d={areaPath} fill="url(#areaGradient)" />

            <path
              d={linePath}
              fill="none"
              stroke="url(#lineGradient)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
      {/* X-axis labels */}
      <div className="flex justify-between text-xs text-slate-500 mt-2">
        <span>Now</span>
        <span>+45m</span>
        <span>+1h30</span>
        <span>+2h15</span>
        <span>+3h</span>
      </div>
    </div>
  );
}

export default function DemoDashboard() {
  const [selectedCamera, setSelectedCamera] = useState<number | null>(null);
  const [alerts, _setAlerts] = useState(initialAlerts);
  const [safetyScore, setSafetyScore] = useState(87);
  const [totalOccupancy, setTotalOccupancy] = useState(1700);
  const [activeIncidents, _setActiveIncidents] = useState(2);

  // Simulate real-time data updates
  useEffect(() => {
    const dataTimer = setInterval(() => {
      // Fluctuate safety score slightly
      setSafetyScore((prev) =>
        Math.min(100, Math.max(70, prev + Math.floor(Math.random() * 5) - 2)),
      );
      // Fluctuate occupancy
      setTotalOccupancy((prev) =>
        Math.min(
          2500,
          Math.max(1500, prev + Math.floor(Math.random() * 50) - 25),
        ),
      );
    }, 5000);
    return () => clearInterval(dataTimer);
  }, []);

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

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "alert":
        return <XCircle className="w-4 h-4 text-red-400" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      default:
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <div className="p-4 lg:p-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Safety Score */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-sm">Safety Score</span>
            <Shield className="w-4 h-4 text-slate-500" />
          </div>
          <div className="flex items-end gap-2">
            <span
              className={`text-3xl font-bold ${safetyScore >= 80 ? "text-emerald-400" : safetyScore >= 60 ? "text-amber-400" : "text-red-400"}`}
            >
              {safetyScore}
            </span>
            <span className="text-slate-500 text-sm mb-1">/100</span>
          </div>
          <div className="mt-2 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${safetyScore >= 80 ? "bg-emerald-500" : safetyScore >= 60 ? "bg-amber-500" : "bg-red-500"}`}
              style={{ width: `${safetyScore}%` }}
            />
          </div>
        </div>

        {/* Total Occupancy */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-sm">Total Occupancy</span>
            <Users className="w-4 h-4 text-slate-500" />
          </div>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-white">
              {totalOccupancy.toLocaleString()}
            </span>
            <span className="text-slate-500 text-sm mb-1">/ 2,500</span>
          </div>
          <div className="flex items-center gap-1 mt-2 text-emerald-400 text-sm">
            <TrendingUp className="w-3 h-3" />
            <span>+127 last 15 min</span>
          </div>
        </div>

        {/* Active Cameras */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-sm">Active Cameras</span>
            <Camera className="w-4 h-4 text-slate-500" />
          </div>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-white">142</span>
            <span className="text-slate-500 text-sm mb-1">/ 144</span>
          </div>
          <div className="flex items-center gap-1 mt-2 text-amber-400 text-sm">
            <AlertTriangle className="w-3 h-3" />
            <span>2 cameras offline</span>
          </div>
        </div>

        {/* Active Alerts */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-sm">Active Alerts</span>
            <Bell className="w-4 h-4 text-slate-500" />
          </div>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-amber-400">
              {activeIncidents}
            </span>
            <span className="text-slate-500 text-sm mb-1">unresolved</span>
          </div>
          <div className="flex items-center gap-1 mt-2 text-slate-400 text-sm">
            <CheckCircle className="w-3 h-3" />
            <span>14 resolved today</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Camera Grid */}
        <div className="xl:col-span-2 bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-slate-400" />
              <span className="font-medium">Live Camera Feeds</span>
            </div>
            <button className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-1">
              View All
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {cameraFeeds.map((camera) => (
                <div
                  key={camera.id}
                  className={`relative bg-slate-800 rounded-lg overflow-hidden cursor-pointer transition-all hover:ring-2 hover:ring-slate-600 ${selectedCamera === camera.id ? "ring-2 ring-emerald-500" : ""}`}
                  onClick={() =>
                    setSelectedCamera(
                      camera.id === selectedCamera ? null : camera.id,
                    )
                  }
                >
                  {/* Camera Image */}
                  <div className="aspect-video relative">
                    <Image
                      src={`/images/surveillance-${camera.id}.jpg`}
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
                          className={`text-[10px] font-medium ${camera.occupancy / camera.capacity > 0.9 ? "text-red-400" : camera.occupancy / camera.capacity > 0.7 ? "text-amber-400" : "text-emerald-400"}`}
                        >
                          {Math.round(
                            (camera.occupancy / camera.capacity) * 100,
                          )}
                          %
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Alerts Panel */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-slate-400" />
              <span className="font-medium">Recent Alerts</span>
            </div>
            <span className="text-xs bg-slate-800 px-2 py-1 rounded-full text-slate-400">
              {alerts.filter((a) => !a.resolved).length} active
            </span>
          </div>
          <div className="p-2 max-h-[400px] overflow-y-auto">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-3 rounded-lg mb-2 transition-colors ${alert.resolved ? "bg-slate-800/30" : "bg-slate-800/70"}`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{getAlertIcon(alert.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-sm font-medium ${alert.resolved ? "text-slate-500" : "text-white"}`}
                      >
                        {alert.title}
                      </span>
                      {alert.resolved && (
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">
                          Resolved
                        </span>
                      )}
                    </div>
                    <p
                      className={`text-xs mt-0.5 ${alert.resolved ? "text-slate-600" : "text-slate-400"}`}
                    >
                      {alert.message}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] text-slate-500">
                        {alert.zone}
                      </span>
                      <span className="text-[10px] text-slate-600">•</span>
                      <span className="text-[10px] text-slate-500">
                        {alert.time}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Crowd Density Forecast */}
        <CrowdForecastChart />

        {/* Zone Status */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-slate-400" />
              <span className="font-medium">Zone Status</span>
            </div>
            <button className="text-sm text-slate-400 hover:text-white transition-colors">
              View Map
            </button>
          </div>
          <div className="p-4 space-y-3">
            {zoneData.map((zone) => (
              <div key={zone.name} className="flex items-center gap-3">
                <div className="w-16 text-sm text-slate-400">{zone.name}</div>
                <div className="flex-1">
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${zone.current / zone.max > 1 ? "bg-red-500" : zone.current / zone.max > 0.8 ? "bg-amber-500" : "bg-emerald-500"}`}
                      style={{
                        width: `${Math.min(100, (zone.current / zone.max) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="w-20 text-right">
                  <span
                    className={`text-sm font-medium ${zone.current / zone.max > 1 ? "text-red-400" : zone.current / zone.max > 0.8 ? "text-amber-400" : "text-emerald-400"}`}
                  >
                    {zone.current}
                  </span>
                  <span className="text-xs text-slate-500">/{zone.max}</span>
                </div>
                <div className="w-12 flex items-center justify-end gap-1">
                  {zone.trend === "up" ? (
                    <TrendingUp className="w-3 h-3 text-red-400" />
                  ) : zone.trend === "down" ? (
                    <TrendingDown className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <div className="w-3 h-0.5 bg-slate-600 rounded" />
                  )}
                  <span
                    className={`text-[10px] ${zone.trend === "up" ? "text-red-400" : zone.trend === "down" ? "text-emerald-400" : "text-slate-500"}`}
                  >
                    {zone.change > 0 ? "+" : ""}
                    {zone.change}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
