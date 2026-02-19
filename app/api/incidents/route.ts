import { NextRequest, NextResponse } from "next/server";
import { listIncidents } from "@/lib/db/incidents";

function parseStatus(value: string | null): "active" | "resolved" | "all" {
  if (value === "resolved" || value === "all") return value;
  return "active";
}

function parseLimit(value: string | null): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return 50;
  return Math.min(parsed, 200);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = parseStatus(searchParams.get("status"));
    const limit = parseLimit(searchParams.get("limit"));
    const incidents = await listIncidents({ status, limit });

    return NextResponse.json({
      incidents,
      count: incidents.length,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Incident list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch incidents" },
      { status: 500 },
    );
  }
}
