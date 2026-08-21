from __future__ import annotations

import logging
from fastapi import APIRouter, HTTPException

from shared.schemas import ForecastRequest, ForecastResponse
from forecast.predict import run_forecast

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/forecast", tags=["Forecast"])


@router.post("", response_model=dict)
async def forecast_crowd_density(request: ForecastRequest):
    try:
        logger.info(
            "Forecast request: zone=%s site=%s density=%d/%d hours=%d festival=%s",
            request.zone_id,
            request.site_id,
            request.current_density,
            request.max_capacity,
            request.hours_ahead,
            request.is_festival_day,
        )

        result: ForecastResponse = run_forecast(
            zone_id=request.zone_id,
            site_id=request.site_id,
            current_density=request.current_density,
            max_capacity=request.max_capacity,
            hours_ahead=request.hours_ahead,
            weather_condition=request.weather_condition,
            is_festival_day=request.is_festival_day,
            historical_data=request.historical_data,
        )

        return {
            "success": True,
            "data": result.model_dump(mode="json"),
            "message": "Forecast generated",
        }

    except Exception as exc:
        logger.error("Forecast error zone=%s: %s", request.zone_id, exc, exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Forecast generation failed: {exc}",
        )
