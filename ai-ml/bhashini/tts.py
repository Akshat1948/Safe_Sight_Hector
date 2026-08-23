"""
tts.py — Text-to-Speech wrapper: Bhashini (primary) + gTTS (free fallback).

Priority:
  1. Bhashini TTS  — used when BHASHINI_API_KEY + BHASHINI_USER_ID are set in .env
  2. gTTS          — Google TTS via the gTTS library, free, no key required,
                     supports all major Indian languages (returns MP3 as base64)

gTTS docs: https://gtts.readthedocs.io/
"""

import base64
import io
import logging

import httpx
from gtts import gTTS

from shared.config import BHASHINI_API_KEY, BHASHINI_USER_ID, BHASHINI_BASE_URL
from shared.schemas import TTSRequest, TTSResponse

logger = logging.getLogger(__name__)

_PIPELINE_CONFIG_PATH = "/ulca/apis/v0/model/getModelsPipeline"

# gTTS language codes mapped from our short codes
# gTTS uses BCP-47 / ISO 639-1 codes
_GTTS_LANG_MAP = {
    "en": "en",
    "hi": "hi",
    "ta": "ta",
    "te": "te",
    "bn": "bn",
    "mr": "mr",
    "gu": "gu",
    "kn": "kn",
    "ml": "ml",
    "pa": "pa",
    "or": "hi",   # Odia not supported by gTTS — fallback to Hindi
    "as": "hi",   # Assamese not supported by gTTS — fallback to Hindi
    "ur": "ur",
}


def _headers() -> dict:
    return {
        "userID": BHASHINI_USER_ID,
        "ulcaApiKey": BHASHINI_API_KEY,
        "Content-Type": "application/json",
    }


# ─────────────────────────────────────────────
# Bhashini TTS (primary — used when keys set)
# ─────────────────────────────────────────────

def _get_tts_pipeline(language: str) -> tuple[str, str, str]:
    """Fetch Bhashini TTS pipeline ID + inference URL."""
    payload = {
        "pipelineTasks": [
            {
                "taskType": "tts",
                "config": {
                    "language": {"sourceLanguage": language},
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
        "callbackUrl", f"{BHASHINI_BASE_URL}/services/inference/pipeline"
    )
    return pipeline_id, service_id, inference_url


def _run_tts_bhashini(
    text: str,
    language: str,
    pipeline_id: str,
    service_id: str,
    inference_url: str,
) -> str:
    """Call Bhashini TTS inference. Returns base64-encoded WAV audio."""
    payload = {
        "pipelineTasks": [
            {
                "taskType": "tts",
                "config": {
                    "language": {"sourceLanguage": language},
                    "serviceId": service_id,
                    "gender": "female",
                },
            }
        ],
        "inputData": {"input": [{"source": text}]},
    }
    infer_headers = {**_headers(), "pipelineId": pipeline_id}
    with httpx.Client(timeout=20.0) as client:
        response = client.post(inference_url, json=payload, headers=infer_headers)
        response.raise_for_status()
        data = response.json()

    return (
        data.get("pipelineResponse", [{}])[0]
        .get("audio", [{}])[0]
        .get("audioContent", "")
    )


def _tts_via_bhashini(request: TTSRequest) -> TTSResponse:
    """Full Bhashini TTS flow."""
    pipeline_id, service_id, inference_url = _get_tts_pipeline(request.language)
    audio_b64 = _run_tts_bhashini(
        text=request.text,
        language=request.language,
        pipeline_id=pipeline_id,
        service_id=service_id,
        inference_url=inference_url,
    )
    logger.info("Bhashini TTS: language=%s text_len=%d", request.language, len(request.text))
    return TTSResponse(
        audio_base64=audio_b64,
        format="wav",
        language=request.language,
    )


# ─────────────────────────────────────────────
# gTTS fallback (free, no key required)
# ─────────────────────────────────────────────

def _tts_via_gtts(request: TTSRequest) -> TTSResponse:
    """
    Generate speech using gTTS (Google Text-to-Speech).

    - No API key needed
    - Returns MP3 encoded as base64
    - Supports hi, ta, te, bn, mr, gu, kn, ml, pa, ur
    - or/as fall back to Hindi (gTTS limitation)
    """
    lang_code = _GTTS_LANG_MAP.get(request.language, "hi")

    if lang_code != request.language:
        logger.warning(
            "gTTS does not support language '%s'. Using '%s' as fallback.",
            request.language, lang_code,
        )

    tts = gTTS(text=request.text, lang=lang_code, slow=False)

    # Write to in-memory buffer (no temp files needed)
    audio_buffer = io.BytesIO()
    tts.write_to_fp(audio_buffer)
    audio_buffer.seek(0)

    audio_b64 = base64.b64encode(audio_buffer.read()).decode("utf-8")

    logger.info(
        "gTTS generated audio: language=%s (mapped=%s) text='%s'",
        request.language, lang_code, request.text[:60],
    )
    return TTSResponse(
        audio_base64=audio_b64,
        format="mp3",   # gTTS outputs MP3
        language=request.language,
    )


# ─────────────────────────────────────────────
# Public entry point
# ─────────────────────────────────────────────

def text_to_speech(request: TTSRequest) -> TTSResponse:
    """
    Convert text to speech audio.

    Uses Bhashini TTS if keys are configured in .env, otherwise
    falls back to gTTS (free, no key, works immediately).
    Returns base64-encoded audio (WAV from Bhashini, MP3 from gTTS).
    """
    if BHASHINI_API_KEY and BHASHINI_USER_ID:
        try:
            return _tts_via_bhashini(request)
        except Exception as exc:
            logger.warning("Bhashini TTS failed (%s). Falling back to gTTS.", exc)

    return _tts_via_gtts(request)