"""
translate.py — Bhashini translation API wrapper.

Bhashini (bhashini.gov.in) is MeitY Government of India's National
Language Translation Mission. It provides free translation across
22 scheduled Indian languages.

Two-step flow:
  1. POST /pipeline/config   → get pipeline ID for the language pair
  2. POST /pipeline/predict  → run translation using the pipeline

Docs: https://bhashini.gitbook.io/bhashini-apis/
"""

import logging
import httpx

from shared.config import BHASHINI_API_KEY, BHASHINI_USER_ID, BHASHINI_BASE_URL
from shared.schemas import TranslateRequest, TranslateResponse

logger = logging.getLogger(__name__)

_PIPELINE_CONFIG_PATH = "/ulca/apis/v0/model/getModelsPipeline"
_PIPELINE_INFER_PATH = "/services/inference/pipeline"


def _headers() -> dict:
    return {
        "userID": BHASHINI_USER_ID,
        "ulcaApiKey": BHASHINI_API_KEY,
        "Content-Type": "application/json",
    }


def _get_pipeline_id(source_language: str, target_language: str) -> tuple[str, str]:
    """
    Fetch the Bhashini pipeline ID and service URL for a translation task.

    Returns (pipeline_id, inference_url).
    Raises httpx.HTTPError on failure.
    """
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
    """
    Call the Bhashini inference endpoint to translate text.

    Returns translated text string.
    """
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
        "inputData": {
            "input": [{"source": text}],
        },
    }

    infer_headers = {
        **_headers(),
        "pipelineId": pipeline_id,
    }

    with httpx.Client(timeout=15.0) as client:
        response = client.post(inference_url, json=payload, headers=infer_headers)
        response.raise_for_status()
        data = response.json()

    output = (
        data.get("pipelineResponse", [{}])[0]
        .get("output", [{}])[0]
        .get("target", "")
    )
    return output


def translate(request: TranslateRequest) -> TranslateResponse:
    """
    Translate text from source_language to target_language via Bhashini.

    Falls back to returning original text with a warning if Bhashini
    API keys are not configured (allows local dev without credentials).
    """
    if not BHASHINI_API_KEY or not BHASHINI_USER_ID:
        logger.warning(
            "Bhashini credentials not set. Returning original text as fallback."
        )
        return TranslateResponse(
            translated_text=f"[BHASHINI_UNCONFIGURED] {request.text}",
            source_language=request.source_language,
            target_language=request.target_language,
        )

    try:
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
            "Translated [%s→%s]: '%s' → '%s'",
            request.source_language, request.target_language,
            request.text[:50], translated[:50],
        )
        return TranslateResponse(
            translated_text=translated,
            source_language=request.source_language,
            target_language=request.target_language,
        )

    except httpx.HTTPError as exc:
        logger.exception("Bhashini translate HTTP error: %s", exc)
        raise
    except Exception as exc:
        logger.exception("Bhashini translate unexpected error: %s", exc)
        raise