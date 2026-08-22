export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

export const DENSITY_THRESHOLDS = {
  GREEN_MAX: 0.5,
  YELLOW_MAX: 0.7,
  ORANGE_MAX: 0.9,
};

export const SUPPORTED_LANGUAGES = [
  'en', 'hi', 'ta', 'te', 'bn', 'mr', 'gu', 'kn',
  'ml', 'pa', 'or', 'as', 'ur',
] as const;

export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];
export const DEFAULT_LANGUAGE = 'en';
