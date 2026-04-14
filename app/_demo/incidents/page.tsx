"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  AlertCircle,
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

// Mock incidents data - mapped to actual camera locations
const mockIncidents: Incident[] = [
  {
    id: "INC-2024-001",
    title: "High Crowd Density - Main Gate",
    description:
      "AI detected crowd density at 97% capacity in Main Gate corridor. Dense crowd flow through arched passageway with security guard monitoring. Risk of crowd crush if density increases.",
    type: "crowd",
    priority: "critical",
    status: "active",
    zone: "Zone A",
    location: "Main Gate - Arched Corridor",
    camera: "CAM-01",
    reportedAt: new Date(Date.now() - 5 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 60 * 1000),
    assignedTo: ["John Smith", "Sarah Johnson"],
    aiConfidence: 96,
    detectionMethod: "ai",
    timeline: [
      {
        time: new Date(Date.now() - 5 * 60 * 1000),
        action: "AI detected critical crowd density (97%)",
        user: "System",
        type: "detection",
      },
      {
        time: new Date(Date.now() - 4 * 60 * 1000),
        action: "Alert dispatched to security team",
        user: "System",
        type: "response",
      },
      {
        time: new Date(Date.now() - 3 * 60 * 1000),
        action: "Assigned to John Smith",
        user: "Control Room",
        type: "update",
      },
      {
        time: new Date(Date.now() - 2 * 60 * 1000),
        action: "Implementing crowd flow control measures",
        user: "John Smith",
        type: "response",
      },
    ],
    relatedCameras: ["CAM-01", "CAM-02"],
    affectedCapacity: 487,
  },
  {
    id: "INC-2024-002",
    title: "Crowd Gathering - Food Court",
    description:
      "Unusual clustering of individuals detected near central seating area of Food Court. Multiple groups converging, potential dispute or incident.",
    type: "crowd",
    priority: "high",
    status: "responding",
    zone: "Zone F",
    location: "Food Court - Central Tables",
    camera: "CAM-06",
    reportedAt: new Date(Date.now() - 12 * 60 * 1000),
    updatedAt: new Date(Date.now() - 8 * 60 * 1000),
    assignedTo: ["Mike Chen"],
    aiConfidence: 89,
    detectionMethod: "ai",
    timeline: [
      {
        time: new Date(Date.now() - 12 * 60 * 1000),
        action: "AI detected unusual crowd gathering pattern",
        user: "System",
        type: "detection",
      },
      {
        time: new Date(Date.now() - 11 * 60 * 1000),
        action: "Alert dispatched to security team",
        user: "System",
        type: "response",
      },
      {
        time: new Date(Date.now() - 10 * 60 * 1000),
        action: "Assigned to Mike Chen",
        user: "Control Room",
        type: "update",
      },
      {
        time: new Date(Date.now() - 8 * 60 * 1000),
        action: "En route to Food Court, ETA 1 min",
        user: "Mike Chen",
        type: "response",
      },
    ],
    relatedCameras: ["CAM-06"],
    affectedCapacity: 89,
  },
  {
    id: "INC-2024-003",
    title: "Unoccupied Area Alert - North Hallway",
    description:
      "North Hallway has been completely empty for extended period. Dim lighting conditions detected. Routine patrol recommended.",
    type: "security",
    priority: "low",
    status: "monitoring",
    zone: "Zone C",
    location: "North Hallway - Service Corridor",
    camera: "CAM-03",
    reportedAt: new Date(Date.now() - 15 * 60 * 1000),
    updatedAt: new Date(Date.now() - 5 * 60 * 1000),
    assignedTo: ["Lisa Wong"],
    aiConfidence: 78,
    detectionMethod: "ai",
    timeline: [
      {
        time: new Date(Date.now() - 15 * 60 * 1000),
        action: "AI flagged extended vacancy in corridor",
        user: "System",
        type: "detection",
      },
      {
        time: new Date(Date.now() - 14 * 60 * 1000),
        action: "Low priority alert generated",
        user: "System",
        type: "response",
      },
      {
        time: new Date(Date.now() - 10 * 60 * 1000),
        action: "Added to patrol route",
        user: "Control Room",
        type: "update",
      },
      {
        time: new Date(Date.now() - 5 * 60 * 1000),
        action: "Scheduled for next patrol sweep",
        user: "Lisa Wong",
        type: "update",
      },
    ],
    relatedCameras: ["CAM-03"],
    affectedCapacity: 0,
  },
  {
    id: "INC-2024-004",
    title: "Crew Member Verified - Backstage",
    description:
      "Single individual detected on phone near stage equipment in backstage area. Verified as authorized crew member.",
    type: "security",
    priority: "low",
    status: "resolved",
    zone: "Zone E",
    location: "Backstage - Near Equipment Truck",
    camera: "CAM-05",
    reportedAt: new Date(Date.now() - 45 * 60 * 1000),
    updatedAt: new Date(Date.now() - 20 * 60 * 1000),
    resolvedAt: new Date(Date.now() - 20 * 60 * 1000),
    assignedTo: ["James Wilson"],
    aiConfidence: 94,
    detectionMethod: "ai",
    timeline: [
      {
        time: new Date(Date.now() - 45 * 60 * 1000),
        action: "Motion detected in backstage area",
        user: "System",
        type: "detection",
      },
      {
        time: new Date(Date.now() - 40 * 60 * 1000),
        action: "Security dispatched to verify",
        user: "Control Room",
        type: "response",
      },
      {
        time: new Date(Date.now() - 25 * 60 * 1000),
        action: "Individual on phone identified as sound technician",
        user: "James Wilson",
        type: "update",
      },
      {
        time: new Date(Date.now() - 20 * 60 * 1000),
        action: "Credentials verified, routine activity",
        user: "James Wilson",
        type: "resolution",
      },
    ],
    relatedCameras: ["CAM-05"],
    affectedCapacity: 3,
  },
  {
    id: "INC-2024-005",
    title: "Vehicle Count Verification - Parking Lot B",
    description:
      "Routine vehicle count verification in Parking Lot B. Night vision cameras showing scattered vehicles with adequate spacing.",
    type: "other",
    priority: "low",
    status: "resolved",
    zone: "Zone D",
    location: "Parking Lot B - All Sections",
    camera: "CAM-04",
    reportedAt: new Date(Date.now() - 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 50 * 60 * 1000),
    resolvedAt: new Date(Date.now() - 50 * 60 * 1000),
    assignedTo: ["Parking Attendant"],
    aiConfidence: 0,
    detectionMethod: "manual",
    timeline: [
      {
        time: new Date(Date.now() - 60 * 60 * 1000),
        action: "Routine vehicle count initiated",
        user: "Control Room",
        type: "detection",
      },
      {
        time: new Date(Date.now() - 55 * 60 * 1000),
        action: "IR cameras captured lot overview",
        user: "System",
        type: "response",
      },
      {
        time: new Date(Date.now() - 52 * 60 * 1000),
        action: "Count verified: 127 vehicles",
        user: "Parking Attendant",
        type: "update",
      },
      {
        time: new Date(Date.now() - 50 * 60 * 1000),
        action: "Lot at 25% capacity, verification complete",
        user: "Control Room",
        type: "resolution",
      },
    ],
    relatedCameras: ["CAM-04"],
    affectedCapacity: 127,
  },
  {
    id: "INC-2024-006",
    title: "Stadium Event Monitoring",
    description:
      "Main Field event in progress. Crowd of approximately 18,500 attending. Person observed walking down aisle - routine movement.",
    type: "crowd",
    priority: "low",
    status: "monitoring",
    zone: "Zone B",
    location: "Main Field - Stadium Floor & Seating",
    camera: "CAM-02",
    reportedAt: new Date(Date.now() - 30 * 60 * 1000),
    updatedAt: new Date(Date.now() - 25 * 60 * 1000),
    assignedTo: ["Event Security Team"],
    aiConfidence: 0,
    detectionMethod: "manual",
    timeline: [
      {
        time: new Date(Date.now() - 30 * 60 * 1000),
        action: "Event monitoring commenced",
        user: "Control Room",
        type: "detection",
      },
      {
        time: new Date(Date.now() - 28 * 60 * 1000),
        action: "Crowd count updated: 18,500",
        user: "System",
        type: "response",
      },
      {
        time: new Date(Date.now() - 25 * 60 * 1000),
        action: "All sectors reporting normal activity",
        user: "Event Security Team",
        type: "update",
      },
    ],
    relatedCameras: ["CAM-02"],
    affectedCapacity: 18500,
  },
];

const priorityConfig = {
  critical: { color: "red", icon: AlertCircle, label: "Critical" },
  high: { color: "amber", icon: TriangleAlert, label: "High" },
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
  const [incidents, setIncidents] = useState(mockIncidents);
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
  const [filterOpen, setFilterOpen] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((currentTime.getTime() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const filteredIncidents = incidents.filter((incident) => {
    const matchesSearch =
      incident.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      incident.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      incident.zone.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || incident.status === filterStatus;
    const matchesPriority =
      filterPriority === "all" || incident.priority === filterPriority;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const activeCount = incidents.filter(
    (i) => i.status === "active" || i.status === "escalated",
  ).length;
  const respondingCount = incidents.filter(
    (i) => i.status === "responding",
  ).length;
  const resolvedToday = incidents.filter((i) => i.status === "resolved").length;

  const handleResolve = (incidentId: string) => {
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
  };

  const handleEscalate = (incidentId: string) => {
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
                        </div>

                        <h3 className="font-medium text-white text-sm truncate">
                          {incident.title}
                        </h3>

                        <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {incident.zone}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTimeAgo(incident.reportedAt)}
                          </div>
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
                </div>

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
                      {currentTime.toLocaleTimeString("en-US", {
                        hour12: false,
                      })}
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
                            <span>{formatTimeAgo(event.time)}</span>
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
                    <button
                      onClick={() => handleResolve(selectedIncident.id)}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors font-medium text-sm"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Mark Resolved
                    </button>
                    {selectedIncident.priority !== "critical" && (
                      <button
                        onClick={() => handleEscalate(selectedIncident.id)}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-lg transition-colors font-medium text-sm"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                        Escalate
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
                        {selectedIncident.resolvedAt &&
                          `Closed ${formatTimeAgo(selectedIncident.resolvedAt)}`}
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
