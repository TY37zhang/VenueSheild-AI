import type { CameraFeed } from "@/lib/types/camera";

interface FeedResponse {
  feeds: CameraFeed[];
  generatedAt: string;
  warning?: string;
}

export async function fetchFeedSnapshot(): Promise<FeedResponse> {
  const response = await fetch("/api/feed", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Failed to fetch camera feed snapshot");
  }
  return response.json() as Promise<FeedResponse>;
}
