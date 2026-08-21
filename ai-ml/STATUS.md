# Pod C (AI/ML) — STATUS LOG

> **Last updated:** 2026-08-21 17:05 by Shreyashi

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

## ?? IN PROGRESS

| # | Feature / Task | Files Being Touched | Being Done By | Approach / Notes |
|---|---------------|--------------------|--------------|-----------------|
| 1 | Anomaly Detection (Crush Precursor) | `anomaly/detector.py`, `anomaly/patterns.py` | Diya | Isolation Forest + Flow Velocity analysis |
| 2 | Bhashini Translation & Voice Services | `bhashini/translate.py`, `bhashini/tts.py`, `bhashini/stt.py` | Diya | Bhashini ULCA API integration |

---

## ?? PENDING / TODO

| # | Feature / Task | Priority | Assigned To | Dependencies |
|---|---------------|----------|-------------|-------------|
| 1 | Register Anomaly & Bhashini routes in `api/main.py` | HIGH | Diya | Anomaly detector & Bhashini client complete |
| 2 | Dockerfile for AI/ML service | MEDIUM | Shreyashi | Endpoints finalized |
| 3 | Cross-pod backend integration test | HIGH | Shreyashi & Ayush | Backend zones & weather proxy live |

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
| 1 | Implemented `POST /ml/forecast`, `GET /ml/weather/current`, `POST /ml/weather/hazards` | None (Unimplemented) | Live & Tested against MASTER.md contracts | Backend (Ayush / Pod B) | ? Yes |

---

## ?? FILE MAP

```
ai-ml/
+-- api/
¦   +-- __init__.py
¦   +-- main.py                  — FastAPI app entry point & router aggregation
¦   +-- forecast_routes.py       — POST /ml/forecast endpoint
¦   +-- weather_routes.py        — GET /ml/weather/current & POST /ml/weather/hazards
+-- forecast/
¦   +-- __init__.py
¦   +-- model.py                 — Prophet forecasting model with fallback
¦   +-- predict.py               — Inference handler and color-coded status mapping
¦   +-- train.py                 — Model fitting & cross-validation script
¦   +-- data/
¦       +-- generate_sample.py   — Synthetic pilgrimage crowd dataset generator
¦       +-- sample_crowd.csv     — 21-day hourly crowd dataset (504 rows)
+-- weather/
¦   +-- __init__.py
¦   +-- imd_client.py            — IMD weather client with simulation & caching
¦   +-- hazard_overlay.py        — Multi-hazard scoring (flood, landslide, lightning, heat)
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
