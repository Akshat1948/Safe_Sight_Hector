# Pod C (AI/ML) — STATUS LOG

> **Last updated:** 2026-08-21 19:05 by Shreyashi

---

## ?? COMPLETED

| # | Feature / Task | Files Created/Modified | Done By | Date | Notes |
|---|---------------|----------------------|---------|------|-------|
| 1 | Pydantic v2 schemas & shared config | `shared/schemas.py`, `shared/config.py` | Shreyashi | Aug 21 | All Pydantic v2 schemas from MASTER.md Section 10 & 11 |
| 2 | Crowd forecasting model & training pipeline | `forecast/model.py`, `forecast/train.py`, `forecast/predict.py` | Shreyashi | Aug 21 | Prophet model with holiday/festival regressors & sinusoidal heuristic fallback |
| 3 | Synthetic crowd dataset generator | `forecast/data/generate_sample.py`, `forecast/data/sample_crowd.csv` | Shreyashi | Aug 21 | 21-day hourly dataset with temple peak curves (504 observations) |
| 4 | IMD weather client & hazard scoring logic | `weather/imd_client.py`, `weather/hazard_overlay.py` | Shreyashi | Aug 21 | Multi-hazard overlay (flood, landslide, lightning, heat) with cache & realistic fallback |
| 5 | FastAPI app & routers setup | `api/main.py`, `api/forecast_routes.py`, `api/weather_routes.py` | Shreyashi | Aug 21 | Port 8000, prefix `/ml`, CORS configured for port 3000 & 3001 |
| 6 | Integration test suite | `tests/test_service.py` | Shreyashi | Aug 21 | Full validation of health, forecast, weather current, and hazard assessment endpoints |

---

## ?? IN PROGRESS / UPCOMING ACTION ITEMS FOR TEAMMATES

### ?? For Diya (Pod C — AI/ML Partner)
| # | Task | Files to Create / Touch | Target Date | Notes |
|---|------|------------------------|-------------|-------|
| 1 | Build Crush Precursor / Anomaly Detection | `ai-ml/anomaly/detector.py`, `ai-ml/anomaly/patterns.py` | Aug 22 (Day 3) | Use Isolation Forest / flow velocity thresholds against `shared/schemas.py` |
| 2 | Build Bhashini Voice & Translation Integration | `ai-ml/bhashini/translate.py`, `ai-ml/bhashini/tts.py`, `ai-ml/bhashini/stt.py` | Aug 22 (Day 3) | Integration with Bhashini ULCA API for Indic languages |
| 3 | Create Anomaly & Bhashini API Routes | `ai-ml/api/anomaly_routes.py`, `ai-ml/api/bhashini_routes.py` | Aug 22 (Day 3) | Expose `POST /ml/anomaly/detect` and `POST /ml/bhashini/*` |
| 4 | Register Routers in FastAPI Entrypoint | `ai-ml/api/main.py` | Aug 22 (Day 3) | Uncomment Diya's router imports and `app.include_router(...)` lines |
| 5 | Review Shreyashi's PR & open own PR | GitHub PR `pod-c/forecast-model` ? `develop` | Aug 22 (Day 3) | Cross-review Pod C code |

### ?? For Ayush (Pod B — Backend Lead)
| # | Task | Target Date | Notes / Integration Contract |
|---|------|-------------|------------------------------|
| 1 | Connect Backend Weather Proxy to AI/ML | Aug 22–23 | Call `GET http://localhost:8000/ml/weather/current?site_lat={lat}&site_lon={lon}` from NestJS backend |
| 2 | Connect Zone Forecast Service to AI/ML | Aug 22–23 | Call `POST http://localhost:8000/ml/forecast` passing historical density readings to receive 6h forecasts |
| 3 | Connect Site Hazard Evaluation to AI/ML | Aug 22–23 | Call `POST http://localhost:8000/ml/weather/hazards` to evaluate live environmental risks |
| 4 | Finalize Zone & Geofence CRUD | Aug 22 (Day 3) | Needed for Frontend map rendering and AI/ML zone ID matching |

---

## ?? PENDING / TODO

| # | Feature / Task | Priority | Assigned To | Dependencies |
|---|---------------|----------|-------------|-------------|
| 1 | Dockerfile for AI/ML service | MEDIUM | Shreyashi | Service tested |
| 2 | Cross-pod end-to-end integration testing | HIGH | Shreyashi, Ayush, Diya | Backend proxies live on Day 4 |

---

## ?? ARCHITECTURE DECISIONS

| # | Decision | Why | Decided By | Date |
|---|---------|-----|-----------|------|
| 1 | Prophet as primary forecaster with sinusoidal heuristic fallback | Ensures robust API responses (<10 data points or fitting issues gracefully handled) | Shreyashi | Aug 21 |
| 2 | Rule-based hazard assessment matrix | Fast, deterministic, explainable multi-hazard scoring (flood, landslide, lightning, heat) without requiring external training datasets | Shreyashi | Aug 21 |
| 3 | In-memory 10-min cache on weather data | Prevents hitting external IMD rate limits while maintaining freshness | Shreyashi | Aug 21 |

---

## ?? INTERFACE CHANGES (CROSS-POD IMPACT)

| # | What Changed | Old | New | Affects | Notified? |
|---|-------------|-----|-----|---------|----------|
| 1 | Implemented `POST /ml/forecast`, `GET /ml/weather/current`, `POST /ml/weather/hazards` | None (Unimplemented) | Live & Tested against MASTER.md contracts on port 8000 | Backend (Ayush / Pod B) | ? Yes |

---

## ?? FILE MAP

```
ai-ml/
+-- api/
¦   +-- __init__.py
¦   +-- main.py                  — FastAPI app entry point & router aggregation
¦   +-- forecast_routes.py       — POST /ml/forecast endpoint (Shreyashi)
¦   +-- weather_routes.py        — GET /ml/weather/current & POST /ml/weather/hazards (Shreyashi)
¦   +-- anomaly_routes.py        — (Reserved for Diya)
¦   +-- bhashini_routes.py       — (Reserved for Diya)
+-- forecast/
¦   +-- __init__.py
¦   +-- model.py                 — Prophet forecasting model with fallback (Shreyashi)
¦   +-- predict.py               — Inference handler and color-coded status mapping (Shreyashi)
¦   +-- train.py                 — Model fitting & cross-validation script (Shreyashi)
¦   +-- data/
¦       +-- generate_sample.py   — Synthetic pilgrimage crowd dataset generator
¦       +-- sample_crowd.csv     — 21-day hourly crowd dataset (504 rows)
+-- weather/
¦   +-- __init__.py
¦   +-- imd_client.py            — IMD weather client with simulation & caching (Shreyashi)
¦   +-- hazard_overlay.py        — Multi-hazard scoring (flood, landslide, lightning, heat) (Shreyashi)
+-- anomaly/                     — (Reserved for Diya)
+-- bhashini/                    — (Reserved for Diya)
+-- shared/
¦   +-- __init__.py
¦   +-- config.py                — Configuration & environment variable access
¦   +-- schemas.py               — Pydantic v2 data contracts
+-- tests/
¦   +-- __init__.py
¦   +-- test_service.py          — Full integration test suite
+-- requirements.txt             — Pinned dependencies
+-- .env                         — Local environment variables
+-- STATUS.md                    — Pod C status log
```

---

## ?? KNOWN ISSUES

| # | Issue | Severity | Workaround | Filed By |
|---|-------|----------|-----------|----------|
| 1 | IMD public REST API URL is placeholder | Low | Client automatically uses realistic monsoon weather generator fallback | Shreyashi |
