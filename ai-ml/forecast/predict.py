from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Optional

from shared.schemas import (
    DensityReading,
    DensityStatusEnum,
    ForecastPoint,
    ForecastResponse,
)
from shared.config import DENSITY_THRESHOLDS
from forecast.model import CrowdForecastModel

logger = logging.getLogger(__name__)

_model = CrowdForecastModel()


def get_density_status(predicted: int, max_capacity: int) -> DensityStatusEnum:
    if max_capacity <= 0:
        return DensityStatusEnum.GREEN
    ratio = predicted / max_capacity
    if ratio <= DENSITY_THRESHOLDS["green_max"]:
        return DensityStatusEnum.GREEN
    elif ratio <= DENSITY_THRESHOLDS["yellow_max"]:
        return DensityStatusEnum.YELLOW
    elif ratio <= DENSITY_THRESHOLDS["orange_max"]:
        return DensityStatusEnum.ORANGE
    return DensityStatusEnum.RED


def should_alert(status: DensityStatusEnum) -> bool:
    return status in (DensityStatusEnum.ORANGE, DensityStatusEnum.RED)


def run_forecast(
    zone_id: str,
    site_id: str,
    current_density: int,
    max_capacity: int,
    hours_ahead: int,
    weather_condition: Optional[str],
    is_festival_day: bool,
    historical_data: list[DensityReading],
) -> ForecastResponse:
    history = [
        {"timestamp": r.timestamp, "headcount": r.headcount}
        for r in historical_data
    ]

    raw_forecasts = _model.predict(
        historical_data=history,
        current_density=current_density,
        max_capacity=max_capacity,
        hours_ahead=hours_ahead,
        weather_condition=weather_condition,
        is_festival_day=is_festival_day,
    )

    forecast_points: list[ForecastPoint] = []
    for raw in raw_forecasts:
        ts = raw["timestamp"]
        if isinstance(ts, str):
            ts = datetime.fromisoformat(ts.replace("Z", "+00:00"))
        status = get_density_status(raw["predicted_density"], max_capacity)
        forecast_points.append(
            ForecastPoint(
                timestamp=ts,
                predicted_density=raw["predicted_density"],
                confidence_lower=raw["confidence_lower"],
                confidence_upper=raw["confidence_upper"],
                density_status=status,
                alert_recommended=should_alert(status),
            )
        )

    if forecast_points:
        peak_point = max(forecast_points, key=lambda p: p.predicted_density)
        peak_time = peak_point.timestamp
        peak_density = peak_point.predicted_density
    else:
        peak_time = datetime.now(timezone.utc)
        peak_density = current_density

    return ForecastResponse(
        zone_id=zone_id,
        forecasts=forecast_points,
        peak_time=peak_time,
        peak_density=peak_density,
        model_version="prophet-v1",
    )
