# AGENTS.md

## Cursor Cloud specific instructions

### Overview

VenueShield AI is a Next.js 16 application (App Router, React 19, TypeScript 5, Tailwind CSS 4). The landing page (`/`) and demo dashboard (`/demo/*`) use hardcoded data and work without any backend or environment variables. The live feed features (`/feed/*` and API routes) require Supabase credentials.

### Required tooling

- **Node.js 20** (CI uses Node 20; the project emits a TypeScript version warning with TS 5.0.2 but it compiles fine)
- **pnpm 9** (lockfile is pnpm v9 format; pnpm 10 will work for `pnpm install` but CI pins v9)

### Running the dev server

```bash
pnpm dev          # Next.js dev server on http://localhost:3000
```

The landing page (`/`) and all `/demo/*` routes work immediately with no env vars. The `/feed` routes and API endpoints require Supabase configuration in `.env.local` (see `.env.example`).

### Available scripts

See `README.md` for the full list. Key ones: `pnpm lint`, `pnpm type-check`, `pnpm format`, `pnpm format-write`.

### Gotchas

- The `pnpm-lock.yaml` may be slightly out of sync with `package.json` (lockfile has an extra `@neondatabase/serverless` specifier). Use `pnpm install` (not `--frozen-lockfile`) to install.
- `pnpm format` (Prettier check) exits non-zero on the current codebase due to 27+ pre-existing formatting issues. This is a known state of the repo.
- The `/demo/cameras` page (Camera Feeds) shows "Unable to load live feed data" because it attempts to fetch from Supabase. The main `/demo` dashboard page shows cameras with hardcoded data and works fine.
- The optional Python shadow adapter (`pnpm shadow:adapter`) requires `backend/requirements-shadow.txt` dependencies and a YOLO model file not included in the repo.
