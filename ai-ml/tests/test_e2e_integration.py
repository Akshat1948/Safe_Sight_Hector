"""
test_e2e_integration.py — End-to-End Cross-Pod Integration Test Suite

Simulates EXACTLY what Ayush's NestJS Backend (Pod B) does when
it proxies requests to the AI/ML FastAPI service (Pod C).

Tests the full chain:
  Backend Weather Proxy  → GET  /ml/weather/current
  Backend Hazard Eval    → POST /ml/weather/hazards
  Backend Zone Forecast  → POST /ml/forecast
  Backend Anomaly Trigger→ POST /ml/anomaly/detect
  Backend Bhashini Proxy → POST /ml/bhashini/translate
"""
import csv
import sys
import json
from pathlib import Path
from datetime import datetime, timezone

sys.path.insert(0, str(Path(__file__).parent.parent))

from fastapi.testclient import TestClient
from api.main import app

client = TestClient(app)

PASSED = 0
FAILED = 0

def check(name, condition, detail=""):
    global PASSED, FAILED
    if condition:
        PASSED += 1
        print(f"  [PASS] {name}")
    else:
        FAILED += 1
        print(f"  [FAIL] {name} — {detail}")


# ─────────────────────────────────────────────────
# Test 1: Backend Weather Proxy → GET /ml/weather/current
# Mirrors: backend/src/modules/weather/weather.service.ts line 60
# ─────────────────────────────────────────────────
def test_backend_weather_proxy():
    print("\n[1/5] Backend Weather Proxy → GET /ml/weather/current")
    r = client.get("/ml/weather/current?site_lat=25.4358&site_lon=81.8463")
    check("Status 200", r.status_code == 200, f"Got {r.status_code}")
    d = r.json()
    check("success=True", d.get("success") is True)
    w = d.get("data", {})
    check("Has temperature", "temperature" in w)
    check("Has humidity", "humidity" in w)
    check("Has wind_speed", "wind_speed" in w)
    check("Has condition", "condition" in w)
    check("Has precipitation", "precipitation" in w)
    check("Has 24h forecast", len(w.get("forecast_24h", [])) == 24)


# ─────────────────────────────────────────────────
# Test 2: Backend Hazard Evaluator → POST /ml/weather/hazards
# Mirrors: backend/src/modules/weather/weather.service.ts line 72
# ─────────────────────────────────────────────────
def test_backend_hazard_eval():
    print("\n[2/5] Backend Hazard Evaluator → POST /ml/weather/hazards")
    body = {
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
    r = client.post("/ml/weather/hazards", json=body)
    check("Status 200", r.status_code == 200, f"Got {r.status_code}")
    d = r.json()
    check("success=True", d.get("success") is True)
    h = d.get("data", {})
    check("Has hazard_level", h.get("hazard_level") in ["low", "moderate", "high", "severe"])
    check("Has hazard_type", h.get("hazard_type") is not None)
    check("Has advisory text", len(h.get("advisory", "")) > 10)


# ─────────────────────────────────────────────────
# Test 3: Backend Zone Forecast → POST /ml/forecast
# Mirrors: backend/src/modules/zones/zones.service.ts getZoneForecast()
# ─────────────────────────────────────────────────
def test_backend_zone_forecast():
    print("\n[3/5] Backend Zone Forecast → POST /ml/forecast")
    sample_csv = Path(__file__).parent.parent / "forecast" / "data" / "sample_crowd.csv"
    historical = []
    with open(sample_csv, mode="r") as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader):
            if i >= 48:
                break
            historical.append({
                "timestamp": row["timestamp"],
                "headcount": int(row["headcount"]),
            })
    body = {
        "zone_id": "zone-ghat-c",
        "site_id": "site-kumbh",
        "current_density": 380,
        "max_capacity": 500,
        "hours_ahead": 6,
        "weather_condition": "partly_cloudy",
        "is_festival_day": False,
        "historical_data": historical,
    }
    r = client.post("/ml/forecast", json=body)
    check("Status 200", r.status_code == 200, f"Got {r.status_code}")
    d = r.json()
    check("success=True", d.get("success") is True)
    f = d.get("data", {})
    check("zone_id matches", f.get("zone_id") == "zone-ghat-c")
    check("Has 6 forecast points", len(f.get("forecasts", [])) == 6)
    check("Has peak_density", f.get("peak_density", 0) > 0)
    check("Has model_version", f.get("model_version") is not None)


# ─────────────────────────────────────────────────
# Test 4: Anomaly/Crush Precursor Detection → POST /ml/anomaly/detect
# Mirrors: what Akshat's incident module would call on density spike
# ─────────────────────────────────────────────────
def test_anomaly_crush_precursor():
    print("\n[4/5] Anomaly Crush Precursor → POST /ml/anomaly/detect")
    body = {
        "zone_id": "zone-ghat-c",
        "readings": [
            {"timestamp": "2026-08-25T10:00:00", "headcount": 350, "flow_rate": 12.0, "flow_velocity": 0.8},
            {"timestamp": "2026-08-25T10:05:00", "headcount": 380, "flow_rate": 10.0, "flow_velocity": 0.6},
            {"timestamp": "2026-08-25T10:10:00", "headcount": 410, "flow_rate": 7.0, "flow_velocity": 0.4},
            {"timestamp": "2026-08-25T10:15:00", "headcount": 440, "flow_rate": 4.0, "flow_velocity": 0.2},
            {"timestamp": "2026-08-25T10:20:00", "headcount": 470, "flow_rate": 2.0, "flow_velocity": 0.1},
            {"timestamp": "2026-08-25T10:25:00", "headcount": 485, "flow_rate": 1.0, "flow_velocity": 0.05},
        ],
        "max_capacity": 500,
        "zone_type": "high_risk",
    }
    r = client.post("/ml/anomaly/detect", json=body)
    check("Status 200", r.status_code == 200, f"Got {r.status_code}")
    d = r.json()
    check("success=True", d.get("success") is True)
    a = d.get("data", {})
    check("Has is_anomaly field", "is_anomaly" in a)
    check("Has severity field", "severity" in a)
    check("Has recommended_action", "recommended_action" in a or "message" in a)


# ─────────────────────────────────────────────────
# Test 5: Bhashini Translation → POST /ml/bhashini/translate
# Mirrors: multilingual alert broadcast via backend
# ─────────────────────────────────────────────────
def test_bhashini_translate():
    print("\n[5/5] Bhashini Translation → POST /ml/bhashini/translate")
    body = {
        "text": "Zone C staircase is overcrowded. Please use the north exit.",
        "source_language": "en",
        "target_language": "hi",
    }
    r = client.post("/ml/bhashini/translate", json=body)
    check("Status 200", r.status_code == 200, f"Got {r.status_code}")
    d = r.json()
    check("success=True", d.get("success") is True)
    t = d.get("data", {})
    check("Has translated_text", len(t.get("translated_text", "")) > 0)


if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("  SafeSight Cross-Pod E2E Integration Test Suite")
    print("  Simulates NestJS Backend → FastAPI AI/ML calls")
    print("=" * 60)

    test_backend_weather_proxy()
    test_backend_hazard_eval()
    test_backend_zone_forecast()
    test_anomaly_crush_precursor()
    test_bhashini_translate()

    print("\n" + "=" * 60)
    print(f"  RESULTS: {PASSED} passed, {FAILED} failed out of {PASSED + FAILED}")
    print("=" * 60 + "\n")

    if FAILED > 0:
        sys.exit(1)
