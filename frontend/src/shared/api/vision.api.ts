const ML_API_BASE = 'http://localhost:8000/ml';

export interface BoundingBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  confidence: number;
  label: string;
}

export interface DetectionResult {
  total_persons: number;
  detections: BoundingBox[];
  annotated_image_base64: string | null;
  processing_time_ms: number;
  model_version: string;
}

export interface ZoneDetectionResult {
  zone_id: string;
  zone_name: string;
  headcount: number;
  max_capacity: number;
  density_percentage: number;
  density_status: string;
}

export interface VisionAnalysisResponse {
  total_persons: number;
  zone_breakdown: ZoneDetectionResult[];
  annotated_image_base64: string | null;
  processing_time_ms: number;
  timestamp: string;
}

export async function detectFromImage(file: File, confidence = 0.35): Promise<{ success: boolean; data?: DetectionResult; message: string }> {
  const formData = new FormData();
  formData.append('file', file);
  try {
    const res = await fetch(`${ML_API_BASE}/vision/detect?confidence=${confidence}`, {
      method: 'POST',
      body: formData,
    });
    return res.json();
  } catch {
    return { success: false, message: 'Vision service unreachable' };
  }
}

export async function detectFromBase64(imageBase64: string, confidence = 0.35): Promise<{ success: boolean; data?: DetectionResult; message: string }> {
  try {
    const res = await fetch(`${ML_API_BASE}/vision/detect-base64`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_base64: imageBase64, confidence }),
    });
    return res.json();
  } catch {
    return { success: false, message: 'Vision service unreachable' };
  }
}

export async function analyzeZones(file: File, autoUpdate = false): Promise<{ success: boolean; data?: VisionAnalysisResponse; message: string }> {
  const formData = new FormData();
  formData.append('file', file);
  try {
    const res = await fetch(`${ML_API_BASE}/vision/analyze-zones?auto_update=${autoUpdate}`, {
      method: 'POST',
      body: formData,
    });
    return res.json();
  } catch {
    return { success: false, message: 'Vision service unreachable' };
  }
}
