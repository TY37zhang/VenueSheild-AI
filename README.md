# VenueShield AI

**Real-Time Safety Intelligence for Venues**

VenueShield AI is an AI-powered safety platform that detects risks in real-time using your existing security cameras. Designed for arenas, theaters, convention centers, universities, nightclubs, and stadiums.

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?style=for-the-badge&logo=tailwindcss)
![React](https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react)

## ✨ Features

- **Real-Time Crowd Monitoring** - AI-powered crowd density detection and flow analysis
- **Multi-Camera Dashboard** - View all camera feeds with live status indicators
- **Incident Management** - Track, respond to, and resolve security incidents
- **Predictive Analytics** - AI forecasting for crowd patterns and potential issues
- **Compliance Tracking** - Monitor regulatory requirements and certifications
- **Smart Alerts** - Automated notifications based on configurable thresholds

## 🚀 Getting Started

### Installation

```bash
# Install dependencies
pnpm install

# Start the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the landing page.

### Demo Dashboard

Visit [http://localhost:3000/demo](http://localhost:3000/demo) to explore the interactive dashboard with:

| Page                | URL                | Description                                                        |
| ------------------- | ------------------ | ------------------------------------------------------------------ |
| **Dashboard**       | `/demo`            | Overview with key metrics, camera feeds, alerts, and zone status   |
| **Camera Feeds**    | `/demo/cameras`    | Full camera grid with search, filters, and fullscreen view         |
| **Crowd Analytics** | `/demo/analytics`  | Occupancy trends, AI predictions, zone analytics, demographics     |
| **Incidents**       | `/demo/incidents`  | Incident management with timeline, status tracking, and resolution |
| **Compliance**      | `/demo/compliance` | Regulatory requirements, certificates, and audit history           |

## 📁 Project Structure

```
├── app/
│   ├── demo/
│   │   ├── layout.tsx              # Shared layout with sidebar navigation
│   │   ├── page.tsx                # Main dashboard overview
│   │   ├── analytics/page.tsx      # Crowd analytics & predictions
│   │   ├── cameras/page.tsx        # Camera feeds grid & fullscreen
│   │   ├── compliance/page.tsx     # Compliance tracking dashboard
│   │   └── incidents/page.tsx      # Incident management system
│   ├── globals.css                 # Global styles
│   ├── layout.tsx                  # Root layout
│   └── page.tsx                    # Landing page
├── components/
│   ├── ui/                         # Reusable UI (shadcn/ui)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── select.tsx
│   │   ├── slider.tsx
│   │   └── testimonials-column.tsx
│   ├── demo-dashboard.tsx          # Dashboard content
│   ├── hero-section.tsx            # Landing hero
│   ├── features-section.tsx        # Features grid
│   ├── ai-team-section.tsx         # AI agents showcase
│   ├── problem-solution-section.tsx
│   ├── roi-calculator-section.tsx  # ROI calculator
│   ├── testimonials-section.tsx
│   ├── cta-section.tsx
│   ├── footer.tsx
│   ├── glassmorphism-nav.tsx       # Main navigation
│   ├── theme-provider.tsx
│   ├── Aurora.tsx                  # Background effects
│   ├── GradualBlur.tsx
│   ├── PixelBlast.tsx
│   └── RotatingText.tsx
├── lib/
│   └── utils.ts                    # Utility functions (cn, etc.)
├── public/images/
│   ├── surveillance-1.jpg          # Main Gate
│   ├── surveillance-2.jpg          # Main Field
│   ├── surveillance-3.jpg          # North Hallway
│   ├── surveillance-4.jpg          # Parking Lot B
│   ├── surveillance-5.jpg          # Backstage
│   ├── surveillance-6.jpg          # Food Court
│   └── venueshield-logo.png
├── package.json
├── tsconfig.json
└── tailwind.config.ts
```

## 🎨 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui + Radix UI
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Charts**: Custom SVG visualizations

## 📜 Available Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm type-check   # Run TypeScript type checking
pnpm format       # Check code formatting
pnpm format-write # Format code with Prettier
```
