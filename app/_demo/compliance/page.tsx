"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  AlertCircle,
  Clock,
  Calendar,
  FileText,
  Download,
  RefreshCw,
  ChevronRight,
  Eye,
  Upload,
  Search,
  Award,
  Building,
  Users,
  Flame,
  Accessibility,
  Lock,
  History,
  Zap,
  Info,
} from "lucide-react";

// Compliance categories
type ComplianceCategory =
  | "fire"
  | "crowd"
  | "accessibility"
  | "security"
  | "health"
  | "structural";
type ComplianceStatus =
  | "compliant"
  | "warning"
  | "violation"
  | "pending"
  | "expired";

interface ComplianceItem {
  id: string;
  title: string;
  description: string;
  category: ComplianceCategory;
  status: ComplianceStatus;
  requirement: string;
  currentValue?: string | number;
  threshold?: string | number;
  lastChecked: Date;
  nextCheck: Date;
  automated: boolean;
  documents?: string[];
  notes?: string;
}

interface Certificate {
  id: string;
  name: string;
  issuer: string;
  issuedDate: Date;
  expiryDate: Date;
  status: "valid" | "expiring" | "expired";
  documentUrl: string;
}

interface AuditRecord {
  id: string;
  type: string;
  date: Date;
  auditor: string;
  score: number;
  findings: number;
  status: "passed" | "failed" | "conditional";
}

// Mock compliance data
const complianceItems: ComplianceItem[] = [
  {
    id: "FIRE-001",
    title: "Emergency Exit Accessibility",
    description:
      "All emergency exits must be unobstructed and clearly marked at all times",
    category: "fire",
    status: "compliant",
    requirement: "100% clear",
    currentValue: "100%",
    threshold: "100%",
    lastChecked: new Date(Date.now() - 15 * 60 * 1000),
    nextCheck: new Date(Date.now() + 45 * 60 * 1000),
    automated: true,
  },
  {
    id: "FIRE-002",
    title: "Fire Extinguisher Inspection",
    description:
      "All fire extinguishers must be inspected monthly and serviced annually",
    category: "fire",
    status: "compliant",
    requirement: "Monthly inspection",
    lastChecked: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    nextCheck: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
    automated: false,
    documents: ["Fire Extinguisher Log 2024.pdf"],
  },
  {
    id: "FIRE-003",
    title: "Sprinkler System Status",
    description: "Automatic sprinkler system must be operational in all areas",
    category: "fire",
    status: "compliant",
    requirement: "Fully operational",
    currentValue: "142/142 zones",
    lastChecked: new Date(Date.now() - 2 * 60 * 60 * 1000),
    nextCheck: new Date(Date.now() + 22 * 60 * 60 * 1000),
    automated: true,
  },
  {
    id: "CROWD-001",
    title: "Maximum Occupancy Limit",
    description:
      "Total venue occupancy must not exceed licensed capacity of 30,000",
    category: "crowd",
    status: "compliant",
    requirement: "≤ 30,000",
    currentValue: 19206,
    threshold: 30000,
    lastChecked: new Date(),
    nextCheck: new Date(Date.now() + 60 * 1000),
    automated: true,
  },
  {
    id: "CROWD-002",
    title: "Zone Capacity Compliance",
    description: "Individual zones must not exceed their rated capacity",
    category: "crowd",
    status: "warning",
    requirement: "All zones ≤ 100%",
    currentValue: "5/6 compliant",
    notes: "Zone A (Main Gate) at 97% capacity - approaching limit",
    lastChecked: new Date(),
    nextCheck: new Date(Date.now() + 60 * 1000),
    automated: true,
  },
  {
    id: "CROWD-003",
    title: "Crowd Flow Monitoring",
    description: "Real-time crowd flow analysis must be operational",
    category: "crowd",
    status: "compliant",
    requirement: "Active monitoring",
    currentValue: "Active",
    lastChecked: new Date(),
    nextCheck: new Date(Date.now() + 5 * 60 * 1000),
    automated: true,
  },
  {
    id: "ACCESS-001",
    title: "Wheelchair Access Points",
    description: "Minimum 4 wheelchair accessible entry points required",
    category: "accessibility",
    status: "compliant",
    requirement: "≥ 4 access points",
    currentValue: "6 active",
    lastChecked: new Date(Date.now() - 30 * 60 * 1000),
    nextCheck: new Date(Date.now() + 24 * 60 * 60 * 1000),
    automated: false,
  },
  {
    id: "ACCESS-002",
    title: "Accessible Seating Availability",
    description: "2% of seating must be wheelchair accessible",
    category: "accessibility",
    status: "compliant",
    requirement: "≥ 2% (50 seats)",
    currentValue: "68 seats (2.7%)",
    lastChecked: new Date(Date.now() - 2 * 60 * 60 * 1000),
    nextCheck: new Date(Date.now() + 24 * 60 * 60 * 1000),
    automated: false,
  },
  {
    id: "SEC-001",
    title: "CCTV Coverage",
    description: "100% coverage of public areas with CCTV surveillance",
    category: "security",
    status: "warning",
    requirement: "100% coverage",
    currentValue: "98.6%",
    notes: "2 cameras offline in Zone H",
    lastChecked: new Date(),
    nextCheck: new Date(Date.now() + 5 * 60 * 1000),
    automated: true,
  },
  {
    id: "SEC-002",
    title: "Security Personnel Ratio",
    description: "Minimum 1 security officer per 100 attendees",
    category: "security",
    status: "compliant",
    requirement: "1:100 ratio",
    currentValue: "24 officers (1:73)",
    lastChecked: new Date(Date.now() - 60 * 60 * 1000),
    nextCheck: new Date(Date.now() + 60 * 60 * 1000),
    automated: false,
  },
  {
    id: "SEC-003",
    title: "Bag Check Protocol",
    description: "All bags must be checked at entry points",
    category: "security",
    status: "compliant",
    requirement: "100% checked",
    currentValue: "100%",
    lastChecked: new Date(Date.now() - 30 * 60 * 1000),
    nextCheck: new Date(Date.now() + 30 * 60 * 1000),
    automated: false,
  },
  {
    id: "HEALTH-001",
    title: "First Aid Stations",
    description: "Minimum 3 first aid stations with trained personnel",
    category: "health",
    status: "compliant",
    requirement: "≥ 3 stations",
    currentValue: "4 active",
    lastChecked: new Date(Date.now() - 2 * 60 * 60 * 1000),
    nextCheck: new Date(Date.now() + 2 * 60 * 60 * 1000),
    automated: false,
  },
  {
    id: "HEALTH-002",
    title: "AED Accessibility",
    description: "AED devices must be within 3 minutes reach from any point",
    category: "health",
    status: "compliant",
    requirement: "< 3 min reach",
    currentValue: "8 AEDs (avg 1.5 min)",
    lastChecked: new Date(Date.now() - 24 * 60 * 60 * 1000),
    nextCheck: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    automated: false,
  },
  {
    id: "STRUCT-001",
    title: "Load Bearing Certification",
    description: "Structural load bearing capacity must be certified annually",
    category: "structural",
    status: "compliant",
    requirement: "Annual certification",
    lastChecked: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
    nextCheck: new Date(Date.now() + 320 * 24 * 60 * 60 * 1000),
    automated: false,
    documents: ["Structural_Cert_2024.pdf"],
  },
];

const certificates: Certificate[] = [
  {
    id: "CERT-001",
    name: "Fire Safety Certificate",
    issuer: "City Fire Department",
    issuedDate: new Date("2024-01-15"),
    expiryDate: new Date("2025-01-15"),
    status: "valid",
    documentUrl: "/docs/fire-cert.pdf",
  },
  {
    id: "CERT-002",
    name: "Public Entertainment License",
    issuer: "Municipal Authority",
    issuedDate: new Date("2024-03-01"),
    expiryDate: new Date("2025-03-01"),
    status: "valid",
    documentUrl: "/docs/entertainment-license.pdf",
  },
  {
    id: "CERT-003",
    name: "Health & Safety Certification",
    issuer: "Health Department",
    issuedDate: new Date("2024-06-01"),
    expiryDate: new Date("2024-12-15"),
    status: "expiring",
    documentUrl: "/docs/health-cert.pdf",
  },
  {
    id: "CERT-004",
    name: "Accessibility Compliance",
    issuer: "ADA Compliance Board",
    issuedDate: new Date("2023-09-01"),
    expiryDate: new Date("2024-09-01"),
    status: "expired",
    documentUrl: "/docs/ada-cert.pdf",
  },
  {
    id: "CERT-005",
    name: "Security Operations License",
    issuer: "State Security Board",
    issuedDate: new Date("2024-02-01"),
    expiryDate: new Date("2025-02-01"),
    status: "valid",
    documentUrl: "/docs/security-license.pdf",
  },
];

const auditHistory: AuditRecord[] = [
  {
    id: "AUD-001",
    type: "Fire Safety Inspection",
    date: new Date("2024-11-15"),
    auditor: "City Fire Marshal",
    score: 96,
    findings: 2,
    status: "passed",
  },
  {
    id: "AUD-002",
    type: "Crowd Management Audit",
    date: new Date("2024-10-22"),
    auditor: "Safety Consultants Inc.",
    score: 88,
    findings: 5,
    status: "conditional",
  },
  {
    id: "AUD-003",
    type: "Security Assessment",
    date: new Date("2024-09-30"),
    auditor: "SecureVenue Auditors",
    score: 94,
    findings: 3,
    status: "passed",
  },
  {
    id: "AUD-004",
    type: "Accessibility Review",
    date: new Date("2024-08-15"),
    auditor: "ADA Compliance Team",
    score: 91,
    findings: 4,
    status: "passed",
  },
];

const categoryConfig = {
  fire: { icon: Flame, label: "Fire Safety", color: "orange" },
  crowd: { icon: Users, label: "Crowd Management", color: "blue" },
  accessibility: {
    icon: Accessibility,
    label: "Accessibility",
    color: "purple",
  },
  security: { icon: Lock, label: "Security", color: "slate" },
  health: { icon: Shield, label: "Health & Safety", color: "emerald" },
  structural: { icon: Building, label: "Structural", color: "cyan" },
};

const statusConfig = {
  compliant: { icon: CheckCircle, label: "Compliant", color: "emerald" },
  warning: { icon: AlertTriangle, label: "Warning", color: "amber" },
  violation: { icon: XCircle, label: "Violation", color: "red" },
  pending: { icon: Clock, label: "Pending", color: "blue" },
  expired: { icon: AlertCircle, label: "Expired", color: "red" },
};

export default function CompliancePage() {
  const [selectedCategory, setSelectedCategory] = useState<
    ComplianceCategory | "all"
  >("all");
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<
    "requirements" | "certificates" | "audits"
  >("requirements");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const filteredItems = complianceItems.filter((item) => {
    const matchesCategory =
      selectedCategory === "all" || item.category === selectedCategory;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const stats = {
    total: complianceItems.length,
    compliant: complianceItems.filter((i) => i.status === "compliant").length,
    warnings: complianceItems.filter((i) => i.status === "warning").length,
    violations: complianceItems.filter((i) => i.status === "violation").length,
  };

  const overallScore = Math.round((stats.compliant / stats.total) * 100);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getDaysUntil = (date: Date) => {
    const days = Math.ceil(
      (date.getTime() - currentTime.getTime()) / (1000 * 60 * 60 * 24),
    );
    return days;
  };

  return (
    <div className="p-4 lg:p-6 min-h-[calc(100vh-60px)]">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-slate-400" />
            Compliance Dashboard
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Monitor regulatory compliance and certification status
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            className={`flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors ${
              isRefreshing ? "animate-pulse" : ""
            }`}
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            <span className="text-sm">Refresh</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors">
            <Download className="w-4 h-4" />
            <span className="text-sm">Export Report</span>
          </button>
        </div>
      </div>

      {/* Overall Score Card */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
        <div className="lg:col-span-1 bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-6">
          <div className="text-center">
            <div className="relative inline-flex items-center justify-center">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-slate-700"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${overallScore * 3.52} 352`}
                  strokeLinecap="round"
                  className={
                    overallScore >= 90
                      ? "text-emerald-500"
                      : overallScore >= 70
                        ? "text-amber-500"
                        : "text-red-500"
                  }
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span
                  className={`text-4xl font-bold ${
                    overallScore >= 90
                      ? "text-emerald-400"
                      : overallScore >= 70
                        ? "text-amber-400"
                        : "text-red-400"
                  }`}
                >
                  {overallScore}%
                </span>
                <span className="text-xs text-slate-400">Compliance</span>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-sm font-medium text-white">
                Overall Score
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {stats.compliant} of {stats.total} requirements met
              </div>
            </div>
          </div>
        </div>

        {/* Status Cards */}
        <div className="lg:col-span-3 grid grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <div className="text-3xl font-bold text-emerald-400">
                  {stats.compliant}
                </div>
                <div className="text-sm text-slate-400">Compliant</div>
              </div>
            </div>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-500/20 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <div className="text-3xl font-bold text-amber-400">
                  {stats.warnings}
                </div>
                <div className="text-sm text-slate-400">Warnings</div>
              </div>
            </div>
          </div>

          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <div className="text-3xl font-bold text-red-400">
                  {stats.violations}
                </div>
                <div className="text-sm text-slate-400">Violations</div>
              </div>
            </div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-400">
                  {complianceItems.filter((i) => i.automated).length}
                </div>
                <div className="text-sm text-slate-400">Auto-Monitored</div>
              </div>
            </div>
          </div>

          <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-400">
                  {certificates.filter((c) => c.status === "valid").length}
                </div>
                <div className="text-sm text-slate-400">Valid Certs</div>
              </div>
            </div>
          </div>

          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                <History className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <div className="text-3xl font-bold text-cyan-400">
                  {auditHistory.length}
                </div>
                <div className="text-sm text-slate-400">Audits YTD</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-4">
        {[
          {
            id: "requirements",
            label: "Requirements",
            icon: FileText,
            count: complianceItems.length,
          },
          {
            id: "certificates",
            label: "Certificates",
            icon: Award,
            count: certificates.length,
          },
          {
            id: "audits",
            label: "Audit History",
            icon: History,
            count: auditHistory.length,
          },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === tab.id
                ? "bg-slate-800 text-white"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="text-sm font-medium">{tab.label}</span>
            <span className="text-xs px-2 py-0.5 bg-slate-700 rounded-full">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Requirements Tab */}
      {activeTab === "requirements" && (
        <div>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search requirements..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  selectedCategory === "all"
                    ? "bg-emerald-500 text-white"
                    : "bg-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                All
              </button>
              {(Object.keys(categoryConfig) as ComplianceCategory[]).map(
                (cat) => {
                  const config = categoryConfig[cat];
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                        selectedCategory === cat
                          ? "bg-emerald-500 text-white"
                          : "bg-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      <config.icon className="w-3.5 h-3.5" />
                      {config.label}
                    </button>
                  );
                },
              )}
            </div>
          </div>

          {/* Requirements List */}
          <div className="space-y-3">
            {filteredItems.map((item) => {
              const CategoryIcon = categoryConfig[item.category].icon;
              const StatusIcon = statusConfig[item.status].icon;
              const isExpanded = expandedItems.includes(item.id);

              return (
                <motion.div
                  key={item.id}
                  layout
                  className={`bg-slate-900/80 border rounded-xl overflow-hidden ${
                    item.status === "violation"
                      ? "border-red-500/50"
                      : item.status === "warning"
                        ? "border-amber-500/50"
                        : "border-slate-800"
                  }`}
                >
                  <div
                    className="p-4 cursor-pointer hover:bg-slate-800/50 transition-colors"
                    onClick={() => toggleExpand(item.id)}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          item.status === "compliant"
                            ? "bg-emerald-500/20"
                            : item.status === "warning"
                              ? "bg-amber-500/20"
                              : "bg-red-500/20"
                        }`}
                      >
                        <StatusIcon
                          className={`w-5 h-5 ${
                            item.status === "compliant"
                              ? "text-emerald-400"
                              : item.status === "warning"
                                ? "text-amber-400"
                                : "text-red-400"
                          }`}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-slate-500">
                            {item.id}
                          </span>
                          <span
                            className={`text-xs px-1.5 py-0.5 rounded ${
                              item.status === "compliant"
                                ? "bg-emerald-500/20 text-emerald-400"
                                : item.status === "warning"
                                  ? "bg-amber-500/20 text-amber-400"
                                  : "bg-red-500/20 text-red-400"
                            }`}
                          >
                            {statusConfig[item.status].label}
                          </span>
                          {item.automated && (
                            <span className="text-xs px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded flex items-center gap-1">
                              <Zap className="w-3 h-3" />
                              Auto
                            </span>
                          )}
                        </div>

                        <h3 className="font-medium text-white">{item.title}</h3>

                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <CategoryIcon className="w-3.5 h-3.5" />
                            {categoryConfig[item.category].label}
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <Clock className="w-3.5 h-3.5" />
                            Last: {formatDate(item.lastChecked)}
                          </div>
                          {item.currentValue && (
                            <div className="text-slate-300">
                              Current:{" "}
                              <span className="font-medium">
                                {item.currentValue}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <ChevronRight
                        className={`w-5 h-5 text-slate-500 transition-transform ${
                          isExpanded ? "rotate-90" : ""
                        }`}
                      />
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-slate-800"
                      >
                        <div className="p-4 bg-slate-800/30">
                          <p className="text-sm text-slate-300 mb-4">
                            {item.description}
                          </p>

                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                            <div>
                              <div className="text-xs text-slate-500 mb-1">
                                Requirement
                              </div>
                              <div className="text-sm font-medium text-white">
                                {item.requirement}
                              </div>
                            </div>
                            {item.threshold && (
                              <div>
                                <div className="text-xs text-slate-500 mb-1">
                                  Threshold
                                </div>
                                <div className="text-sm font-medium text-white">
                                  {item.threshold}
                                </div>
                              </div>
                            )}
                            <div>
                              <div className="text-xs text-slate-500 mb-1">
                                Next Check
                              </div>
                              <div className="text-sm font-medium text-white">
                                {formatDate(item.nextCheck)}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-slate-500 mb-1">
                                Monitoring
                              </div>
                              <div className="text-sm font-medium text-white">
                                {item.automated ? "Automated" : "Manual"}
                              </div>
                            </div>
                          </div>

                          {item.notes && (
                            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 mb-4">
                              <div className="flex items-start gap-2">
                                <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-amber-200">
                                  {item.notes}
                                </p>
                              </div>
                            </div>
                          )}

                          {item.documents && item.documents.length > 0 && (
                            <div>
                              <div className="text-xs text-slate-500 mb-2">
                                Related Documents
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {item.documents.map((doc) => (
                                  <button
                                    key={doc}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-lg text-sm text-slate-300 hover:text-white transition-colors"
                                  >
                                    <FileText className="w-4 h-4" />
                                    {doc}
                                    <Download className="w-3.5 h-3.5" />
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Certificates Tab */}
      {activeTab === "certificates" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {certificates.map((cert) => {
            const daysUntil = getDaysUntil(cert.expiryDate);

            return (
              <motion.div
                key={cert.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-slate-900/80 border rounded-xl p-4 ${
                  cert.status === "expired"
                    ? "border-red-500/50"
                    : cert.status === "expiring"
                      ? "border-amber-500/50"
                      : "border-slate-800"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      cert.status === "valid"
                        ? "bg-emerald-500/20"
                        : cert.status === "expiring"
                          ? "bg-amber-500/20"
                          : "bg-red-500/20"
                    }`}
                  >
                    <Award
                      className={`w-6 h-6 ${
                        cert.status === "valid"
                          ? "text-emerald-400"
                          : cert.status === "expiring"
                            ? "text-amber-400"
                            : "text-red-400"
                      }`}
                    />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          cert.status === "valid"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : cert.status === "expiring"
                              ? "bg-amber-500/20 text-amber-400"
                              : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {cert.status === "valid"
                          ? "Valid"
                          : cert.status === "expiring"
                            ? `Expires in ${daysUntil} days`
                            : "Expired"}
                      </span>
                    </div>

                    <h3 className="font-medium text-white mb-1">{cert.name}</h3>
                    <p className="text-sm text-slate-400 mb-3">{cert.issuer}</p>

                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <div>
                        <span className="text-slate-500">Issued:</span>{" "}
                        {formatDate(cert.issuedDate)}
                      </div>
                      <div>
                        <span className="text-slate-500">Expires:</span>{" "}
                        {formatDate(cert.expiryDate)}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors">
                      <Eye className="w-4 h-4 text-slate-400" />
                    </button>
                    <button className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors">
                      <Download className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                </div>

                {cert.status !== "valid" && (
                  <div
                    className={`mt-4 p-3 rounded-lg ${
                      cert.status === "expired"
                        ? "bg-red-500/10 border border-red-500/30"
                        : "bg-amber-500/10 border border-amber-500/30"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertTriangle
                          className={`w-4 h-4 ${
                            cert.status === "expired"
                              ? "text-red-400"
                              : "text-amber-400"
                          }`}
                        />
                        <span
                          className={`text-sm ${
                            cert.status === "expired"
                              ? "text-red-300"
                              : "text-amber-300"
                          }`}
                        >
                          {cert.status === "expired"
                            ? "Certificate has expired - renewal required"
                            : "Certificate expiring soon - schedule renewal"}
                        </span>
                      </div>
                      <button className="text-xs px-3 py-1 bg-white/10 rounded hover:bg-white/20 transition-colors">
                        Renew
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}

          {/* Add Certificate Card */}
          <div className="bg-slate-900/50 border border-dashed border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-slate-600 transition-colors cursor-pointer">
            <Upload className="w-10 h-10 text-slate-600 mb-3" />
            <p className="text-slate-400 text-sm">Upload New Certificate</p>
            <p className="text-slate-600 text-xs mt-1">
              PDF, JPG or PNG up to 10MB
            </p>
          </div>
        </div>
      )}

      {/* Audits Tab */}
      {activeTab === "audits" && (
        <div>
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left text-xs font-medium text-slate-400 px-4 py-3">
                      Audit Type
                    </th>
                    <th className="text-left text-xs font-medium text-slate-400 px-4 py-3">
                      Date
                    </th>
                    <th className="text-left text-xs font-medium text-slate-400 px-4 py-3">
                      Auditor
                    </th>
                    <th className="text-left text-xs font-medium text-slate-400 px-4 py-3">
                      Score
                    </th>
                    <th className="text-left text-xs font-medium text-slate-400 px-4 py-3">
                      Findings
                    </th>
                    <th className="text-left text-xs font-medium text-slate-400 px-4 py-3">
                      Status
                    </th>
                    <th className="text-right text-xs font-medium text-slate-400 px-4 py-3">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {auditHistory.map((audit, i) => (
                    <tr
                      key={audit.id}
                      className={`border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors ${
                        i === auditHistory.length - 1 ? "border-0" : ""
                      }`}
                    >
                      <td className="px-4 py-4">
                        <div className="font-medium text-white text-sm">
                          {audit.type}
                        </div>
                        <div className="text-xs text-slate-500">{audit.id}</div>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-300">
                        {formatDate(audit.date)}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-300">
                        {audit.auditor}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div
                            className={`text-lg font-bold ${
                              audit.score >= 90
                                ? "text-emerald-400"
                                : audit.score >= 80
                                  ? "text-amber-400"
                                  : "text-red-400"
                            }`}
                          >
                            {audit.score}
                          </div>
                          <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                audit.score >= 90
                                  ? "bg-emerald-500"
                                  : audit.score >= 80
                                    ? "bg-amber-500"
                                    : "bg-red-500"
                              }`}
                              style={{ width: `${audit.score}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-slate-300">
                          {audit.findings} issues
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded ${
                            audit.status === "passed"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : audit.status === "conditional"
                                ? "bg-amber-500/20 text-amber-400"
                                : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {audit.status === "passed" ? (
                            <CheckCircle className="w-3 h-3" />
                          ) : audit.status === "conditional" ? (
                            <AlertTriangle className="w-3 h-3" />
                          ) : (
                            <XCircle className="w-3 h-3" />
                          )}
                          {audit.status.charAt(0).toUpperCase() +
                            audit.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
                            <Eye className="w-4 h-4 text-slate-400" />
                          </button>
                          <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
                            <Download className="w-4 h-4 text-slate-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Schedule Audit Button */}
          <div className="mt-4 flex justify-end">
            <button className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors font-medium text-sm">
              <Calendar className="w-4 h-4" />
              Schedule New Audit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
