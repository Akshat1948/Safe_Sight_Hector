"""
translation_routes.py — FastAPI router for Multilingual Translation Feature.

Owner: Diya (Pod C)
Endpoints:
  POST /ml/translate            — Primary clean translation endpoint
  POST /ml/translator/translate — Alternate alias
  POST /ml/bhashini/translate   — Backward-compatible alias for legacy calls
"""

import logging
from fastapi import APIRouter, HTTPException, status

from shared.schemas import TranslateRequest, TranslateResponse
from shared.config import SUPPORTED_LANGUAGES
from translator.translate import translate

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Multilingual Translator Feature"])


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
    description="Translate text across 13 Indian languages using the multilingual translator service.",
    status_code=status.HTTP_200_OK,
)
@router.post(
    "/translator/translate",
    include_in_schema=False,
)
@router.post(
    "/bhashini/translate",
    include_in_schema=False,
)
async def translate_text(request: TranslateRequest) -> dict:
    """
    POST /ml/translate (also aliases /ml/bhashini/translate)

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