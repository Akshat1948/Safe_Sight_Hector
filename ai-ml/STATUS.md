# Pod C — AI/ML STATUS LOG

> **Last updated:** 2026-08-21 17:43 by Diya

---

## COMPLETED

| # | Feature / Task | Files Created/Modified | Done By | Date | Notes |
|---|---------------|----------------------|---------|------|-------|
| 1 | Shared Pydantic v2 schemas | `shared/schemas.py` | Diya | Aug 21 | All schemas per MASTER.md Section 10: AnomalyRequest/Response, TranslateRequest/Response, TTSRequest/Response, STTRequest/Response, ApiEnvelope |
| 2 | Shared config | `shared/config.py` | Diya | Aug 21 | All env vars per MASTER.md Section 11: BHASHINI_*, BACKEND_API_URL, DENSITY_THRESHOLDS, SUPPORTED_LANGUAGES |
| 3 | Anomaly pattern definitions | `anomaly/patterns.py` | Diya | Aug 21 | 4 patterns: crush_precursor (2-tier), reverse_flow, stationary_crowd, density_spike. Two-tier crush precursor catches run-up phase (>=70% + decelerating + slow) |
| 4 | Isolation Forest detector | `anomaly/detector.py` | Diya | Aug 21 | Fits IsolationForest on incoming window, scores latest reading, applies pattern overlay. Uses trailing 5-reading window for pattern stats |
| 5 | Anomaly sample datasets | `anomaly/data/generate_samples.py`, `anomaly/data/normal_readings.json`, `anomaly/data/crush_precursor_readings.json`, `anomaly/data/reverse_flow_readings.json` | Diya | Aug 21 | Simulated datasets for demo and testing |
| 6 | Anomaly FastAPI router | `api/anomaly_routes.py` | Diya | Aug 21 | POST /ml/anomaly/detect — exact contract per MASTER.md Section 6.3 |
| 7 | Bhashini translate wrapper | `bhashini/translate.py` | Diya | Aug 21 | Two-step Bhashini flow: /pipeline/config then /pipeline/predict. Graceful fallback if keys not set |
| 8 | Bhashini TTS wrapper | `bhashini/tts.py` | Diya | Aug 21 | Returns base64 WAV. Silent WAV stub fallback for dev |
| 9 | Bhashini STT wrapper | `bhashini/stt.py` | Diya | Aug 21 | ASR pipeline, returns text + confidence. Stub fallback if unconfigured |
| 10 | Bhashini FastAPI router | `api/bhashini_routes.py` | Diya | Aug 21 | POST /ml/bhashini/translate, /tts, /stt — exact contracts per MASTER.md Section 6.4 |
| 11 | Python venv + deps | `requirements.txt`, `venv/` | Diya | Aug 21 | Python 3.14 compatible: fastapi 0.141.1, pydantic 2.13.4, scikit-learn 1.9.0, numpy 2.5.2, pandas 3.0.5, httpx 0.28.1 |

---

## IN PROGRESS

| # | Feature / Task | Files Being Touched | Being Done By | Approach / Notes |
|---|---------------|--------------------|--------------|-----------------| 
| — | — | — | — | — |

> No files currently in progress.

---

## PENDING / TODO

| # | Feature / Task | Priority | Assigned To | Dependencies |
|---|---------------|----------|-------------|-------------|
| 1 | Register anomaly + bhashini routers in main.py | HIGH | Shreyashi | Shreyashi must add `include_router` calls in `api/main.py` |
| 2 | Fill BHASHINI_API_KEY + BHASHINI_USER_ID in .env | HIGH | Diya | Need team Bhashini API credentials from MeitY dashboard |
| 3 | Integration test with Backend (POST /ml/anomaly/detect end-to-end) | HIGH | Diya + Akshat | Needs Akshat's incidents endpoint live |
| 4 | Stationary crowd + reverse flow scenario tests | MEDIUM | Diya | Can do independently |

---

## ARCHITECTURE DECISIONS

| # | Decision | Why | Decided By | Date |
|---|---------|-----|-----------|------|
| 1 | Isolation Forest fitted on incoming window (self-calibrating) | No pre-labeled crush data available at hackathon; IF is unsupervised and works on small batches | Diya | Aug 21 |
| 2 | Two-tier crush precursor pattern | Trailing 5-reading window average is below peak, so a second tier (>=70% + both decel + slow) catches dangerous run-up phase | Diya | Aug 21 |
| 3 | Trailing 5-reading window for pattern stats | Current zone state matters more than historical average for real-time anomaly classification | Diya | Aug 21 |
| 4 | Graceful fallback when Bhashini keys not set | Allows local dev and demo without live API credentials; returns clearly marked stub responses | Diya | Aug 21 |

---

## INTERFACE CHANGES (CROSS-POD IMPACT)

| # | What Changed | Old | New | Affects | Notified? |
|---|-------------|-----|-----|---------|----------|
| — | No contract changes — all endpoints follow MASTER.md exactly | — | — | — | — |

---

## FILE MAP

```
ai-ml/
├── shared/
│   ├── schemas.py         — All Pydantic v2 request/response models (per MASTER.md Section 10)
│   └── config.py          — All env vars and constants (per MASTER.md Section 11)
│
├── anomaly/
│   ├── detector.py        — IsolationForest detection engine, main entry: detect(request)
│   ├── patterns.py        — Rule-based pattern classifier: crush_precursor, reverse_flow, stationary, spike
│   └── data/
│       ├── generate_samples.py          — Script to regenerate sample datasets
│       ├── normal_readings.json         — 20 normal crowd readings
│       ├── crush_precursor_readings.json — 20 crush scenario readings
│       └── reverse_flow_readings.json   — 20 reverse flow readings
│
├── bhashini/
│   ├── translate.py       — Bhashini translate API wrapper: translate(request)
│   ├── tts.py             — Bhashini TTS API wrapper: text_to_speech(request)
│   └── stt.py             — Bhashini ASR API wrapper: speech_to_text(request)
│
├── api/
│   ├── anomaly_routes.py  — FastAPI router: POST /ml/anomaly/detect
│   └── bhashini_routes.py — FastAPI router: POST /ml/bhashini/translate, /tts, /stt
│
├── .env                   — Env vars (not committed) — fill BHASHINI_API_KEY + USER_ID
├── requirements.txt       — Python 3.14-compatible dependencies
└── venv/                  — Virtual environment
```

---

## KNOWN ISSUES

| # | Issue | Severity | Workaround | Filed By |
|---|-------|----------|-----------|----------|
| 1 | Bhashini API keys not yet configured | Medium | Endpoints return clearly-labelled stub responses | Diya |
| 2 | Git not installed on dev machine | Low | Code downloaded via GitHub API; will commit once Git installed | Diya |