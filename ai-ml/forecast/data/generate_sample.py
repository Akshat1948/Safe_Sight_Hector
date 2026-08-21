from __future__ import annotations

import math
import random
from datetime import datetime, timedelta, timezone
from pathlib import Path
import pandas as pd

OUTPUT_PATH = Path(__file__).parent / "sample_crowd.csv"
MAX_CAPACITY = 500
START_DATE = datetime(2026, 7, 1, 0, 0, 0, tzinfo=timezone.utc)
DAYS = 21
FESTIVAL_DAYS = {3, 10, 17}

CONDITIONS = [
    ("clear", 1.0, 0.25),
    ("partly_cloudy", 0.95, 0.25),
    ("cloudy", 0.85, 0.20),
    ("drizzle", 0.75, 0.15),
    ("rain", 0.55, 0.10),
    ("thunderstorm", 0.20, 0.05),
]
COND_WEIGHTS = [c[2] for c in CONDITIONS]


def daily_crowd_pattern(hour: int) -> float:
    morning = math.exp(-0.5 * ((hour - 7) / 2.5) ** 2)
    evening = math.exp(-0.5 * ((hour - 19) / 2.0) ** 2)
    night_base = 0.08
    return night_base + 0.92 * max(morning, evening)


def main() -> None:
    random.seed(42)
    rows = []
    current_dt = START_DATE

    for day_offset in range(DAYS):
        day_of_week = current_dt.weekday()
        is_festival = day_offset in FESTIVAL_DAYS
        is_monday = (day_of_week == 0)

        cond_idx = random.choices(range(len(CONDITIONS)), weights=COND_WEIGHTS, k=1)[0]
        condition, weather_factor, _ = CONDITIONS[cond_idx]

        festival_boost = random.uniform(2.0, 2.8) if is_festival else 1.0
        monday_boost = random.uniform(1.3, 1.5) if is_monday else 1.0
        day_multiplier = festival_boost * monday_boost * weather_factor

        for hour in range(24):
            ts = current_dt + timedelta(hours=hour)
            pattern = daily_crowd_pattern(hour)
            base_headcount = MAX_CAPACITY * pattern * day_multiplier
            noise = random.gauss(0, max(5, base_headcount * 0.06))
            headcount = max(5, min(MAX_CAPACITY, int(base_headcount + noise)))

            rows.append({
                "timestamp": ts.isoformat(),
                "headcount": headcount,
                "is_festival": 1 if is_festival else 0,
                "weather_factor": round(weather_factor, 2),
                "condition": condition,
            })

        current_dt += timedelta(days=1)

    df = pd.DataFrame(rows)
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(OUTPUT_PATH, index=False)
    print(f"Sample data generated at {OUTPUT_PATH} ({len(df)} rows)")


if __name__ == "__main__":
    main()
