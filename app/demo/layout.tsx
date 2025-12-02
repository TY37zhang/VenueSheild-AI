"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  Camera,
  Users,
  AlertTriangle,
  Activity,
  Bell,
  Settings,
  Clock,
  CheckCircle,
  ArrowLeft,
  User,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/demo", icon: Activity, label: "Dashboard" },
  { href: "/demo/cameras", icon: Camera, label: "Camera Feeds" },
  { href: "/demo/analytics", icon: Users, label: "Crowd Analytics" },
  {
    href: "/demo/incidents",
    icon: AlertTriangle,
    label: "Incidents",
    badge: 2,
  },
  { href: "/demo/compliance", icon: Shield, label: "Compliance" },
];

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Top Navigation Bar */}
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-4 py-3 sticky top-0 z-50">
        <div className="flex items-center justify-between max-w-[1920px] mx-auto">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="h-6 w-px bg-slate-700" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-lg hidden sm:inline">
                VenueShield AI
              </span>
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
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setNotificationsOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-80 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden"
                  >
                    <div className="p-3 border-b border-slate-700 flex items-center justify-between">
                      <span className="font-semibold text-white">
                        Notifications
                      </span>
                      <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full">
                        4 new
                      </span>
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
                              <p className="text-sm font-medium text-white">
                                {notification.title}
                              </p>
                              <p className="text-xs text-slate-400 truncate">
                                {notification.message}
                              </p>
                              <p className="text-xs text-slate-500 mt-1">
                                {notification.time}
                              </p>
                            </div>
                            {i < 2 && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                            )}
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
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setSettingsOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-56 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden"
                  >
                    <div className="p-3 border-b border-slate-700">
                      <p className="font-semibold text-white">Operator Demo</p>
                      <p className="text-xs text-slate-400">
                        demo@venueshield.ai
                      </p>
                    </div>
                    <div className="py-1">
                      {[
                        { icon: User, label: "Profile", shortcut: "⌘P" },
                        { icon: Settings, label: "Settings", shortcut: "⌘S" },
                        { icon: Shield, label: "Security", shortcut: null },
                        {
                          icon: Bell,
                          label: "Notification Preferences",
                          shortcut: null,
                        },
                      ].map((item, i) => (
                        <button
                          key={i}
                          className="w-full px-3 py-2 flex items-center justify-between text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <item.icon className="w-4 h-4" />
                            <span>{item.label}</span>
                          </div>
                          {item.shortcut && (
                            <span className="text-xs text-slate-500">
                              {item.shortcut}
                            </span>
                          )}
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
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${
                    isActive
                      ? "bg-slate-800 text-white"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                  {item.badge && (
                    <span className="ml-auto bg-red-500/20 text-red-400 text-xs px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Venue Info */}
          <div className="mt-auto p-4 border-t border-slate-800">
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="text-xs text-slate-500 mb-1">Current Venue</div>
              <div className="font-medium text-sm">Metro Arena</div>
              <div className="text-xs text-slate-400 mt-1">
                Event: Concert - Taylor Swift
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
