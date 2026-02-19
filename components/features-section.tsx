"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";

const AnimatedAlertDemo = ({ isActive }: { isActive: boolean }) => {
  const [alerts, setAlerts] = useState([
    { zone: "Zone A", type: "Crowd Density", level: "warning", visible: false },
    { zone: "Zone B", type: "Disturbance", level: "critical", visible: false },
    { zone: "Zone C", type: "Anomaly", level: "info", visible: false },
  ]);

  useEffect(() => {
    if (!isActive) return;

    [0, 1, 2].forEach((index) => {
      setTimeout(
        () => {
          setAlerts((prev) =>
            prev.map((alert, i) =>
              i === index ? { ...alert, visible: true } : alert,
            ),
          );
        },
        500 + index * 600,
      );
    });
  }, [isActive]);

  return (
    <div className="bg-slate-50 rounded-lg p-4 h-32 overflow-hidden">
      <div className="absolute top-2 right-2 flex items-center gap-1">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        <span className="text-xs text-slate-500 font-medium">Live</span>
      </div>
      <div className="space-y-2">
        {alerts.map((alert, i) => (
          <div
            key={i}
            className={`flex items-center gap-2 p-2 rounded transition-all duration-500 ${
              alert.visible
                ? "opacity-100 translate-x-0"
                : "opacity-0 -translate-x-4"
            } ${
              alert.level === "critical"
                ? "bg-red-100 border-l-4 border-red-500"
                : alert.level === "warning"
                  ? "bg-yellow-100 border-l-4 border-yellow-500"
                  : "bg-blue-100 border-l-4 border-blue-500"
            }`}
          >
            <span className="text-xs font-medium text-slate-700">
              {alert.zone}
            </span>
            <span className="text-xs text-slate-600">{alert.type}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const AnimatedScoreDemo = ({ isActive }: { isActive: boolean }) => {
  const [scores, setScores] = useState([
    { zone: "Main Hall", safety: 0, ambiance: 0 },
    { zone: "Entrance", safety: 0, ambiance: 0 },
  ]);

  useEffect(() => {
    if (!isActive) return;

    const targets = [
      { safety: 87, ambiance: 92 },
      { safety: 94, ambiance: 88 },
    ];

    targets.forEach((_, index) => {
      const interval = setInterval(() => {
        setScores((prev) =>
          prev.map((score, i) => {
            if (i === index) {
              return {
                ...score,
                safety: Math.min(score.safety + 3, targets[index].safety),
                ambiance: Math.min(score.ambiance + 3, targets[index].ambiance),
              };
            }
            return score;
          }),
        );
      }, 50);

      setTimeout(() => clearInterval(interval), 1500);
    });
  }, [isActive]);

  return (
    <div className="bg-slate-50 rounded-lg p-4 h-32 overflow-hidden">
      <div className="space-y-3">
        {scores.map((score, i) => (
          <div key={i} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="font-medium text-slate-700">{score.zone}</span>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <div className="text-[10px] text-slate-500 mb-1">Safety</div>
                <div className="bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${score.safety}%` }}
                  />
                </div>
              </div>
              <div className="flex-1">
                <div className="text-[10px] text-slate-500 mb-1">Ambiance</div>
                <div className="bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${score.ambiance}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const AnimatedPredictiveDemo = ({ isActive }: { isActive: boolean }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isActive) {
      setProgress(0);
      return;
    }

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2;
      });
    }, 30);

    return () => clearInterval(interval);
  }, [isActive]);

  const dataPoints = [
    { time: "Now", value: 45 },
    { time: "+15m", value: 52 },
    { time: "+30m", value: 68 },
    { time: "+45m", value: 82 },
    { time: "+1h", value: 95 },
    { time: "+1.5h", value: 78 },
    { time: "+2h", value: 55 },
  ];

  const maxValue = 100;
  const chartHeight = 64;
  const _chartWidth = 100; // percentage

  const getPath = () => {
    const points = dataPoints.map((point, index) => {
      const x = (index / (dataPoints.length - 1)) * 100;
      const y = chartHeight - (point.value / maxValue) * chartHeight;
      return { x, y };
    });

    const pathData = points
      .map((point, index) => {
        if (index === 0) return `M ${point.x} ${point.y}`;
        const prev = points[index - 1];
        const cpX = (prev.x + point.x) / 2;
        return `C ${cpX} ${prev.y}, ${cpX} ${point.y}, ${point.x} ${point.y}`;
      })
      .join(" ");

    return pathData;
  };

  const getAreaPath = () => {
    const linePath = getPath();
    return `${linePath} L 100 ${chartHeight} L 0 ${chartHeight} Z`;
  };

  const showWarning = progress > 60;

  return (
    <div className="bg-slate-50 rounded-lg p-4 h-32">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs text-slate-500">Crowd Density Forecast</div>
        {showWarning && (
          <div className="text-[10px] text-red-600 font-medium animate-pulse flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
            Peak in 45 min
          </div>
        )}
      </div>

      <div className="relative h-16">
        <svg
          viewBox={`0 0 100 ${chartHeight}`}
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#22c55e" />
              <stop offset="50%" stopColor="#eab308" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(59, 130, 246, 0.3)" />
              <stop offset="100%" stopColor="rgba(59, 130, 246, 0)" />
            </linearGradient>
            <clipPath id="revealClip">
              <rect x="0" y="0" width={progress} height={chartHeight} />
            </clipPath>
          </defs>

          {[0, 25, 50, 75, 100].map((val) => (
            <line
              key={val}
              x1="0"
              y1={chartHeight - (val / maxValue) * chartHeight}
              x2="100"
              y2={chartHeight - (val / maxValue) * chartHeight}
              stroke="#e2e8f0"
              strokeWidth="0.5"
              strokeDasharray="2,2"
            />
          ))}

          <rect
            x="0"
            y={chartHeight - (80 / maxValue) * chartHeight}
            width="100"
            height={
              (80 / maxValue) * chartHeight -
              (chartHeight - (100 / maxValue) * chartHeight)
            }
            fill="rgba(239, 68, 68, 0.1)"
            clipPath="url(#revealClip)"
          />

          <path
            d={getAreaPath()}
            fill="url(#areaGradient)"
            clipPath="url(#revealClip)"
          />

          <path
            d={getPath()}
            fill="none"
            stroke="url(#lineGradient)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            clipPath="url(#revealClip)"
          />

          {dataPoints.map((point, index) => {
            const x = (index / (dataPoints.length - 1)) * 100;
            const y = chartHeight - (point.value / maxValue) * chartHeight;
            const pointProgress = (index / (dataPoints.length - 1)) * 100;
            const isVisible = progress >= pointProgress;

            return (
              <g key={index}>
                <circle
                  cx={x}
                  cy={y}
                  r={isVisible ? 2.5 : 0}
                  fill={
                    point.value >= 80
                      ? "#ef4444"
                      : point.value >= 60
                        ? "#eab308"
                        : "#22c55e"
                  }
                  className="transition-all duration-300"
                />
              </g>
            );
          })}
        </svg>
      </div>

      <div className="flex justify-between mt-1">
        {dataPoints
          .filter((_, i) => i % 2 === 0 || i === dataPoints.length - 1)
          .map((point, i) => (
            <span key={i} className="text-[9px] text-slate-400">
              {point.time}
            </span>
          ))}
      </div>
    </div>
  );
};

const AnimatedComplianceDemo = ({ isActive }: { isActive: boolean }) => {
  const [items, setItems] = useState([
    { name: "Exit routes clear", checked: false },
    { name: "Capacity limits", checked: false },
    { name: "Staff positions", checked: false },
    { name: "Emergency access", checked: false },
  ]);

  useEffect(() => {
    if (!isActive) return;

    [0, 1, 2, 3].forEach((index) => {
      setTimeout(
        () => {
          setItems((prev) =>
            prev.map((item, i) =>
              i === index ? { ...item, checked: true } : item,
            ),
          );
        },
        400 + index * 350,
      );
    });
  }, [isActive]);

  return (
    <div className="bg-slate-900 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-white text-sm font-medium">Compliance Check</span>
        <span className="text-emerald-400 text-xs">Auto-generated</span>
      </div>
      <div className="space-y-2">
        {items.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: isActive ? 1 : 0.5, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center gap-3 bg-slate-800 rounded-lg px-3 py-2"
          >
            <motion.div
              className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 ${
                item.checked ? "bg-emerald-500" : "bg-slate-600"
              }`}
              animate={{ scale: item.checked ? [1, 1.2, 1] : 1 }}
            >
              {item.checked && (
                <svg
                  className="w-3 h-3 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </motion.div>
            <span
              className={`text-sm ${item.checked ? "text-white" : "text-slate-400"}`}
            >
              {item.name}
            </span>
          </motion.div>
        ))}
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: items.every((i) => i.checked) ? 1 : 0 }}
        className="mt-3 text-center text-emerald-400 text-xs font-medium"
      >
        All checks passed - Report ready
      </motion.div>
    </div>
  );
};

const AnimatedCameraDemo = ({ isActive }: { isActive: boolean }) => {
  const [cameras, setCameras] = useState([
    { id: 1, status: "offline" },
    { id: 2, status: "offline" },
    { id: 3, status: "offline" },
    { id: 4, status: "offline" },
    { id: 5, status: "offline" },
    { id: 6, status: "offline" },
  ]);

  useEffect(() => {
    if (!isActive) return;

    [0, 1, 2, 3, 4, 5].forEach((index) => {
      setTimeout(
        () => {
          setCameras((prev) =>
            prev.map((cam, i) =>
              i === index ? { ...cam, status: "online" } : cam,
            ),
          );
        },
        300 + index * 200,
      );
    });
  }, [isActive]);

  const cameraImages = [
    "/images/surveillance-1.jpg",
    "/images/surveillance-2.jpg",
    "/images/surveillance-3.jpg",
    "/images/surveillance-4.jpg",
    "/images/surveillance-5.jpg",
    "/images/surveillance-6.jpg",
  ];

  return (
    <div className="bg-slate-900 rounded-lg p-3 pb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] text-slate-400 font-medium">
          Camera Integration
        </div>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
          <span className="text-[9px] text-green-400">LIVE</span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {cameras.map((cam, index) => (
          <div
            key={cam.id}
            className={`relative aspect-video rounded overflow-hidden transition-all duration-500 ${
              cam.status === "online" ? "opacity-100" : "opacity-30"
            }`}
          >
            {cam.status === "online" ? (
              <>
                <Image
                  src={cameraImages[index] || "/placeholder.svg"}
                  alt={`Camera ${cam.id} feed`}
                  fill
                  className="object-cover"
                />
                <div className="absolute top-0.5 left-0.5 flex items-center gap-0.5 bg-black/60 px-1 py-0.5 rounded">
                  <div className="w-1 h-1 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-[7px] text-white font-medium">
                    CAM {cam.id}
                  </span>
                </div>
                <div className="absolute bottom-0.5 right-0.5 text-[6px] text-white/70 bg-black/60 px-1 rounded">
                  {new Date().toLocaleTimeString()}
                </div>
              </>
            ) : (
              <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                <span className="text-[8px] text-slate-500">NO SIGNAL</span>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="text-[10px] text-center mt-2 text-green-400 font-medium">
        {cameras.filter((c) => c.status === "online").length}/6 feeds connected
      </div>
    </div>
  );
};

const AnimatedPrivacyDemo = ({ isActive }: { isActive: boolean }) => {
  const [features, setFeatures] = useState([
    { name: "No facial recognition", active: false },
    { name: "Event-based logging", active: false },
    { name: "Data encryption", active: false },
    { name: "On-premise processing", active: false },
    { name: "Auto data purging", active: false },
  ]);

  useEffect(() => {
    if (!isActive) return;

    [0, 1, 2, 3, 4].forEach((index) => {
      setTimeout(
        () => {
          setFeatures((prev) =>
            prev.map((feat, i) =>
              i === index ? { ...feat, active: true } : feat,
            ),
          );
        },
        400 + index * 400,
      );
    });
  }, [isActive]);

  return (
    <div className="bg-slate-50 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
          <svg
            className="w-4 h-4 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <span className="text-xs font-medium text-slate-700">
          Privacy Shield Active
        </span>
      </div>
      <div className="space-y-2">
        {features.map((feat, i) => (
          <div
            key={i}
            className={`flex items-center gap-2 transition-all duration-500 ${feat.active ? "opacity-100" : "opacity-30"}`}
          >
            <div
              className={`w-2 h-2 rounded-full ${feat.active ? "bg-green-500" : "bg-slate-300"}`}
            />
            <span className="text-xs text-slate-600">{feat.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const features = [
  {
    title: "Real-Time AI Alerts",
    description:
      "Instant detection of crowd surges, disturbances, and anomalies across all camera feeds simultaneously. Get notified before situations escalate.",
    demo: AnimatedAlertDemo,
    size: "large",
  },
  {
    title: "Safety & Ambiance Scores",
    description:
      "Live scores for each zone explaining what's driving risk levels. Understand exactly why an area needs attention.",
    demo: AnimatedScoreDemo,
    size: "medium",
  },
  {
    title: "Predictive Crowd Modeling",
    description:
      "AI forecasts crowd density and movement patterns to help you anticipate unsafe situations before they happen.",
    demo: AnimatedPredictiveDemo,
    size: "medium",
  },
  {
    title: "Compliance & Reporting",
    description:
      "Automated compliance checklists, incident logs, and insurer-ready reports generated in seconds, not hours.",
    demo: AnimatedComplianceDemo,
    size: "large",
  },
  {
    title: "Works With Existing Cameras",
    description:
      "Software-only solution that integrates with your current security infrastructure. No expensive hardware upgrades required.",
    demo: AnimatedCameraDemo,
    size: "medium",
  },
  {
    title: "Privacy-First Design",
    description:
      "No facial recognition or biometric storage. Event-based logging ensures compliance with privacy regulations.",
    demo: AnimatedPrivacyDemo,
    size: "medium",
  },
];

export function FeaturesSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [activeDemo, setActiveDemo] = useState<number | null>(null);

  useEffect(() => {
    const currentSection = sectionRef.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -100px 0px",
      },
    );

    if (currentSection) {
      observer.observe(currentSection);
    }

    return () => {
      if (currentSection) {
        observer.unobserve(currentSection);
      }
    };
  }, []);

  return (
    <section id="features" ref={sectionRef} className="relative z-10">
      <div className="bg-white rounded-t-[3rem] pt-16 sm:pt-24 pb-16 sm:pb-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.02]">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, rgb(0,0,0) 1px, transparent 0)`,
              backgroundSize: "24px 24px",
            }}
          ></div>
        </div>

        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-slate-200 rounded-full animate-float"
              style={{
                left: `${20 + i * 15}%`,
                top: `${30 + (i % 3) * 20}%`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: `${4 + i * 0.5}s`,
              }}
            ></div>
          ))}
        </div>

        <div className="max-w-7xl mx-auto relative">
          <div
            className={`text-center mb-12 sm:mb-20 transition-all duration-1000 ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
          >
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-sm font-medium mb-6">
              <svg
                className="w-4 h-4 mr-2 text-slate-600"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 100-16 8 8 0 000 16zm-1-5v2h2v-2h-2zm0-8v6h2V7h-2z" />
              </svg>
              AI-Powered Safety Intelligence
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 text-balance mb-4 sm:mb-6">
              Your AI Safety Team{" "}
              <span className="bg-gradient-to-r from-slate-600 to-slate-400 bg-clip-text text-transparent">
                Never Blinks
              </span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-slate-600 max-w-3xl mx-auto font-light leading-relaxed">
              See how VenueShield AI monitors every camera, detects risks in
              real-time, and helps you prevent incidents before they happen.
            </p>
          </div>

          <div
            className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 transition-all duration-1000 delay-300 ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-12"
            }`}
          >
            {features.map((feature, index) => (
              <div
                key={index}
                className={`group transition-all duration-1000 ${feature.size === "large" ? "md:col-span-2" : ""}`}
                style={{
                  transitionDelay: isVisible ? `${300 + index * 100}ms` : "0ms",
                }}
                onMouseEnter={() => setActiveDemo(index)}
                onMouseLeave={() => setActiveDemo(null)}
              >
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 h-full hover:shadow-lg transition-shadow duration-300">
                  <feature.demo isActive={activeDemo === index || isVisible} />
                  <h3 className="text-xl font-bold text-slate-800 mt-4 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
