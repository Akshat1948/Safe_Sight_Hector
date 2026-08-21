# SafeSight — Project Status

> **Last updated:** 2026-08-21 16:32 by Akshat

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
| `/api/incidents` | GET/POST | 🟢 LIVE | Akshat | List & create incidents + WS `incident:new` |
| `/api/incidents/:id` | GET | 🟢 LIVE | Akshat | Retrieve single incident by ID |
| `/api/incidents/:id/verify` | PATCH | 🟢 LIVE | Akshat | Verify/dismiss incident + WS `incident:verified` |
| `/api/incidents/:id/status` | PATCH | 🟢 LIVE | Akshat | Update status + WS `incident:status:update` |
| `/api/alerts` | GET/POST | 🟢 LIVE | Akshat | Alert compose, Bhashini translate + WS `alert:new` |
| `/api/alerts/:id/acknowledge` | PATCH | 🟢 LIVE | Akshat | Acknowledge alert + WS `alert:acknowledged` |
| `/api/sos` | POST | 🟢 LIVE | Akshat | Public SOS create, auto-incident + WS `sos:new` |
| `/api/sos` | GET | 🟢 LIVE | Akshat | List SOS requests for site |
| `/api/sos/:id/status` | PATCH | 🟢 LIVE | Akshat | Update SOS request status |
| `/api/transport/parking` | GET | 🟢 LIVE | Akshat | Public parking occupancy & status |
| `/api/transport/shuttles` | GET | 🟢 LIVE | Akshat | Public shuttle schedule & status |
| `/api/transport/:id` | PUT | 🟢 LIVE | Akshat | Manager transport status update |

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
| Incident Queue UI | 🔴 NOT STARTED | Aditya | Ready for `/api/incidents` |
| Responder Console | 🔴 NOT STARTED | Aditya | Ready for `/api/incidents` & `/api/sos` |

---

## 🚧 BLOCKERS
| What's Blocked | Blocked By | Who Needs to Act | Notes |
|----------------|------------|------------------|-------|
| Live DB Testing | Docker containers starting | Local environment | `docker-compose up -d` for Postgres & Redis |
| AppModule Registration | `src/app.module.ts` import | Ayush | Wire up Incidents, Alerts, SOS, Transport, Gateway in `app.module.ts` |

---

## 🏗️ SHARED INFRA STATUS
| Item | Status | Notes |
|------|--------|-------|
| GitHub Repository | 🟢 READY | Main & Develop branches pushed |
| Docker Compose Config | 🟢 READY | PostGIS 15 + Redis 7 configured |
| Shared Common Contracts | 🟢 LOCKED | All DTOs, Enums, & Interfaces defined |
| TypeORM Schema & Entities | 🟢 READY | 10 entities created |
| Swagger API Docs | 🟢 READY | Available at `/api/docs` on boot |
| WebSocket Gateway | 🟢 READY | Room-based real-time broadcasting on port 3001 |

---

## 🔄 CONTRACT CHANGES LOG
| Date | What Changed | Changed By | All Pods Notified? |
|------|-------------|-----------|-------------------|
| 2026-08-21 | Initialized all shared DTOs & Entities as per MASTER.md | Ayush | ✅ Yes |
| 2026-08-21 | Completed Incidents, Alerts, SOS, Transport, and Gateway modules | Akshat | ✅ Yes |