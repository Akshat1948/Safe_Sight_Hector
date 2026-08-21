from __future__ import annotations

import logging
from pathlib import Path
import pandas as pd

logger = logging.getLogger(__name__)

DATA_DIR = Path(__file__).parent / "data"
SAMPLE_CSV = DATA_DIR / "sample_crowd.csv"


def load_sample_data() -> pd.DataFrame:
    if not SAMPLE_CSV.exists():
        from forecast.data.generate_sample import main as gen_data
        gen_data()
    df = pd.read_csv(SAMPLE_CSV, parse_dates=["timestamp"])
    df = df.rename(columns={"timestamp": "ds", "headcount": "y"})
    df["ds"] = pd.to_datetime(df["ds"]).dt.tz_localize(None)
    return df.sort_values("ds").reset_index(drop=True)


def train_and_validate() -> None:
    try:
        from prophet import Prophet
    except ImportError:
        logger.warning("Prophet not installed. Run 'pip install prophet'.")
        return

    df = load_sample_data()
    logger.info("Loaded %d rows from %s", len(df), SAMPLE_CSV)

    model = Prophet(
        changepoint_prior_scale=0.05,
        seasonality_prior_scale=10.0,
        yearly_seasonality=False,
        weekly_seasonality=True,
        daily_seasonality=True,
        interval_width=0.80,
    )
    if "is_festival" in df.columns:
        model.add_regressor("is_festival", standardize=False)
    if "weather_factor" in df.columns:
        model.add_regressor("weather_factor", standardize=False)

    model.fit(df)
    logger.info("Model fitted successfully on %d historical records.", len(df))


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    train_and_validate()
