# Pod C — AI/ML STATUS LOG

> **Last updated:** 2026-08-23 19:37 by Diya

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
| 8 | Translation wrapper | `bhashini/translate.py` | Diya | Aug 23 | Bhashini primary + MyMemory free fallback. Live tested 5 languages |
| 9 | Bhashini FastAPI router | `api/bhashini_routes.py` | Diya | Aug 23 | POST /ml/bhashini/translate only. TTS/STT removed from scope |
| 10 | Router registration in main.py | `api/main.py` | Shreyashi | Aug 23 | Shreyashi uncommented Diya's 4 router lines |
| 11 | Merge develop into branch | — | Diya | Aug 23 | Resolved conflicts in requirements.txt and STATUS files |
| 12 | LIVE endpoint verification | — | Diya | Aug 23 | All 3 endpoints return 200. Server running on port 8000. Docs at http://127.0.0.1:8000/docs |
| 13 | STATUS files updated | `ai-ml/STATUS.md`, `STATUS.md` | Diya | Aug 23 | Both updated and pushed |

---

## IN PROGRESS

Nothing in progress — all Diya modules complete and live tested.

---

## PENDING / TODO

| # | Feature | Priority | Assigned To | Notes |
|---|---------|----------|-------------|-------|
| 1 | Integration with Backend POST /api/incidents | HIGH | Akshat + Diya | Anomaly endpoint needs to trigger incident creation |
| 2 | Bhashini API keys | MEDIUM | Team | Optional — MyMemory fallback covers demo |

---

## ARCHITECTURE DECISIONS

| # | Decision | Why | By | Date |
|---|---------|-----|----|------|
| 1 | Isolation Forest fitted on incoming window | No pre-labeled crush data. IF is unsupervised, works on small batches | Diya | Aug 21 |
| 2 | Two-tier crush precursor pattern | Trailing 5-window avg is below peak — second tier catches dangerous run-up phase | Diya | Aug 21 |
| 3 | MyMemory as translation fallback | Bhashini login unavailable. MyMemory is free, no key, supports 13 Indian languages | Diya | Aug 23 |
| 4 | TTS/STT removed from scope | Audio quality issues during testing. Text translation covers demo requirement | Diya | Aug 23 |

---

## INTERFACE CHANGES

| # | What Changed | Old | New | Affects |
|---|-------------|-----|-----|---------|
| 1 | TTS endpoint removed | POST /ml/bhashini/tts | Removed | Frontend language toggle only needs translate |
| 2 | STT endpoint removed | POST /ml/bhashini/stt | Removed | No frontend dependency built yet |

---

## FILE MAP

`
ai-ml/
├── shared/
│   ├── schemas.py        — All Pydantic v2 models (MASTER.md s10)
│   └── config.py         — Env vars and constants (MASTER.md s11)
├── anomaly/
│   ├── detector.py       — IsolationForest engine. Entry: detect(request)
│   ├── patterns.py       — Rule-based classifier: 4 pattern types
│   └── data/             — 3 simulated JSON datasets
├── bhashini/
│   ├── translate.py      — Bhashini + MyMemory fallback. Entry: translate(request)
│   ├── tts.py            — NOT IN USE (removed from scope)
│   └── stt.py            — NOT IN USE (removed from scope)
├── api/
│   ├── anomaly_routes.py   — POST /ml/anomaly/detect
│   └── bhashini_routes.py  — POST /ml/bhashini/translate
├── .env                  — Env vars (not committed)
└── requirements.txt      — Python 3.14 compatible deps (prophet>=1.1.5 added by Shreyashi)
`

---

## LIVE ENDPOINT STATUS (as of Aug 23)

Server: `uvicorn api.main:app --host 0.0.0.0 --port 8000`
Docs:   http://127.0.0.1:8000/docs

| Endpoint | HTTP | Status | Response |
|----------|------|--------|----------|
| /ml/health | GET | 200 OK | {success: true, status: ok} |
| /ml/anomaly/detect | POST | 200 OK | is_anomaly, anomaly_type, confidence_score, severity |
| /ml/bhashini/translate | POST | 200 OK | translated_text in target language |
| /ml/forecast | POST | 200 OK | Shreyashi's endpoint |
| /ml/weather/current | GET | 200 OK | Shreyashi's endpoint |

---

## KNOWN ISSUES

| # | Issue | Severity | Workaround |
|---|-------|----------|-----------|
| 1 | Bhashini API login unavailable | Medium | MyMemory fallback active — works without keys |
| 2 | TTS/STT not implemented | Low | Removed from scope intentionally |