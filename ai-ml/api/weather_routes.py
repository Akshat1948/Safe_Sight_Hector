from __future__ import annotations

import logging
from fastapi import APIRouter, HTTPException, Query

from shared.schemas import HazardRequest, HazardResponse, WeatherResponse
from weather.imd_client import fetch_current_weather
from weather.hazard_overlay import assess_hazard

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/weather", tags=["Weather"])


@router.get("/current", response_model=dict)
async def get_current_weather(
    site_lat: float = Query(..., description="Site latitude (decimal degrees)"),
    site_lon: float = Query(..., description="Site longitude (decimal degrees)"),
):
    try:
        logger.info("Weather request: lat=%.4f lon=%.4f", site_lat, site_lon)
        weather: WeatherResponse = await fetch_current_weather(lat=site_lat, lon=site_lon)
        return {
            "success": True,
            "data": weather.model_dump(mode="json"),
            "message": "Weather data fetched",
        }
    except Exception as exc:
        logger.error("Weather fetch error: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail=f"Weather fetch failed: {exc}")


@router.post("/hazards", response_model=dict)
async def evaluate_weather_hazards(request: HazardRequest):
    try:
        logger.info("Hazard assessment request: site=%s", request.site_id)
        result: HazardResponse = assess_hazard(
            site_id=request.site_id,
            weather=request.weather,
            site_features=request.site_features,
        )
        return {
            "success": True,
            "data": result.model_dump(mode="json"),
            "message": "Hazard assessment complete",
        }
    except Exception as exc:
        logger.error("Hazard error site=%s: %s", request.site_id, exc, exc_info=True)
        raise HTTPException(status_code=500, detail=f"Hazard assessment failed: {exc}")
