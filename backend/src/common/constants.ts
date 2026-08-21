export const DENSITY_THRESHOLDS = {
  GREEN_MAX: 0.5,   // 0–50% of maxCapacity
  YELLOW_MAX: 0.7,  // 50–70%
  ORANGE_MAX: 0.9,  // 70–90%
  // Above 90% = RED
};

export const ALERT_ESCALATION_TIMEOUT_MS = 60_000; // 60 seconds

export const JWT_ACCESS_EXPIRY = '15m';
export const JWT_REFRESH_EXPIRY = '7d';

export const SUPPORTED_LANGUAGES = [
  'en', 'hi', 'ta', 'te', 'bn', 'mr', 'gu', 'kn',
  'ml', 'pa', 'or', 'as', 'ur',
] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: SupportedLanguage = 'en';

export const AI_ML_SERVICE_URL = process.env.AI_ML_SERVICE_URL || 'http://localhost:8000/ml';
