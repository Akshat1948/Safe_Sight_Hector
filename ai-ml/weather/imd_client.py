from __future__ import annotations

import logging
import math
import random
from datetime import datetime, timedelta, timezone
from typing import Any

import httpx

from shared.config import IMD_API_URL
from shared.schemas import WeatherResponse

logger = logging.getLogger(__name__)

_CACHE_TTL_SECONDS = 600
_cache: dict[str, dict[str, Any]] = {}


async def fetch_current_weather(lat: float, lon: float) -> WeatherResponse:
    cache_key = f"{lat:.3f},{lon:.3f}"
    cached = _cache.get(cache_key)
    if cached:
        age = (datetime.now(timezone.utc) - cached["fetched_at"]).total_seconds()
        if age < _CACHE_TTL_SECONDS:
            logger.debug("Cache hit for weather at %s", cache_key)
            return WeatherResponse(**cached["data"])

    try:
        data = await _call_imd_api(lat, lon)
        logger.info("IMD API data fetched for lat=%.3f, lon=%.3f", lat, lon)
    except Exception as exc:
        logger.warning(
            "IMD API unavailable (%.3f, %.3f): %s - using simulated weather.",
            lat, lon, exc,
        )
        data = _simulate_weather(lat, lon)

    _cache[cache_key] = {"data": data, "fetched_at": datetime.now(timezone.utc)}
    return WeatherResponse(**data)


async def _call_imd_api(lat: float, lon: float) -> dict:
    url = f"{IMD_API_URL}/current"
    params = {"lat": lat, "lon": lon, "format": "json"}
    async with httpx.AsyncClient(timeout=5.0) as client:
        response = await client.get(url, params=params)
        response.raise_for_status()
        raw = response.json()
    return _parse_imd_response(raw)


def _parse_imd_response(raw: dict) -> dict:
    return {
        "temperature": float(raw.get("temp", 28.0)),
        "humidity": float(raw.get("humidity", 70.0)),
        "wind_speed": float(raw.get("wind_speed", 10.0)),
        "wind_direction": str(raw.get("wind_dir", "NE")),
        "condition": str(raw.get("condition", "partly_cloudy")),
        "precipitation": float(raw.get("precip", 0.0)),
        "visibility": float(raw.get("visibility", 8.0)),
        "forecast_24h": raw.get("forecast", [])[:24],
    }


def _simulate_weather(lat: float, lon: float) -> dict:
    now = datetime.now(timezone.utc)
    hour = now.hour
    is_mountain = (lat > 28.0)

    base_temp = 21.0 if is_mountain else 29.5
    temp_swing = 4.0 * math.sin(math.pi * (hour - 6) / 12) if 6 <= hour <= 18 else -2.5

    conditions = ["clear", "partly_cloudy", "cloudy", "drizzle", "rain", "thunderstorm"]
    weights = [0.08, 0.18, 0.24, 0.24, 0.18, 0.08] if is_mountain else [0.15, 0.25, 0.25, 0.18, 0.12, 0.05]

    condition = random.choices(conditions, weights=weights, k=1)[0]
    precip_map = {
        "clear": 0.0, "partly_cloudy": 0.0, "cloudy": 2.0,
        "drizzle": 7.5, "rain": 24.0, "thunderstorm": 42.0,
    }
    wind_dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]

    forecast_24h = []
    for h in range(1, 25):
        f_time = now + timedelta(hours=h)
        f_hour = f_time.hour
        f_cond = random.choices(conditions, weights=weights, k=1)[0]
        f_temp = base_temp + 4.0 * math.sin(math.pi * (f_hour - 6) / 12) if 6 <= f_hour <= 18 else base_temp - 2.5
        forecast_24h.append({
            "time": f_time.isoformat(),
            "temperature": round(f_temp + random.uniform(-0.8, 0.8), 1),
            "condition": f_cond,
            "precipitation": round(precip_map.get(f_cond, 0.0) + random.uniform(0, 3.0), 1),
        })

    return {
        "temperature": round(base_temp + temp_swing + random.uniform(-0.8, 0.8), 1),
        "humidity": round(random.uniform(72 if is_mountain else 65, 92), 1),
        "wind_speed": round(random.uniform(8.0, 22.0 if is_mountain else 16.0), 1),
        "wind_direction": random.choice(wind_dirs),
        "condition": condition,
        "precipitation": round(precip_map.get(condition, 0.0) + random.uniform(0, 4.0), 1),
        "visibility": round(random.uniform(5.0 if is_mountain else 7.0, 10.0), 1),
        "forecast_24h": forecast_24h,
    }
