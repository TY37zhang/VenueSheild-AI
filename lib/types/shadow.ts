export type ShadowSeverity = "low" | "medium" | "high" | "critical";
export type ShadowModelMode = "heuristic" | "adapter";

export interface ShadowBox {
  classId: number;
  classLabel: string;
  confidence: number;
  xyxy: [number, number, number, number];
}

export interface ShadowFrameShape {
  width: number;
  height: number;
}

export interface ShadowDetection {
  cameraId: string;
  sourceType: "local-device" | "remote-stream";
  modelKey: string;
  modelVersion: string;
  severity: ShadowSeverity;
  confidence: number;
  summary: string;
  recommendedAction: string;
  tags: string[];
  metrics: {
    occupancyRatio: number;
    predictedRatio5m: number;
    feedLive: boolean;
    frameAvailable?: boolean;
    frameShape?: ShadowFrameShape | null;
    totalDetections?: number;
    personCountTracked?: number;
    visionConfidence?: number;
    thresholdUsed?: number;
    classCounts?: Record<string, number>;
    detectionBoxes?: ShadowBox[];
  };
  generatedAt: string;
}

export interface ShadowRunMeta {
  mode: ShadowModelMode;
  fallbackUsed: boolean;
  latencyMs: number;
  detectionCount: number;
  sourceCount: number;
}
