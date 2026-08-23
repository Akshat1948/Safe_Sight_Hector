import { ML_BASE_URL } from '@/shared/constants';

export interface TranslationResponse {
  success: boolean;
  data: {
    translated_text: string;
    source_language: string;
    target_language: string;
  };
  message: string;
}

export async function translateText(
  text: string,
  targetLanguage: string = 'hi',
  sourceLanguage: string = 'en',
): Promise<string> {
  if (!text || targetLanguage === sourceLanguage) {
    return text;
  }

  try {
    const res = await fetch(`${ML_BASE_URL}/translate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        source_language: sourceLanguage,
        target_language: targetLanguage,
      }),
    });

    if (res.ok) {
      const json: TranslationResponse = await res.json();
      if (json?.data?.translated_text) {
        return json.data.translated_text;
      }
    }
  } catch (err) {
    console.warn('AI/ML translation call fallback:', err);
  }

  return text;
}
