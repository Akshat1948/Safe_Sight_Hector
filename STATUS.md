# SafeSight — Project Status

> **Last updated:** 2026-08-21 15:52 by Ayush (Pod B Lead)

---

## 📊 CURRENT CHECKPOINT
**Day 2 of 6 — Core Features (Phase 1)**

---

## 🔗 CROSS-POD INTEGRATION STATUS

### Backend API Endpoints (Pod B → Pod A & Pod C consume)
| Endpoint | Method | Status | Owner | Notes / Contract |
|----------|--------|--------|-------|------------------|
| `/api/auth/login` | POST | 🟢 LIVE | Ayush | Returns `{ accessToken, refreshToken, user }` |
| `/api/auth/refresh` | POST | 🟢 LIVE | Ayush | Returns new access & refresh tokens |
| `/api/auth/me` | GET | 🟢 LIVE | Ayush | Requires Bearer JWT |
| `/api/zones` | GET | 🟢 LIVE | Ayush | Returns all active zones (filtered by `siteId`) |
| `/api/zones/:id` | GET | 🟢 LIVE | Ayush | Returns single zone with polygon |
| `/api/zones` | POST | 🟢 LIVE | Ayush | Creates zone (Manager/Admin role) |
| `/api/zones/:id` | PUT | 🟢 LIVE | Ayush | Updates zone (Manager/Admin role) |
| `/api/zones/:id/density` | GET | 🟢 LIVE | Ayush | Returns density time-series history |
| `/api/zones/:id/density` | PATCH | 🟢 LIVE | Ayush | Updates headcount & recalculates status |
| `/api/geofences` | GET | 🟢 LIVE | Ayush | Returns geofences for zone/site |
| `/api/geofences` | POST/PUT/DEL | 🟢 LIVE | Ayush | Geofence CRUD |
| `/api/weather/:siteId` | GET | 🟢 LIVE | Ayush | Live weather + hazard advisory |
| `/api/incidents` | GET/POST | 🔴 NOT STARTED | Akshat | TypeORM entity & DTO ready |
| `/api/incidents/:id/verify` | PATCH | 🔴 NOT STARTED | Akshat | TypeORM entity & DTO ready |
| `/api/alerts` | GET/POST | 🔴 NOT STARTED | Akshat | TypeORM entity & DTO ready |
| `/api/sos` | POST | 🔴 NOT STARTED | Akshat | TypeORM entity & DTO ready |
| `/api/transport/parking` | GET | 🔴 NOT STARTED | Akshat | TypeORM entity & DTO ready |
| `/api/transport/shuttles` | GET | 🔴 NOT STARTED | Akshat | TypeORM entity & DTO ready |

### AI/ML Endpoints (Pod C → Pod B consumes)
| Endpoint | Method | Status | Owner | Notes |
|----------|--------|--------|-------|-------|
| `/ml/forecast` | POST | 🔴 NOT STARTED | Shreyashi | Prophet/LSTM crowd forecast |
| `/ml/weather/hazards` | POST | 🔴 NOT STARTED | Shreyashi | IMD weather hazard evaluation |
| `/ml/anomaly/detect` | POST | 🔴 NOT STARTED | Diya | Isolation Forest crush detection |
| `/ml/bhashini/translate` | POST | 🔴 NOT STARTED | Diya | Bhashini translation API |
| `/ml/bhashini/tts` | POST | 🔴 NOT STARTED | Diya | Text-to-speech API |

### Frontend Views (Pod A)
| View / Component | Status | Owner | Using Real API? |
|------------------|--------|-------|-----------------|
| Visitor Landing & Heatmap | 🔴 NOT STARTED | Yashasvi | Can connect to `/api/zones` & `/api/weather` |
| MapView & Zone Overlays | 🔴 NOT STARTED | Yashasvi | Ready for `/api/zones` data |
| WeatherWidget | 🔴 NOT STARTED | Yashasvi | Ready for `/api/weather/:siteId` |
| LanguageSwitcher (i18n) | 🔴 NOT STARTED | Yashasvi | Config ready |
| Manager Dashboard | 🔴 NOT STARTED | Aditya | Ready for `/api/auth/login` |
| Incident Queue UI | 🔴 NOT STARTED | Aditya | — |
| Responder Console | 🔴 NOT STARTED | Aditya | — |

---

## 🚧 BLOCKERS
| What's Blocked | Blocked By | Who Needs to Act | Notes |
|----------------|------------|------------------|-------|
| Live DB Testing | Docker containers starting | Ayush | `docker-compose up -d` for Postgres & Redis |

---

## 🏗️ SHARED INFRA STATUS
| Item | Status | Notes |
|------|--------|-------|
| GitHub Repository | 🟢 READY | Main & Develop branches pushed |
| Docker Compose Config | 🟢 READY | PostGIS 15 + Redis 7 configured |
| Shared Common Contracts | 🟢 LOCKED | All DTOs, Enums, & Interfaces defined |
| TypeORM Schema & Entities | 🟢 READY | 10 entities created |
| Swagger API Docs | 🟢 READY | Available at `/api/docs` on boot |

---

## 🔄 CONTRACT CHANGES LOG
| Date | What Changed | Changed By | All Pods Notified? |
|------|-------------|-----------|-------------------|
| 2026-08-21 | Initialized all shared DTOs & Entities as per MASTER.md | Ayush | ✅ Yes |