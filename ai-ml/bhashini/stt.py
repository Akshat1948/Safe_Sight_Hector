"""
stt.py — Bhashini Speech-to-Text (STT) API wrapper.

Converts base64-encoded audio (WAV) in an Indian language
to text using Bhashini's ASR (Automatic Speech Recognition) pipeline.
"""

import logging
import httpx

from shared.config import BHASHINI_API_KEY, BHASHINI_USER_ID, BHASHINI_BASE_URL
from shared.schemas import STTRequest, STTResponse

logger = logging.getLogger(__name__)

_PIPELINE_CONFIG_PATH = "/ulca/apis/v0/model/getModelsPipeline"


def _headers() -> dict:
    return {
        "userID": BHASHINI_USER_ID,
        "ulcaApiKey": BHASHINI_API_KEY,
        "Content-Type": "application/json",
    }


def _get_stt_pipeline(language: str) -> tuple[str, str, str]:
    """
    Fetch pipeline ID, service ID, and inference URL for ASR task.
    Returns (pipeline_id, service_id, inference_url).
    """
    payload = {
        "pipelineTasks": [
            {
                "taskType": "asr",
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


def _run_stt(
    audio_base64: str,
    language: str,
    pipeline_id: str,
    service_id: str,
    inference_url: str,
) -> tuple[str, float]:
    """
    Call Bhashini ASR inference endpoint.
    Returns (transcribed_text, confidence_score).
    """
    payload = {
        "pipelineTasks": [
            {
                "taskType": "asr",
                "config": {
                    "language": {"sourceLanguage": language},
                    "serviceId": service_id,
                    "audioFormat": "wav",
                    "samplingRate": 16000,
                },
            }
        ],
        "inputData": {
            "audio": [{"audioContent": audio_base64}],
        },
    }

    infer_headers = {**_headers(), "pipelineId": pipeline_id}

    with httpx.Client(timeout=30.0) as client:
        response = client.post(inference_url, json=payload, headers=infer_headers)
        response.raise_for_status()
        data = response.json()

    output = data.get("pipelineResponse", [{}])[0].get("output", [{}])[0]
    transcribed_text = output.get("source", "")
    confidence = float(output.get("confidenceScore", 0.9))

    return transcribed_text, confidence


def speech_to_text(request: STTRequest) -> STTResponse:
    """
    Transcribe audio to text via Bhashini ASR.

    Returns STTResponse with transcribed text and confidence score.
    Falls back to a stub response if credentials are not configured.
    """
    if not BHASHINI_API_KEY or not BHASHINI_USER_ID:
        logger.warning("Bhashini credentials not set. Returning STT stub response.")
        return STTResponse(
            text="[BHASHINI_UNCONFIGURED] Audio transcription unavailable.",
            language=request.language,
            confidence=0.0,
        )

    try:
        pipeline_id, service_id, inference_url = _get_stt_pipeline(request.language)
        text, confidence = _run_stt(
            audio_base64=request.audio_base64,
            language=request.language,
            pipeline_id=pipeline_id,
            service_id=service_id,
            inference_url=inference_url,
        )
        logger.info(
            "STT transcribed language=%s confidence=%.2f text_preview='%s'",
            request.language, confidence, text[:60],
        )
        return STTResponse(
            text=text,
            language=request.language,
            confidence=confidence,
        )

    except httpx.HTTPError as exc:
        logger.exception("Bhashini STT HTTP error: %s", exc)
        raise
    except Exception as exc:
        logger.exception("Bhashini STT unexpected error: %s", exc)
        raise