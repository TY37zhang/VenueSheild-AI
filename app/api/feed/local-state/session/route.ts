import { NextResponse } from "next/server";
import { createLocalFeedSessionToken } from "@/lib/auth/internal-session";

const LOCAL_SESSION_COOKIE = "vs_local_feed_session";
const DEFAULT_TTL_SECONDS = 30 * 60;

export async function POST() {
  const secret = process.env.INTERNAL_API_TOKEN;
  if (!secret) {
    if (process.env.NODE_ENV !== "production") {
      return NextResponse.json({ success: true, expiresInSeconds: 0 });
    }
    return NextResponse.json(
      { error: "INTERNAL_API_TOKEN is not configured" },
      { status: 500 },
    );
  }

  const ttlSeconds = Number(process.env.LOCAL_FEED_SESSION_TTL_SECONDS);
  const maxAge = Number.isFinite(ttlSeconds) && ttlSeconds > 0
    ? Math.floor(ttlSeconds)
    : DEFAULT_TTL_SECONDS;

  const token = createLocalFeedSessionToken(secret, maxAge);
  const response = NextResponse.json({
    success: true,
    expiresInSeconds: maxAge,
  });

  response.cookies.set(LOCAL_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/api/feed/local-state",
    maxAge,
  });

  return response;
}
