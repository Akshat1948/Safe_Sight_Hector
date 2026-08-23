"""
bhashini_routes.py — FastAPI router for Bhashini multilingual endpoints.

Owner: Diya (Pod C)
Base prefix: /ml/bhashini  (registered in api/main.py by Shreyashi)

Endpoints:
  POST /ml/bhashini/translate   — Text translation between Indian languages
  POST /ml/bhashini/tts         — Text-to-speech (returns base64 WAV)
  POST /ml/bhashini/stt         — Speech-to-text (accepts base64 WAV)
"""

import logging
from fastapi import APIRouter, HTTPException, status

from shared.schemas import (
    TranslateRequest,
    TranslateResponse,
    TTSRequest,
    TTSResponse,
    STTRequest,
    STTResponse,
)
from shared.config import SUPPORTED_LANGUAGES
from bhashini.translate import translate
from bhashini.tts import text_to_speech
from bhashini.stt import speech_to_text

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
        "Translate text from source_language to target_language using "
        "the Bhashini (MeitY) API. Supports 13 Indian languages."
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
            detail="Bhashini translation service encountered an error.",
        )

    return {
        "success": True,
        "data": result.model_dump(),
        "message": "Translation complete",
    }


@router.post(
    "/tts",
    summary="Text-to-speech via Bhashini",
    description=(
        "Convert text in a supported Indian language to speech. "
        "Returns base64-encoded WAV audio."
    ),
    status_code=status.HTTP_200_OK,
)
async def tts(request: TTSRequest) -> dict:
    """
    POST /ml/bhashini/tts

    Request body: TTSRequest
    Response envelope: { success, data: TTSResponse, message }
    """
    _validate_language(request.language)

    if not request.text.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="text must not be empty.",
        )

    try:
        result: TTSResponse = text_to_speech(request)
    except Exception as exc:
        logger.exception("TTS failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Bhashini TTS service encountered an error.",
        )

    return {
        "success": True,
        "data": result.model_dump(),
        "message": "Speech generated",
    }


@router.post(
    "/stt",
    summary="Speech-to-text via Bhashini",
    description=(
        "Transcribe base64-encoded WAV audio in a supported Indian language "
        "to text using Bhashini ASR."
    ),
    status_code=status.HTTP_200_OK,
)
async def stt(request: STTRequest) -> dict:
    """
    POST /ml/bhashini/stt

    Request body: STTRequest
    Response envelope: { success, data: STTResponse, message }
    """
    _validate_language(request.language)

    if not request.audio_base64.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="audio_base64 must not be empty.",
        )

    try:
        result: STTResponse = speech_to_text(request)
    except Exception as exc:
        logger.exception("STT failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Bhashini STT service encountered an error.",
        )

    return {
        "success": True,
        "data": result.model_dump(),
        "message": "Transcription complete",
    }