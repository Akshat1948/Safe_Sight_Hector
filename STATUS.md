# SafeSight — Project Status

> **Last updated:** 2026-08-23 20:10 by Aditya (Pod A Co-Lead — Frontend)

---

## ⚠️ TEMPORARY TEAM REALLOCATION NOTE
> **Status:** Active (Effective Aug 23, 2026)  
> **Notice:** **Yashasvi** is currently unavailable for a temporary time period. To maintain delivery momentum, his responsibilities are temporarily taken over by **Aditya**, **Shreyashi**, and **Akshat** until Yashasvi returns:
> * **Aditya (Pod A Co-Lead):** Visitor Landing Page (`app/page.tsx`, `(visitor)/`), Root Layout & Styling, Service Worker & PWA Shell.
> * **Shreyashi (Pod C):** Weather & Hazard Overlays (`components/weather/`), Multilingual i18n & Bhashini UI integration (`components/language/`, `i18n/`).
> * **Akshat (Pod B):** Interactive Leaflet Map & GeoJSON Overlays (`components/map/`), Transport Widgets (`components/transport/`), Public SOS & Safety Essentials (`components/visitor/`).

---

## 📊 CURRENT CHECKPOINT
**Day 3 of 6 — Integration & Multi-Pod Feature Execution**

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
│   - Tactical Light Theme│                              │                               │
│   - [Interim: Visitor]  │ • Akshat:                    │ • Diya:                       │
│                         │   🟢 100% COMPLETE & LIVE    │   🔴 IN PROGRESS (Day 3 Target│
│ • Yashasvi (On Leave):  │   - Incidents & Verification │   - Isolation Forest Anomaly  │
│   🟡 REALLOCATED        │   - Alerts & Auto-Escalation │   - Bhashini Translate & TTS  │
│   (Handed to Aditya,    │   - SOS & Auto-Incident Flow │                               │
│    Shreyashi & Akshat)  │   - Transport Status         │                               │
│                         │   - WebSocket Gateway (:3001)│                               │
│                         │   - [Interim: Maps/Transport]│                               │
└─────────────────────────┴──────────────────────────────┴───────────────────────────────┘
```

---

## 🟢 POD A (FRONTEND — ADITYA) WORK ACCOMPLISHED

All core Site Manager and Emergency Responder consoles assigned to Aditya are **100% built, typed, styled, and production-compiled** (`npm run build` passing with 0 errors).

| Module / View | Route | Status | Key Highlights |
|---|---|---|---|
| **Auth & Security** | `/login` | 🟢 100% COMPLETE | Himalayan glassmorphic UI, custom branding, role guard (`manager`, `responder`, `admin`), 1-click demo logins |
| **Site Manager Dashboard** | `/dashboard` | 🟢 100% COMPLETE | Retractable sidebar, KPI cards, centered zone density meters, synchronized incident overview queue |
| **Incident Management** | `/dashboard/incidents` | 🟢 100% COMPLETE | Status/severity queue filters, synchronous Verify & Dismiss actions, Visitor Evidence Side Panel with photo lightbox zoom |
| **Alert Center** | `/dashboard/alerts` | 🟢 100% COMPLETE | Multi-channel alert composer, animated marching-ants critical alert banner with 1-click acknowledge |
| **SOS Emergency Console** | `/dashboard/sos` | 🟢 100% COMPLETE | Real-time distress call queue, status progression (`pending` → `acknowledged` → `responding` → `resolved`), pulsating marching borders |
| **Emergency Responder Console** | `/responder` | 🟢 100% COMPLETE | Split-pane Active Dispatches feed, dynamic translucent emergency header, GPS Google Maps navigation, synchronized two-way action workflow |
| **API & Realtime Client** | `src/shared/api/*` | 🟢 100% COMPLETE | Centralized REST client with automatic JWT token refresh, Socket.io room hooks, and resilient mock fallbacks |

---

## 🟢 POD B (BACKEND — AYUSH & AKSHAT) WORK ACCOMPLISHED

All 18 REST endpoints and the real-time WebSocket Gateway are **100% COMPLETE, TESTED & LIVE** on port `:3001` with Swagger documentation at `/api/docs`.

### 1. Ayush (Pod B Lead) — 🟢 100% COMPLETE & LIVE
* **Docker & Database Infrastructure**: PostgreSQL 15 with PostGIS 3.4 (`:5432`) + Redis 7 (`:6379`).
* **Authentication & RBAC**: JWT Access & Refresh token rotation, `/api/auth/login`, `/api/auth/refresh`, `/api/auth/me`.
* **Zones & PostGIS Geospatial Engine**: Full CRUD `/api/zones`, zone polygon boundary queries, headcount update & density status calculator `/api/zones/:id/density`. Seed data for Prayagraj and Kedarnath.
* **Geofences**: Full CRUD `/api/geofences` with spatial polygon association.
* **Weather & Hazard Proxy**: `/api/weather/:siteId` integrating live IMD weather data and multi-hazard advisories.
* **Application Bootstrap & Swagger**: Global API prefix, CORS policies, ValidationPipe with `class-validator`, interactive API docs at `/api/docs`.

### 2. Akshat — 🟢 100% COMPLETE & LIVE
* **Incident Management**: `/api/incidents` CRUD, verification pipeline (`/api/incidents/:id/verify`), status transitions (`/api/incidents/:id/status`).
* **Alert System**: `/api/alerts` composition, non-blocking translation call, 60s background auto-escalation timer, acknowledgement tracking (`/api/alerts/:id/acknowledge`).
* **SOS Distress Flow**: Public `/api/sos` reporting with automatic incident generation and immediate WebSocket broadcast.
* **Transport Intelligence**: `/api/transport/parking` and `/api/transport/shuttles` for real-time occupancy and schedules.
* **WebSocket Gateway**: Socket.io gateway on port `:3001` broadcasting real-time site events (`join:site`, `incident:*`, `alert:*`, `sos:*`, `zone:density:*`).

---

## 🟢 POD C (AI/ML — SHREYASHI & DIYA) WORK ACCOMPLISHED

### 1. Shreyashi — 🟢 100% COMPLETE & LIVE
* **FastAPI Service**: Running on port `:8000` (`/ml` prefix) with full CORS support and Pydantic v2 schemas.
* **Prophet Crowd Forecasting (`POST /ml/forecast`)**: Time-series crowd prediction (6–24h ahead) with festival/holiday regressors and sinusoidal heuristic fallback for high reliability.
* **Pilgrimage Synthetic Dataset**: 21-day hourly crowd dataset generator (`sample_crowd.csv`, 504 rows) modeling realistic temple peak curves.
* **Live IMD Weather Client (`GET /ml/weather/current`)**: Real-time temperature, precipitation, wind, visibility, and humidity with 10-minute caching.
* **Multi-Hazard Scoring Matrix (`POST /ml/weather/hazards`)**: Rule-based deterministic assessment scoring flood, landslide, lightning, and heat risks.
* **Service Test Suite**: 100% validation in `tests/test_service.py`.

### 2. Diya — 🔴 IN PROGRESS (Day 3 Target)
* **Crowd Crush Anomaly Detection (`POST /ml/anomaly/detect`)**: Isolation Forest model with flow velocity checks for precursor crush detection.
* **Bhashini Indic Localization (`POST /ml/bhashini/*`)**: Translation, Text-to-Speech (TTS), and Speech-to-Text (STT) via Bhashini ULCA API.

---

## 🟡 POD A (FRONTEND — INTERIM HANDOVER FROM YASHASVI)

* **Aditya (Co-Lead):** Visitor Landing View (`app/(visitor)/page.tsx`), root routing, PWA shell and tactical light theme.
* **Akshat:** Interactive Leaflet GIS map with GeoJSON zone overlays (`components/map/`), public transport status (`components/transport/`), SOS button (`components/visitor/`).
* **Shreyashi:** Public weather advisory widget (`components/weather/`), Multilingual Bhashini i18n switcher (`components/language/`, `i18n/`).

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
| `/ml/anomaly/detect` | POST | 🔴 IN PROGRESS | Diya | Isolation Forest crush detection |
| `/ml/bhashini/translate` | POST | 🔴 IN PROGRESS | Diya | Bhashini translation API |
| `/ml/bhashini/tts` | POST | 🔴 IN PROGRESS | Diya | Text-to-speech API |
