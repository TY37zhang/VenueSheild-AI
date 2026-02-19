import { supabaseAdmin } from "@/lib/supabase";
import type { CameraFeed } from "@/lib/types/camera";

export async function upsertCameras(feeds: CameraFeed[]) {
  const rows = feeds.map((feed) => ({
    camera_id: feed.cameraId,
    numeric_id: feed.id,
    name: feed.name,
    zone: feed.zone,
    source_type: feed.sourceType,
    stream_url: feed.streamUrl ?? null,
    metadata: {
      image_url: feed.imageUrl,
    },
  }));

  const { error } = await supabaseAdmin.from("cameras").upsert(rows, {
    onConflict: "camera_id",
  });

  if (error) {
    throw new Error(error.message);
  }
}
