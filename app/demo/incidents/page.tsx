"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  Camera,
  Users,
  Shield,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  X,
  MessageSquare,
  Send,
  Radio,
  Bell,
  Eye,
  Play,
  MoreVertical,
  Share2,
  Printer,
  ArrowUpRight,
  Zap,
  Target,
  TriangleAlert,
  CircleAlert,
  Info,
  CheckCheck,
  Timer,
} from "lucide-react";
import Image from "next/image";
import type { ShadowDetection } from "@/lib/types/shadow";

// Incident types
type IncidentStatus =
  | "active"
  | "responding"
  | "monitoring"
  | "resolved"
  | "escalated";
type IncidentPriority = "critical" | "high" | "medium" | "low";
type IncidentType =
  | "crowd"
  | "security"
  | "medical"
  | "fire"
  | "technical"
  | "other";

interface Incident {
  id: string;
  title: string;
  description: string;
  type: IncidentType;
  priority: IncidentPriority;
  status: IncidentStatus;
  zone: string;
  location: string;
  camera: string;
  reportedAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  assignedTo: string[];
  aiConfidence: number;
  detectionMethod: "ai" | "manual" | "sensor";
  timeline: {
    time: Date;
    action: string;
    user: string;
    type: "detection" | "response" | "update" | "resolution";
  }[];
  relatedCameras: string[];
  affectedCapacity: number;
}

interface ApiIncident {
  id: string;
  cameraId: string;
  type: "capacity_warning" | "capacity_critical" | "camera_offline" | "camera_recovered";
  severity: "low" | "medium" | "high" | "critical";
  status: "active" | "resolved";
  title: string;
  description: string;
  triggerValue?: number | null;
  thresholdValue?: number | null;
  source: "rule-engine";
  zone?: string | null;
  cameraName?: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string | null;
  acknowledgedAt?: string | null;
  acknowledgedBy?: string | null;
}

interface IncidentApiResponse {
  incidents: ApiIncident[];
}

interface ShadowApiResponse {
  detections: ShadowDetection[];
}

function mapApiIncidentToUI(incident: ApiIncident): Incident {
  const uiType: IncidentType =
    incident.type === "capacity_warning" || incident.type === "capacity_critical"
      ? "crowd"
      : "technical";

  const timelineAction =
    incident.type === "camera_offline"
      ? "Camera stream went offline"
      : incident.type === "camera_recovered"
        ? "Camera stream recovered"
        : incident.type === "capacity_critical"
          ? "Capacity crossed critical threshold"
          : "Capacity crossed warning threshold";

  return {
    id: incident.id,
    title: incident.title,
    description: incident.description,
    type: uiType,
    priority: incident.severity as IncidentPriority,
    status: incident.status === "active" ? "active" : "resolved",
    zone: incident.zone ?? "Unknown Zone",
    location: `${incident.zone ?? "Unknown Zone"} - ${incident.cameraName ?? incident.cameraId}`,
    camera: incident.cameraId,
    reportedAt: new Date(incident.createdAt),
    updatedAt: new Date(incident.updatedAt),
    resolvedAt: incident.resolvedAt ? new Date(incident.resolvedAt) : undefined,
    acknowledgedAt: incident.acknowledgedAt
      ? new Date(incident.acknowledgedAt)
      : undefined,
    acknowledgedBy: incident.acknowledgedBy ?? undefined,
    assignedTo: ["Rule Engine"],
    aiConfidence: 0,
    detectionMethod: "sensor",
    timeline: [
      {
        time: new Date(incident.createdAt),
        action: timelineAction,
        user: "System",
        type: "detection",
      },
    ],
    relatedCameras: [incident.cameraId],
    affectedCapacity: Number(incident.triggerValue ?? 0),
  };
}

const priorityConfig = {
  critical: { color: "red", icon: TriangleAlert, label: "Critical" },
  high: { color: "amber", icon: AlertTriangle, label: "High" },
  medium: { color: "blue", icon: CircleAlert, label: "Medium" },
  low: { color: "slate", icon: Info, label: "Low" },
};

const statusConfig = {
  active: { color: "red", label: "Active", icon: Zap },
  responding: { color: "amber", label: "Responding", icon: Radio },
  monitoring: { color: "blue", label: "Monitoring", icon: Eye },
  resolved: { color: "emerald", label: "Resolved", icon: CheckCircle },
  escalated: { color: "purple", label: "Escalated", icon: ArrowUpRight },
};

const typeConfig = {
  crowd: { icon: Users, label: "Crowd", color: "blue" },
  security: { icon: Shield, label: "Security", color: "purple" },
  medical: { icon: Target, label: "Medical", color: "red" },
  fire: { icon: AlertTriangle, label: "Fire/Safety", color: "orange" },
  technical: { icon: Camera, label: "Technical", color: "slate" },
  other: { icon: Bell, label: "Other", color: "gray" },
};

export default function IncidentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCameraId = searchParams.get("cameraId")?.trim() ?? "";
  const [isMounted, setIsMounted] = useState(false);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<IncidentStatus | "all">(
    "all",
  );
  const [filterPriority, setFilterPriority] = useState<
    IncidentPriority | "all"
  >("all");
  const [cameraFilter, setCameraFilter] = useState<string>(
    initialCameraId || "all",
  );
  const [filterOpen, setFilterOpen] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [actionState, setActionState] = useState<{
    incidentId: string;
    action: "resolve" | "escalate" | "acknowledge";
    status: "idle" | "loading" | "success" | "error";
    message: string;
  } | null>(null);
  const [shadowByCamera, setShadowByCamera] = useState<
    Record<string, ShadowDetection>
  >({});

  useEffect(() => {
    const queryCamera = searchParams.get("cameraId")?.trim() ?? "";
    setCameraFilter(queryCamera || "all");
  }, [searchParams]);

  useEffect(() => {
    setIsMounted(true);
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let mounted = true;

    const fetchIncidents = async () => {
      try {
        const response = await fetch("/api/incidents?status=all&limit=200", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch incidents");
        }
        const payload: IncidentApiResponse = await response.json();
        const mapped = (payload.incidents ?? []).map(mapApiIncidentToUI);
        if (!mounted) return;
        setIncidents(mapped);
      } catch (error) {
        console.warn("[incidents] failed to fetch incidents", error);
        if (!mounted) return;
        setIncidents([]);
      }
    };

    void fetchIncidents();
    const interval = setInterval(fetchIncidents, 3000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const fetchShadow = async () => {
      try {
        const response = await fetch("/api/feed/shadow?limit=200", {
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error("Failed to fetch shadow detections");
        }
        const payload: ShadowApiResponse = await response.json();
        const byCamera = Object.fromEntries(
          (payload.detections ?? []).map((detection) => [
            detection.cameraId,
            detection,
          ]),
        ) as Record<string, ShadowDetection>;
        if (!mounted) return;
        setShadowByCamera(byCamera);
      } catch (error) {
        console.warn("[incidents] failed to fetch shadow detections", error);
      }
    };

    void fetchShadow();
    const interval = setInterval(fetchShadow, 5000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const formatTimeAgo = (date: Date) => {
    if (!isMounted) return "--";
    const seconds = Math.floor((currentTime.getTime() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const cameraOptions = Array.from(
    new Set(incidents.map((incident) => incident.camera)),
  ).sort();

  if (cameraFilter !== "all" && !cameraOptions.includes(cameraFilter)) {
    cameraOptions.unshift(cameraFilter);
  }

  const filteredIncidents = incidents.filter((incident) => {
    const matchesSearch =
      incident.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      incident.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      incident.zone.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || incident.status === filterStatus;
    const matchesPriority =
      filterPriority === "all" || incident.priority === filterPriority;
    const matchesCamera =
      cameraFilter === "all" || incident.camera === cameraFilter;
    return matchesSearch && matchesStatus && matchesPriority && matchesCamera;
  });

  useEffect(() => {
    if (!selectedIncident) return;
    const stillVisible = filteredIncidents.some(
      (incident) => incident.id === selectedIncident.id,
    );
    if (!stillVisible) {
      setSelectedIncident(null);
    }
  }, [filteredIncidents, selectedIncident]);

  const activeCount = incidents.filter(
    (i) => i.status === "active" || i.status === "escalated",
  ).length;
  const respondingCount = incidents.filter(
    (i) => i.status === "responding",
  ).length;
  const resolvedToday = incidents.filter((i) => i.status === "resolved").length;

  const handleResolve = async (incidentId: string) => {
    setActionState({
      incidentId,
      action: "resolve",
      status: "loading",
      message: "Resolving incident...",
    });

    try {
      const response = await fetch(`/api/incidents/${incidentId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "resolve" }),
      });

      if (!response.ok) {
        throw new Error("API resolve request failed");
      }
    } catch (error) {
      console.warn("[incidents] failed to resolve", error);
      setActionState({
        incidentId,
        action: "resolve",
        status: "error",
        message: "Failed to resolve incident.",
      });
      return;
    }

    setIncidents((prev) =>
      prev.map((i) =>
        i.id === incidentId
          ? {
              ...i,
              status: "resolved" as IncidentStatus,
              resolvedAt: new Date(),
              updatedAt: new Date(),
              timeline: [
                ...i.timeline,
                {
                  time: new Date(),
                  action: "Incident marked as resolved",
                  user: "Operator",
                  type: "resolution" as const,
                },
              ],
            }
          : i,
      ),
    );
    if (selectedIncident?.id === incidentId) {
      setSelectedIncident((prev) =>
        prev
          ? {
              ...prev,
              status: "resolved",
              resolvedAt: new Date(),
              updatedAt: new Date(),
            }
          : null,
      );
    }

    setActionState((prev) =>
      prev?.incidentId === incidentId
        ? {
            incidentId,
            action: "resolve",
            status: prev.status === "error" ? "error" : "success",
            message:
              prev.status === "error"
                ? prev.message
                : "Incident resolved successfully.",
          }
        : prev,
    );
  };

  const handleEscalate = async (incidentId: string) => {
    setActionState({
      incidentId,
      action: "escalate",
      status: "loading",
      message: "Escalating incident...",
    });

    try {
      const response = await fetch(`/api/incidents/${incidentId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "escalate" }),
      });

      if (!response.ok) {
        throw new Error("API escalate request failed");
      }
    } catch (error) {
      console.warn("[incidents] failed to escalate", error);
      setActionState({
        incidentId,
        action: "escalate",
        status: "error",
        message: "Failed to escalate incident.",
      });
      return;
    }

    setIncidents((prev) =>
      prev.map((i) =>
        i.id === incidentId
          ? {
              ...i,
              status: "escalated" as IncidentStatus,
              priority: "critical" as IncidentPriority,
              updatedAt: new Date(),
              timeline: [
                ...i.timeline,
                {
                  time: new Date(),
                  action: "Incident escalated to critical priority",
                  user: "Operator",
                  type: "update" as const,
                },
              ],
            }
          : i,
        ),
    );

    setActionState((prev) =>
      prev?.incidentId === incidentId
        ? {
            incidentId,
            action: "escalate",
            status: prev.status === "error" ? "error" : "success",
            message:
              prev.status === "error"
                ? prev.message
                : "Incident escalated successfully.",
          }
        : prev,
    );
  };

  const handleAcknowledge = async (incidentId: string) => {
    setActionState({
      incidentId,
      action: "acknowledge",
      status: "loading",
      message: "Acknowledging incident...",
    });

    try {
      const response = await fetch(`/api/incidents/${incidentId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "acknowledge", actor: "Operator" }),
      });

      if (!response.ok) {
        throw new Error("API acknowledge request failed");
      }
    } catch (error) {
      console.warn("[incidents] failed to acknowledge", error);
      setActionState({
        incidentId,
        action: "acknowledge",
        status: "error",
        message: "Failed to acknowledge incident.",
      });
      return;
    }

    setIncidents((prev) =>
      prev.map((i) =>
        i.id === incidentId
          ? {
              ...i,
              acknowledgedAt: new Date(),
              acknowledgedBy: "Operator",
              updatedAt: new Date(),
              timeline: [
                ...i.timeline,
                {
                  time: new Date(),
                  action: "Incident acknowledged by operator",
                  user: "Operator",
                  type: "update" as const,
                },
              ],
            }
          : i,
      ),
    );
    if (selectedIncident?.id === incidentId) {
      setSelectedIncident((prev) =>
        prev
          ? {
              ...prev,
              acknowledgedAt: new Date(),
              acknowledgedBy: "Operator",
              updatedAt: new Date(),
            }
          : null,
      );
    }

    setActionState({
      incidentId,
      action: "acknowledge",
      status: "success",
      message: "Incident acknowledged.",
    });
  };

  return (
    <div className="p-4 lg:p-6 h-[calc(100vh-60px)] flex flex-col">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-slate-400" />
            Incident Management
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Monitor, respond, and resolve security incidents in real-time
          </p>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto">
          {/* Search */}
          <div className="relative flex-1 lg:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search incidents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full lg:w-64 pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
            />
          </div>

          {/* Filter */}
          <div className="relative">
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                filterStatus !== "all" || filterPriority !== "all"
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
                    className="absolute right-0 top-full mt-2 w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden"
                  >
                    <div className="p-3 border-b border-slate-700">
                      <div className="text-xs text-slate-500 mb-2">Status</div>
                      <div className="flex flex-wrap gap-1">
                        {(
                          [
                            "all",
                            "active",
                            "responding",
                            "monitoring",
                            "resolved",
                            "escalated",
                          ] as const
                        ).map((status) => (
                          <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-2 py-1 text-xs rounded transition-colors ${
                              filterStatus === status
                                ? "bg-emerald-500 text-white"
                                : "bg-slate-700 text-slate-400 hover:text-white"
                            }`}
                          >
                            {status === "all"
                              ? "All"
                              : statusConfig[status].label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="p-3">
                      <div className="text-xs text-slate-500 mb-2">
                        Priority
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {(
                          ["all", "critical", "high", "medium", "low"] as const
                        ).map((priority) => (
                          <button
                            key={priority}
                            onClick={() => setFilterPriority(priority)}
                            className={`px-2 py-1 text-xs rounded transition-colors ${
                              filterPriority === priority
                                ? "bg-emerald-500 text-white"
                                : "bg-slate-700 text-slate-400 hover:text-white"
                            }`}
                          >
                            {priority === "all"
                              ? "All"
                              : priorityConfig[priority].label}
                          </button>
                        ))}
                      </div>
                    </div>
                    {(filterStatus !== "all" || filterPriority !== "all") && (
                      <div className="p-3 border-t border-slate-700">
                        <button
                          onClick={() => {
                            setFilterStatus("all");
                            setFilterPriority("all");
                          }}
                          className="w-full py-2 text-xs text-slate-400 hover:text-white transition-colors"
                        >
                          Clear filters
                        </button>
                      </div>
                    )}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setCameraFilter("all")}
          className={`rounded-full px-3 py-1 text-xs border ${
            cameraFilter === "all"
              ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
              : "border-slate-700 bg-slate-800 text-slate-300"
          }`}
        >
          All Cameras
        </button>
        {cameraOptions.map((cameraId) => (
          <button
            key={cameraId}
            type="button"
            onClick={() => setCameraFilter(cameraId)}
            className={`rounded-full px-3 py-1 text-xs border ${
              cameraFilter === cameraId
                ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                : "border-slate-700 bg-slate-800 text-slate-300"
            }`}
          >
            {cameraId}
          </button>
        ))}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-center gap-3">
          <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-red-400">{activeCount}</div>
            <div className="text-xs text-slate-400">Active Incidents</div>
          </div>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
            <Radio className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-400">
              {respondingCount}
            </div>
            <div className="text-xs text-slate-400">In Response</div>
          </div>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
            <CheckCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-400">
              {resolvedToday}
            </div>
            <div className="text-xs text-slate-400">Resolved Today</div>
          </div>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
            <Timer className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-400">4.2m</div>
            <div className="text-xs text-slate-400">Avg Response Time</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* Incidents List */}
        <div
          className={`${selectedIncident ? "hidden lg:flex lg:w-1/2 xl:w-2/5" : "w-full"} flex flex-col bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden`}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
            <span className="font-medium text-white">
              Incidents ({filteredIncidents.length})
            </span>
            <span className="text-xs text-slate-500">
              Sorted by priority & time
            </span>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredIncidents
              .sort((a, b) => {
                const priorityOrder = {
                  critical: 0,
                  high: 1,
                  medium: 2,
                  low: 3,
                };
                const statusOrder = {
                  active: 0,
                  escalated: 1,
                  responding: 2,
                  monitoring: 3,
                  resolved: 4,
                };
                if (statusOrder[a.status] !== statusOrder[b.status]) {
                  return statusOrder[a.status] - statusOrder[b.status];
                }
                if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                  return priorityOrder[a.priority] - priorityOrder[b.priority];
                }
                return b.reportedAt.getTime() - a.reportedAt.getTime();
              })
              .map((incident) => {
                const PriorityIcon = priorityConfig[incident.priority].icon;
                const shadow = shadowByCamera[incident.camera];

                return (
                  <motion.div
                    key={incident.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`p-4 border-b border-slate-800 cursor-pointer transition-colors ${
                      selectedIncident?.id === incident.id
                        ? "bg-slate-800"
                        : "hover:bg-slate-800/50"
                    }`}
                    onClick={() => setSelectedIncident(incident)}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          incident.priority === "critical"
                            ? "bg-red-500/20"
                            : incident.priority === "high"
                              ? "bg-amber-500/20"
                              : incident.priority === "medium"
                                ? "bg-blue-500/20"
                                : "bg-slate-700"
                        }`}
                      >
                        <PriorityIcon
                          className={`w-5 h-5 ${
                            incident.priority === "critical"
                              ? "text-red-400"
                              : incident.priority === "high"
                                ? "text-amber-400"
                                : incident.priority === "medium"
                                  ? "text-blue-400"
                                  : "text-slate-400"
                          }`}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-slate-500">
                            {incident.id}
                          </span>
                          <span
                            className={`text-xs px-1.5 py-0.5 rounded ${
                              incident.status === "active"
                                ? "bg-red-500/20 text-red-400"
                                : incident.status === "responding"
                                  ? "bg-amber-500/20 text-amber-400"
                                  : incident.status === "monitoring"
                                    ? "bg-blue-500/20 text-blue-400"
                                    : incident.status === "escalated"
                                      ? "bg-purple-500/20 text-purple-400"
                                      : "bg-emerald-500/20 text-emerald-400"
                            }`}
                          >
                            {statusConfig[incident.status].label}
                          </span>
                          {incident.detectionMethod === "ai" && (
                            <span className="text-xs px-1.5 py-0.5 bg-cyan-500/20 text-cyan-400 rounded">
                              AI
                            </span>
                          )}
                          {incident.acknowledgedAt && (
                            <span className="text-xs px-1.5 py-0.5 bg-blue-500/20 text-blue-300 rounded">
                              ACK
                            </span>
                          )}
                        </div>

                        <h3 className="font-medium text-white text-sm truncate">
                          {incident.title}
                        </h3>
                        {shadow && (
                          <div
                            className={`mt-1 text-[11px] ${
                              shadow.severity === "critical"
                                ? "text-red-300"
                                : shadow.severity === "high"
                                  ? "text-amber-300"
                                  : shadow.severity === "medium"
                                    ? "text-blue-300"
                                    : "text-emerald-300"
                            }`}
                          >
                            Shadow advisory: {shadow.severity.toUpperCase()} (
                            {Math.round(shadow.confidence * 100)}%)
                          </div>
                        )}

                        <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {incident.zone}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span suppressHydrationWarning>
                              {formatTimeAgo(incident.reportedAt)}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              router.push(
                                `/feed?cameraId=${encodeURIComponent(incident.camera)}`,
                              );
                            }}
                            className="rounded border border-emerald-500/40 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] text-emerald-300 hover:bg-emerald-500/20"
                          >
                            Open Camera
                          </button>
                        </div>
                      </div>

                      <ChevronRight className="w-4 h-4 text-slate-600 flex-shrink-0" />
                    </div>
                  </motion.div>
                );
              })}
          </div>
        </div>

        {/* Incident Details */}
        <AnimatePresence mode="wait">
          {selectedIncident && (
            <motion.div
              key={selectedIncident.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex-1 flex flex-col bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedIncident(null)}
                    className="lg:hidden p-1 hover:bg-slate-800 rounded transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <span className="font-mono text-sm text-slate-400">
                    {selectedIncident.id}
                  </span>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      selectedIncident.status === "active"
                        ? "bg-red-500/20 text-red-400"
                        : selectedIncident.status === "responding"
                          ? "bg-amber-500/20 text-amber-400"
                          : selectedIncident.status === "monitoring"
                            ? "bg-blue-500/20 text-blue-400"
                            : selectedIncident.status === "escalated"
                              ? "bg-purple-500/20 text-purple-400"
                              : "bg-emerald-500/20 text-emerald-400"
                    }`}
                  >
                    {statusConfig[selectedIncident.status].label}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
                    <Share2 className="w-4 h-4 text-slate-400" />
                  </button>
                  <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
                    <Printer className="w-4 h-4 text-slate-400" />
                  </button>
                  <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
                    <MoreVertical className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4">
                {/* Title & Priority */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-white mb-2">
                      {selectedIncident.title}
                    </h2>
                    <div className="flex items-center gap-3 text-sm">
                      <div
                        className={`flex items-center gap-1 ${
                          selectedIncident.priority === "critical"
                            ? "text-red-400"
                            : selectedIncident.priority === "high"
                              ? "text-amber-400"
                              : selectedIncident.priority === "medium"
                                ? "text-blue-400"
                                : "text-slate-400"
                        }`}
                      >
                        {(() => {
                          const Icon =
                            priorityConfig[selectedIncident.priority].icon;
                          return <Icon className="w-4 h-4" />;
                        })()}
                        {priorityConfig[selectedIncident.priority].label}{" "}
                        Priority
                      </div>
                      <span className="text-slate-600">•</span>
                      <div className="flex items-center gap-1 text-slate-400">
                        {(() => {
                          const Icon = typeConfig[selectedIncident.type].icon;
                          return <Icon className="w-4 h-4" />;
                        })()}
                        {typeConfig[selectedIncident.type].label}
                      </div>
                    </div>
                  </div>

                  {selectedIncident.detectionMethod === "ai" && (
                    <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-cyan-400">
                        {selectedIncident.aiConfidence}%
                      </div>
                      <div className="text-xs text-slate-400">
                        AI Confidence
                      </div>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="bg-slate-800/50 rounded-lg p-4 mb-4">
                  <p className="text-sm text-slate-300">
                    {selectedIncident.description}
                  </p>
                  {selectedIncident.acknowledgedAt && (
                    <p className="mt-2 text-xs text-blue-300">
                      Acknowledged by {selectedIncident.acknowledgedBy ?? "Operator"} •{" "}
                      {formatTimeAgo(selectedIncident.acknowledgedAt)}
                    </p>
                  )}
                </div>
                {shadowByCamera[selectedIncident.camera] && (
                  <div className="mb-4 rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-3">
                    <div className="text-xs font-semibold text-cyan-300">
                      Shadow Mode Advisory
                    </div>
                    <div className="mt-1 text-xs text-slate-200">
                      {shadowByCamera[selectedIncident.camera].summary}
                    </div>
                    <div className="mt-1 text-[11px] text-slate-300">
                      Recommended action:{" "}
                      {shadowByCamera[selectedIncident.camera].recommendedAction}
                    </div>
                  </div>
                )}

                {/* Location & Camera */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                      <MapPin className="w-3 h-3" />
                      Location
                    </div>
                    <div className="font-medium text-white text-sm">
                      {selectedIncident.location}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {selectedIncident.zone}
                    </div>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                      <Camera className="w-3 h-3" />
                      Camera
                    </div>
                    <div className="font-medium text-white text-sm">
                      {selectedIncident.camera}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      +{selectedIncident.relatedCameras.length - 1} related
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          `/feed?cameraId=${encodeURIComponent(selectedIncident.camera)}`,
                        )
                      }
                      className="mt-2 rounded border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-[10px] text-emerald-300 hover:bg-emerald-500/20"
                    >
                      Open Camera Feed
                    </button>
                  </div>
                </div>

                {/* Camera Preview */}
                <div className="relative aspect-video bg-slate-800 rounded-lg overflow-hidden mb-4">
                  <Image
                    src={`/images/surveillance-${Math.min(parseInt(selectedIncident.camera.split("-")[1]) || 1, 6)}.jpg`}
                    alt="Camera feed"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className="text-xs font-mono bg-black/60 px-2 py-1 rounded">
                      {selectedIncident.camera}
                    </span>
                    {selectedIncident.status !== "resolved" && (
                      <span className="flex items-center gap-1 text-xs bg-red-500/80 px-2 py-1 rounded">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        LIVE
                      </span>
                    )}
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    <span className="text-xs text-white">
                      <span suppressHydrationWarning>
                        {isMounted
                          ? currentTime.toLocaleTimeString("en-US", {
                              hour12: false,
                            })
                          : "--:--:--"}
                      </span>
                    </span>
                    <button className="p-2 bg-black/60 rounded-lg hover:bg-black/80 transition-colors">
                      <Play className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Assigned Team */}
                <div className="mb-4">
                  <div className="text-xs text-slate-500 mb-2">
                    Assigned Personnel
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedIncident.assignedTo.map((person) => (
                      <div
                        key={person}
                        className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-2"
                      >
                        <div className="w-6 h-6 bg-slate-700 rounded-full flex items-center justify-center text-xs font-medium">
                          {person
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                        <span className="text-sm text-white">{person}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Timeline */}
                <div className="mb-4">
                  <div className="text-xs text-slate-500 mb-3">
                    Activity Timeline
                  </div>
                  <div className="space-y-0">
                    {selectedIncident.timeline.map((event, i) => (
                      <div key={i} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              event.type === "detection"
                                ? "bg-cyan-500/20"
                                : event.type === "response"
                                  ? "bg-amber-500/20"
                                  : event.type === "resolution"
                                    ? "bg-emerald-500/20"
                                    : "bg-slate-700"
                            }`}
                          >
                            {event.type === "detection" ? (
                              <Eye className="w-4 h-4 text-cyan-400" />
                            ) : event.type === "response" ? (
                              <Radio className="w-4 h-4 text-amber-400" />
                            ) : event.type === "resolution" ? (
                              <CheckCircle className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <MessageSquare className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                          {i < selectedIncident.timeline.length - 1 && (
                            <div className="w-0.5 h-full min-h-[24px] bg-slate-700" />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <p className="text-sm text-white">{event.action}</p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                            <span>{event.user}</span>
                            <span>•</span>
                            <span suppressHydrationWarning>
                              {formatTimeAgo(event.time)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              {selectedIncident.status !== "resolved" && (
                <div className="border-t border-slate-800 p-4">
                  {actionState?.incidentId === selectedIncident.id && (
                    <div
                      className={`mb-3 rounded-lg border px-3 py-2 text-xs ${
                        actionState.status === "loading"
                          ? "border-blue-500/30 bg-blue-500/10 text-blue-300"
                          : actionState.status === "success"
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                            : actionState.status === "error"
                              ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                              : "border-slate-700 bg-slate-800/40 text-slate-300"
                      }`}
                    >
                      {actionState.message}
                    </div>
                  )}

                  <div className="flex items-center gap-2 mb-3">
                    <input
                      type="text"
                      placeholder="Add update or note..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                    <button className="p-2 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors">
                      <Send className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {!selectedIncident.acknowledgedAt && (
                      <button
                        onClick={() => void handleAcknowledge(selectedIncident.id)}
                        disabled={
                          actionState?.incidentId === selectedIncident.id &&
                          actionState.status === "loading"
                        }
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 rounded-lg transition-colors font-medium text-sm"
                      >
                        <CheckCircle className="w-4 h-4" />
                        {actionState?.incidentId === selectedIncident.id &&
                        actionState.action === "acknowledge" &&
                        actionState.status === "loading"
                          ? "Acknowledging..."
                          : "Acknowledge"}
                      </button>
                    )}
                    <button
                      onClick={() => void handleResolve(selectedIncident.id)}
                      disabled={
                        actionState?.incidentId === selectedIncident.id &&
                        actionState.status === "loading"
                      }
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors font-medium text-sm"
                    >
                      <CheckCircle className="w-4 h-4" />
                      {actionState?.incidentId === selectedIncident.id &&
                      actionState.action === "resolve" &&
                      actionState.status === "loading"
                        ? "Resolving..."
                        : "Mark Resolved"}
                    </button>
                    {selectedIncident.priority !== "critical" && (
                      <button
                        onClick={() =>
                          void handleEscalate(selectedIncident.id)
                        }
                        disabled={
                          actionState?.incidentId === selectedIncident.id &&
                          actionState.status === "loading"
                        }
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-lg transition-colors font-medium text-sm"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                        {actionState?.incidentId === selectedIncident.id &&
                        actionState.action === "escalate" &&
                        actionState.status === "loading"
                          ? "Escalating..."
                          : "Escalate"}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Resolved State */}
              {selectedIncident.status === "resolved" && (
                <div className="border-t border-slate-800 p-4 bg-emerald-500/5">
                  <div className="flex items-center gap-3 text-emerald-400">
                    <CheckCircle className="w-5 h-5" />
                    <div>
                      <div className="font-medium">Incident Resolved</div>
                      <div className="text-xs text-slate-400">
                        <span suppressHydrationWarning>
                          {selectedIncident.resolvedAt &&
                            `Closed ${formatTimeAgo(selectedIncident.resolvedAt)}`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
