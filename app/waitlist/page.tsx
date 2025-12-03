"use client";

import { useState } from "react";
import Link from "next/link";
import Aurora from "@/components/Aurora";
import { Button } from "@/components/ui/button";

const venueTypes = [
  "Sports Arena",
  "Stadium",
  "Theater",
  "Convention Center",
  "University/Campus",
  "Nightclub",
  "Concert Hall",
  "Museum",
  "Shopping Mall",
  "Other",
];

const CheckIcon = () => (
  <svg
    className="w-5 h-5 text-emerald-400"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5 13l4 4L19 7"
    />
  </svg>
);

const ArrowLeft = () => (
  <svg
    className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 19l-7-7 7-7"
    />
  </svg>
);

const ShieldIcon = () => (
  <svg
    className="w-12 h-12"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
    />
  </svg>
);

export default function WaitlistPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    venueType: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to join waitlist");
      }

      setIsSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="min-h-screen bg-black overflow-hidden">
      <main className="min-h-screen relative overflow-hidden">
        {/* Aurora Background */}
        <div className="fixed inset-0 w-full h-full">
          <Aurora
            colorStops={["#475569", "#64748b", "#475569"]}
            amplitude={1.2}
            blend={0.6}
            speed={0.8}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 min-h-screen flex flex-col">
          {/* Back to Home */}
          <div className="p-6">
            <Link
              href="/"
              className="inline-flex items-center text-white/70 hover:text-white transition-colors group"
            >
              <ArrowLeft />
              <span>Back to Home</span>
            </Link>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex items-center justify-center px-4 py-8">
            <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Left Side - Info */}
              <div className="text-center lg:text-left animate-fade-in-hero">
                {/* Logo/Icon */}
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-white/10 mb-8 text-emerald-400">
                  <ShieldIcon />
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                  Join the
                  <br />
                  <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
                    VenueShield
                  </span>
                  <br />
                  Waitlist
                </h1>

                <p className="text-lg sm:text-xl text-white/70 mb-10 max-w-md mx-auto lg:mx-0 leading-relaxed">
                  Be among the first to experience AI-powered safety
                  intelligence for your venue. Early access members get
                  exclusive benefits.
                </p>

                {/* Benefits */}
                <div className="space-y-4">
                  {[
                    "Priority access to the platform",
                    "Exclusive early-bird pricing",
                    "Direct input on feature development",
                    "Dedicated onboarding support",
                  ].map((benefit, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 text-white/80 justify-center lg:justify-start"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <CheckIcon />
                      </div>
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Side - Form */}
              <div className="animate-fade-in-hero animation-delay-500">
                <div className="relative">
                  {/* Glow effect */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 via-cyan-500/20 to-blue-500/20 rounded-3xl blur-xl opacity-50" />
                  
                  {/* Form Card */}
                  <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 sm:p-10">
                    {isSubmitted ? (
                      /* Success State */
                      <div className="text-center py-8 animate-fade-in">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                          <svg
                            className="w-10 h-10 text-emerald-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-3">
                          You&apos;re on the list!
                        </h2>
                        <p className="text-white/70 mb-8">
                          We&apos;ll be in touch soon with your exclusive early
                          access details.
                        </p>
                        <Link href="/">
                          <Button className="bg-white text-black hover:bg-gray-100 rounded-full px-8 py-3 font-medium transition-all duration-300 hover:scale-105">
                            Return Home
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      /* Form */
                      <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="text-center mb-8">
                          <h2 className="text-2xl font-bold text-white mb-2">
                            Get Early Access
                          </h2>
                          <p className="text-white/60 text-sm">
                            Fill in your details and we&apos;ll reach out
                          </p>
                        </div>

                        {/* Name Field */}
                        <div>
                          <label
                            htmlFor="name"
                            className="block text-sm font-medium text-white/80 mb-2"
                          >
                            Full Name *
                          </label>
                          <input
                            type="text"
                            id="name"
                            name="name"
                            required
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-300"
                            placeholder="John Smith"
                          />
                        </div>

                        {/* Email Field */}
                        <div>
                          <label
                            htmlFor="email"
                            className="block text-sm font-medium text-white/80 mb-2"
                          >
                            Work Email *
                          </label>
                          <input
                            type="email"
                            id="email"
                            name="email"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-300"
                            placeholder="john@venue.com"
                          />
                        </div>

                        {/* Company Field */}
                        <div>
                          <label
                            htmlFor="company"
                            className="block text-sm font-medium text-white/80 mb-2"
                          >
                            Venue / Company Name *
                          </label>
                          <input
                            type="text"
                            id="company"
                            name="company"
                            required
                            value={formData.company}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-300"
                            placeholder="Madison Square Garden"
                          />
                        </div>

                        {/* Venue Type Field */}
                        <div>
                          <label
                            htmlFor="venueType"
                            className="block text-sm font-medium text-white/80 mb-2"
                          >
                            Venue Type *
                          </label>
                          <select
                            id="venueType"
                            name="venueType"
                            required
                            value={formData.venueType}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-300 appearance-none cursor-pointer"
                            style={{
                              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23ffffff60'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                              backgroundRepeat: "no-repeat",
                              backgroundPosition: "right 1rem center",
                              backgroundSize: "1.25rem",
                            }}
                          >
                            <option value="" className="bg-gray-900">
                              Select venue type...
                            </option>
                            {venueTypes.map((type) => (
                              <option key={type} value={type} className="bg-gray-900">
                                {type}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Message Field */}
                        <div>
                          <label
                            htmlFor="message"
                            className="block text-sm font-medium text-white/80 mb-2"
                          >
                            Anything else we should know? (Optional)
                          </label>
                          <textarea
                            id="message"
                            name="message"
                            rows={3}
                            value={formData.message}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-300 resize-none"
                            placeholder="Tell us about your safety challenges..."
                          />
                        </div>

                        {/* Error Message */}
                        {error && (
                          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
                            {error}
                          </div>
                        )}

                        {/* Submit Button */}
                        <Button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white rounded-xl py-4 text-lg font-semibold transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-emerald-500/25 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                          {isSubmitting ? (
                            <span className="flex items-center justify-center gap-2">
                              <svg
                                className="animate-spin h-5 w-5"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                />
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                />
                              </svg>
                              Joining...
                            </span>
                          ) : (
                            "Join the Waitlist"
                          )}
                        </Button>

                        {/* Privacy Note */}
                        <p className="text-center text-white/40 text-xs">
                          By joining, you agree to receive updates about
                          VenueShield AI. We respect your privacy.
                        </p>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 text-center text-white/40 text-sm">
            © 2025 VenueShield AI. All rights reserved.
          </div>
        </div>
      </main>
    </div>
  );
}

