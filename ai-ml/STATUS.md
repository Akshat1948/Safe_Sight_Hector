# Pod C — AI/ML STATUS LOG

> **Last updated:** 2026-08-23 22:30 by Diya

---

## COMPLETED

| # | Feature | Files | Done By | Date | Notes |
|---|---------|-------|---------|------|-------|
| 1 | Python venv + dependencies | `requirements.txt`, `venv/` | Diya | Aug 21 | Python 3.14 compatible. fastapi, pydantic v2, scikit-learn, numpy, httpx, uvicorn |
| 2 | Shared Pydantic v2 schemas | `shared/schemas.py` | Diya | Aug 21 | All schemas per MASTER.md s10 |
| 3 | Shared config | `shared/config.py` | Diya | Aug 21 | All env vars per MASTER.md s11 |
| 4 | Anomaly pattern rules | `anomaly/patterns.py` | Diya | Aug 21 | 4 patterns: crush_precursor (2-tier), reverse_flow, stationary_crowd, density_spike |
| 5 | Isolation Forest detector | `anomaly/detector.py` | Diya | Aug 21 | Fits IsolationForest on window, scores latest reading, applies pattern overlay |
| 6 | Simulated anomaly datasets | `anomaly/data/` | Diya | Aug 21 | 3 datasets: normal (20), crush_precursor (20), reverse_flow (20) |
| 7 | Anomaly FastAPI router | `api/anomaly_routes.py` | Diya | Aug 21 | POST /ml/anomaly/detect — exact contract per MASTER.md s6.3 |
| 8 | Multilingual Translator Feature | `translator/translate.py` | Diya | Aug 23 | Renamed from Bhashini -> Translator. Uses MyMemory open translation engine across 13 Indian languages |
| 9 | Translation FastAPI router | `api/translation_routes.py` | Diya | Aug 23 | Primary route: POST /ml/translate. Supports legacy alias /ml/bhashini/translate |
| 10 | Router registration in main.py | `api/main.py` | Shreyashi & Diya | Aug 23 | Registered translation_router under /ml |
| 11 | STATUS files updated | `ai-ml/STATUS.md`, `STATUS.md` | Diya | Aug 23 | Clear naming and instructions for team |

---

## IN PROGRESS

Nothing in progress — all Diya modules complete and live tested.

---

## PENDING / TODO

| # | Feature | Priority | Assigned To | Notes |
|---|---------|----------|-------------|-------|
| 1 | Integration with Backend POST /api/incidents | HIGH | Akshat + Diya | Anomaly endpoint triggers incident creation |

---

## ARCHITECTURE DECISIONS

| # | Decision | Why | By | Date |
|---|---------|-----|----|------|
| 1 | Renamed feature to Multilingual Translator | Since Bhashini portal registration was unavailable, using MyMemory open translation engine. Renamed to remove confusion across pods | Diya | Aug 23 |
| 2 | Backward-compatible route aliases | Main route is /ml/translate, with legacy /ml/bhashini/translate alias so Frontend/Backend never break | Diya | Aug 23 |
| 3 | Isolation Forest fitted on incoming window | No pre-labeled crush data. IF is unsupervised, works on small batches | Diya | Aug 21 |
| 4 | TTS/STT removed from scope | Audio synthesis unstable; pure text translation provides 100% demo stability | Diya | Aug 23 |

---

## FILE MAP

`
ai-ml/
├── shared/
│   ├── schemas.py          — Pydantic models
│   └── config.py           — Constants & settings
├── anomaly/
│   ├── detector.py         — IsolationForest engine. Entry: detect(request)
│   ├── patterns.py         — Rule-based classifier: 4 pattern types
│   └── data/               — Simulated JSON datasets
├── translator/
│   ├── translate.py        — MyMemory 13-language translation engine
│   └── __init__.py
├── api/
│   ├── anomaly_routes.py     — POST /ml/anomaly/detect
│   └── translation_routes.py — POST /ml/translate (and /ml/bhashini/translate)
├── .env                    — Env settings
└── requirements.txt        — Dependencies
`

---

## LIVE ENDPOINTS (Port 8000)

| Endpoint | Method | Description |
|---|---|---|
| /ml/translate | POST | Primary translation across 13 Indian languages |
| /ml/bhashini/translate | POST | Backward-compatible alias for existing frontend/backend calls |
| /ml/anomaly/detect | POST | Crowd anomaly & crush precursor detection |
| /ml/forecast | POST | Shreyashi crowd forecast |
| /ml/weather/current | GET | Shreyashi weather current |
| /ml/health | GET | AI/ML service health |