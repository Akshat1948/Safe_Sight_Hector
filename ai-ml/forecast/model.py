"""
Crowd forecasting model using Facebook Prophet with a robust seasonal fallback.
"""
from __future__ import annotations

import logging
import math
from datetime import datetime, timedelta, timezone
from typing import Optional

import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)

MODEL_VERSION = "prophet-v1"


def _weather_to_factor(condition: Optional[str]) -> float:
    mapping = {
        "clear": 1.0,
        "partly_cloudy": 0.95,
        "cloudy": 0.85,
        "drizzle": 0.75,
        "rain": 0.55,
        "heavy_rain": 0.35,
        "thunderstorm": 0.20,
        "fog": 0.65,
    }
    if condition is None:
        return 1.0
    return mapping.get(condition.lower().strip(), 0.90)


def _heuristic_forecast(
    current_density: int,
    max_capacity: int,
    hours_ahead: int,
    weather_condition: Optional[str],
    is_festival_day: bool,
) -> list[dict]:
    now = datetime.now(timezone.utc)
    weather_factor = _weather_to_factor(weather_condition)
    festival_boost = 1.35 if is_festival_day else 1.0
    results = []

    for h in range(1, hours_ahead + 1):
        future_ts = now + timedelta(hours=h)
        hour = future_ts.hour

        # Morning puja peak (5-9 AM) & Evening aarti peak (5-9 PM)
        morning_peak = math.exp(-0.5 * ((hour - 7) / 2.2) ** 2)
        evening_peak = math.exp(-0.5 * ((hour - 19) / 2.0) ** 2)
        daily_curve = 0.25 + 0.75 * max(morning_peak, evening_peak)

        # Baseline blend with current density
        decay = math.exp(-0.3 * h)
        current_ratio = current_density / max(max_capacity, 1)
        expected_ratio = (current_ratio * decay) + (daily_curve * (1.0 - decay))

        predicted = int(max_capacity * expected_ratio * weather_factor * festival_boost)
        predicted = max(5, min(predicted, max_capacity))

        margin = max(10, int(predicted * 0.15))
        lower = max(0, predicted - margin)
        upper = min(max_capacity, predicted + margin)

        results.append({
            "timestamp": future_ts,
            "predicted_density": predicted,
            "confidence_lower": lower,
            "confidence_upper": upper,
        })

    return results


class CrowdForecastModel:
    MIN_ROWS_FOR_PROPHET = 10

    def _try_prophet_forecast(
        self,
        df: pd.DataFrame,
        future_df: pd.DataFrame,
        has_weather: bool,
        has_festival: bool,
    ) -> Optional[list[dict]]:
        try:
            from prophet import Prophet

            # Normalize ds column to naive UTC datetime
            train_df = df.copy()
            train_df["ds"] = pd.to_datetime(train_df["ds"], utc=True).dt.tz_localize(None)

            pred_future_df = future_df.copy()
            pred_future_df["ds"] = pd.to_datetime(pred_future_df["ds"], utc=True).dt.tz_localize(None)

            model = Prophet(
                changepoint_prior_scale=0.05,
                seasonality_prior_scale=10.0,
                yearly_seasonality=False,
                weekly_seasonality=True,
                daily_seasonality=True,
                interval_width=0.80,
            )
            if has_weather and "weather_factor" in train_df.columns:
                model.add_regressor("weather_factor", standardize=False)
            if has_festival and "is_festival" in train_df.columns:
                model.add_regressor("is_festival", standardize=False)

            model.fit(train_df)
            forecast = model.predict(pred_future_df)

            results = []
            for i, row in forecast.iterrows():
                predicted = int(max(0, round(row["yhat"])))
                lower = int(max(0, round(row["yhat_lower"])))
                upper = int(max(0, round(row["yhat_upper"])))
                orig_ts = future_df.iloc[i]["ds"]
                if hasattr(orig_ts, "to_pydatetime"):
                    orig_ts = orig_ts.to_pydatetime()
                results.append({
                    "timestamp": orig_ts,
                    "predicted_density": predicted,
                    "confidence_lower": lower,
                    "confidence_upper": upper,
                })
            return results

        except Exception as exc:
            logger.warning("Prophet forecast failed (%s). Falling back to heuristic.", exc)
            return None

    def predict(
        self,
        historical_data: list[dict],
        current_density: int,
        max_capacity: int,
        hours_ahead: int = 6,
        weather_condition: Optional[str] = None,
        is_festival_day: bool = False,
    ) -> list[dict]:
        records = []
        for reading in historical_data:
            ts = reading["timestamp"]
            if isinstance(ts, str):
                ts = datetime.fromisoformat(ts.replace("Z", "+00:00"))
            records.append({
                "ds": ts,
                "y": float(reading["headcount"]),
                "weather_factor": _weather_to_factor(weather_condition),
                "is_festival": 1.0 if is_festival_day else 0.0,
            })

        now_utc = datetime.now(timezone.utc)
        records.append({
            "ds": now_utc,
            "y": float(current_density),
            "weather_factor": _weather_to_factor(weather_condition),
            "is_festival": 1.0 if is_festival_day else 0.0,
        })

        df = pd.DataFrame(records).sort_values("ds").reset_index(drop=True)

        if len(df) >= self.MIN_ROWS_FOR_PROPHET:
            last_ts = df["ds"].iloc[-1]
            future_rows = []
            for h in range(1, hours_ahead + 1):
                future_ts = last_ts + timedelta(hours=h)
                future_rows.append({
                    "ds": future_ts,
                    "weather_factor": _weather_to_factor(weather_condition),
                    "is_festival": 1.0 if is_festival_day else 0.0,
                })
            future_df = pd.DataFrame(future_rows)

            result = self._try_prophet_forecast(
                df=df,
                future_df=future_df,
                has_weather=(weather_condition is not None),
                has_festival=True,
            )
            if result is not None:
                for r in result:
                    r["predicted_density"] = min(r["predicted_density"], max_capacity)
                    r["confidence_lower"] = min(r["confidence_lower"], max_capacity)
                    r["confidence_upper"] = min(r["confidence_upper"], max_capacity)
                return result

        logger.info("Using sinusoidal heuristic forecast (data points: %d)", len(df))
        return _heuristic_forecast(
            current_density=current_density,
            max_capacity=max_capacity,
            hours_ahead=hours_ahead,
            weather_condition=weather_condition,
            is_festival_day=is_festival_day,
        )
