import type React from "react";
import type { Metadata } from "next";
import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Dancing_Script, Caveat } from "next/font/google";

const dancingScript = Dancing_Script({
  subsets: ["latin"],
  variable: "--font-dancing-script",
  display: "swap",
});

const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-caveat",
  display: "swap",
});

export const metadata: Metadata = {
  title: "VenueShield AI - Real-Time Safety Intelligence for Venues",
  description:
    "AI-powered safety platform for arenas, theaters, convention centers, and campuses. Detect risks in real-time, prevent incidents, and automate compliance with your existing cameras.",
  generator: "v0.app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`font-sans antialiased ${dancingScript.variable} ${caveat.variable}`}
      >
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
