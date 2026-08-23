"""
anomaly_routes.py — FastAPI router for anomaly detection endpoints.

Owner: Diya (Pod C)
Base prefix: /ml/anomaly  (registered in api/main.py by Shreyashi)

Endpoints:
  POST /ml/anomaly/detect   — Analyze crowd readings for anomalies
"""

import logging
from fastapi import APIRouter, HTTPException, status

from shared.schemas import AnomalyRequest, AnomalyResponse
from anomaly.detector import detect

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/anomaly", tags=["Anomaly Detection"])


@router.post(
    "/detect",
    summary="Detect crowd anomalies",
    description=(
        "Analyze a window of crowd density readings for crush precursors, "
        "stationary crowds, reverse flow, or density spikes using "
        "Isolation Forest + rule-based pattern classification."
    ),
    status_code=status.HTTP_200_OK,
)
async def detect_anomaly(request: AnomalyRequest) -> dict:
    """
    POST /ml/anomaly/detect

    Request body: AnomalyRequest
    Response envelope: { success, data: AnomalyResponse, message }
    """
    if not request.readings:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="readings list must not be empty.",
        )

    if request.max_capacity <= 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="max_capacity must be a positive integer.",
        )

    try:
        result: AnomalyResponse = detect(request)
    except Exception as exc:
        logger.exception("Anomaly detection failed for zone=%s: %s", request.zone_id, exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Anomaly detection service encountered an internal error.",
        )

    return {
        "success": True,
        "data": result.model_dump(),
        "message": "Anomaly detection complete",
    }