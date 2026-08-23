"""
translate.py — Translation wrapper: Bhashini (primary) + MyMemory (free fallback).

Priority:
  1. Bhashini API  — used when BHASHINI_API_KEY + BHASHINI_USER_ID are set in .env
  2. MyMemory API  — free fallback, no API key required (active for hackathon demo)

Bhashini docs: https://bhashini.gitbook.io/bhashini-apis/
MyMemory docs:  https://mymemory.translated.net/doc/spec.php
"""

import logging
import httpx

from shared.config import BHASHINI_API_KEY, BHASHINI_USER_ID, BHASHINI_BASE_URL
from shared.schemas import TranslateRequest, TranslateResponse

logger = logging.getLogger(__name__)

_PIPELINE_CONFIG_PATH = "/ulca/apis/v0/model/getModelsPipeline"
_PIPELINE_INFER_PATH = "/services/inference/pipeline"

# MyMemory free translation API — no key required
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


def _headers() -> dict:
    return {
        "userID": BHASHINI_USER_ID,
        "ulcaApiKey": BHASHINI_API_KEY,
        "Content-Type": "application/json",
    }


# ─────────────────────────────────────────────
# Bhashini (primary — used when keys are set)
# ─────────────────────────────────────────────

def _get_pipeline_id(source_language: str, target_language: str) -> tuple[str, str, str]:
    """Fetch Bhashini pipeline ID + inference URL. Returns (pipeline_id, service_id, url)."""
    payload = {
        "pipelineTasks": [
            {
                "taskType": "translation",
                "config": {
                    "language": {
                        "sourceLanguage": source_language,
                        "targetLanguage": target_language,
                    }
                },
            }
        ],
        "pipelineRequestConfig": {"pipelineId": "64392f96daac500b55c543cd"},
    }
    with httpx.Client(timeout=10.0) as client:
        response = client.post(
            f"{BHASHINI_BASE_URL}{_PIPELINE_CONFIG_PATH}",
            json=payload,
            headers=_headers(),
        )
        response.raise_for_status()
        data = response.json()

    pipeline_response = data.get("pipelineResponseConfig", [{}])[0]
    config = pipeline_response.get("config", [{}])[0]
    pipeline_id = config.get("pipelineId", "")
    service_id = config.get("serviceId", "")
    inference_url = data.get("pipelineInferenceAPIEndPoint", {}).get(
        "callbackUrl", f"{BHASHINI_BASE_URL}{_PIPELINE_INFER_PATH}"
    )
    return pipeline_id, service_id, inference_url


def _run_translation(
    text: str,
    source_language: str,
    target_language: str,
    pipeline_id: str,
    service_id: str,
    inference_url: str,
) -> str:
    """Call Bhashini inference endpoint. Returns translated text."""
    payload = {
        "pipelineTasks": [
            {
                "taskType": "translation",
                "config": {
                    "language": {
                        "sourceLanguage": source_language,
                        "targetLanguage": target_language,
                    },
                    "serviceId": service_id,
                },
            }
        ],
        "inputData": {"input": [{"source": text}]},
    }
    infer_headers = {**_headers(), "pipelineId": pipeline_id}
    with httpx.Client(timeout=15.0) as client:
        response = client.post(inference_url, json=payload, headers=infer_headers)
        response.raise_for_status()
        data = response.json()

    return (
        data.get("pipelineResponse", [{}])[0]
        .get("output", [{}])[0]
        .get("target", "")
    )


def _translate_via_bhashini(request: TranslateRequest) -> TranslateResponse:
    """Full Bhashini translation flow."""
    pipeline_id, service_id, inference_url = _get_pipeline_id(
        request.source_language, request.target_language
    )
    translated = _run_translation(
        text=request.text,
        source_language=request.source_language,
        target_language=request.target_language,
        pipeline_id=pipeline_id,
        service_id=service_id,
        inference_url=inference_url,
    )
    logger.info(
        "Bhashini [%s->%s]: '%s' -> '%s'",
        request.source_language, request.target_language,
        request.text[:50], translated[:50],
    )
    return TranslateResponse(
        translated_text=translated,
        source_language=request.source_language,
        target_language=request.target_language,
    )


# ─────────────────────────────────────────────
# MyMemory (free fallback — no key required)
# ─────────────────────────────────────────────

def _translate_via_mymemory(request: TranslateRequest) -> TranslateResponse:
    """
    Translate via MyMemory free API (https://mymemory.translated.net).
    No API key needed. Supports all 13 Indian languages.
    Rate limit: 5000 chars/day on free tier — ample for demo.
    """
    src = _MYMEMORY_LANG_MAP.get(request.source_language, request.source_language)
    tgt = _MYMEMORY_LANG_MAP.get(request.target_language, request.target_language)

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
            "MyMemory returned no result for [%s->%s]. Returning original.",
            request.source_language, request.target_language,
        )
        translated_text = request.text

    logger.info(
        "MyMemory [%s->%s]: '%s' -> '%s'",
        request.source_language, request.target_language,
        request.text[:50], translated_text[:50],
    )
    return TranslateResponse(
        translated_text=translated_text,
        source_language=request.source_language,
        target_language=request.target_language,
    )


# ─────────────────────────────────────────────
# Public entry point
# ─────────────────────────────────────────────

def translate(request: TranslateRequest) -> TranslateResponse:
    """
    Translate text between Indian languages.

    Uses Bhashini if keys are configured in .env, otherwise
    falls back to MyMemory (free, no key, works immediately).
    """
    if BHASHINI_API_KEY and BHASHINI_USER_ID:
        try:
            return _translate_via_bhashini(request)
        except Exception as exc:
            logger.warning("Bhashini failed (%s). Falling back to MyMemory.", exc)

    return _translate_via_mymemory(request)