"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  MapPin,
  Activity,
  BarChart3,
  LineChart,
  PieChart,
  ChevronDown,
  Download,
  RefreshCw,
  Zap,
  Target,
  AlertTriangle,
  Eye,
  ArrowRight,
  Minus,
} from "lucide-react";

// Mock time series data for the main chart
const generateHourlyData = () => {
  const hours = [];
  const now = new Date();
  for (let i = 23; i >= 0; i--) {
    const hour = new Date(now);
    hour.setHours(now.getHours() - i);
    hours.push({
      time: hour.toLocaleTimeString("en-US", { hour: "2-digit", hour12: true }),
      timestamp: hour.getTime(),
      occupancy: Math.floor(Math.random() * 800 + 1200),
      capacity: 2500,
      entries: Math.floor(Math.random() * 200 + 50),
      exits: Math.floor(Math.random() * 180 + 40),
    });
  }
  return hours;
};

// Zone data with detailed analytics - mapped to actual camera locations
const zoneAnalytics = [
  {
    id: "A",
    name: "Main Gate",
    current: 487,
    max: 500,
    avgDwell: "2.1 min",
    peakHour: "7:30 PM",
    trend: "up",
    change: 31,
    density: 97,
    flowRate: 156,
  },
  {
    id: "B",
    name: "Main Field",
    current: 18500,
    max: 25000,
    avgDwell: "95 min",
    peakHour: "8:30 PM",
    trend: "stable",
    change: 120,
    density: 74,
    flowRate: 45,
  },
  {
    id: "C",
    name: "North Hallway",
    current: 0,
    max: 200,
    avgDwell: "0 min",
    peakHour: "7:00 PM",
    trend: "down",
    change: 0,
    density: 0,
    flowRate: 0,
  },
  {
    id: "D",
    name: "Parking Lot B",
    current: 127,
    max: 500,
    avgDwell: "45 min",
    peakHour: "6:30 PM",
    trend: "down",
    change: 15,
    density: 25,
    flowRate: 8,
  },
  {
    id: "E",
    name: "Backstage",
    current: 3,
    max: 50,
    avgDwell: "120 min",
    peakHour: "6:00 PM",
    trend: "stable",
    change: 1,
    density: 6,
    flowRate: 1,
  },
  {
    id: "F",
    name: "Food Court",
    current: 89,
    max: 300,
    avgDwell: "22.5 min",
    peakHour: "7:45 PM",
    trend: "stable",
    change: 8,
    density: 30,
    flowRate: 24,
  },
];

// Crowd flow patterns - mapped to actual locations
const flowPatterns = [
  { from: "Main Gate", to: "Main Field", volume: 245, percentage: 42 },
  { from: "Main Gate", to: "Food Court", volume: 156, percentage: 27 },
  { from: "Main Gate", to: "North Hallway", volume: 98, percentage: 17 },
  { from: "Food Court", to: "Main Field", volume: 134, percentage: 28 },
  { from: "Parking Lot B", to: "Main Gate", volume: 67, percentage: 14 },
];

// Demographics breakdown (simulated AI detection)
const demographics = {
  ageGroups: [
    { label: "18-24", value: 28, color: "#10b981" },
    { label: "25-34", value: 35, color: "#3b82f6" },
    { label: "35-44", value: 22, color: "#8b5cf6" },
    { label: "45-54", value: 10, color: "#f59e0b" },
    { label: "55+", value: 5, color: "#ef4444" },
  ],
  groupSizes: [
    { label: "Solo", value: 15 },
    { label: "Pairs", value: 32 },
    { label: "Small (3-5)", value: 38 },
    { label: "Large (6+)", value: 15 },
  ],
};

// Predictions
const predictions = [
  {
    time: "+15 min",
    occupancy: 1850,
    confidence: 94,
    alert: null,
  },
  {
    time: "+30 min",
    occupancy: 2100,
    confidence: 89,
    alert: "warning",
  },
  {
    time: "+45 min",
    occupancy: 2350,
    confidence: 82,
    alert: "critical",
  },
  {
    time: "+1 hour",
    occupancy: 2200,
    confidence: 75,
    alert: "warning",
  },
];

type TimeRange = "1h" | "6h" | "24h" | "7d";

export default function CrowdAnalyticsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>("24h");
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [hourlyData, setHourlyData] = useState(generateHourlyData());
  const [currentOccupancy, setCurrentOccupancy] = useState(1742);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<"overview" | "zones" | "flow">(
    "overview",
  );

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentOccupancy((prev) =>
        Math.min(
          2500,
          Math.max(1500, prev + Math.floor(Math.random() * 100) - 50),
        ),
      );
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setHourlyData(generateHourlyData());
      setIsRefreshing(false);
    }, 1000);
  };

  const occupancyPercentage = Math.round((currentOccupancy / 2500) * 100);

  // Generate path for area chart
  const chartPath = useMemo(() => {
    const width = 100;
    const height = 100;
    const data = hourlyData.slice(-12);
    const maxVal = Math.max(...data.map((d) => d.occupancy));
    const minVal = Math.min(...data.map((d) => d.occupancy));
    const range = maxVal - minVal || 1;

    const points = data.map((d, i) => ({
      x: (i / (data.length - 1)) * width,
      y: height - ((d.occupancy - minVal) / range) * height * 0.8 - 10,
    }));

    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const curr = points[i];
      const next = points[i + 1];
      const cx = (curr.x + next.x) / 2;
      path += ` C ${cx} ${curr.y}, ${cx} ${next.y}, ${next.x} ${next.y}`;
    }

    const areaPath = `${path} L ${width} ${height} L 0 ${height} Z`;
    return { line: path, area: areaPath, points };
  }, [hourlyData]);

  return (
    <div className="p-4 lg:p-6 min-h-[calc(100vh-60px)]">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-slate-400" />
            Crowd Analytics
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time crowd intelligence and predictive analytics
          </p>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto">
          {/* View Mode Selector */}
          <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg p-1">
            {[
              { value: "overview", icon: BarChart3, label: "Overview" },
              { value: "zones", icon: MapPin, label: "Zones" },
              { value: "flow", icon: Activity, label: "Flow" },
            ].map((mode) => (
              <button
                key={mode.value}
                onClick={() => setViewMode(mode.value as typeof viewMode)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors ${
                  viewMode === mode.value
                    ? "bg-slate-700 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <mode.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{mode.label}</span>
              </button>
            ))}
          </div>

          {/* Time Range Selector */}
          <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg p-1">
            {(["1h", "6h", "24h", "7d"] as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 rounded text-sm transition-colors ${
                  timeRange === range
                    ? "bg-emerald-500 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          {/* Actions */}
          <button
            onClick={handleRefresh}
            className={`p-2 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors ${
              isRefreshing ? "animate-spin" : ""
            }`}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button className="p-2 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors">
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Current Occupancy */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 text-sm">Current Occupancy</span>
            <Users className="w-4 h-4 text-slate-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <motion.span
              key={currentOccupancy}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-bold text-white"
            >
              {currentOccupancy.toLocaleString()}
            </motion.span>
            <span className="text-slate-500 text-sm">/ 2,500</span>
          </div>
          <div className="mt-3 h-2 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${
                occupancyPercentage > 90
                  ? "bg-red-500"
                  : occupancyPercentage > 70
                    ? "bg-amber-500"
                    : "bg-emerald-500"
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${occupancyPercentage}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <div className="flex items-center gap-1 mt-2 text-emerald-400 text-sm">
            <TrendingUp className="w-3 h-3" />
            <span>+127 in last 15 min</span>
          </div>
        </div>

        {/* Peak Density */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 text-sm">Peak Density</span>
            <Target className="w-4 h-4 text-slate-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-amber-400">96%</span>
            <span className="text-slate-500 text-sm">Zone B</span>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full w-[96%] bg-amber-500 rounded-full" />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-2 text-amber-400 text-sm">
            <AlertTriangle className="w-3 h-3" />
            <span>Near capacity threshold</span>
          </div>
        </div>

        {/* Avg Dwell Time */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 text-sm">Avg Dwell Time</span>
            <Clock className="w-4 h-4 text-slate-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">12.4</span>
            <span className="text-slate-500 text-sm">minutes</span>
          </div>
          <div className="mt-3 flex gap-2 text-xs">
            <span className="px-2 py-1 bg-slate-800 rounded text-slate-400">
              Min: 2.1m
            </span>
            <span className="px-2 py-1 bg-slate-800 rounded text-slate-400">
              Max: 45.3m
            </span>
          </div>
          <div className="flex items-center gap-1 mt-2 text-slate-400 text-sm">
            <Minus className="w-3 h-3" />
            <span>Stable vs yesterday</span>
          </div>
        </div>

        {/* Flow Rate */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 text-sm">Flow Rate</span>
            <Activity className="w-4 h-4 text-slate-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">234</span>
            <span className="text-slate-500 text-sm">people/min</span>
          </div>
          <div className="mt-3 flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1 text-emerald-400">
              <ArrowUpRight className="w-3 h-3" />
              <span>128 in</span>
            </div>
            <div className="flex items-center gap-1 text-red-400">
              <ArrowDownRight className="w-3 h-3" />
              <span>106 out</span>
            </div>
          </div>
          <div className="flex items-center gap-1 mt-2 text-emerald-400 text-sm">
            <TrendingUp className="w-3 h-3" />
            <span>+18% from avg</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Large Chart Area */}
        <div className="xl:col-span-2 bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <LineChart className="w-4 h-4 text-slate-400" />
              <span className="font-medium">Occupancy Trend</span>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-emerald-500 rounded" />
                <span className="text-slate-400">Occupancy</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-slate-500 rounded" />
                <span className="text-slate-400">Capacity</span>
              </div>
            </div>
          </div>

          <div className="p-4">
            {/* Chart */}
            <div className="relative h-64">
              {/* Y-axis labels */}
              <div className="absolute -left-2 top-0 h-full flex flex-col justify-between text-xs text-slate-500 w-12 text-right pr-2">
                <span>2,500</span>
                <span>1,875</span>
                <span>1,250</span>
                <span>625</span>
                <span>0</span>
              </div>

              {/* Chart area */}
              <div className="ml-12 h-full relative">
                <svg
                  viewBox="0 0 100 100"
                  className="w-full h-full"
                  preserveAspectRatio="none"
                >
                  {/* Grid lines */}
                  {[0, 25, 50, 75, 100].map((y) => (
                    <line
                      key={y}
                      x1="0"
                      y1={y}
                      x2="100"
                      y2={y}
                      stroke="rgb(51, 65, 85)"
                      strokeWidth="0.5"
                      strokeDasharray="2"
                    />
                  ))}

                  {/* Capacity threshold line */}
                  <line
                    x1="0"
                    y1="20"
                    x2="100"
                    y2="20"
                    stroke="rgb(239, 68, 68)"
                    strokeWidth="0.5"
                    strokeDasharray="4"
                  />

                  {/* Gradients for dynamic coloring based on capacity */}
                  <defs>
                    {/* Line gradient - vertical, changes color based on Y position */}
                    <linearGradient
                      id="lineGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="rgb(239, 68, 68)" />
                      <stop offset="15%" stopColor="rgb(239, 68, 68)" />
                      <stop offset="20%" stopColor="rgb(245, 158, 11)" />
                      <stop offset="35%" stopColor="rgb(245, 158, 11)" />
                      <stop offset="45%" stopColor="rgb(16, 185, 129)" />
                      <stop offset="100%" stopColor="rgb(16, 185, 129)" />
                    </linearGradient>

                    {/* Area gradient - follows same color scheme */}
                    <linearGradient
                      id="areaGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="rgb(239, 68, 68)"
                        stopOpacity="0.3"
                      />
                      <stop
                        offset="20%"
                        stopColor="rgb(245, 158, 11)"
                        stopOpacity="0.25"
                      />
                      <stop
                        offset="45%"
                        stopColor="rgb(16, 185, 129)"
                        stopOpacity="0.2"
                      />
                      <stop
                        offset="100%"
                        stopColor="rgb(16, 185, 129)"
                        stopOpacity="0"
                      />
                    </linearGradient>
                  </defs>

                  {/* Area fill */}
                  <path d={chartPath.area} fill="url(#areaGradient)" />

                  {/* Line with gradient */}
                  <path
                    d={chartPath.line}
                    fill="none"
                    stroke="url(#lineGradient)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>

                {/* Hover tooltip area would go here */}
              </div>
            </div>

            {/* X-axis labels */}
            <div className="ml-12 flex justify-between text-xs text-slate-500 mt-2">
              {hourlyData
                .slice(-12)
                .filter((_, i) => i % 2 === 0)
                .map((d, i) => (
                  <span key={i}>{d.time}</span>
                ))}
            </div>
          </div>
        </div>

        {/* AI Predictions Panel */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="font-medium">AI Predictions</span>
            </div>
            <span className="text-xs px-2 py-1 bg-amber-500/10 text-amber-400 rounded-full">
              Live
            </span>
          </div>

          <div className="p-4 space-y-3">
            {predictions.map((pred, i) => (
              <motion.div
                key={pred.time}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`p-3 rounded-lg border ${
                  pred.alert === "critical"
                    ? "bg-red-500/10 border-red-500/30"
                    : pred.alert === "warning"
                      ? "bg-amber-500/10 border-amber-500/30"
                      : "bg-slate-800/50 border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white">
                    {pred.time}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      pred.confidence >= 90
                        ? "bg-emerald-500/20 text-emerald-400"
                        : pred.confidence >= 80
                          ? "bg-amber-500/20 text-amber-400"
                          : "bg-slate-700 text-slate-400"
                    }`}
                  >
                    {pred.confidence}% conf.
                  </span>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-2xl font-bold text-white">
                      {pred.occupancy.toLocaleString()}
                    </span>
                    <span className="text-sm text-slate-400 ml-1">people</span>
                  </div>
                  {pred.alert && (
                    <div
                      className={`flex items-center gap-1 text-xs ${
                        pred.alert === "critical"
                          ? "text-red-400"
                          : "text-amber-400"
                      }`}
                    >
                      <AlertTriangle className="w-3 h-3" />
                      {pred.alert === "critical"
                        ? "Over capacity"
                        : "High density"}
                    </div>
                  )}
                </div>
                <div className="mt-2 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      pred.occupancy / 2500 > 0.9
                        ? "bg-red-500"
                        : pred.occupancy / 2500 > 0.75
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                    }`}
                    style={{
                      width: `${Math.min(100, (pred.occupancy / 2500) * 100)}%`,
                    }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mt-6">
        {/* Zone Density Heatmap */}
        <div className="xl:col-span-2 bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-400" />
              <span className="font-medium">Zone Analytics</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Sort by:</span>
              <button className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
                Density
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="p-4">
            <div className="grid gap-3">
              {zoneAnalytics.map((zone) => (
                <motion.div
                  key={zone.id}
                  whileHover={{ scale: 1.01 }}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedZone === zone.id
                      ? "bg-slate-800 border-emerald-500/50"
                      : "bg-slate-800/50 border-slate-700 hover:border-slate-600"
                  }`}
                  onClick={() =>
                    setSelectedZone(selectedZone === zone.id ? null : zone.id)
                  }
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${
                          zone.density > 90
                            ? "bg-red-500/20 text-red-400"
                            : zone.density > 70
                              ? "bg-amber-500/20 text-amber-400"
                              : "bg-emerald-500/20 text-emerald-400"
                        }`}
                      >
                        {zone.id}
                      </div>
                      <div>
                        <div className="font-medium text-white">
                          {zone.name}
                        </div>
                        <div className="text-xs text-slate-400">
                          Peak: {zone.peakHour} • Avg dwell: {zone.avgDwell}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <span
                          className={`text-xl font-bold ${
                            zone.density > 90
                              ? "text-red-400"
                              : zone.density > 70
                                ? "text-amber-400"
                                : "text-emerald-400"
                          }`}
                        >
                          {zone.current}
                        </span>
                        <span className="text-sm text-slate-500">
                          /{zone.max}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs mt-0.5">
                        {zone.trend === "up" ? (
                          <>
                            <TrendingUp className="w-3 h-3 text-red-400" />
                            <span className="text-red-400">+{zone.change}</span>
                          </>
                        ) : zone.trend === "down" ? (
                          <>
                            <TrendingDown className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">
                              -{zone.change}
                            </span>
                          </>
                        ) : (
                          <>
                            <Minus className="w-3 h-3 text-slate-500" />
                            <span className="text-slate-500">Stable</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Density bar */}
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, zone.density)}%` }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                      className={`h-full rounded-full ${
                        zone.density > 90
                          ? "bg-red-500"
                          : zone.density > 70
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                      }`}
                    />
                  </div>

                  {/* Expanded details */}
                  <AnimatePresence>
                    {selectedZone === zone.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-4 pt-4 border-t border-slate-700 grid grid-cols-3 gap-4"
                      >
                        <div>
                          <div className="text-xs text-slate-500 mb-1">
                            Density
                          </div>
                          <div className="text-lg font-semibold text-white">
                            {zone.density}%
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500 mb-1">
                            Flow Rate
                          </div>
                          <div className="text-lg font-semibold text-white">
                            {zone.flowRate}/min
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500 mb-1">
                            Avg Dwell
                          </div>
                          <div className="text-lg font-semibold text-white">
                            {zone.avgDwell}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Demographics & Group Analysis */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-slate-400" />
              <span className="font-medium">Demographics</span>
            </div>
            <span className="text-xs px-2 py-1 bg-blue-500/10 text-blue-400 rounded-full">
              AI Detected
            </span>
          </div>

          <div className="p-4">
            {/* Age Groups */}
            <div className="mb-6">
              <h4 className="text-sm text-slate-400 mb-3">Age Distribution</h4>
              <div className="space-y-2">
                {demographics.ageGroups.map((group) => (
                  <div key={group.label} className="flex items-center gap-3">
                    <span className="w-12 text-xs text-slate-400">
                      {group.label}
                    </span>
                    <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${group.value}%` }}
                        transition={{ duration: 0.5 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: group.color }}
                      />
                    </div>
                    <span className="w-8 text-xs text-slate-400 text-right">
                      {group.value}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Group Sizes */}
            <div>
              <h4 className="text-sm text-slate-400 mb-3">Group Sizes</h4>
              <div className="grid grid-cols-2 gap-2">
                {demographics.groupSizes.map((group) => (
                  <div
                    key={group.label}
                    className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-center"
                  >
                    <div className="text-2xl font-bold text-white">
                      {group.value}%
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      {group.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Third Row - Flow Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Flow Patterns */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-slate-400" />
              <span className="font-medium">Movement Patterns</span>
            </div>
            <Eye className="w-4 h-4 text-slate-500" />
          </div>

          <div className="p-4 space-y-3">
            {flowPatterns.map((flow, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-white font-medium">{flow.from}</span>
                    <ArrowRight className="w-4 h-4 text-slate-500" />
                    <span className="text-white font-medium">{flow.to}</span>
                  </div>
                  <div className="mt-2 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full"
                      style={{ width: `${flow.percentage}%` }}
                    />
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-white">
                    {flow.volume}
                  </div>
                  <div className="text-xs text-slate-400">
                    {flow.percentage}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Entry/Exit Stats */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-slate-400" />
              <span className="font-medium">Entry/Exit Analysis</span>
            </div>
            <span className="text-xs text-slate-500">Last 2 hours</span>
          </div>

          <div className="p-4">
            {/* Bar chart representation */}
            <div className="flex items-end justify-between h-40 gap-1">
              {hourlyData.slice(-8).map((data, i) => {
                const maxVal = Math.max(
                  ...hourlyData
                    .slice(-8)
                    .map((d) => Math.max(d.entries, d.exits)),
                );
                const entryHeight = (data.entries / maxVal) * 100;
                const exitHeight = (data.exits / maxVal) * 100;

                return (
                  <div key={i} className="flex-1 flex gap-0.5 items-end h-full">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${entryHeight}%` }}
                      transition={{ duration: 0.5, delay: i * 0.05 }}
                      className="flex-1 bg-emerald-500 rounded-t"
                      title={`Entries: ${data.entries}`}
                    />
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${exitHeight}%` }}
                      transition={{ duration: 0.5, delay: i * 0.05 }}
                      className="flex-1 bg-red-500/70 rounded-t"
                      title={`Exits: ${data.exits}`}
                    />
                  </div>
                );
              })}
            </div>

            {/* X-axis labels */}
            <div className="flex justify-between mt-2 text-xs text-slate-500">
              {hourlyData.slice(-8).map((d, i) => (
                <span key={i} className="flex-1 text-center">
                  {d.time}
                </span>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-500 rounded" />
                <span className="text-xs text-slate-400">Entries</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500/70 rounded" />
                <span className="text-xs text-slate-400">Exits</span>
              </div>
            </div>

            {/* Summary stats */}
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-emerald-400">1,247</div>
                <div className="text-xs text-slate-400">Total Entries</div>
              </div>
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-red-400">1,089</div>
                <div className="text-xs text-slate-400">Total Exits</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
