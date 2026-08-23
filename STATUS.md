# SafeSight — Root Project Status

> **Last updated:** 2026-08-23 20:33 by Akshat & Aditya (Pod A & B Cross-Integration)

---

## ⚠️ TEMPORARY TEAM REALLOCATION NOTE
> **Status:** Active (Effective Aug 23, 2026)  
> **Notice:** **Yashasvi** is currently unavailable for a temporary period. To maintain delivery momentum, his responsibilities were temporarily distributed among **Aditya**, **Shreyashi**, and **Akshat**:
> * **Aditya (Pod A Co-Lead):** Visitor Landing Page (`app/page.tsx`, `(visitor)/`), Root Layout & Styling, Service Worker & PWA Shell.
> * **Shreyashi (Pod C):** Weather & Hazard Overlays (`components/weather/`), Multilingual i18n & Bhashini UI integration (`components/language/`, `i18n/`).
> * **Akshat (Pod B):** 🟢 **100% COMPLETE** — Interactive Leaflet Map & GeoJSON Overlays (`components/map/`), Transport Widgets (`components/transport/`), Public SOS & Safety Essentials (`components/visitor/`), and Visitor Portal (`app/(visitor)/visitor/page.tsx`).

---

## 📊 CURRENT CHECKPOINT
**Day 3 of 6 — Full Cross-Pod Integration & Component Execution**

---

## 👥 TEAM BLUEPRINT STATUS MATRIX

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                  TEAM BLUEPRINT PODS                                   │
├─────────────────────────┬──────────────────────────────┬───────────────────────────────┤
│   POD A: FRONTEND       │      POD B: BACKEND          │      POD C: AI / ML           │
├─────────────────────────┼──────────────────────────────┼───────────────────────────────┤
│ • Aditya (Co-Lead):     │ • Ayush (Lead):              │ • Shreyashi:                  │
│   🟢 100% COMPLETE      │   🟢 100% COMPLETE & LIVE    │   🟢 100% COMPLETE & LIVE     │
│   - Manager Dashboard   │   - Auth & Refresh (JWT)     │   - Prophet Forecast Model    │
│   - Incidents & Evidence│   - Zones & Density CRUD     │   - IMD Weather Client        │
│   - Alerts & Banner     │   - Geofences & Weather Proxy│   - Multi-Hazard Scoring      │
│   - SOS Distress Queue  │   - PostGIS Seeding & Infra  │   - Synthetic Crowd Dataset   │
│   - Responder Console   │   - Swagger Docs (/api/docs) │   - [Interim: Weather/i18n UI]│
│   - Tactical Light Theme│   - Demo Simulation Script   │                               │
│   - [Interim: Visitor]  │                              │ • Diya:                       │
│                         │ • Akshat:                    │   🟢 100% COMPLETE & LIVE     │
│ • Yashasvi (On Leave):  │   🟢 100% COMPLETE & LIVE    │   - Isolation Forest Anomaly  │
│   🟡 REALLOCATED        │   - Incidents & Verification │   - Bhashini Translate & TTS  │
│   (Handed to Aditya,    │   - Alerts & Auto-Escalation │   - MyMemory & gTTS Fallbacks │
│    Shreyashi & Akshat)  │   - SOS & Auto-Incident Flow │                               │
│                         │   - Transport Status         │                               │
│                         │   - WebSocket Gateway (:3001)│                               │
│                         │   - [Interim: 100% COMPLETED]│                               │
└─────────────────────────┴──────────────────────────────┴───────────────────────────────┘
```

---

## 🟢 POD A (FRONTEND — ADITYA & AKSHAT) WORK ACCOMPLISHED

All core Site Manager, Emergency Responder, and Visitor components are **100% built, typed, styled, and production-compiled** (`next build` passing with 0 errors across 11 routes).

| Module / View | Route | Status | Done By | Key Highlights |
|---|---|---|---|---|
| **Auth & Security** | `/login` | 🟢 100% COMPLETE | Aditya | Himalayan glassmorphic UI, custom branding, role guard (`manager`, `responder`, `admin`), 1-click demo logins |
| **Site Manager Dashboard** | `/dashboard` | 🟢 100% COMPLETE | Aditya | Retractable sidebar, KPI cards, centered zone density meters, synchronized incident overview queue |
| **Incident Management** | `/dashboard/incidents` | 🟢 100% COMPLETE | Aditya | Status/severity queue filters, synchronous Verify & Dismiss actions, Visitor Evidence Side Panel with photo lightbox zoom |
| **Alert Center** | `/dashboard/alerts` | 🟢 100% COMPLETE | Aditya | Multi-channel alert composer, animated marching-ants critical alert banner with 1-click acknowledge |
| **SOS Emergency Console** | `/dashboard/sos` | 🟢 100% COMPLETE | Aditya | Real-time distress call queue, status progression (`pending` → `acknowledged` → `responding` → `resolved`), pulsating marching borders |
| **Emergency Responder Console** | `/responder` | 🟢 100% COMPLETE | Aditya | Split-pane Active Dispatches feed, dynamic translucent emergency header, GPS Google Maps navigation, synchronized two-way action workflow |
| **Interactive GIS Map & Zone Heatmap** | `src/components/map/*` | 🟢 100% COMPLETE | Akshat | Leaflet GIS map with dynamic GeoJSON polygon overlays, zone status colors (Green/Yellow/Orange/Red), and interactive telemetry popups |
| **Public Transport Tracker** | `src/components/transport/*` | 🟢 100% COMPLETE | Akshat | `ParkingStatus.tsx` & `ShuttleInfo.tsx` with live capacity progress bars, occupancy meters, and countdown departure timers |
| **Visitor 1-Tap SOS Console** | `src/components/visitor/*` | 🟢 100% COMPLETE | Akshat | Radial pulsing 1-tap SOS button with geolocation dispatch, 108 ambulance speed-dials, and safety essentials |
| **Public Visitor Portal Page** | `/visitor` | 🟢 100% COMPLETE | Akshat | Full visitor page combining map, SOS, parking, shuttles, and live safety alert banner |
| **API & Realtime Client** | `src/shared/api/*` | 🟢 100% COMPLETE | Aditya & Akshat | Centralized REST client with automatic JWT token refresh, Socket.io room hooks, and resilient mock fallbacks |

---

## 🟢 POD B (BACKEND — AYUSH & AKSHAT) WORK ACCOMPLISHED

All 18 REST endpoints and the real-time WebSocket Gateway are **100% COMPLETE, TESTED & LIVE** on port `:3001` with Swagger documentation at `/api/docs`.

### 1. Ayush (Pod B Lead) — 🟢 100% COMPLETE & LIVE
* **Docker & Database Infrastructure**: PostgreSQL 15 with PostGIS 3.4 (`:5432`) + Redis 7 (`:6379`).
* **Authentication & RBAC**: JWT Access & Refresh token rotation, `/api/auth/login`, `/api/auth/refresh`, `/api/auth/me`.
* **Zones & PostGIS Geospatial Engine**: Full CRUD `/api/zones`, zone polygon boundary queries, headcount update & density status calculator `/api/zones/:id/density`. Seed data for Prayagraj and Kedarnath.
* **Geofences**: Full CRUD `/api/geofences` with spatial polygon association.
* **Weather & Hazard Proxy**: `/api/weather/:siteId` integrating live IMD weather data and multi-hazard advisories.
* **Demo Simulation Engine**: `scripts/simulate-demo.ts` with `--crush`, `--fast`, `--reset` options.
* **Application Bootstrap & Swagger**: Global API prefix, CORS policies, ValidationPipe with `class-validator`, interactive API docs at `/api/docs`.

### 2. Akshat — 🟢 100% COMPLETE & LIVE
* **Incident Management**: `/api/incidents` CRUD, verification pipeline (`/api/incidents/:id/verify`), status transitions (`/api/incidents/:id/status`).
* **Alert System**: `/api/alerts` composition, non-blocking translation call, 60s background auto-escalation timer, acknowledgement tracking (`/api/alerts/:id/acknowledge`).
* **SOS Distress Flow**: Public `/api/sos` reporting with automatic incident generation and immediate WebSocket broadcast.
* **Transport Intelligence**: `/api/transport/parking` and `/api/transport/shuttles` for real-time occupancy and schedules with auto-seeder.
* **WebSocket Gateway**: Socket.io gateway on port `:3001` broadcasting real-time site events (`join:site`, `incident:*`, `alert:*`, `sos:*`, `zone:density:*`).
* **One-Click Dev Scripts**: `start.sh` and `stop.sh` for instant local full-stack startup and graceful shutdown.

---

## 🟢 POD C (AI/ML — SHREYASHI & DIYA) WORK ACCOMPLISHED

### 1. Shreyashi — 🟢 100% COMPLETE & LIVE
* **FastAPI Service**: Running on port `:8000` (`/ml` prefix) with full CORS support and Pydantic v2 schemas.
* **Prophet Crowd Forecasting (`POST /ml/forecast`)**: Time-series crowd prediction (6–24h ahead) with festival/holiday regressors and sinusoidal heuristic fallback.
* **Pilgrimage Synthetic Dataset**: 21-day hourly crowd dataset generator (`sample_crowd.csv`, 504 rows).
* **Live IMD Weather Client (`GET /ml/weather/current`)**: Real-time weather data with 10-minute caching.
* **Multi-Hazard Scoring Matrix (`POST /ml/weather/hazards`)**: Rule-based deterministic assessment scoring flood, landslide, lightning, and heat risks.

### 2. Diya — 🟢 100% COMPLETE & LIVE
* **Crowd Crush Anomaly Detection (`POST /ml/anomaly/detect`)**: Isolation Forest model with flow velocity checks for precursor crush detection.
* **Bhashini Indic Localization (`POST /ml/bhashini/*`)**: Translation, Text-to-Speech (TTS), and Speech-to-Text (STT) via Bhashini ULCA API with MyMemory and gTTS fallbacks.

---

## 🏗️ SHARED INFRA & ENDPOINT REGISTRY

| Endpoint | Method | Status | Owner | Notes / Contract |
|---|---|---|---|---|
| `/api/auth/login` | POST | 🟢 LIVE | Ayush | Returns `{ accessToken, refreshToken, user }` |
| `/api/auth/refresh` | POST | 🟢 LIVE | Ayush | Returns new access & refresh tokens |
| `/api/auth/me` | GET | 🟢 LIVE | Ayush | Requires Bearer JWT |
| `/api/zones` | GET/POST | 🟢 LIVE | Ayush | Active zones with GeoJSON polygons |
| `/api/zones/:id` | GET/PUT | 🟢 LIVE | Ayush | Single zone query & update |
| `/api/zones/:id/density` | GET/PATCH | 🟢 LIVE | Ayush | Time-series history & headcount update |
| `/api/geofences` | GET/POST/DEL | 🟢 LIVE | Ayush | Geofence spatial management |
| `/api/weather/:siteId` | GET | 🟢 LIVE | Ayush | Live weather + multi-hazard advisory |
| `/api/incidents` | GET/POST | 🟢 LIVE | Akshat | Full incident CRUD & verification |
| `/api/incidents/:id/verify` | PATCH | 🟢 LIVE | Akshat | Verify/dismiss incident |
| `/api/incidents/:id/status` | PATCH | 🟢 LIVE | Akshat | Responding/resolved status update |
| `/api/alerts` | GET/POST | 🟢 LIVE | Akshat | Alert composition & dispatch |
| `/api/alerts/:id/acknowledge` | PATCH | 🟢 LIVE | Akshat | Acknowledge alert |
| `/api/sos` | POST/GET | 🟢 LIVE | Akshat | Visitor SOS creation & tracking |
| `/api/transport/parking` | GET | 🟢 LIVE | Akshat | Live parking occupancy |
| `/api/transport/shuttles` | GET | 🟢 LIVE | Akshat | Live shuttle schedules |
| WebSocket Gateway | WS (`:3001`) | 🟢 LIVE | Akshat | Real-time events on `ws://localhost:3001` |
| `/ml/forecast` | POST | 🟢 LIVE | Shreyashi | Prophet/LSTM crowd forecast (6–24h ahead) |
| `/ml/weather/current` | GET | 🟢 LIVE | Shreyashi | Live IMD weather data with cache |
| `/ml/weather/hazards` | POST | 🟢 LIVE | Shreyashi | Multi-hazard assessment logic |
| `/ml/anomaly/detect` | POST | 🟢 LIVE | Diya | Isolation Forest crush detection |
| `/ml/bhashini/translate` | POST | 🟢 LIVE | Diya | Bhashini translation API |
| `/ml/bhashini/tts` | POST | 🟢 LIVE | Diya | Text-to-speech API |
| One-Click Startup (`./start.sh`) | Script | 🟢 LIVE | Akshat | Auto-launches full stack & opens Swagger |
| One-Click Shutdown (`./stop.sh`) | Script | 🟢 LIVE | Akshat | Terminates background services |
