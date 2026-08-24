# SafeSight — Root Project Status

> **Last updated:** 2026-08-24 12:53 by Team Blueprint (Diya, Aditya, Ayush, Akshat, Shreyashi)

---

## 🎨 UI REDESIGN UPDATE: CLEARPOINT COMMAND & SAFESIGHT HECTOR (POD A)
> **Status:** 🟢 **100% COMPLETE & LIVE**
> * **Design System:** High-Contrast Light Theme with Inter & JetBrains Mono typography, SafeSight Amber (`#855300` / `#f59e0b`), 1px `#e2e8f0` HUD panels, and subtle tonal layering.
> * **Root Page (`/`) & `/dashboard`:** Real-time System Performance Overview with 24h Incident Trends Bar Chart, 4 KPI Telemetry Cards (Alerts, Response Time, Uptime, Patrols), Inflow Rate meters, and Live Incident Triage Queue.
> * **Real-Time Map (`/dashboard/map`):** Split-screen command stack, Live Event Feed (CCTV-45, Zone 3, Sensor Alerts), Leaflet GIS Map, Sector 7 Command Hub, and animated Perimeter Breach popups.
> * **Asset Tracking (`/dashboard/assets`):** Roster tracking Tactical Units, Surveillance Drones, Armored Transports, and Thermal Sensors with live battery %, speed gauges, and encrypted Comms Link / Issue Orders actions.
> * **Alert History (`/dashboard/alerts`):** Broadcast Log stream table, delivery/latency KPIs, multi-channel icons (`SMS`, `Push`, `PA`), and AI Multilingual Alert Composer.


## 📢 IMPORTANT ANNOUNCEMENT: TRANSLATION FEATURE UPDATE (POD C)
> **To All Pods (Frontend, Backend, AI/ML):**
> 
> * **1. Name Change (Bhashini ➔ Multilingual Translator):**
>   We have renamed the module from **Bhashini** to **Multilingual Translator Feature**. Because the MeitY Bhashini government portal was inaccessible for account registration, we transitioned to the **MyMemory Open Translation Engine**.
> 
> * **2. Zero Setup / No API Keys Required:**
>   The translation engine works **100% out of the box**. Nobody on the team needs to register, login, or configure any API keys in `.env` for local testing or judge presentations.
> 
> * **3. Scope Refinement (Text-Only):**
>   Synthetic audio generation (TTS / STT) has been **removed** to eliminate synthetic voice glitches, latency, and system dependencies. We are delivering 100% stable, instant **text translation** across 13 scheduled Indian languages.
> 
> * **4. Endpoints & 100% Backward Compatibility:**
>   * **New Clean Endpoint:** `POST /ml/translate`
>   * **Legacy Aliases (Will NOT break existing code):** `POST /ml/bhashini/translate` and `POST /ml/translator/translate` are active aliases that route to the exact same engine.
>   * **Payload Contract:**
>     ```json
>     // Request: POST /ml/translate
>     {
>       "text": "Avoid Zone C staircase. Use Zone D corridor instead.",
>       "source_language": "en",
>       "target_language": "hi"
>     }
> 
>     // Response: HTTP 200 OK
>     {
>       "success": true,
>       "data": {
>         "translated_text": "ज़ोन सी सीढ़ी से बचें। इसके बजाय ज़ोन डी कॉरिडोर का उपयोग करें।",
>         "source_language": "en",
>         "target_language": "hi"
>       },
>       "message": "Translation complete"
>     }
>     ```

---

## ⚠️ TEMPORARY TEAM REALLOCATION NOTE
> **Status:** Active (Effective Aug 23, 2026)  
> **Notice:** **Yashasvi** is currently unavailable for a temporary period. To maintain delivery momentum, his responsibilities were temporarily distributed among **Aditya**, **Shreyashi**, and **Akshat**:
> * **Aditya (Pod A Co-Lead):** 🟢 **100% COMPLETE** — Visitor Landing Page (`app/page.tsx`, `(visitor)/`), Root Layout & Styling, Service Worker & PWA Shell.
> * **Shreyashi (Pod C):** 🟢 **100% COMPLETE** — Weather & Hazard Overlays (`components/weather/`), Multilingual i18n & Translator UI integration (`components/language/`, `i18n/`).
> * **Akshat (Pod B):** 🟢 **100% COMPLETE** — Interactive Leaflet Map & GeoJSON Overlays (`components/map/`), Transport Widgets (`components/transport/`), Public SOS & Safety Essentials (`components/visitor/`), and Visitor Portal (`app/(visitor)/visitor/page.tsx`).

---

## 📊 CURRENT CHECKPOINT
**Day 3 of 6 — Full Integration & End-to-End Testing (Pods A, B, C 100% LIVE)**

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
│   - Responder Console   │   - Swagger Docs (/api/docs) │   - Weather & Hazard Widget   │
│   - Tactical Light Theme│   - Demo Simulation Script   │   - Multilingual i18n UI      │
│   - Visitor PWA Shell   │                              │                               │
│                         │ • Akshat:                    │ • Diya:                       │
│ • Yashasvi (On Leave):  │   🟢 100% COMPLETE & LIVE    │   🟢 100% COMPLETE & LIVE     │
│   🟡 REALLOCATED        │   - Incidents & Verification │   - Isolation Forest Anomaly  │
│   (Handed to Aditya,    │   - Alerts & Auto-Escalation │   - Multilingual Translator   │
│    Shreyashi & Akshat)  │   - SOS & Auto-Incident Flow │   - MyMemory 13-Language Eng  │
│                         │   - Transport Status         │   - Zero-Auth Setup Live      │
│                         │   - WebSocket Gateway (:3001)│                               │
│                         │   - Map & Transport UI       │                               │
│                         │   - SOS & Visitor Portal     │                               │
└─────────────────────────┴──────────────────────────────┴───────────────────────────────┘
```

---

## 🟢 POD A (FRONTEND — ADITYA, SHREYASHI & AKSHAT) WORK ACCOMPLISHED

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
| **Weather & Hazard Overlay** | `src/components/weather/*` | 🟢 100% COMPLETE | Shreyashi | `WeatherWidget.tsx` & `HazardOverlay.tsx` with live temperature, humidity, wind, rainfall, and hazard indicators |
| **Multilingual i18n Switcher** | `src/components/language/*`, `src/i18n/*` | 🟢 100% COMPLETE | Shreyashi | `LanguageSwitcher.tsx` with 13-language translations and global `LanguageProvider` |
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
* **Multilingual Translator (`POST /ml/translate`)**: 13-language open translation engine powered by MyMemory with backward-compatible `/ml/bhashini/translate` alias and zero-auth setup.

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
| `/ml/translate` | POST | 🟢 LIVE | Diya | 13-language open translation engine (alias: `/ml/bhashini/translate`) |
| One-Click Startup (`./start.sh`) | Script | 🟢 LIVE | Akshat | Auto-launches full stack & opens Swagger |
| One-Click Shutdown (`./stop.sh`) | Script | 🟢 LIVE | Akshat | Terminates background services |
