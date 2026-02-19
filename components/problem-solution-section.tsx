"use client";

import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";

const AlertTriangle = () => (
  <svg
    className="h-6 w-6 text-red-400"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-2.186-.833-2.956 0L3.858 16.5c-.77.833.192 2.5 1.732 2.5z"
    />
  </svg>
);

const CheckCircle = () => (
  <svg
    className="h-5 w-5 text-green-400"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const ArrowRight = () => (
  <svg
    className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 5l7 7-7 7"
    />
  </svg>
);

export function ProblemSolutionSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

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
    <section ref={sectionRef} className="py-16 sm:py-24 px-4 relative z-10">
      <div className="max-w-6xl mx-auto">
        {/* Section Header - Updated for VenueShield AI */}
        <div
          className={`text-center mb-12 sm:mb-20 transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-medium mb-6">
            <span className="w-2 h-2 bg-red-400 rounded-full mr-2 animate-pulse"></span>
            The Safety Challenge Every Venue Faces
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white text-balance mb-4 sm:mb-6">
            <span className="text-red-400">80%</span> of Incidents Could Be
            Prevented
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-white/70 max-w-3xl mx-auto font-light leading-relaxed">
            Traditional security monitoring can't keep up with large crowds.
            Here's how AI changes everything.
          </p>
        </div>

        {/* Main Problem/Solution Cards - Updated content for VenueShield */}
        <div
          className={`grid lg:grid-cols-2 gap-6 sm:gap-8 mb-12 sm:mb-20 transition-all duration-1000 delay-300 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
          }`}
        >
          {/* Problem Card */}
          <div className="group">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 sm:p-8 h-full hover:bg-white/10 transition-all duration-500 hover:border-red-400/30">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-red-500/20">
                  <AlertTriangle />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-red-400">
                  The Reality
                </h3>
              </div>

              {/* Key Stat */}
              <div className="bg-red-500/10 backdrop-blur-sm border border-red-500/20 rounded-xl p-4 sm:p-6 mb-6">
                <div className="text-3xl sm:text-4xl font-bold text-red-400 mb-2">
                  100+ Cameras
                </div>
                <p className="text-white/80 text-sm sm:text-base">
                  Average venue has dozens of feeds, but security staff can only
                  monitor 4-6 at once
                </p>
              </div>

              {/* Problem Points */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-white/70 text-sm sm:text-base">
                    Crowd surges and disturbances detected too late to prevent
                    injuries
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-white/70 text-sm sm:text-base">
                    Manual compliance tracking is error-prone and time-consuming
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-white/70 text-sm sm:text-base">
                    Incident reports for insurers take hours to compile
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Solution Card */}
          <div className="group">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 sm:p-8 h-full hover:bg-white/10 transition-all duration-500 hover:border-green-400/30">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-green-500/20">
                  <CheckCircle />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-green-400">
                  VenueShield Solution
                </h3>
              </div>

              {/* Key Stat */}
              <div className="bg-green-500/10 backdrop-blur-sm border border-green-500/20 rounded-xl p-4 sm:p-6 mb-6">
                <div className="text-3xl sm:text-4xl font-bold text-green-400 mb-2">
                  24/7 AI
                </div>
                <p className="text-white/80 text-sm sm:text-base">
                  Monitors every camera simultaneously, detecting risks in
                  milliseconds
                </p>
              </div>

              {/* Solution Points */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle />
                  <p className="text-white/70 text-sm sm:text-base">
                    Real-time alerts for crowd density, disturbances, and
                    anomalies
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle />
                  <p className="text-white/70 text-sm sm:text-base">
                    Automated compliance checklists and insurer-ready reports
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle />
                  <p className="text-white/70 text-sm sm:text-base">
                    Works with your existing cameras—no hardware overhaul
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Row - Updated stats for VenueShield */}
        <div
          className={`grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-12 sm:mb-16 transition-all duration-1000 delay-600 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="text-center bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 sm:p-6 hover:bg-white/10 transition-all duration-300">
            <div className="text-2xl sm:text-3xl font-bold text-white mb-2">
              95%
            </div>
            <p className="text-white/70 text-xs sm:text-sm">
              Faster incident detection
            </p>
          </div>
          <div className="text-center bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 sm:p-6 hover:bg-white/10 transition-all duration-300">
            <div className="text-2xl sm:text-3xl font-bold text-white mb-2">
              60%
            </div>
            <p className="text-white/70 text-xs sm:text-sm">
              Reduction in security incidents
            </p>
          </div>
          <div className="text-center bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 sm:p-6 hover:bg-white/10 transition-all duration-300">
            <div className="text-2xl sm:text-3xl font-bold text-white mb-2">
              100%
            </div>
            <p className="text-white/70 text-xs sm:text-sm">
              Privacy-first, no facial ID storage
            </p>
          </div>
        </div>

        {/* CTA Section - Updated CTA for VenueShield */}
        <div
          className={`text-center bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 sm:p-8 transition-all duration-1000 delay-900 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-3 sm:mb-4 text-balance">
            Stop Reacting. Start Preventing.
          </h3>
          <p className="text-sm sm:text-base md:text-lg text-white/70 mb-6 sm:mb-8 max-w-2xl mx-auto font-light leading-relaxed">
            Get a free safety assessment and see how VenueShield AI can
            transform your venue's security posture.
          </p>
          <Button
            size="lg"
            className="bg-white text-black rounded-full px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-medium transition-all duration-300 hover:bg-gray-50 hover:scale-105 hover:shadow-lg group cursor-pointer"
          >
            Get Free Safety Assessment
            <ArrowRight />
          </Button>
        </div>
      </div>
    </section>
  );
}
