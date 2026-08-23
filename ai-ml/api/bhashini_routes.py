"""
bhashini_routes.py — FastAPI router for Bhashini multilingual endpoints.

Owner: Diya (Pod C)
Base prefix: /ml/bhashini  (registered in api/main.py by Shreyashi)

Endpoints:
  POST /ml/bhashini/translate   — Text translation between Indian languages

Note: TTS and STT are out of scope for this hackathon submission.
"""

import logging
from fastapi import APIRouter, HTTPException, status

from shared.schemas import TranslateRequest, TranslateResponse
from shared.config import SUPPORTED_LANGUAGES
from bhashini.translate import translate

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/bhashini", tags=["Bhashini Multilingual"])


def _validate_language(lang: str, field_name: str = "language") -> None:
    """Raise 422 if language code is not in the supported set."""
    if lang not in SUPPORTED_LANGUAGES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                f"Unsupported {field_name} '{lang}'. "
                f"Supported languages: {SUPPORTED_LANGUAGES}"
            ),
        )


@router.post(
    "/translate",
    summary="Translate text between Indian languages",
    description=(
        "Translate text from source_language to target_language. "
        "Uses Bhashini API if keys are configured, otherwise falls back "
        "to MyMemory free API. Supports 13 Indian languages."
    ),
    status_code=status.HTTP_200_OK,
)
async def translate_text(request: TranslateRequest) -> dict:
    """
    POST /ml/bhashini/translate

    Request body: TranslateRequest
    Response envelope: { success, data: TranslateResponse, message }
    """
    _validate_language(request.source_language, "source_language")
    _validate_language(request.target_language, "target_language")

    if not request.text.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="text must not be empty.",
        )

    try:
        result: TranslateResponse = translate(request)
    except Exception as exc:
        logger.exception("Translation failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Translation service encountered an error.",
        )

    return {
        "success": True,
        "data": result.model_dump(),
        "message": "Translation complete",
    }