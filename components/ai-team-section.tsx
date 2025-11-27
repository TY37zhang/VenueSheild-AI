"use client"

import { useState, useEffect, useRef } from "react"
import { MessageCircle, Clock, Zap } from "lucide-react"

interface Message {
    text: string
    sender: "ai" | "operator"
    delay: number
}

const conversations: { title: string; messages: Message[] }[] = [
    {
        title: "Crowd Density Alert",
        messages: [
            { text: "Alert: Zone B crowd density at 85%. Approaching capacity threshold.", sender: "ai", delay: 0 },
            { text: "Can you show me the affected areas?", sender: "operator", delay: 1500 },
            {
                text: "Displaying Zone B heat map. Primary congestion at North entrance and concession area. Predicted to exceed safe capacity in 12 minutes.",
                sender: "ai",
                delay: 2500,
            },
            { text: "What do you recommend?", sender: "operator", delay: 4000 },
            {
                text: "Recommend: 1) Open auxiliary entrance E3, 2) Deploy 2 staff to direct flow, 3) Delay next section entry by 5 min. Shall I notify the team?",
                sender: "ai",
                delay: 5000,
            },
            { text: "Yes, send the notification", sender: "operator", delay: 6500 },
            {
                text: "Team notified. Entrance E3 opening in progress. I'll continue monitoring and update you when density normalizes.",
                sender: "ai",
                delay: 7500,
            },
        ],
    },
    {
        title: "Disturbance Detection",
        messages: [
            {
                text: "Potential disturbance detected in Section 112. Unusual movement patterns identified.",
                sender: "ai",
                delay: 0,
            },
            {
                text: "Show me the footage",
                sender: "operator",
                delay: 1500,
            },
            {
                text: "Camera 47 feed displayed. Two individuals showing aggressive behavior near Row K. Safety score dropped from 94 to 67 in last 30 seconds.",
                sender: "ai",
                delay: 2500,
            },
            { text: "Has this escalated?", sender: "operator", delay: 4000 },
            {
                text: "Currently contained. Nearby guests are creating distance. Nearest security staff is 45 seconds away. Shall I dispatch them?",
                sender: "ai",
                delay: 5000,
            },
            { text: "Yes, dispatch immediately", sender: "operator", delay: 6500 },
            {
                text: "Security dispatched. Incident logged for compliance report. I'll monitor and alert if situation changes.",
                sender: "ai",
                delay: 7500,
            },
        ],
    },
    {
        title: "Compliance Check",
        messages: [
            {
                text: "Automated compliance scan complete. 2 items require attention before tonight's event.",
                sender: "ai",
                delay: 0,
            },
            {
                text: "What needs attention?",
                sender: "operator",
                delay: 1500,
            },
            {
                text: "1) Emergency Exit D blocked by equipment (Camera 23), 2) Fire lane partially obstructed in Loading Dock B. Photos logged.",
                sender: "ai",
                delay: 2500,
            },
            {
                text: "Send to facilities team",
                sender: "operator",
                delay: 4000,
            },
            {
                text: "Work orders created and assigned. Estimated resolution: 25 minutes. I'll verify completion and update the compliance checklist automatically.",
                sender: "ai",
                delay: 5000,
            },
        ],
    },
]

export function AITeamSection() {
    const sectionRef = useRef<HTMLElement>(null)
    const [isVisible, setIsVisible] = useState(false)
    const [currentConversation, setCurrentConversation] = useState(0)
    const [displayedMessages, setDisplayedMessages] = useState<Message[]>([])
    const [isTyping, setIsTyping] = useState(false)
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)
    const chatContainerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true)
                }
            },
            {
                threshold: 0.1,
                rootMargin: "0px 0px -100px 0px",
            }
        )

        if (sectionRef.current) {
            observer.observe(sectionRef.current)
        }

        return () => {
            if (sectionRef.current) {
                observer.unobserve(sectionRef.current)
            }
        }
    }, [])

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
        }
    }, [displayedMessages, isTyping])

    useEffect(() => {
        const conversation = conversations[currentConversation]
        setDisplayedMessages([])
        setIsTyping(false)

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
        }

        let messageIndex = 0

        const showNextMessage = () => {
            if (messageIndex >= conversation.messages.length) {
                timeoutRef.current = setTimeout(() => {
                    setCurrentConversation((prev) => (prev + 1) % conversations.length)
                }, 3000)
                return
            }

            const message = conversation.messages[messageIndex]

            timeoutRef.current = setTimeout(() => {
                if (message.sender === "ai") {
                    setIsTyping(true)
                    timeoutRef.current = setTimeout(() => {
                        setDisplayedMessages((prev) => [...prev, message])
                        setIsTyping(false)
                        messageIndex++
                        showNextMessage()
                    }, 800)
                } else {
                    setDisplayedMessages((prev) => [...prev, message])
                    messageIndex++
                    showNextMessage()
                }
            }, message.delay)
        }

        showNextMessage()

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [currentConversation])

    return (
        <section id="ai-team" ref={sectionRef} className="relative z-10">
            <div className="bg-white rounded-b-[3rem] pt-16 sm:pt-24 pb-16 sm:pb-24 px-4 relative overflow-hidden">
                <div className="container mx-auto px-4 relative z-10">
                    <div className="text-center mb-16">
                        <div
                            className={`inline-flex items-center gap-2 bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2 rounded-full text-sm font-medium mb-6 transition-all duration-1000 ${
                                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                            }`}
                        >
                            <MessageCircle className="w-4 h-4" />
                            VenueShield AI Command Center
                        </div>

                        <h2
                            className={`text-4xl md:text-5xl font-bold text-slate-900 mb-4 transition-all duration-1000 delay-200 ${
                                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                            }`}
                        >
                            See AI Handle{" "}
                            <span className="bg-gradient-to-r from-slate-600 to-slate-400 bg-clip-text text-transparent">
                                Real Safety Events
                            </span>
                        </h2>

                        <p
                            className={`text-xl text-slate-600 max-w-2xl mx-auto transition-all duration-1000 delay-400 ${
                                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                            }`}
                        >
                            Watch how VenueShield AI detects risks, provides recommendations, and helps operators
                            respond in real-time.
                        </p>
                    </div>

                    <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20 max-w-7xl mx-auto">
                        {/* Left side - Text content - Updated for VenueShield */}
                        <div className="w-full lg:w-1/2 flex flex-col justify-center lg:h-[600px] space-y-6 lg:space-y-8 order-2 lg:order-1">
                            <div
                                className={`transition-all duration-1000 delay-600 ${
                                    isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
                                }`}
                            >
                                <h3 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-4 lg:mb-6">
                                    This is what your operations team sees
                                </h3>

                                <div className="space-y-3 lg:space-y-4 text-base lg:text-lg text-slate-700 leading-relaxed">
                                    <p>
                                        While your team focuses on guests, VenueShield AI monitors every camera feed,
                                        detecting crowd surges, disturbances, and compliance issues in real-time.
                                    </p>

                                    <p>
                                        Every alert you're watching could be preventing an injury, avoiding a lawsuit,
                                        or ensuring compliance—automatically.
                                    </p>

                                    <p className="text-lg lg:text-xl font-semibold text-slate-900">
                                        Traditional monitoring can't keep up. AI can.
                                    </p>
                                </div>
                            </div>

                            <div
                                className={`transition-all duration-1000 delay-800 ${
                                    isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
                                }`}
                            >
                                <div className="p-4 lg:p-6 bg-slate-50 rounded-xl border-l-4 border-slate-900">
                                    <p className="text-slate-800 font-medium text-sm lg:text-base">
                                        "VenueShield detected a crowd surge 8 minutes before it would have become
                                        dangerous. We prevented what could have been a serious incident."
                                    </p>
                                    <p className="text-xs lg:text-sm text-slate-600 mt-2">
                                        — Sarah Chen, Director of Operations, Metro Arena
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Right side - Phone mockup */}
                        <div className="w-full lg:w-1/2 flex justify-center order-1 lg:order-2">
                            <div className="max-w-md w-full">
                                <div
                                    className={`relative transition-all duration-1000 delay-600 ${
                                        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                                    }`}
                                >
                                    <div className="bg-slate-900 rounded-[2.5rem] p-2 shadow-2xl">
                                        <div className="bg-black rounded-[2rem] p-1">
                                            <div className="bg-white rounded-[1.5rem] overflow-hidden">
                                                {/* Status bar - Updated for VenueShield */}
                                                <div className="bg-slate-50 px-6 py-3 flex justify-between items-center text-sm">
                                                    <div className="flex items-center gap-1">
                                                        <div className="w-2 h-2 bg-slate-900 rounded-full"></div>
                                                        <span className="font-medium text-slate-700">
                                                            VenueShield AI
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-slate-500">
                                                        <Clock className="w-3 h-3" />
                                                        <span className="text-xs">24/7</span>
                                                    </div>
                                                </div>

                                                <div className="bg-slate-900 px-6 py-4 text-white">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center">
                                                            <svg
                                                                className="w-5 h-5 text-white"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth={2}
                                                                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                                                                />
                                                            </svg>
                                                        </div>
                                                        <div className="flex-1">
                                                            <h3 className="font-semibold text-sm">AI Safety Monitor</h3>
                                                            <p className="text-xs text-slate-300">Command Center</p>
                                                        </div>
                                                        <div className="text-xs text-green-400 flex items-center gap-1">
                                                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                                            Active
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Chat messages */}
                                                <div
                                                    ref={chatContainerRef}
                                                    className="h-96 overflow-y-scroll scrollbar-hide p-4 space-y-3 bg-slate-50"
                                                    style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                                                >
                                                    {displayedMessages.map((message, index) => (
                                                        <div
                                                            key={index}
                                                            className={`flex ${message.sender === "operator" ? "justify-end" : "justify-start"}`}
                                                        >
                                                            {message.sender === "ai" && (
                                                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
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
                                                                            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                                                                        />
                                                                    </svg>
                                                                </div>
                                                            )}
                                                            <div
                                                                className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed ${
                                                                    message.sender === "operator"
                                                                        ? "bg-slate-900 text-white rounded-br-md"
                                                                        : "bg-white text-slate-800 shadow-sm border border-slate-200 rounded-bl-md"
                                                                }`}
                                                            >
                                                                {message.text
                                                                    .split("\n")
                                                                    .map((line: string, i: number) => (
                                                                        <div key={i}>{line}</div>
                                                                    ))}
                                                            </div>
                                                            {message.sender === "operator" && (
                                                                <div className="w-6 h-6 rounded-full bg-slate-400 ml-2 mt-1 flex-shrink-0 flex items-center justify-center text-xs text-white font-medium">
                                                                    OP
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}

                                                    {/* Typing indicator */}
                                                    {isTyping && (
                                                        <div className="flex justify-start items-start">
                                                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
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
                                                                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                                                                    />
                                                                </svg>
                                                            </div>
                                                            <div className="bg-white p-3 rounded-2xl rounded-bl-md shadow-sm border border-slate-200">
                                                                <div className="flex space-x-1">
                                                                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                                                                    <div
                                                                        className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                                                                        style={{ animationDelay: "0.1s" }}
                                                                    ></div>
                                                                    <div
                                                                        className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                                                                        style={{ animationDelay: "0.2s" }}
                                                                    ></div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="p-4 bg-white border-t border-slate-200">
                                                    <div className="flex items-center gap-3 bg-slate-100 rounded-full px-4 py-2">
                                                        <span className="text-slate-500 text-sm lg:text-base flex-1">
                                                            AI is analyzing feeds...
                                                        </span>
                                                        <div className="w-6 h-6 bg-slate-900 rounded-full flex items-center justify-center">
                                                            <Zap className="w-3 h-3 text-white" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
