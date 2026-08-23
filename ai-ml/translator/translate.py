"""
translate.py — Generic multilingual translation engine.

Uses MyMemory open translation API (zero authentication / no key needed)
to support 13 scheduled Indian languages with high reliability and low latency.
"""

import logging
import httpx

from shared.schemas import TranslateRequest, TranslateResponse

logger = logging.getLogger(__name__)

# MyMemory free translation API endpoint
_MYMEMORY_URL = "https://api.mymemory.translated.net/get"

# BCP-47 codes MyMemory expects, mapped from our short codes
_MYMEMORY_LANG_MAP = {
    "en": "en-GB",
    "hi": "hi-IN",
    "ta": "ta-IN",
    "te": "te-IN",
    "bn": "bn-IN",
    "mr": "mr-IN",
    "gu": "gu-IN",
    "kn": "kn-IN",
    "ml": "ml-IN",
    "pa": "pa-IN",
    "or": "or-IN",
    "as": "as-IN",
    "ur": "ur-PK",
}


def translate(request: TranslateRequest) -> TranslateResponse:
    """
    Translate text between Indian languages using MyMemory Translation API.
    
    Supports: en, hi, ta, te, bn, mr, gu, kn, ml, pa, or, as, ur.
    No API keys or authentication required.
    """
    src = _MYMEMORY_LANG_MAP.get(request.source_language, request.source_language)
    tgt = _MYMEMORY_LANG_MAP.get(request.target_language, request.target_language)

    try:
        with httpx.Client(timeout=10.0) as client:
            response = client.get(
                _MYMEMORY_URL,
                params={"q": request.text, "langpair": f"{src}|{tgt}"},
            )
            response.raise_for_status()
            data = response.json()

        translated_text = data.get("responseData", {}).get("translatedText", "")

        if not translated_text or "INVALID" in translated_text.upper():
            logger.warning(
                "Translation service returned no result for [%s->%s]. Returning original text.",
                request.source_language, request.target_language,
            )
            translated_text = request.text

        logger.info(
            "Translated [%s->%s]: '%s' -> '%s'",
            request.source_language, request.target_language,
            request.text[:50], translated_text[:50],
        )
        return TranslateResponse(
            translated_text=translated_text,
            source_language=request.source_language,
            target_language=request.target_language,
        )

    except Exception as exc:
        logger.exception("Translation request failed: %s", exc)
        # Fallback to returning original text to never crash caller
        return TranslateResponse(
            translated_text=request.text,
            source_language=request.source_language,
            target_language=request.target_language,
        )