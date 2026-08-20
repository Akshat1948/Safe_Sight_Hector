# SafeSight — MASTER.md (Technical Bible)

> **Version:** 1.0  
> **Date:** August 20, 2026  
> **Status:** LOCKED — Do not edit without team consensus  
> **Purpose:** Single source of truth for HOW SafeSight is built. Every AI agent reads this. Nobody modifies shared code without referencing this document.

---

## Table of Contents

1. [Service Architecture & Ports](#1-service-architecture--ports)
2. [Folder Structure](#2-folder-structure)
3. [Database Schema](#3-database-schema)
4. [Roles & RBAC](#4-roles--rbac)
5. [API Contracts — Backend (NestJS)](#5-api-contracts--backend-nestjs)
6. [API Contracts — AI/ML (FastAPI)](#6-api-contracts--aiml-fastapi)
7. [WebSocket Events](#7-websocket-events)
8. [Shared TypeScript DTOs & Interfaces (Backend)](#8-shared-typescript-dtos--interfaces-backend)
9. [Shared TypeScript Types (Frontend)](#9-shared-typescript-types-frontend)
10. [Shared Pydantic Schemas (AI/ML)](#10-shared-pydantic-schemas-aiml)
11. [Shared Constants](#11-shared-constants)
12. [Environment Variables](#12-environment-variables)
13. [Coding Conventions](#13-coding-conventions)
14. [Inter-Service Communication](#14-inter-service-communication)

---

## 1. Service Architecture & Ports

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER (PWA)                            │
│          Next.js App — Visitor / Manager / Responder            │
│                     Port: 3000                                  │
└──────────────┬─────────────────────────────┬────────────────────┘
               │ HTTPS / WebSocket           │
               ▼                             │
┌──────────────────────────────┐             │
│     BACKEND (NestJS)         │             │
│     Port: 3001               │             │
│     API Gateway + Auth       │             │
│     + WebSocket Gateway      │             │
│     + All REST endpoints     │             │
└──────────┬───────────────────┘             │
           │ HTTP (internal)                 │
           ▼                                 │
┌──────────────────────────────┐             │
│     AI/ML SERVICE (FastAPI)  │             │
│     Port: 8000               │             │
│     Forecast, Anomaly,       │             │
│     Bhashini, Weather        │             │
└──────────┬───────────────────┘             │
           │                                 │
           ▼                                 ▼
┌──────────────────────────────────────────────────┐
│              DATA LAYER                          │
│  PostgreSQL + PostGIS    Port: 5432              │
│  Redis                   Port: 6379              │
└──────────────────────────────────────────────────┘
```

| Service | Technology | Port | Base URL |
|---------|-----------|------|----------|
| Frontend | Next.js 14+ | 3000 | `http://localhost:3000` |
| Backend | NestJS | 3001 | `http://localhost:3001/api` |
| AI/ML | FastAPI | 8000 | `http://localhost:8000/ml` |
| PostgreSQL | PostgreSQL 15 + PostGIS | 5432 | — |
| Redis | Redis 7 | 6379 | — |

---

## 2. Folder Structure

```
safesight/
├── frontend/                ← Pod A
├── backend/                 ← Pod B
├── ai-ml/                   ← Pod C
├── shared-contracts/        ← Read-only reference (API contracts, DB schema)
├── docs/
│   ├── PRD.md
│   ├── MASTER.md            ← THIS FILE
│   └── SOP.md
├── STATUS.md
├── docker-compose.yml
├── .gitignore
└── README.md
```

Detailed per-pod folder structures are defined in the SOP (Section 2).

---

## 3. Database Schema

PostgreSQL 15 with PostGIS extension. All tables use UUID primary keys. Timestamps are UTC.

### 3.1 `users`

Stores site managers and emergency responders only. Visitors do NOT have accounts.

```sql
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name          VARCHAR(255) NOT NULL,
  role          VARCHAR(20) NOT NULL CHECK (role IN ('manager', 'responder', 'admin')),
  phone         VARCHAR(20),
  site_id       UUID REFERENCES sites(id),
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.2 `sites`

A pilgrimage or eco-tourism site (e.g., a temple complex, a trek route).

```sql
CREATE TABLE sites (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  location    GEOGRAPHY(POINT, 4326) NOT NULL,
  bounds      GEOGRAPHY(POLYGON, 4326),
  address     TEXT,
  site_type   VARCHAR(20) NOT NULL CHECK (site_type IN ('pilgrimage', 'eco_tourism', 'mixed')),
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.3 `zones`

A sub-area within a site (entry gate, staircase, corridor, parking lot, etc.).

```sql
CREATE TABLE zones (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id         UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  name            VARCHAR(255) NOT NULL,
  zone_type       VARCHAR(30) NOT NULL CHECK (zone_type IN (
                    'entry_exit', 'high_risk', 'restricted', 'medical_aid',
                    'safe_assembly', 'corridor', 'parking', 'general'
                  )),
  polygon         GEOGRAPHY(POLYGON, 4326) NOT NULL,
  max_capacity    INTEGER NOT NULL,
  current_density INTEGER DEFAULT 0,
  density_status  VARCHAR(10) DEFAULT 'green' CHECK (density_status IN ('green', 'yellow', 'orange', 'red')),
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.4 `geofences`

Manager-defined geofence boundaries tied to zones with alert rules.

```sql
CREATE TABLE geofences (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id       UUID NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
  name          VARCHAR(255) NOT NULL,
  fence_type    VARCHAR(20) NOT NULL CHECK (fence_type IN ('boundary', 'restricted', 'alert_radius')),
  polygon       GEOGRAPHY(POLYGON, 4326) NOT NULL,
  alert_on_entry  BOOLEAN DEFAULT false,
  alert_on_exit   BOOLEAN DEFAULT false,
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.5 `density_readings`

Time-series crowd density data per zone (from sensors or simulation).

```sql
CREATE TABLE density_readings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id     UUID NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
  headcount   INTEGER NOT NULL,
  flow_rate   FLOAT,                   -- people per minute through zone
  flow_velocity FLOAT,                 -- avg movement speed m/s
  source      VARCHAR(20) DEFAULT 'sensor' CHECK (source IN ('sensor', 'simulation', 'manual')),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for time-series queries
CREATE INDEX idx_density_zone_time ON density_readings (zone_id, recorded_at DESC);
```

### 3.6 `incidents`

Detected incidents (auto-detected by AI or manually reported).

```sql
CREATE TABLE incidents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id         UUID NOT NULL REFERENCES sites(id),
  zone_id         UUID REFERENCES zones(id),
  incident_type   VARCHAR(30) NOT NULL CHECK (incident_type IN (
                    'crush_precursor', 'medical_emergency', 'geofence_breach',
                    'environmental_hazard', 'stampede', 'fire', 'other'
                  )),
  severity        VARCHAR(10) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status          VARCHAR(20) DEFAULT 'flagged' CHECK (status IN (
                    'flagged', 'verified', 'dismissed', 'responding', 'resolved'
                  )),
  title           VARCHAR(500) NOT NULL,
  description     TEXT,
  location        GEOGRAPHY(POINT, 4326),
  confidence_score FLOAT,              -- 0.0 to 1.0, from AI detection
  detection_source VARCHAR(20) DEFAULT 'ai' CHECK (detection_source IN ('ai', 'manual', 'sos')),
  verified_by     UUID REFERENCES users(id),
  verified_at     TIMESTAMPTZ,
  resolved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.7 `alerts`

Alerts composed and dispatched by managers after incident verification.

```sql
CREATE TABLE alerts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id     UUID REFERENCES incidents(id),
  site_id         UUID NOT NULL REFERENCES sites(id),
  target_zone_id  UUID REFERENCES zones(id),
  severity        VARCHAR(10) NOT NULL CHECK (severity IN (
                    'informational', 'advisory', 'warning', 'critical'
                  )),
  title           VARCHAR(500) NOT NULL,
  message         TEXT NOT NULL,
  message_hi      TEXT,                 -- Hindi translation
  channels        VARCHAR(20)[] DEFAULT ARRAY['push'],  -- push, sms, dashboard, pa_system
  status          VARCHAR(20) DEFAULT 'draft' CHECK (status IN (
                    'draft', 'dispatched', 'acknowledged', 'escalated', 'expired'
                  )),
  created_by      UUID NOT NULL REFERENCES users(id),
  acknowledged_by UUID REFERENCES users(id),
  acknowledged_at TIMESTAMPTZ,
  escalated_at    TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.8 `sos_requests`

Visitor-initiated SOS emergency requests.

```sql
CREATE TABLE sos_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id         UUID REFERENCES sites(id),
  location        GEOGRAPHY(POINT, 4326),
  message         TEXT,
  contact_phone   VARCHAR(20),
  status          VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
                    'pending', 'acknowledged', 'responding', 'resolved'
                  )),
  assigned_to     UUID REFERENCES users(id),
  session_token   VARCHAR(255),         -- ephemeral, non-persistent
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.9 `weather_data`

Cached weather data from IMD.

```sql
CREATE TABLE weather_data (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id         UUID NOT NULL REFERENCES sites(id),
  temperature     FLOAT,
  humidity        FLOAT,
  wind_speed      FLOAT,
  wind_direction  VARCHAR(10),
  condition       VARCHAR(50),          -- 'clear', 'rain', 'thunderstorm', etc.
  precipitation   FLOAT,
  visibility      FLOAT,
  hazard_level    VARCHAR(10) DEFAULT 'none' CHECK (hazard_level IN (
                    'none', 'low', 'moderate', 'high', 'severe'
                  )),
  hazard_type     VARCHAR(30),          -- 'flood', 'landslide', 'lightning', 'heat', null
  forecast_json   JSONB,                -- raw forecast data for next 24h
  fetched_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.10 `transport_status`

Parking and shuttle status.

```sql
CREATE TABLE transport_status (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id         UUID NOT NULL REFERENCES sites(id),
  transport_type  VARCHAR(20) NOT NULL CHECK (transport_type IN ('parking', 'shuttle', 'bus')),
  name            VARCHAR(255) NOT NULL,
  total_capacity  INTEGER,
  current_occupancy INTEGER DEFAULT 0,
  status          VARCHAR(20) DEFAULT 'operational' CHECK (status IN (
                    'operational', 'full', 'closed', 'delayed'
                  )),
  next_departure  TIMESTAMPTZ,          -- for shuttle/bus
  route_info      TEXT,
  location        GEOGRAPHY(POINT, 4326),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.11 Entity Relationship Diagram

```
sites (1) ──── (N) zones (1) ──── (N) geofences
  │                   │
  │                   ├──── (N) density_readings
  │                   │
  ├──── (N) incidents ┘
  │         │
  │         └──── (N) alerts
  │
  ├──── (N) weather_data
  ├──── (N) transport_status
  ├──── (N) sos_requests
  └──── (N) users
```

---

## 4. Roles & RBAC

| Role | Can Access | Cannot Access |
|------|-----------|---------------|
| `visitor` | Public endpoints (zones, weather, transport, SOS) — no login | Any dashboard, admin, incident management |
| `manager` | Manager Dashboard, incidents (verify/dismiss), alerts (compose/dispatch), zones (CRUD), all public endpoints | Responder-only status updates, user management |
| `responder` | Responder Console, incidents (view, acknowledge, update status), navigation | Alert composition, zone management, user management |
| `admin` | Everything | — |

**Auth flow:** JWT-based. Access token (15 min TTL) + Refresh token (7 day TTL).

---

## 5. API Contracts — Backend (NestJS)

Base URL: `http://localhost:3001/api`

All responses follow this envelope:

```typescript
{
  success: boolean;
  data: T | null;
  message: string;
  error?: string;
}
```

### 5.1 Auth Module — `AYUSH`

#### `POST /api/auth/login`
- **Auth:** Public
- **Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```
- **Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "string (JWT)",
    "refreshToken": "string (JWT)",
    "user": {
      "id": "uuid",
      "email": "string",
      "name": "string",
      "role": "manager | responder | admin",
      "siteId": "uuid"
    }
  },
  "message": "Login successful"
}
```
- **Errors:** 401 Invalid credentials

#### `POST /api/auth/refresh`
- **Auth:** Public (requires valid refresh token)
- **Request Body:**
```json
{
  "refreshToken": "string"
}
```
- **Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "string (JWT)",
    "refreshToken": "string (JWT)"
  },
  "message": "Token refreshed"
}
```
- **Errors:** 401 Invalid/expired refresh token

#### `GET /api/auth/me`
- **Auth:** JWT (any role)
- **Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "string",
    "name": "string",
    "role": "string",
    "siteId": "uuid",
    "phone": "string | null"
  },
  "message": "User profile retrieved"
}
```

---

### 5.2 Zones Module — `AYUSH`

#### `GET /api/zones`
- **Auth:** Public
- **Query Params:** `siteId` (required, uuid)
- **Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "siteId": "uuid",
      "name": "string",
      "zoneType": "entry_exit | high_risk | restricted | medical_aid | safe_assembly | corridor | parking | general",
      "polygon": { "type": "Polygon", "coordinates": [[[lng, lat], ...]] },
      "maxCapacity": 500,
      "currentDensity": 320,
      "densityStatus": "green | yellow | orange | red",
      "isActive": true,
      "updatedAt": "ISO8601"
    }
  ],
  "message": "Zones retrieved"
}
```

#### `GET /api/zones/:id`
- **Auth:** Public
- **Response (200):** Single zone object (same shape as above)
- **Errors:** 404 Zone not found

#### `POST /api/zones`
- **Auth:** JWT (manager, admin)
- **Request Body:**
```json
{
  "siteId": "uuid",
  "name": "string",
  "zoneType": "string",
  "polygon": { "type": "Polygon", "coordinates": [[[lng, lat], ...]] },
  "maxCapacity": 500
}
```
- **Response (201):** Created zone object
- **Errors:** 400 Validation error, 403 Insufficient role

#### `PUT /api/zones/:id`
- **Auth:** JWT (manager, admin)
- **Request Body:** Same as POST (partial updates allowed)
- **Response (200):** Updated zone object

#### `GET /api/zones/:id/density`
- **Auth:** Public
- **Query Params:** `from` (ISO8601, optional), `to` (ISO8601, optional), `limit` (number, default 100)
- **Response (200):**
```json
{
  "success": true,
  "data": {
    "zoneId": "uuid",
    "zoneName": "string",
    "currentDensity": 320,
    "maxCapacity": 500,
    "densityStatus": "yellow",
    "readings": [
      {
        "headcount": 320,
        "flowRate": 45.2,
        "flowVelocity": 0.8,
        "recordedAt": "ISO8601"
      }
    ]
  },
  "message": "Density readings retrieved"
}
```

#### `PATCH /api/zones/:id/density`
- **Auth:** Internal / JWT (manager, admin)
- **Request Body:**
```json
{
  "headcount": 320,
  "flowRate": 45.2,
  "flowVelocity": 0.8,
  "source": "sensor | simulation | manual"
}
```
- **Response (200):** Updated zone with new density status
- **Side Effect:** Emits `zone:density:update` via WebSocket

---

### 5.3 Geofences Module — `AYUSH`

#### `GET /api/geofences`
- **Auth:** Public
- **Query Params:** `siteId` (required), `zoneId` (optional)
- **Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "zoneId": "uuid",
      "name": "string",
      "fenceType": "boundary | restricted | alert_radius",
      "polygon": { "type": "Polygon", "coordinates": [[[lng, lat], ...]] },
      "alertOnEntry": false,
      "alertOnExit": false,
      "isActive": true
    }
  ],
  "message": "Geofences retrieved"
}
```

#### `POST /api/geofences`
- **Auth:** JWT (manager, admin)
- **Request Body:**
```json
{
  "zoneId": "uuid",
  "name": "string",
  "fenceType": "string",
  "polygon": { "type": "Polygon", "coordinates": [[[lng, lat], ...]] },
  "alertOnEntry": false,
  "alertOnExit": false
}
```
- **Response (201):** Created geofence object

#### `PUT /api/geofences/:id`
- **Auth:** JWT (manager, admin)
- **Request Body:** Same as POST
- **Response (200):** Updated geofence object

#### `DELETE /api/geofences/:id`
- **Auth:** JWT (manager, admin)
- **Response (200):** `{ "success": true, "data": null, "message": "Geofence deleted" }`

---

### 5.4 Weather Module — `AYUSH`

#### `GET /api/weather/:siteId`
- **Auth:** Public
- **Response (200):**
```json
{
  "success": true,
  "data": {
    "siteId": "uuid",
    "current": {
      "temperature": 28.5,
      "humidity": 75,
      "windSpeed": 12.3,
      "windDirection": "NW",
      "condition": "partly_cloudy",
      "precipitation": 0,
      "visibility": 8.5
    },
    "hazard": {
      "level": "none | low | moderate | high | severe",
      "type": "flood | landslide | lightning | heat | null",
      "advisory": "string | null"
    },
    "forecast": [
      {
        "time": "ISO8601",
        "temperature": 26,
        "condition": "rain",
        "precipitation": 15
      }
    ],
    "fetchedAt": "ISO8601"
  },
  "message": "Weather data retrieved"
}
```

---

### 5.5 Incidents Module — `AKSHAT`

#### `GET /api/incidents`
- **Auth:** JWT (manager, responder, admin)
- **Query Params:** `siteId` (required), `status` (optional), `severity` (optional), `limit` (default 50), `offset` (default 0)
- **Response (200):**
```json
{
  "success": true,
  "data": {
    "incidents": [
      {
        "id": "uuid",
        "siteId": "uuid",
        "zoneId": "uuid | null",
        "zoneName": "string | null",
        "incidentType": "crush_precursor | medical_emergency | geofence_breach | environmental_hazard | stampede | fire | other",
        "severity": "low | medium | high | critical",
        "status": "flagged | verified | dismissed | responding | resolved",
        "title": "string",
        "description": "string | null",
        "location": { "type": "Point", "coordinates": [lng, lat] },
        "confidenceScore": 0.92,
        "detectionSource": "ai | manual | sos",
        "verifiedBy": "uuid | null",
        "verifiedAt": "ISO8601 | null",
        "resolvedAt": "ISO8601 | null",
        "createdAt": "ISO8601",
        "updatedAt": "ISO8601"
      }
    ],
    "total": 25,
    "limit": 50,
    "offset": 0
  },
  "message": "Incidents retrieved"
}
```

#### `GET /api/incidents/:id`
- **Auth:** JWT (manager, responder, admin)
- **Response (200):** Single incident object

#### `POST /api/incidents`
- **Auth:** JWT (manager, admin) or Internal (from AI/ML service)
- **Request Body:**
```json
{
  "siteId": "uuid",
  "zoneId": "uuid | null",
  "incidentType": "string",
  "severity": "string",
  "title": "string",
  "description": "string | null",
  "location": { "latitude": 25.4358, "longitude": 81.8463 },
  "confidenceScore": 0.92,
  "detectionSource": "ai | manual"
}
```
- **Response (201):** Created incident object
- **Side Effect:** Emits `incident:new` via WebSocket

#### `PATCH /api/incidents/:id/verify`
- **Auth:** JWT (manager, admin)
- **Request Body:**
```json
{
  "action": "verify | dismiss"
}
```
- **Response (200):** Updated incident with `status: "verified"` or `status: "dismissed"`
- **Side Effect:** If verified, emits `incident:verified` via WebSocket

#### `PATCH /api/incidents/:id/status`
- **Auth:** JWT (responder, manager, admin)
- **Request Body:**
```json
{
  "status": "responding | resolved"
}
```
- **Response (200):** Updated incident
- **Side Effect:** Emits `incident:status:update` via WebSocket

---

### 5.6 Alerts Module — `AKSHAT`

#### `GET /api/alerts`
- **Auth:** JWT (manager, responder, admin)
- **Query Params:** `siteId` (required), `status` (optional), `severity` (optional)
- **Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "incidentId": "uuid | null",
      "siteId": "uuid",
      "targetZoneId": "uuid | null",
      "targetZoneName": "string | null",
      "severity": "informational | advisory | warning | critical",
      "title": "string",
      "message": "string",
      "messageHi": "string | null",
      "channels": ["push", "sms", "dashboard"],
      "status": "draft | dispatched | acknowledged | escalated | expired",
      "createdBy": "uuid",
      "acknowledgedBy": "uuid | null",
      "acknowledgedAt": "ISO8601 | null",
      "createdAt": "ISO8601"
    }
  ],
  "message": "Alerts retrieved"
}
```

#### `POST /api/alerts`
- **Auth:** JWT (manager, admin)
- **Request Body:**
```json
{
  "incidentId": "uuid | null",
  "siteId": "uuid",
  "targetZoneId": "uuid | null",
  "severity": "informational | advisory | warning | critical",
  "title": "string",
  "message": "string",
  "channels": ["push", "sms", "dashboard"]
}
```
- **Response (201):** Created alert object (translation auto-requested from AI/ML service)
- **Side Effect:** Emits `alert:new` via WebSocket. If `channels` includes `sms`, triggers SMS dispatch (simulated in MVP).

#### `PATCH /api/alerts/:id/acknowledge`
- **Auth:** JWT (manager, responder, admin)
- **Response (200):** Updated alert with `status: "acknowledged"`
- **Side Effect:** Emits `alert:acknowledged` via WebSocket

---

### 5.7 SOS Module — `AKSHAT`

#### `POST /api/sos`
- **Auth:** Public (no login required)
- **Request Body:**
```json
{
  "siteId": "uuid | null",
  "latitude": 25.4358,
  "longitude": 81.8463,
  "message": "string | null",
  "contactPhone": "string | null"
}
```
- **Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "pending",
    "message": "SOS received. Help is on the way.",
    "createdAt": "ISO8601"
  },
  "message": "SOS request created"
}
```
- **Side Effect:** Creates an incident with `detectionSource: "sos"`. Emits `sos:new` via WebSocket.

#### `GET /api/sos`
- **Auth:** JWT (manager, responder, admin)
- **Query Params:** `siteId` (required), `status` (optional)
- **Response (200):** Array of SOS request objects

#### `PATCH /api/sos/:id/status`
- **Auth:** JWT (responder, manager, admin)
- **Request Body:**
```json
{
  "status": "acknowledged | responding | resolved"
}
```
- **Response (200):** Updated SOS request

---

### 5.8 Transport Module — `AKSHAT`

#### `GET /api/transport/parking`
- **Auth:** Public
- **Query Params:** `siteId` (required)
- **Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Parking Lot A",
      "totalCapacity": 200,
      "currentOccupancy": 145,
      "status": "operational | full | closed",
      "location": { "type": "Point", "coordinates": [lng, lat] }
    }
  ],
  "message": "Parking status retrieved"
}
```

#### `GET /api/transport/shuttles`
- **Auth:** Public
- **Query Params:** `siteId` (required)
- **Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Shuttle Route 1",
      "status": "operational | delayed | closed",
      "currentOccupancy": 30,
      "totalCapacity": 50,
      "nextDeparture": "ISO8601",
      "routeInfo": "Temple Gate → Parking A → Bus Stand"
    }
  ],
  "message": "Shuttle status retrieved"
}
```

#### `PUT /api/transport/:id`
- **Auth:** JWT (manager, admin)
- **Request Body:**
```json
{
  "currentOccupancy": 150,
  "status": "operational | full | closed | delayed",
  "nextDeparture": "ISO8601 | null"
}
```
- **Response (200):** Updated transport status object

---

## 6. API Contracts — AI/ML (FastAPI)

Base URL: `http://localhost:8000/ml`

All responses follow this envelope:

```python
{
  "success": bool,
  "data": dict | None,
  "message": str
}
```

### 6.1 Forecast Routes — `SHREYASHI`

#### `POST /ml/forecast`
- **Purpose:** Get crowd density forecast for a zone
- **Request Body:**
```json
{
  "zone_id": "uuid",
  "site_id": "uuid",
  "current_density": 320,
  "max_capacity": 500,
  "hours_ahead": 6,
  "weather_condition": "clear | rain | thunderstorm | null",
  "is_festival_day": false,
  "historical_data": [
    { "timestamp": "ISO8601", "headcount": 280 }
  ]
}
```
- **Response (200):**
```json
{
  "success": true,
  "data": {
    "zone_id": "uuid",
    "forecasts": [
      {
        "timestamp": "ISO8601",
        "predicted_density": 410,
        "confidence_lower": 380,
        "confidence_upper": 440,
        "density_status": "orange",
        "alert_recommended": false
      }
    ],
    "peak_time": "ISO8601",
    "peak_density": 480,
    "model_version": "prophet-v1"
  },
  "message": "Forecast generated"
}
```

### 6.2 Weather Routes — `SHREYASHI`

#### `GET /ml/weather/current?site_lat={lat}&site_lon={lon}`
- **Purpose:** Fetch current weather from IMD
- **Response (200):**
```json
{
  "success": true,
  "data": {
    "temperature": 28.5,
    "humidity": 75,
    "wind_speed": 12.3,
    "wind_direction": "NW",
    "condition": "partly_cloudy",
    "precipitation": 0,
    "visibility": 8.5,
    "forecast_24h": [
      { "time": "ISO8601", "temperature": 26, "condition": "rain", "precipitation": 15 }
    ]
  },
  "message": "Weather data fetched"
}
```

#### `POST /ml/weather/hazards`
- **Purpose:** Evaluate hazard level based on weather + site characteristics
- **Request Body:**
```json
{
  "site_id": "uuid",
  "weather": { "temperature": 28.5, "humidity": 75, "wind_speed": 12.3, "precipitation": 30, "condition": "thunderstorm" },
  "site_features": { "has_river": true, "has_slopes": false, "elevation_m": 250 }
}
```
- **Response (200):**
```json
{
  "success": true,
  "data": {
    "hazard_level": "moderate",
    "hazard_type": "flood",
    "advisory": "Heavy rain expected. River-adjacent zones may experience flooding. Consider closing Zone B access.",
    "affected_zone_types": ["high_risk", "corridor"]
  },
  "message": "Hazard assessment complete"
}
```

### 6.3 Anomaly Routes — `DIYA`

#### `POST /ml/anomaly/detect`
- **Purpose:** Analyze density + flow data for crush precursors and anomalies
- **Request Body:**
```json
{
  "zone_id": "uuid",
  "readings": [
    {
      "timestamp": "ISO8601",
      "headcount": 320,
      "flow_rate": 45.2,
      "flow_velocity": 0.8
    }
  ],
  "max_capacity": 500,
  "zone_type": "high_risk"
}
```
- **Response (200):**
```json
{
  "success": true,
  "data": {
    "zone_id": "uuid",
    "is_anomaly": true,
    "anomaly_type": "crush_precursor | stationary_crowd | reverse_flow | density_spike | null",
    "confidence_score": 0.92,
    "severity": "critical",
    "description": "High density (320/500) with declining flow velocity (0.8 → 0.3 m/s) — classic crush precursor pattern",
    "recommended_action": "Immediate verification and geofenced crowd redirection recommended"
  },
  "message": "Anomaly detection complete"
}
```

### 6.4 Bhashini Routes — `DIYA`

#### `POST /ml/bhashini/translate`
- **Purpose:** Translate text between languages
- **Request Body:**
```json
{
  "text": "Avoid Zone C staircase. Use Zone D corridor instead.",
  "source_language": "en",
  "target_language": "hi"
}
```
- **Response (200):**
```json
{
  "success": true,
  "data": {
    "translated_text": "ज़ोन C की सीढ़ियों से बचें। इसके बजाय ज़ोन D कॉरिडोर का उपयोग करें।",
    "source_language": "en",
    "target_language": "hi"
  },
  "message": "Translation complete"
}
```

#### `POST /ml/bhashini/tts`
- **Purpose:** Text to speech
- **Request Body:**
```json
{
  "text": "string",
  "language": "hi"
}
```
- **Response (200):**
```json
{
  "success": true,
  "data": {
    "audio_base64": "base64-encoded-audio",
    "format": "wav",
    "language": "hi"
  },
  "message": "Speech generated"
}
```

#### `POST /ml/bhashini/stt`
- **Purpose:** Speech to text
- **Request Body:**
```json
{
  "audio_base64": "base64-encoded-audio",
  "language": "hi"
}
```
- **Response (200):**
```json
{
  "success": true,
  "data": {
    "text": "string",
    "language": "hi",
    "confidence": 0.95
  },
  "message": "Transcription complete"
}
```

---

## 7. WebSocket Events

Backend WebSocket Gateway (Socket.io) at `ws://localhost:3001`

Clients join rooms by `siteId`. Events are scoped to rooms.

### 7.1 Server → Client Events

| Event | Payload | Triggered When |
|-------|---------|---------------|
| `zone:density:update` | `{ zoneId, currentDensity, densityStatus, flowRate, flowVelocity, updatedAt }` | Zone density reading is updated |
| `incident:new` | Full incident object | New incident is created (AI or manual) |
| `incident:verified` | `{ incidentId, verifiedBy, verifiedAt, status }` | Manager verifies an incident |
| `incident:status:update` | `{ incidentId, status, updatedAt }` | Incident status changes |
| `alert:new` | Full alert object | New alert is dispatched |
| `alert:acknowledged` | `{ alertId, acknowledgedBy, acknowledgedAt }` | Alert is acknowledged |
| `sos:new` | `{ id, location, message, createdAt }` | New SOS request received |
| `responder:status:update` | `{ incidentId, responderId, status, updatedAt }` | Responder updates their status |

### 7.2 Client → Server Events

| Event | Payload | Purpose |
|-------|---------|---------|
| `join:site` | `{ siteId }` | Subscribe to a site's real-time updates |
| `leave:site` | `{ siteId }` | Unsubscribe from a site |

---

## 8. Shared TypeScript DTOs & Interfaces (Backend)

Location: `backend/src/common/`

### `common/interfaces/api-response.interface.ts`

```typescript
export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message: string;
  error?: string;
}
```

### `common/interfaces/user.interface.ts`

```typescript
export interface IUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  siteId: string | null;
  phone: string | null;
}

export enum UserRole {
  MANAGER = 'manager',
  RESPONDER = 'responder',
  ADMIN = 'admin',
}
```

### `common/interfaces/zone.interface.ts`

```typescript
export interface IZone {
  id: string;
  siteId: string;
  name: string;
  zoneType: ZoneType;
  polygon: GeoJSON.Polygon;
  maxCapacity: number;
  currentDensity: number;
  densityStatus: DensityStatus;
  isActive: boolean;
  updatedAt: string;
}

export enum ZoneType {
  ENTRY_EXIT = 'entry_exit',
  HIGH_RISK = 'high_risk',
  RESTRICTED = 'restricted',
  MEDICAL_AID = 'medical_aid',
  SAFE_ASSEMBLY = 'safe_assembly',
  CORRIDOR = 'corridor',
  PARKING = 'parking',
  GENERAL = 'general',
}

export enum DensityStatus {
  GREEN = 'green',
  YELLOW = 'yellow',
  ORANGE = 'orange',
  RED = 'red',
}
```

### `common/interfaces/incident.interface.ts`

```typescript
export interface IIncident {
  id: string;
  siteId: string;
  zoneId: string | null;
  zoneName: string | null;
  incidentType: IncidentType;
  severity: Severity;
  status: IncidentStatus;
  title: string;
  description: string | null;
  location: GeoJSON.Point | null;
  confidenceScore: number | null;
  detectionSource: DetectionSource;
  verifiedBy: string | null;
  verifiedAt: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export enum IncidentType {
  CRUSH_PRECURSOR = 'crush_precursor',
  MEDICAL_EMERGENCY = 'medical_emergency',
  GEOFENCE_BREACH = 'geofence_breach',
  ENVIRONMENTAL_HAZARD = 'environmental_hazard',
  STAMPEDE = 'stampede',
  FIRE = 'fire',
  OTHER = 'other',
}

export enum IncidentStatus {
  FLAGGED = 'flagged',
  VERIFIED = 'verified',
  DISMISSED = 'dismissed',
  RESPONDING = 'responding',
  RESOLVED = 'resolved',
}

export enum Severity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum DetectionSource {
  AI = 'ai',
  MANUAL = 'manual',
  SOS = 'sos',
}
```

### `common/interfaces/alert.interface.ts`

```typescript
export interface IAlert {
  id: string;
  incidentId: string | null;
  siteId: string;
  targetZoneId: string | null;
  targetZoneName: string | null;
  severity: AlertSeverity;
  title: string;
  message: string;
  messageHi: string | null;
  channels: AlertChannel[];
  status: AlertStatus;
  createdBy: string;
  acknowledgedBy: string | null;
  acknowledgedAt: string | null;
  createdAt: string;
}

export enum AlertSeverity {
  INFORMATIONAL = 'informational',
  ADVISORY = 'advisory',
  WARNING = 'warning',
  CRITICAL = 'critical',
}

export enum AlertStatus {
  DRAFT = 'draft',
  DISPATCHED = 'dispatched',
  ACKNOWLEDGED = 'acknowledged',
  ESCALATED = 'escalated',
  EXPIRED = 'expired',
}

export enum AlertChannel {
  PUSH = 'push',
  SMS = 'sms',
  DASHBOARD = 'dashboard',
  PA_SYSTEM = 'pa_system',
}
```

### `common/interfaces/sos.interface.ts`

```typescript
export interface ISosRequest {
  id: string;
  siteId: string | null;
  location: GeoJSON.Point | null;
  message: string | null;
  contactPhone: string | null;
  status: SosStatus;
  assignedTo: string | null;
  createdAt: string;
  updatedAt: string;
}

export enum SosStatus {
  PENDING = 'pending',
  ACKNOWLEDGED = 'acknowledged',
  RESPONDING = 'responding',
  RESOLVED = 'resolved',
}
```

### `common/constants.ts`

```typescript
export const DENSITY_THRESHOLDS = {
  GREEN_MAX: 0.5,   // 0–50% of maxCapacity
  YELLOW_MAX: 0.7,  // 50–70%
  ORANGE_MAX: 0.9,  // 70–90%
  // Above 90% = RED
};

export const ALERT_ESCALATION_TIMEOUT_MS = 60_000; // 60 seconds

export const JWT_ACCESS_EXPIRY = '15m';
export const JWT_REFRESH_EXPIRY = '7d';

export const SUPPORTED_LANGUAGES = [
  'en', 'hi', 'ta', 'te', 'bn', 'mr', 'gu', 'kn',
  'ml', 'pa', 'or', 'as', 'ur',
] as const;

export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

export const DEFAULT_LANGUAGE = 'en';

export const AI_ML_SERVICE_URL = process.env.AI_ML_SERVICE_URL || 'http://localhost:8000/ml';
```

---

## 9. Shared TypeScript Types (Frontend)

Location: `frontend/src/shared/`

### `shared/types/`

Frontend types mirror the backend interfaces exactly (same shapes). Import from this folder, NOT from the backend directly.

File structure:
```
shared/types/
├── index.ts            ← re-exports everything
├── api.types.ts        ← ApiResponse<T> envelope
├── user.types.ts       ← IUser, UserRole
├── zone.types.ts       ← IZone, ZoneType, DensityStatus
├── incident.types.ts   ← IIncident, IncidentType, IncidentStatus, Severity
├── alert.types.ts      ← IAlert, AlertSeverity, AlertStatus, AlertChannel
├── sos.types.ts        ← ISosRequest, SosStatus
├── weather.types.ts    ← IWeatherData, IHazard
└── transport.types.ts  ← ITransportStatus
```

### `shared/api/`

```
shared/api/
├── client.ts           ← Base fetch wrapper with auth header injection
├── auth.api.ts         ← login(), refresh(), getMe()
├── zones.api.ts        ← getZones(), getZone(), createZone(), updateZone(), getZoneDensity()
├── incidents.api.ts    ← getIncidents(), getIncident(), createIncident(), verifyIncident(), updateIncidentStatus()
├── alerts.api.ts       ← getAlerts(), createAlert(), acknowledgeAlert()
├── sos.api.ts          ← createSos(), getSosRequests(), updateSosStatus()
├── weather.api.ts      ← getWeather()
└── transport.api.ts    ← getParking(), getShuttles()
```

### `shared/constants.ts`

```typescript
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';
```

---

## 10. Shared Pydantic Schemas (AI/ML)

Location: `ai-ml/shared/schemas.py`

```python
from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum
from datetime import datetime


class DensityStatusEnum(str, Enum):
    GREEN = "green"
    YELLOW = "yellow"
    ORANGE = "orange"
    RED = "red"


class SeverityEnum(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class AnomalyTypeEnum(str, Enum):
    CRUSH_PRECURSOR = "crush_precursor"
    STATIONARY_CROWD = "stationary_crowd"
    REVERSE_FLOW = "reverse_flow"
    DENSITY_SPIKE = "density_spike"


class HazardLevelEnum(str, Enum):
    NONE = "none"
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    SEVERE = "severe"


# --- Forecast ---

class DensityReading(BaseModel):
    timestamp: datetime
    headcount: int


class ForecastRequest(BaseModel):
    zone_id: str
    site_id: str
    current_density: int
    max_capacity: int
    hours_ahead: int = 6
    weather_condition: Optional[str] = None
    is_festival_day: bool = False
    historical_data: list[DensityReading] = []


class ForecastPoint(BaseModel):
    timestamp: datetime
    predicted_density: int
    confidence_lower: int
    confidence_upper: int
    density_status: DensityStatusEnum
    alert_recommended: bool


class ForecastResponse(BaseModel):
    zone_id: str
    forecasts: list[ForecastPoint]
    peak_time: datetime
    peak_density: int
    model_version: str = "prophet-v1"


# --- Anomaly Detection ---

class ReadingInput(BaseModel):
    timestamp: datetime
    headcount: int
    flow_rate: float
    flow_velocity: float


class AnomalyRequest(BaseModel):
    zone_id: str
    readings: list[ReadingInput]
    max_capacity: int
    zone_type: str = "general"


class AnomalyResponse(BaseModel):
    zone_id: str
    is_anomaly: bool
    anomaly_type: Optional[AnomalyTypeEnum] = None
    confidence_score: float = 0.0
    severity: Optional[SeverityEnum] = None
    description: str = ""
    recommended_action: str = ""


# --- Weather ---

class WeatherResponse(BaseModel):
    temperature: float
    humidity: float
    wind_speed: float
    wind_direction: str
    condition: str
    precipitation: float
    visibility: float
    forecast_24h: list[dict] = []


class HazardRequest(BaseModel):
    site_id: str
    weather: dict
    site_features: dict


class HazardResponse(BaseModel):
    hazard_level: HazardLevelEnum
    hazard_type: Optional[str] = None
    advisory: Optional[str] = None
    affected_zone_types: list[str] = []


# --- Bhashini ---

class TranslateRequest(BaseModel):
    text: str
    source_language: str = "en"
    target_language: str = "hi"


class TranslateResponse(BaseModel):
    translated_text: str
    source_language: str
    target_language: str


class TTSRequest(BaseModel):
    text: str
    language: str = "hi"


class TTSResponse(BaseModel):
    audio_base64: str
    format: str = "wav"
    language: str


class STTRequest(BaseModel):
    audio_base64: str
    language: str = "hi"


class STTResponse(BaseModel):
    text: str
    language: str
    confidence: float


# --- Generic API Envelope ---

class ApiEnvelope(BaseModel):
    success: bool = True
    data: Optional[dict] = None
    message: str = ""
```

---

## 11. Shared Constants

### `ai-ml/shared/config.py`

```python
import os

BACKEND_API_URL = os.getenv("BACKEND_API_URL", "http://localhost:3001/api")

BHASHINI_API_KEY = os.getenv("BHASHINI_API_KEY", "")
BHASHINI_USER_ID = os.getenv("BHASHINI_USER_ID", "")
BHASHINI_BASE_URL = os.getenv("BHASHINI_BASE_URL", "https://meity-auth.ulcacontrib.org")

IMD_API_URL = os.getenv("IMD_API_URL", "https://api.weather.gov.in")  # placeholder

SUPPORTED_LANGUAGES = [
    "en", "hi", "ta", "te", "bn", "mr", "gu", "kn",
    "ml", "pa", "or", "as", "ur",
]

DENSITY_THRESHOLDS = {
    "green_max": 0.5,
    "yellow_max": 0.7,
    "orange_max": 0.9,
}
```

---

## 12. Environment Variables

### Backend `.env`

```env
# Server
PORT=3001
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=safesight
DB_PASSWORD=safesight_dev
DB_NAME=safesight

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-jwt-secret-change-in-production
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# AI/ML Service
AI_ML_SERVICE_URL=http://localhost:8000/ml

# SMS Gateway (simulated in MVP)
SMS_GATEWAY_API_KEY=
SMS_GATEWAY_URL=
```

### Frontend `.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_WS_URL=http://localhost:3001
NEXT_PUBLIC_MAP_TILE_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
```

### AI/ML `.env`

```env
BACKEND_API_URL=http://localhost:3001/api
BHASHINI_API_KEY=
BHASHINI_USER_ID=
BHASHINI_BASE_URL=https://meity-auth.ulcacontrib.org
IMD_API_URL=https://api.weather.gov.in
```

---

## 13. Coding Conventions

### Backend (NestJS + TypeScript)

- **File naming:** `kebab-case` → `zone.controller.ts`, `alert.service.ts`
- **Class naming:** `PascalCase` → `ZoneController`, `AlertService`
- **One module = one folder** with: `*.module.ts`, `*.controller.ts`, `*.service.ts`
- **All DTOs** import from `common/interfaces/`
- **Error responses:** NestJS built-in exceptions (`NotFoundException`, `ForbiddenException`, etc.)
- **Environment variables:** via `@nestjs/config`, stored in `.env` (not committed)
- **Indentation:** 2 spaces
- **Quotes:** Single quotes
- **No `console.log`** — use NestJS `Logger`

### Frontend (Next.js + TypeScript)

- **File naming:** `kebab-case` for files, `PascalCase` for components
- **Components:** One component per file, export default
- **Styling:** Tailwind CSS utility classes
- **API calls:** Centralized in `shared/api/`
- **State:** React hooks + Context API
- **Pages:** Next.js App Router with route groups `(visitor)`, `(dashboard)`, `(responder)`
- **Indentation:** 2 spaces
- **Quotes:** Single quotes

### AI/ML (Python + FastAPI)

- **File naming:** `snake_case` → `forecast_model.py`
- **Class naming:** `PascalCase`
- **Function naming:** `snake_case`
- **API models:** Pydantic v2 schemas in `shared/schemas.py`
- **Dependencies:** Listed in `requirements.txt`, pinned versions
- **Indentation:** 4 spaces
- **Quotes:** Double quotes

### Universal

- **No hardcoded URLs** — everything via env vars or constants
- **Every endpoint returns proper HTTP status codes** (200, 201, 400, 401, 403, 404, 500)
- **Commit format:** `type(scope): description`

---

## 14. Inter-Service Communication

```
Frontend (3000) ──── REST/WS ────→ Backend (3001)
                                       │
                                       │ HTTP (internal)
                                       ▼
                                   AI/ML (8000)
```

| From | To | Method | When |
|------|----|--------|------|
| Frontend | Backend | REST (fetch) | All data queries and mutations |
| Frontend | Backend | WebSocket (Socket.io) | Real-time updates (density, incidents, alerts) |
| Backend | AI/ML | HTTP POST/GET | Forecast requests, anomaly detection, translation, weather |
| AI/ML | Backend | HTTP POST | Push detected anomalies as new incidents |

### Important Rules

1. **Frontend NEVER calls AI/ML directly.** All AI/ML requests go through the Backend, which proxies them.
2. **AI/ML can call Backend** to create incidents when anomalies are detected asynchronously.
3. **WebSocket is Backend → Frontend only** (server pushes events to connected clients).
4. **All inter-service calls use the API envelopes** defined in this document.

---

> **This document is the single source of truth. Code against it. If something needs to change, discuss with the team first, make the change here, log it in STATUS.md under CONTRACT CHANGES, and notify all pods.**
