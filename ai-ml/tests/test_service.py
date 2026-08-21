import csv
import sys
from pathlib import Path
from datetime import datetime, timezone
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).parent.parent))

from api.main import app
from shared.schemas import ForecastRequest, HazardRequest

client = TestClient(app)


def test_health():
    response = client.get("/ml/health")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["status"] == "ok"
    print(" [PASS] Health check endpoint (/ml/health)")


def test_forecast_endpoint_heuristic():
    req_body = {
        "zone_id": "zone-123",
        "site_id": "site-456",
        "current_density": 320,
        "max_capacity": 500,
        "hours_ahead": 6,
        "weather_condition": "rain",
        "is_festival_day": False,
        "historical_data": [
            {"timestamp": "2026-08-21T10:00:00Z", "headcount": 250},
            {"timestamp": "2026-08-21T11:00:00Z", "headcount": 280},
            {"timestamp": "2026-08-21T12:00:00Z", "headcount": 310},
        ],
    }
    response = client.post("/ml/forecast", json=req_body)
    assert response.status_code == 200
    res = response.json()
    assert res["success"] is True
    assert "data" in res
    assert res["data"]["zone_id"] == "zone-123"
    assert len(res["data"]["forecasts"]) == 6
    assert res["data"]["model_version"] == "prophet-v1"
    print(" [PASS] Forecast endpoint - Heuristic fallback (< 10 points)")


def test_forecast_endpoint_prophet():
    sample_csv_path = Path(__file__).parent.parent / "forecast" / "data" / "sample_crowd.csv"
    historical = []
    with open(sample_csv_path, mode="r") as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader):
            if i >= 24:
                break
            historical.append({
                "timestamp": row["timestamp"],
                "headcount": int(row["headcount"]),
            })

    req_body = {
        "zone_id": "zone-ghat-c",
        "site_id": "site-kumbh",
        "current_density": 380,
        "max_capacity": 500,
        "hours_ahead": 6,
        "weather_condition": "partly_cloudy",
        "is_festival_day": True,
        "historical_data": historical,
    }
    response = client.post("/ml/forecast", json=req_body)
    assert response.status_code == 200
    res = response.json()
    assert res["success"] is True
    assert "data" in res
    assert res["data"]["zone_id"] == "zone-ghat-c"
    assert len(res["data"]["forecasts"]) == 6
    assert res["data"]["peak_density"] > 0
    print(" [PASS] Forecast endpoint - Prophet model (> 10 points)")


def test_weather_current_endpoint():
    response = client.get("/ml/weather/current?site_lat=25.4358&site_lon=81.8463")
    assert response.status_code == 200
    res = response.json()
    assert res["success"] is True
    assert "temperature" in res["data"]
    assert "forecast_24h" in res["data"]
    assert len(res["data"]["forecast_24h"]) == 24
    print(" [PASS] Weather current endpoint (GET /ml/weather/current)")


def test_weather_hazard_endpoint():
    req_body = {
        "site_id": "site-kumbh",
        "weather": {
            "temperature": 28.5,
            "humidity": 80,
            "wind_speed": 15.0,
            "precipitation": 55.0,
            "condition": "thunderstorm",
        },
        "site_features": {
            "has_river": True,
            "has_slopes": False,
            "elevation_m": 120,
        },
    }
    response = client.post("/ml/weather/hazards", json=req_body)
    assert response.status_code == 200
    res = response.json()
    assert res["success"] is True
    assert res["data"]["hazard_level"] in ["moderate", "high", "severe"]
    assert res["data"]["hazard_type"] == "flood"
    assert "advisory" in res["data"]
    print(" [PASS] Weather hazards endpoint (POST /ml/weather/hazards)")


if __name__ == "__main__":
    print("\n--- Running SafeSight AI/ML Service Full Test Suite ---")
    test_health()
    test_forecast_endpoint_heuristic()
    test_forecast_endpoint_prophet()
    test_weather_current_endpoint()
    test_weather_hazard_endpoint()
    print("\n ALL ENDPOINTS AND PROPHET INFERENCE TESTS PASSED! \n")
