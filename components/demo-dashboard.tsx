"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  Shield,
  Camera,
  Users,
  AlertTriangle,
  Activity,
  Bell,
  Settings,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Maximize2,
  User,
  LogOut,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

// Mock camera feeds data
const cameraFeeds = [
  { id: 1, name: "Main Entrance", zone: "Zone A", status: "normal", occupancy: 342, capacity: 500 },
  { id: 2, name: "North Concourse", zone: "Zone B", status: "warning", occupancy: 478, capacity: 500 },
  { id: 3, name: "South Gate", zone: "Zone C", status: "normal", occupancy: 156, capacity: 400 },
  { id: 4, name: "VIP Section", zone: "Zone D", status: "normal", occupancy: 89, capacity: 150 },
  { id: 5, name: "Food Court", zone: "Zone E", status: "alert", occupancy: 623, capacity: 600 },
  { id: 6, name: "Emergency Exit B", zone: "Zone F", status: "normal", occupancy: 12, capacity: 100 },
]

// Mock alerts data
const initialAlerts = [
  {
    id: 1,
    type: "warning",
    title: "Crowd Density Alert",
    message: "Zone B approaching 95% capacity",
    time: "2 min ago",
    zone: "Zone B",
    resolved: false,
  },
  {
    id: 2,
    type: "alert",
    title: "Capacity Exceeded",
    message: "Food Court over capacity limit",
    time: "5 min ago",
    zone: "Zone E",
    resolved: false,
  },
  {
    id: 3,
    type: "info",
    title: "Compliance Check",
    message: "Automated scan completed - All clear",
    time: "12 min ago",
    zone: "All Zones",
    resolved: true,
  },
  {
    id: 4,
    type: "warning",
    title: "Unusual Activity",
    message: "Movement pattern anomaly detected",
    time: "18 min ago",
    zone: "Zone A",
    resolved: true,
  },
]

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
]

// Mock zone data
const zoneData = [
  { name: "Zone A", current: 342, max: 500, trend: "up", change: 12 },
  { name: "Zone B", current: 478, max: 500, trend: "up", change: 23 },
  { name: "Zone C", current: 156, max: 400, trend: "down", change: 8 },
  { name: "Zone D", current: 89, max: 150, trend: "stable", change: 2 },
  { name: "Zone E", current: 623, max: 600, trend: "up", change: 31 },
  { name: "Zone F", current: 12, max: 100, trend: "stable", change: 0 },
]

function generateSmoothPath(data: typeof forecastData, width: number, height: number): string {
  const points = data.map((point, i) => ({
    x: (i / (data.length - 1)) * width,
    y: height - point.density * (height / 100) * 0.9 - 10,
  }))

  let path = `M ${points[0].x} ${points[0].y}`

  for (let i = 0; i < points.length - 1; i++) {
    const current = points[i]
    const next = points[i + 1]
    const controlX = (current.x + next.x) / 2

    path += ` C ${controlX} ${current.y}, ${controlX} ${next.y}, ${next.x} ${next.y}`
  }

  return path
}

function getDensityColor(density: number): string {
  if (density >= 85) return "rgb(239, 68, 68)" // red
  if (density >= 70) return "rgb(245, 158, 11)" // amber
  return "rgb(16, 185, 129)" // green
}

function CrowdForecastChart() {
  const linePath = generateSmoothPath(forecastData, 400, 120)
  const areaPath = `${linePath} L 400 120 L 0 120 Z`

  const gradientStops = forecastData.map((point, i) => ({
    offset: `${(i / (forecastData.length - 1)) * 100}%`,
    color: getDensityColor(point.density),
  }))

  return (
    <div className="bg-slate-800/50 rounded-xl p-4 pl-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold">Crowd Density Forecast</h3>
        <span className="text-xs text-amber-400 bg-amber-400/10 px-2 py-1 rounded-full">Peak in 45 min</span>
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
          <svg viewBox="0 0 400 120" className="w-full h-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                {gradientStops.map((stop, i) => (
                  <stop key={i} offset={stop.offset} stopColor={stop.color} />
                ))}
              </linearGradient>
              <linearGradient id="areaGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                {gradientStops.map((stop, i) => (
                  <stop key={i} offset={stop.offset} stopColor={stop.color} stopOpacity="0.2" />
                ))}
              </linearGradient>
            </defs>

            {/* Grid lines */}
            <line x1="0" y1="30" x2="400" y2="30" stroke="rgb(51, 65, 85)" strokeWidth="1" strokeDasharray="4" />
            <line x1="0" y1="60" x2="400" y2="60" stroke="rgb(51, 65, 85)" strokeWidth="1" strokeDasharray="4" />
            <line x1="0" y1="90" x2="400" y2="90" stroke="rgb(51, 65, 85)" strokeWidth="1" strokeDasharray="4" />

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
  )
}

export default function DemoDashboard() {
  const [activeSection, setActiveSection] = useState("dashboard")
  const [currentTime, setCurrentTime] = useState(new Date())
  const [selectedCamera, setSelectedCamera] = useState<number | null>(null)
  const [alerts, setAlerts] = useState(initialAlerts)
  const [safetyScore, setSafetyScore] = useState(87)
  const [totalOccupancy, setTotalOccupancy] = useState(1700)
  const [activeIncidents, setActiveIncidents] = useState(2)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Simulate real-time data updates
  useEffect(() => {
    const dataTimer = setInterval(() => {
      // Fluctuate safety score slightly
      setSafetyScore((prev) => Math.min(100, Math.max(70, prev + Math.floor(Math.random() * 5) - 2)))
      // Fluctuate occupancy
      setTotalOccupancy((prev) => Math.min(2500, Math.max(1500, prev + Math.floor(Math.random() * 50) - 25)))
    }, 5000)
    return () => clearInterval(dataTimer)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "alert":
        return "bg-red-500"
      case "warning":
        return "bg-amber-500"
      default:
        return "bg-emerald-500"
    }
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "alert":
        return <XCircle className="w-4 h-4 text-red-400" />
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-amber-400" />
      default:
        return <CheckCircle className="w-4 h-4 text-emerald-400" />
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Top Navigation Bar */}
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-4 py-3 sticky top-0 z-50">
        <div className="flex items-center justify-between max-w-[1920px] mx-auto">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="h-6 w-px bg-slate-700" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-lg hidden sm:inline">VenueShield AI</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-emerald-400 font-medium">Live Demo</span>
            </div>
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-lg">
              <Clock className="w-4 h-4 text-slate-400" />
              <span className="text-slate-300 font-mono">
                {currentTime.toLocaleTimeString("en-US", { hour12: false })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>

              {notificationsOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-80 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden"
                  >
                    <div className="p-3 border-b border-slate-700 flex items-center justify-between">
                      <span className="font-semibold text-white">Notifications</span>
                      <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full">4 new</span>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {[
                        {
                          type: "critical",
                          title: "Crowd Density Alert",
                          message: "Zone A exceeding 90% capacity",
                          time: "2 min ago",
                          icon: Users,
                        },
                        {
                          type: "warning",
                          title: "Potential Incident",
                          message: "Unusual activity detected at Gate 3",
                          time: "8 min ago",
                          icon: AlertTriangle,
                        },
                        {
                          type: "info",
                          title: "Camera Offline",
                          message: "CAM-12 connection lost",
                          time: "15 min ago",
                          icon: Camera,
                        },
                        {
                          type: "success",
                          title: "Incident Resolved",
                          message: "Gate 2 disturbance cleared",
                          time: "32 min ago",
                          icon: CheckCircle,
                        },
                      ].map((notification, i) => (
                        <div
                          key={i}
                          className="p-3 hover:bg-slate-700/50 transition-colors cursor-pointer border-b border-slate-700/50 last:border-0"
                        >
                          <div className="flex gap-3">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                notification.type === "critical"
                                  ? "bg-red-500/20 text-red-400"
                                  : notification.type === "warning"
                                    ? "bg-amber-500/20 text-amber-400"
                                    : notification.type === "info"
                                      ? "bg-blue-500/20 text-blue-400"
                                      : "bg-emerald-500/20 text-emerald-400"
                              }`}
                            >
                              <notification.icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white">{notification.title}</p>
                              <p className="text-xs text-slate-400 truncate">{notification.message}</p>
                              <p className="text-xs text-slate-500 mt-1">{notification.time}</p>
                            </div>
                            {i < 2 && <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-2 border-t border-slate-700">
                      <button className="w-full py-2 text-sm text-center text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
                        View all notifications
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </div>
            <div className="relative">
              <button
                onClick={() => setSettingsOpen(!settingsOpen)}
                className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-medium hover:ring-2 hover:ring-slate-500 transition-all cursor-pointer"
              >
                OP
              </button>

              {settingsOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setSettingsOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-56 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden"
                  >
                    <div className="p-3 border-b border-slate-700">
                      <p className="font-semibold text-white">Operator Demo</p>
                      <p className="text-xs text-slate-400">demo@venueshield.ai</p>
                    </div>
                    <div className="py-1">
                      {[
                        { icon: User, label: "Profile", shortcut: "⌘P" },
                        { icon: Settings, label: "Settings", shortcut: "⌘S" },
                        { icon: Shield, label: "Security", shortcut: null },
                        { icon: Bell, label: "Notification Preferences", shortcut: null },
                      ].map((item, i) => (
                        <button
                          key={i}
                          className="w-full px-3 py-2 flex items-center justify-between text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <item.icon className="w-4 h-4" />
                            <span>{item.label}</span>
                          </div>
                          {item.shortcut && <span className="text-xs text-slate-500">{item.shortcut}</span>}
                        </button>
                      ))}
                    </div>
                    <div className="border-t border-slate-700 py-1">
                      <button className="w-full px-3 py-2 flex items-center gap-2 text-sm text-red-400 hover:bg-slate-700 hover:text-red-300 transition-colors">
                        <LogOut className="w-4 h-4" />
                        <span>Sign out</span>
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 bg-slate-900/50 border-r border-slate-800 min-h-[calc(100vh-60px)]">
          <nav className="p-4 space-y-1">
            <button className="w-full flex items-center gap-3 px-3 py-2.5 bg-slate-800 text-white rounded-lg font-medium">
              <Activity className="w-5 h-5" />
              Dashboard
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-lg transition-colors">
              <Camera className="w-5 h-5" />
              Camera Feeds
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-lg transition-colors">
              <Users className="w-5 h-5" />
              Crowd Analytics
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-lg transition-colors">
              <AlertTriangle className="w-5 h-5" />
              Incidents
              <span className="ml-auto bg-red-500/20 text-red-400 text-xs px-2 py-0.5 rounded-full">
                {activeIncidents}
              </span>
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-lg transition-colors">
              <Shield className="w-5 h-5" />
              Compliance
            </button>
          </nav>

          {/* Venue Info */}
          <div className="mt-auto p-4 border-t border-slate-800">
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="text-xs text-slate-500 mb-1">Current Venue</div>
              <div className="font-medium text-sm">Metro Arena</div>
              <div className="text-xs text-slate-400 mt-1">Event: Concert - Taylor Swift</div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
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
                <span className="text-3xl font-bold text-white">{totalOccupancy.toLocaleString()}</span>
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
                <span className="text-3xl font-bold text-amber-400">{activeIncidents}</span>
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
                      onClick={() => setSelectedCamera(camera.id === selectedCamera ? null : camera.id)}
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
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(camera.status)} animate-pulse`} />
                          <span className="text-xs font-medium bg-black/50 px-1.5 py-0.5 rounded">CAM {camera.id}</span>
                        </div>

                        {/* Camera controls */}
                        <div className="absolute top-2 right-2 flex items-center gap-1">
                          <button className="p-1 bg-black/50 rounded hover:bg-black/70 transition-colors">
                            <Maximize2 className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Camera info */}
                        <div className="absolute bottom-0 left-0 right-0 p-2">
                          <div className="text-xs font-medium truncate">{camera.name}</div>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-[10px] text-slate-400">{camera.zone}</span>
                            <span
                              className={`text-[10px] font-medium ${camera.occupancy / camera.capacity > 0.9 ? "text-red-400" : camera.occupancy / camera.capacity > 0.7 ? "text-amber-400" : "text-emerald-400"}`}
                            >
                              {Math.round((camera.occupancy / camera.capacity) * 100)}%
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
                          <span className={`text-sm font-medium ${alert.resolved ? "text-slate-500" : "text-white"}`}>
                            {alert.title}
                          </span>
                          {alert.resolved && (
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">
                              Resolved
                            </span>
                          )}
                        </div>
                        <p className={`text-xs mt-0.5 ${alert.resolved ? "text-slate-600" : "text-slate-400"}`}>
                          {alert.message}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[10px] text-slate-500">{alert.zone}</span>
                          <span className="text-[10px] text-slate-600">•</span>
                          <span className="text-[10px] text-slate-500">{alert.time}</span>
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
                <button className="text-sm text-slate-400 hover:text-white transition-colors">View Map</button>
              </div>
              <div className="p-4 space-y-3">
                {zoneData.map((zone) => (
                  <div key={zone.name} className="flex items-center gap-3">
                    <div className="w-16 text-sm text-slate-400">{zone.name}</div>
                    <div className="flex-1">
                      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${zone.current / zone.max > 1 ? "bg-red-500" : zone.current / zone.max > 0.8 ? "bg-amber-500" : "bg-emerald-500"}`}
                          style={{ width: `${Math.min(100, (zone.current / zone.max) * 100)}%` }}
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
        </main>
      </div>
    </div>
  )
}
