# VenueShield AI

**Real-Time Safety Intelligence for Venues**

VenueShield AI is an AI-powered safety platform that detects risks in real-time using your existing security cameras. Designed for arenas, theaters, convention centers, universities, nightclubs, and stadiums.

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?style=for-the-badge&logo=tailwindcss)
![React](https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react)

## Getting Started

### Installation

```bash
# Install dependencies
pnpm install

# Start the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the landing page.

Visit [http://localhost:3000/demo](http://localhost:3000/demo) to explore the interactive dashboard demo.

### Backend Setup

TBD

## 📁 Project Structure

```
├── app/                    # Next.js frontend
│   ├── demo/               # Demo dashboard page
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Landing page
├── backend/                # TBD
│   └── README.md           # Backend docs
├── components/
│   ├── ui/                 # Reusable UI components (shadcn/ui)
│   ├── hero-section.tsx
│   ├── features-section.tsx
│   ├── demo-dashboard.tsx
│   └── ...
├── lib/
│   └── utils.ts            # Utility functions
└── public/
    └── images/             # Static assets
```

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
