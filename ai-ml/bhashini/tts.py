"""
tts.py — Bhashini Text-to-Speech (TTS) API wrapper.

Converts text in an Indian language to base64-encoded WAV audio
using Bhashini's TTS pipeline.
"""

import base64
import logging
import httpx

from shared.config import BHASHINI_API_KEY, BHASHINI_USER_ID, BHASHINI_BASE_URL
from shared.schemas import TTSRequest, TTSResponse

logger = logging.getLogger(__name__)

_PIPELINE_CONFIG_PATH = "/ulca/apis/v0/model/getModelsPipeline"


def _headers() -> dict:
    return {
        "userID": BHASHINI_USER_ID,
        "ulcaApiKey": BHASHINI_API_KEY,
        "Content-Type": "application/json",
    }


def _get_tts_pipeline(language: str) -> tuple[str, str, str]:
    """
    Fetch pipeline ID, service ID, and inference URL for TTS task.
    Returns (pipeline_id, service_id, inference_url).
    """
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


def _run_tts(
    text: str,
    language: str,
    pipeline_id: str,
    service_id: str,
    inference_url: str,
) -> str:
    """
    Call Bhashini TTS inference and return base64-encoded audio string.
    """
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
        "inputData": {
            "input": [{"source": text}],
        },
    }

    infer_headers = {**_headers(), "pipelineId": pipeline_id}

    with httpx.Client(timeout=20.0) as client:
        response = client.post(inference_url, json=payload, headers=infer_headers)
        response.raise_for_status()
        data = response.json()

    audio_content = (
        data.get("pipelineResponse", [{}])[0]
        .get("audio", [{}])[0]
        .get("audioContent", "")
    )
    return audio_content  # already base64 from Bhashini


def _silent_wav_base64() -> str:
    """Return a minimal silent WAV file as base64 for fallback/dev mode."""
    # 44-byte WAV header for 0-sample, 16-bit mono 16000Hz WAV
    header = bytes([
        0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00,
        0x57, 0x41, 0x56, 0x45, 0x66, 0x6D, 0x74, 0x20,
        0x10, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00,
        0x80, 0x3E, 0x00, 0x00, 0x00, 0x7D, 0x00, 0x00,
        0x02, 0x00, 0x10, 0x00, 0x64, 0x61, 0x74, 0x61,
        0x00, 0x00, 0x00, 0x00,
    ])
    return base64.b64encode(header).decode("utf-8")


def text_to_speech(request: TTSRequest) -> TTSResponse:
    """
    Convert text to speech audio via Bhashini TTS.

    Returns TTSResponse with base64-encoded WAV audio.
    Falls back to a silent WAV stub if credentials are not configured.
    """
    if not BHASHINI_API_KEY or not BHASHINI_USER_ID:
        logger.warning("Bhashini credentials not set. Returning silent WAV stub.")
        return TTSResponse(
            audio_base64=_silent_wav_base64(),
            format="wav",
            language=request.language,
        )

    try:
        pipeline_id, service_id, inference_url = _get_tts_pipeline(request.language)
        audio_b64 = _run_tts(
            text=request.text,
            language=request.language,
            pipeline_id=pipeline_id,
            service_id=service_id,
            inference_url=inference_url,
        )
        logger.info("TTS generated for language=%s, text_len=%d", request.language, len(request.text))
        return TTSResponse(
            audio_base64=audio_b64,
            format="wav",
            language=request.language,
        )

    except httpx.HTTPError as exc:
        logger.exception("Bhashini TTS HTTP error: %s", exc)
        raise
    except Exception as exc:
        logger.exception("Bhashini TTS unexpected error: %s", exc)
        raise