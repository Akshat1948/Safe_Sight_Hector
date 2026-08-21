# SafeSight — Root Project Status

> **Last updated:** 2026-08-21 17:05 by Shreyashi

## ?? CURRENT CHECKPOINT
Day 2 of 6 — Checkpoint 1 (Core Features - Phase 1)

## ?? CROSS-POD INTEGRATION STATUS

### Backend API Endpoints (Pod B ? Pod A consumes)
| Endpoint | Status | Owner | Notes |
|---|---|---|---|
| POST /api/auth/login | ?? WIP | Ayush | Auth & JWT setup |
| GET /api/zones | ?? WIP | Ayush | Zones & density endpoints |
| GET /api/weather/:siteId | ?? WIP | Ayush | Proxy to AI/ML weather service |
| POST /api/incidents | ?? NOT STARTED | Akshat | Incident management |
| POST /api/alerts | ?? NOT STARTED | Akshat | Alert dispatch |
| POST /api/sos | ?? NOT STARTED | Akshat | SOS handler |

### AI/ML Endpoints (Pod C ? Pod B consumes)
| Endpoint | Status | Owner | Notes |
|---|---|---|---|
| GET /ml/health | ? LIVE | Shreyashi | Liveness probe working |
| POST /ml/forecast | ? LIVE | Shreyashi | Prophet crowd model with heuristic fallback |
| GET /ml/weather/current | ? LIVE | Shreyashi | Current weather with 24h forecast & cache |
| POST /ml/weather/hazards | ? LIVE | Shreyashi | Rule-based hazard scoring (flood, landslide, lightning, heat) |
| POST /ml/anomaly/detect | ?? NOT STARTED | Diya | Crush precursor detection |
| POST /ml/bhashini/* | ?? NOT STARTED | Diya | Translation, TTS, STT |

### Frontend Pages (Pod A)
| Page | Status | Owner | Using Real API? |
|---|---|---|---|
| Visitor View | ?? WIP | Yashasvi | Map + Heatmap + Weather widget |
| Manager Dashboard | ?? NOT STARTED | Aditya | Command center |
| Responder Console | ?? NOT STARTED | Aditya | Incident queue & navigation |

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
