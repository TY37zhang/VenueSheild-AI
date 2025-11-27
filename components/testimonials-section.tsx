"use client"

import { useEffect, useRef } from "react"
import { TestimonialsColumn } from "@/components/ui/testimonials-column"

export function TestimonialsSection() {
    const sectionRef = useRef<HTMLElement>(null)

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const elements = entry.target.querySelectorAll(".fade-in-element")
                        elements.forEach((element, index) => {
                            setTimeout(() => {
                                element.classList.add("animate-fade-in-up")
                            }, index * 300)
                        })
                    }
                })
            },
            { threshold: 0.1 }
        )

        if (sectionRef.current) {
            observer.observe(sectionRef.current)
        }

        return () => observer.disconnect()
    }, [])

    const testimonials = [
        {
            text: "VenueShield detected a crowd surge 8 minutes before it became dangerous. We prevented what could have been a serious incident at our arena.",
            name: "Sarah Chen",
            role: "Director of Operations, Metro Arena",
        },
        {
            text: "Our insurance premiums dropped 23% after implementing VenueShield. The automated compliance reporting alone saved us hundreds of hours.",
            name: "Michael Torres",
            role: "Risk Manager, Convention Center Group",
        },
        {
            text: "We went from reactive to proactive security overnight. The AI catches things our team would never see across 200+ cameras.",
            name: "David Kim",
            role: "Security Director, University Campus",
        },
        {
            text: "The privacy-first approach was crucial for us. VenueShield gives us the safety insights we need without storing facial data.",
            name: "Jennifer Walsh",
            role: "General Counsel, Theater District",
        },
        {
            text: "Response times improved by 85% since deployment. Our staff now gets alerts before situations escalate, not after.",
            name: "James Wilson",
            role: "Operations Manager, Sports Complex",
        },
        {
            text: "The predictive crowd modeling has transformed how we plan events. We can anticipate bottlenecks and adjust staffing in advance.",
            name: "Lisa Thompson",
            role: "Events Director, Exhibition Center",
        },
        {
            text: "VenueShield integrated seamlessly with our existing camera infrastructure. No expensive hardware upgrades required.",
            name: "Robert Garcia",
            role: "IT Director, Nightlife Group",
        },
        {
            text: "Guest confidence has increased significantly. They feel safer knowing we have AI-powered monitoring throughout the venue.",
            name: "Maria Santos",
            role: "Guest Experience Manager, Stadium",
        },
    ]

    return (
        <section id="testimonials" ref={sectionRef} className="relative pt-16 pb-16 px-4 sm:px-6 lg:px-8">
            {/* Grid Background */}
            <div className="absolute inset-0 opacity-10">
                <div
                    className="h-full w-full"
                    style={{
                        backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
                        backgroundSize: "80px 80px",
                    }}
                />
            </div>

            <div className="relative max-w-7xl mx-auto">
                {/* Header Section - Updated header for VenueShield */}
                <div className="text-center mb-16 md:mb-32">
                    <div className="fade-in-element opacity-0 translate-y-8 transition-all duration-1000 ease-out inline-flex items-center gap-2 text-white/60 text-sm font-medium tracking-wider uppercase mb-6">
                        <div className="w-8 h-px bg-white/30"></div>
                        Success Stories
                        <div className="w-8 h-px bg-white/30"></div>
                    </div>
                    <h2 className="fade-in-element opacity-0 translate-y-8 transition-all duration-1000 ease-out text-5xl md:text-6xl lg:text-7xl font-light text-white mb-8 tracking-tight text-balance">
                        The venues we <span className="font-medium italic">protect</span>
                    </h2>
                    <p className="fade-in-element opacity-0 translate-y-8 transition-all duration-1000 ease-out text-xl text-white/70 max-w-2xl mx-auto leading-relaxed">
                        Discover how leading venues are transforming their safety operations with AI-powered
                        intelligence
                    </p>
                </div>

                {/* Testimonials Carousel */}
                <div className="fade-in-element opacity-0 translate-y-8 transition-all duration-1000 ease-out relative flex justify-center items-center min-h-[600px] md:min-h-[800px] overflow-hidden">
                    <div
                        className="flex gap-8 max-w-6xl"
                        style={{
                            maskImage:
                                "linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)",
                            WebkitMaskImage:
                                "linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)",
                        }}
                    >
                        <TestimonialsColumn testimonials={testimonials.slice(0, 3)} duration={15} className="flex-1" />
                        <TestimonialsColumn
                            testimonials={testimonials.slice(2, 5)}
                            duration={12}
                            className="flex-1 hidden md:block"
                        />
                        <TestimonialsColumn
                            testimonials={testimonials.slice(1, 4)}
                            duration={18}
                            className="flex-1 hidden lg:block"
                        />
                    </div>
                </div>
            </div>
        </section>
    )
}
