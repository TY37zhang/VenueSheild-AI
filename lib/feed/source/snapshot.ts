import type { CameraFeed } from "@/lib/types/camera";

const baseCameraFeeds: Omit<CameraFeed, "lastUpdated">[] = [
  {
    id: 1,
    cameraId: "CAM-01",
    name: "Main Gate",
    zone: "Zone A",
    status: "warning",
    sourceType: "snapshot",
    occupancy: 487,
    capacity: 500,
    imageUrl: "/images/surveillance-1.jpg",
    isLive: true,
  },
  {
    id: 2,
    cameraId: "CAM-02",
    name: "Main Field",
    zone: "Zone B",
    status: "normal",
    sourceType: "snapshot",
    occupancy: 18500,
    capacity: 25000,
    imageUrl: "/images/surveillance-2.jpg",
    isLive: true,
  },
  {
    id: 3,
    cameraId: "CAM-03",
    name: "North Hallway",
    zone: "Zone C",
    status: "normal",
    sourceType: "snapshot",
    occupancy: 0,
    capacity: 200,
    imageUrl: "/images/surveillance-3.jpg",
    isLive: true,
  },
  {
    id: 4,
    cameraId: "CAM-04",
    name: "Parking Lot B",
    zone: "Zone D",
    status: "normal",
    sourceType: "snapshot",
    occupancy: 127,
    capacity: 500,
    imageUrl: "/images/surveillance-4.jpg",
    isLive: true,
  },
  {
    id: 5,
    cameraId: "CAM-05",
    name: "Backstage",
    zone: "Zone E",
    status: "normal",
    sourceType: "snapshot",
    occupancy: 3,
    capacity: 50,
    imageUrl: "/images/surveillance-5.jpg",
    isLive: true,
  },
  {
    id: 6,
    cameraId: "CAM-06",
    name: "Food Court",
    zone: "Zone F",
    status: "alert",
    sourceType: "snapshot",
    occupancy: 89,
    capacity: 300,
    imageUrl: "/images/surveillance-6.jpg",
    isLive: true,
  },
];

function withFluctuation(feed: Omit<CameraFeed, "lastUpdated">) {
  if (feed.status === "offline" || !feed.isLive) {
    return { ...feed, occupancy: 0, isLive: false };
  }

  const delta = Math.floor(Math.random() * 20) - 10;
  const occupancy = Math.max(0, Math.min(feed.capacity, feed.occupancy + delta));

  return {
    ...feed,
    occupancy,
  };
}

export function getSnapshotCameraFeeds(): CameraFeed[] {
  const now = new Date().toISOString();
  return baseCameraFeeds.map((feed) => ({
    ...withFluctuation(feed),
    lastUpdated: now,
  }));
}
