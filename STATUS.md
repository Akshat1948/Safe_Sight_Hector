# SafeSight — Root Project Status

> **Last updated:** 2026-08-21 19:05 by Shreyashi

## ?? CURRENT CHECKPOINT
Day 2 of 6 — Checkpoint 1 (Core Features - Phase 1)

## ?? CROSS-POD INTEGRATION STATUS

### Backend API Endpoints (Pod B ? Pod A consumes)
| Endpoint | Status | Owner | Next Action / Notes |
|---|---|---|---|
| POST /api/auth/login | ?? WIP | Ayush | Auth & JWT setup |
| GET /api/zones | ?? WIP | Ayush | Zones & density endpoints |
| GET /api/weather/:siteId | ?? WIP | Ayush | Proxy to AI/ML weather service (`/ml/weather/current`) |
| POST /api/forecast/:zoneId | ?? WIP | Ayush | Proxy to AI/ML forecast service (`/ml/forecast`) |
| POST /api/incidents | ?? NOT STARTED | Akshat | Incident management |
| POST /api/alerts | ?? NOT STARTED | Akshat | Alert dispatch |
| POST /api/sos | ?? NOT STARTED | Akshat | SOS handler |

### AI/ML Endpoints (Pod C ? Pod B consumes)
| Endpoint | Status | Owner | Next Action / Notes |
|---|---|---|---|
| GET /ml/health | ? LIVE | Shreyashi | Liveness probe working |
| POST /ml/forecast | ? LIVE | Shreyashi | Prophet crowd model with heuristic fallback |
| GET /ml/weather/current | ? LIVE | Shreyashi | Current weather with 24h forecast & cache |
| POST /ml/weather/hazards | ? LIVE | Shreyashi | Rule-based hazard scoring (flood, landslide, lightning, heat) |
| POST /ml/anomaly/detect | ?? NOT STARTED | Diya | **Diya Action Item (Day 3):** Implement Isolation Forest + flow velocity checks |
| POST /ml/bhashini/* | ?? NOT STARTED | Diya | **Diya Action Item (Day 3):** Implement Bhashini translation, TTS, STT |

### Frontend Pages (Pod A)
| Page | Status | Owner | Using Real API? |
|---|---|---|---|
| Visitor View | ?? WIP | Yashasvi | Map + Heatmap + Weather widget |
| Manager Dashboard | ?? NOT STARTED | Aditya | Command center |
| Responder Console | ?? NOT STARTED | Aditya | Incident queue & navigation |

## ?? ACTION ITEMS SUMMARY FOR TEAMMATES

### ?? For Diya (Pod C — Day 3 Target):
- [ ] Build `ai-ml/anomaly/` (Isolation Forest for crush precursor detection).
- [ ] Build `ai-ml/bhashini/` (Indic translation & TTS/STT via Bhashini ULCA API).
- [ ] Create `ai-ml/api/anomaly_routes.py` and `ai-ml/api/bhashini_routes.py`.
- [ ] Uncomment router registration in `ai-ml/api/main.py`.
- [ ] Review Shreyashi's PR `pod-c/forecast-model` ? `develop`.

### ?? For Ayush (Pod B — Day 3 Target):
- [ ] Connect NestJS Backend Weather Proxy to AI/ML `GET /ml/weather/current`.
- [ ] Connect NestJS Backend Zone Forecast Service to AI/ML `POST /ml/forecast`.
- [ ] Connect NestJS Site Hazard Evaluator to AI/ML `POST /ml/weather/hazards`.
- [ ] Complete Zone and Geofence CRUD endpoints.

## ?? BLOCKERS
| What's Blocked | Blocked By | Who Needs to Act |
|---|---|---|
| Real IMD API access | Public IMD API key / credentials | Shreyashi (simulated fallback currently in place) |

## ??? SHARED INFRA STATUS
| Item | Status | Notes |
|---|---|---|
| GitHub repo created | ? LIVE | Private repo with branch workflow |
| AI/ML Service | ? LIVE | FastAPI running on port 8000, Prophet + Weather routes ready |
| Backend (NestJS) | ?? WIP | Under development by Pod B |
| Frontend (Next.js) | ?? WIP | Under development by Pod A |
| PostgreSQL + PostGIS | ?? WIP | Docker configuration ready |

## ?? CONTRACT CHANGES LOG
| Date | What Changed | Changed By | All Pods Notified? |
|---|---|---|---|
| 2026-08-21 | Implemented AI/ML forecast & weather endpoints according to MASTER.md | Shreyashi | ? Yes |
