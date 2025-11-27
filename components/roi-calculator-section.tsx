"use client"

import { useState, useEffect } from "react"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { TrendingUp, Users, DollarSign, Clock } from "lucide-react"

interface CalculatorInputs {
    venueCapacity: number
    eventsPerMonth: number
    averageIncidentCost: number
    venueType: string
}

export function ROICalculatorSection() {
    const [inputs, setInputs] = useState<CalculatorInputs>({
        venueCapacity: 10000,
        eventsPerMonth: 8,
        averageIncidentCost: 25000,
        venueType: "arena",
    })

    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsVisible(true)
                    }
                })
            },
            { threshold: 0.1 }
        )

        const section = document.getElementById("roi-calculator")
        if (section) {
            observer.observe(section)
        }

        return () => observer.disconnect()
    }, [])

    const getVenueDefaults = () => {
        const venueDefaults = {
            arena: {
                incidentCost: 50000,
                maxCapacity: 50000,
                incidentReduction: 60,
                responseImprovement: 85,
                insuranceSavings: 23,
            },
            theater: {
                incidentCost: 15000,
                maxCapacity: 5000,
                incidentReduction: 55,
                responseImprovement: 80,
                insuranceSavings: 18,
            },
            convention: {
                incidentCost: 30000,
                maxCapacity: 30000,
                incidentReduction: 58,
                responseImprovement: 82,
                insuranceSavings: 20,
            },
            campus: {
                incidentCost: 20000,
                maxCapacity: 20000,
                incidentReduction: 62,
                responseImprovement: 88,
                insuranceSavings: 25,
            },
            nightclub: {
                incidentCost: 10000,
                maxCapacity: 3000,
                incidentReduction: 65,
                responseImprovement: 90,
                insuranceSavings: 28,
            },
            stadium: {
                incidentCost: 75000,
                maxCapacity: 80000,
                incidentReduction: 55,
                responseImprovement: 80,
                insuranceSavings: 22,
            },
            default: {
                incidentCost: 25000,
                maxCapacity: 20000,
                incidentReduction: 60,
                responseImprovement: 85,
                insuranceSavings: 20,
            },
        }

        return venueDefaults[inputs.venueType as keyof typeof venueDefaults] || venueDefaults.default
    }

    useEffect(() => {
        const defaults = getVenueDefaults()
        setInputs((prev) => ({ ...prev, averageIncidentCost: defaults.incidentCost }))
    }, [inputs.venueType])

    const venueConfig = getVenueDefaults()
    const improvements = {
        incidentReduction: venueConfig.incidentReduction,
        responseImprovement: venueConfig.responseImprovement,
        insuranceSavings: venueConfig.insuranceSavings,
    }

    // Current metrics - Updated calculations for venue safety ROI
    const currentAnnualIncidents = Math.round((inputs.venueCapacity / 5000) * inputs.eventsPerMonth * 0.3) // Rough incident rate
    const currentAnnualCost = currentAnnualIncidents * inputs.averageIncidentCost

    // Improved metrics with VenueShield
    const preventedIncidents = Math.round(currentAnnualIncidents * (improvements.incidentReduction / 100))
    const reducedIncidents = currentAnnualIncidents - preventedIncidents
    const newAnnualCost = reducedIncidents * inputs.averageIncidentCost

    // Savings
    const annualSavings = currentAnnualCost - newAnnualCost
    const insuranceSavings = Math.round(currentAnnualCost * 0.15 * (improvements.insuranceSavings / 100))
    const totalSavings = annualSavings + insuranceSavings

    return (
        <section id="roi-calculator" className="py-16 md:py-20 px-4 relative">
            <div className="max-w-6xl mx-auto">
                {/* Header - Updated for VenueShield */}
                <div
                    className={`text-center mb-12 md:mb-16 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-6">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium text-white/80">ROI Calculator</span>
                    </div>

                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 md:mb-6 text-balance">
                        See your potential{" "}
                        <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                            risk reduction
                        </span>
                    </h2>

                    <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto text-balance">
                        Calculate how much VenueShield AI could save your venue through incident prevention and reduced
                        liability
                    </p>
                </div>

                <div className="grid lg:grid-cols-2 gap-8 lg:gap-10 items-stretch">
                    {/* Calculator Inputs - Updated for venue metrics */}
                    <div
                        className={`transition-all duration-700 delay-200 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                    >
                        <Card className="p-6 md:p-8 bg-[radial-gradient(35%_128px_at_50%_0%,theme(backgroundColor.white/15%),theme(backgroundColor.white/5%))] border-white/20 backdrop-blur-sm shadow-2xl h-full flex flex-col">
                            <h3 className="text-xl md:text-2xl font-semibold text-white mb-6 md:mb-8">
                                Your Venue Metrics
                            </h3>

                            <div className="space-y-8 flex-1">
                                {/* Venue Type */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-3">Venue Type</label>
                                    <Select
                                        value={inputs.venueType}
                                        onValueChange={(value) => setInputs((prev) => ({ ...prev, venueType: value }))}
                                    >
                                        <SelectTrigger className="bg-gray-700/50 border-gray-600 text-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-gray-800 border-gray-700">
                                            <SelectItem value="arena">Arena / Sports Venue</SelectItem>
                                            <SelectItem value="theater">Theater / Performing Arts</SelectItem>
                                            <SelectItem value="convention">Convention Center</SelectItem>
                                            <SelectItem value="campus">University Campus</SelectItem>
                                            <SelectItem value="nightclub">Nightclub / Nightlife</SelectItem>
                                            <SelectItem value="stadium">Stadium</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Venue Capacity */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-3">
                                        Venue Capacity:{" "}
                                        <span className="text-white font-semibold">
                                            {inputs.venueCapacity.toLocaleString()}
                                        </span>
                                    </label>
                                    <Slider
                                        value={[inputs.venueCapacity]}
                                        onValueChange={([value]) =>
                                            setInputs((prev) => ({ ...prev, venueCapacity: value }))
                                        }
                                        max={venueConfig.maxCapacity}
                                        min={500}
                                        step={500}
                                        className="w-full"
                                    />
                                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                                        <span>500</span>
                                        <span>{venueConfig.maxCapacity.toLocaleString()}</span>
                                    </div>
                                </div>

                                {/* Events Per Month */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-3">
                                        Events Per Month:{" "}
                                        <span className="text-white font-semibold">{inputs.eventsPerMonth}</span>
                                    </label>
                                    <Slider
                                        value={[inputs.eventsPerMonth]}
                                        onValueChange={([value]) =>
                                            setInputs((prev) => ({ ...prev, eventsPerMonth: value }))
                                        }
                                        max={30}
                                        min={1}
                                        step={1}
                                        className="w-full"
                                    />
                                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                                        <span>1</span>
                                        <span>30</span>
                                    </div>
                                </div>

                                {/* Average Incident Cost */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-3">
                                        Average Incident Cost:{" "}
                                        <span className="text-white font-semibold">
                                            ${inputs.averageIncidentCost.toLocaleString()}
                                        </span>
                                    </label>
                                    <Slider
                                        value={[inputs.averageIncidentCost]}
                                        onValueChange={([value]) =>
                                            setInputs((prev) => ({ ...prev, averageIncidentCost: value }))
                                        }
                                        max={100000}
                                        min={5000}
                                        step={5000}
                                        className="w-full"
                                    />
                                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                                        <span>$5K</span>
                                        <span>$100K</span>
                                    </div>
                                </div>

                                <div className="flex-1"></div>
                            </div>

                            <div className="mt-6 lg:hidden">
                                <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
                                    <div className="animate-bounce">
                                        <svg
                                            className="w-4 h-4 text-primary"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M19 14l-7 7m0 0l-7-7m7 7V3"
                                            />
                                        </svg>
                                    </div>
                                    <span className="text-sm text-primary font-medium">
                                        Scroll down to see your results
                                    </span>
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-gray-700/50">
                                <div className="space-y-4">
                                    <h4 className="text-sm font-semibold text-gray-300 mb-3">Industry Insights</h4>
                                    <div className="space-y-3">
                                        <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5">
                                            <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                                            <div>
                                                <p className="text-sm text-gray-300">
                                                    <span className="font-medium text-white">Incident reduction:</span>{" "}
                                                    Venues see {venueConfig.incidentReduction}% fewer safety incidents
                                                    with AI monitoring
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5">
                                            <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                                            <div>
                                                <p className="text-sm text-gray-300">
                                                    <span className="font-medium text-white">Response time:</span> AI
                                                    detection is {venueConfig.responseImprovement}% faster than manual
                                                    monitoring
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5">
                                            <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                                            <div>
                                                <p className="text-sm text-gray-300">
                                                    <span className="font-medium text-white">Insurance impact:</span>{" "}
                                                    Average {venueConfig.insuranceSavings}% reduction in premiums with
                                                    VenueShield
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Results - Updated results for VenueShield */}
                    <div
                        className={`transition-all duration-700 delay-400 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                    >
                        <Card className="p-6 md:p-8 bg-[radial-gradient(35%_128px_at_50%_0%,theme(backgroundColor.white/15%),theme(backgroundColor.white/5%))] border-white/20 backdrop-blur-sm shadow-2xl h-full flex flex-col">
                            <h3 className="text-xl md:text-2xl font-semibold text-white mb-6 md:mb-8">
                                Your Potential with VenueShield AI
                            </h3>

                            <div className="space-y-6 flex-1">
                                {/* Current vs New Metrics */}
                                <div className="grid grid-cols-2 gap-3 md:gap-4">
                                    <div className="text-center p-3 md:p-4 rounded-lg bg-gray-700/30">
                                        <div className="text-xs md:text-sm text-gray-400 mb-1">
                                            Current Annual Incidents
                                        </div>
                                        <div className="text-xl md:text-2xl font-bold text-white">
                                            {currentAnnualIncidents}
                                        </div>
                                        <div className="text-xs text-gray-400">estimated/year</div>
                                    </div>
                                    <div className="text-center p-3 md:p-4 rounded-lg bg-white/10 border border-white/20">
                                        <div className="text-xs md:text-sm text-gray-300 mb-1">With VenueShield</div>
                                        <div className="text-xl md:text-2xl font-bold text-white">
                                            {reducedIncidents}
                                        </div>
                                        <div className="text-xs text-gray-300">incidents/year</div>
                                    </div>
                                </div>

                                <div className="space-y-3 md:space-y-4">
                                    <div className="flex items-center justify-between p-3 md:p-4 rounded-lg bg-white/5 border border-white/10">
                                        <div className="flex items-center gap-3">
                                            <Users className="w-4 h-4 md:w-5 md:h-5 text-gray-300" />
                                            <span className="text-sm md:text-base text-white">Incidents Prevented</span>
                                        </div>
                                        <span className="text-lg md:text-xl font-bold text-white">
                                            {preventedIncidents}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between p-3 md:p-4 rounded-lg bg-white/5 border border-white/10">
                                        <div className="flex items-center gap-3">
                                            <DollarSign className="w-4 h-4 md:w-5 md:h-5 text-gray-300" />
                                            <span className="text-sm md:text-base text-white">
                                                Incident Cost Savings
                                            </span>
                                        </div>
                                        <span className="text-lg md:text-xl font-bold text-white">
                                            ${annualSavings.toLocaleString()}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between p-3 md:p-4 rounded-lg bg-white/5 border border-white/10">
                                        <div className="flex items-center gap-3">
                                            <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-gray-300" />
                                            <span className="text-sm md:text-base text-white">
                                                Insurance Premium Savings
                                            </span>
                                        </div>
                                        <span className="text-lg md:text-xl font-bold text-white">
                                            ${insuranceSavings.toLocaleString()}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between p-3 md:p-4 rounded-lg bg-white/5 border border-white/10">
                                        <div className="flex items-center gap-3">
                                            <Clock className="w-4 h-4 md:w-5 md:h-5 text-gray-300" />
                                            <span className="text-sm md:text-base text-white">Response Time</span>
                                        </div>
                                        <span className="text-lg md:text-xl font-bold text-white">
                                            {improvements.responseImprovement}% faster
                                        </span>
                                    </div>
                                </div>

                                {/* Total Annual Savings */}
                                <div className="mt-6 md:mt-8 p-4 md:p-6 rounded-lg bg-white/5 border border-white/10">
                                    <div className="text-center">
                                        <div className="text-xs md:text-sm text-gray-300 mb-2">
                                            Estimated Annual Savings
                                        </div>
                                        <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2">
                                            ${totalSavings.toLocaleString()}
                                        </div>
                                        <div className="text-xs md:text-sm text-gray-400">
                                            Based on your venue metrics and industry benchmarks
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>

                {/* CTA */}
                <div
                    className={`text-center mt-12 md:mt-16 transition-all duration-700 delay-600 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                >
                    <p className="text-sm text-gray-400 mt-4">
                        * Results based on industry averages and may vary by venue
                    </p>
                </div>
            </div>
        </section>
    )
}
