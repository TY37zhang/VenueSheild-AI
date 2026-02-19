export type CameraStatus = "normal" | "warning" | "alert" | "offline";
export type CameraSourceType = "snapshot" | "local-device" | "remote-stream";

export interface CameraFeed {
  id: number;
  cameraId: string;
  name: string;
  zone: string;
  status: CameraStatus;
  sourceType: CameraSourceType;
  occupancy: number;
  capacity: number;
  imageUrl: string;
  frameDataUrl?: string;
  streamUrl?: string;
  isLive?: boolean;
  lastUpdated: string;
}

export interface CameraStateInput {
  cameraId: string;
  numericId: number;
  name: string;
  zone: string;
  sourceType: CameraSourceType;
  status: CameraStatus;
  occupancy: number;
  capacity: number;
  isLive: boolean;
  streamUrl?: string;
  imageUrl: string;
  frameDataUrl?: string;
  lastUpdated: string;
}
