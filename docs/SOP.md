# SafeSight — Standard Operating Procedure (SOP)

## Team Blueprint — Smart India Hackathon 2026

**Project:** AI-Based Visitor Safety, Crowd & Incident Coordination for Eco and Pilgrimage Sites  
**Platform:** Progressive Web App (PWA) — Web Only  
**Duration:** August 20 – August 25, 2026 (~6 working days)  
**Team Size:** 6 members, organized in 3 pods of 2

---

## 1. TEAM STRUCTURE & POD ASSIGNMENTS

> ⚠️ **TEMPORARY WORKLOAD REALLOCATION NOTICE (Effective Aug 23, 2026):**  
> **Yashasvi** is temporarily unavailable. To ensure uninterrupted momentum, his responsibilities have been temporarily redistributed among **Aditya** (Pod A Co-Lead), **Shreyashi** (Pod C), and **Akshat** (Pod B) until Yashasvi returns.

| Pod | Focus Area | Members | Responsibilities & Status |
|-----|-----------|---------|-----------------|
| **Pod A — Frontend** | PWA, UI, Maps, Multilingual | **Aditya** (Co-Lead)<br>*(Interim Support: **Shreyashi** & **Akshat**)*<br>*(**Yashasvi** temporarily on leave)* | Next.js app, all 3 views (Visitor, Manager Dashboard, Responder Console), Leaflet maps, heatmap overlays, language toggle, offline shell, PWA setup, UI/UX |
| **Pod B — Backend** | API, Real-time, Auth | **Ayush** (Lead) & **Akshat** | NestJS API gateway, all REST endpoints, WebSocket layer, RBAC authentication, geofencing logic, SMS simulation, database setup |
| **Pod C — AI/ML + Integrations** | Intelligence Layer | **Shreyashi** & **Diya** | Crowd forecasting model (Prophet/LSTM), anomaly detection, Bhashini API integration, IMD weather API integration, FastAPI microservices, sample/simulated datasets |

---

## 2. MODULE OWNERSHIP — WHO TOUCHES WHAT

### Why This Matters
Every person uses their own personal AI agent. Two AI agents cannot see each other's work in real-time. If two AIs edit the same file, one will overwrite the other. The solution is **hard boundaries** — each person owns specific modules/folders and their AI is instructed to NEVER touch anyone else's.

### Pod B — Backend Module Split

```
backend/src/
├── modules/
│   ├── auth/            ← AYUSH ONLY       (JWT, login, token refresh)
│   ├── zones/           ← AYUSH ONLY       (zone CRUD, density endpoints)
│   ├── geofences/       ← AYUSH ONLY       (geofence CRUD, polygon logic)
│   ├── weather/         ← AYUSH ONLY       (IMD weather proxy endpoint)
│   │
│   ├── incidents/       ← AKSHAT ONLY      (incident CRUD, verification flow)
│   ├── alerts/          ← AKSHAT ONLY      (alert composition, dispatch, escalation)
│   ├── sos/             ← AKSHAT ONLY      (SOS endpoint, location sharing)
│   └── transport/       ← AKSHAT ONLY      (parking, shuttle status endpoints)
│
├── common/              ← SHARED — PRE-DEFINED, LOCKED
│   ├── dto/             ← Request/response shapes (defined in MASTER.md)
│   ├── interfaces/      ← TypeScript interfaces (defined in MASTER.md)
│   ├── constants.ts     ← Shared constants (defined in MASTER.md)
│   └── decorators/      ← Custom decorators (if needed)
│
├── database/            ← AYUSH ONLY (initial setup), then LOCKED
│   ├── entities/        ← TypeORM entities (pre-defined, locked)
│   └── migrations/      ← Database migrations
│
├── gateway/             ← AKSHAT ONLY      (WebSocket gateway for real-time)
│
├── app.module.ts        ← AYUSH ONLY       (root module, registers all modules)
└── main.ts              ← AYUSH ONLY       (entry point, bootstrap)
```

### Pod A — Frontend Module Split (With Temporary Handover)

```
frontend/src/
├── app/
│   ├── (visitor)/           ← ADITYA (Interim for Yashasvi)  (visitor landing, live heatmap view)
│   ├── (dashboard)/         ← ADITYA ONLY                   (site manager dashboard)
│   ├── (responder)/         ← ADITYA ONLY                   (emergency responder console)
│   ├── layout.tsx           ← ADITYA (Interim for Yashasvi)  (root layout, theme, fonts)
│   └── page.tsx             ← ADITYA (Interim for Yashasvi)  (landing page / visitor home)
│
├── components/
│   ├── map/                 ← AKSHAT (Interim for Yashasvi)  (MapView, ZoneHeatmap, zone overlays)
│   ├── weather/             ← SHREYASHI (Interim for Yashasvi) (WeatherWidget, hazard overlays)
│   ├── transport/           ← AKSHAT (Interim for Yashasvi)  (ParkingStatus, ShuttleInfo)
│   ├── language/            ← SHREYASHI (Interim for Yashasvi) (LanguageSwitcher, i18n setup)
│   ├── visitor/             ← AKSHAT (Interim for Yashasvi)  (SOSButton, SafetyEssentials)
│   │
│   ├── incidents/           ← ADITYA ONLY                   (IncidentCard, IncidentQueue)
│   ├── alerts/              ← ADITYA ONLY                   (AlertComposer, AlertBanner)
│   ├── responder/           ← ADITYA ONLY                   (ResponderFeed, NavigationPanel)
│   ├── dashboard/           ← ADITYA ONLY                   (DashboardLayout, AnalyticsPanel)
│   └── auth/                ← ADITYA ONLY                   (LoginForm, RoleGuard)
│
├── shared/                  ← SHARED — PRE-DEFINED, LOCKED
│   ├── types/               ← TypeScript types matching backend DTOs
│   ├── api/                 ← API client functions (fetch wrappers)
│   ├── hooks/               ← Shared React hooks
│   └── constants.ts         ← API base URL, config
│
├── styles/                  ← ADITYA (Interim for Yashasvi)  (global styles, design tokens)
├── public/                  ← ADITYA (Interim for Yashasvi)  (PWA manifest, icons, offline assets)
└── i18n/                    ← SHREYASHI (Interim for Yashasvi) (translation JSON files)
```

### Pod C — AI/ML Module Split

```
ai-ml/
├── forecast/                ← SHREYASHI ONLY  (Prophet/LSTM crowd forecasting)
│   ├── model.py
│   ├── train.py
│   ├── predict.py
│   └── data/                ← Sample/historical crowd datasets
│
├── anomaly/                 ← DIYA ONLY       (Isolation Forest / anomaly detection)
│   ├── detector.py
│   ├── patterns.py          ← Crush precursor pattern definitions
│   └── data/                ← Simulated anomaly datasets
│
├── bhashini/                ← DIYA ONLY       (Bhashini API wrapper)
│   ├── translate.py
│   ├── tts.py               ← Text-to-speech
│   └── stt.py               ← Speech-to-text
│
├── weather/                 ← SHREYASHI ONLY  (IMD API wrapper + hazard logic)
│   ├── imd_client.py
│   └── hazard_overlay.py
│
├── api/                     ← SHARED (one person sets up FastAPI app, both add routes)
│   ├── main.py              ← SHREYASHI ONLY  (FastAPI app entry)
│   ├── forecast_routes.py   ← SHREYASHI ONLY
│   ├── anomaly_routes.py    ← DIYA ONLY
│   ├── bhashini_routes.py   ← DIYA ONLY
│   └── weather_routes.py    ← SHREYASHI ONLY
│
├── shared/                  ← SHARED — PRE-DEFINED, LOCKED
│   ├── schemas.py           ← Pydantic request/response models
│   └── config.py            ← API keys, constants
│
├── requirements.txt
└── Dockerfile
```

### The Golden Rule

> **Your AI agent must be told: "I ONLY work in MY modules. I NEVER create, edit, or delete files in the other person's modules. If I need something from their module, I import from it but never modify it."**

---

## 3. THE `common/` AND `shared/` FOLDERS

Every pod has a `common/` or `shared/` folder. These contain:
- Data shapes (DTOs, interfaces, Pydantic models)
- Constants (API URLs, config values)
- Shared utilities

### Rules for shared folders:
1. They are **pre-defined before day 1** in the MASTER.md
2. They are **created once** by the pod lead during initial setup
3. After creation, they are **effectively read-only** — no AI modifies them
4. If a change is needed, the **two pod members discuss it on call**, one person makes the change, the other pulls
5. Any change to shared folders **must also be logged** in the root STATUS.md under INTERFACE CHANGES

---

## 4. GIT WORKFLOW

### Repository Structure
One monorepo with clear folder boundaries:

```
safesight/                   ← repo root
├── frontend/                ← Pod A's territory
├── backend/                 ← Pod B's territory
├── ai-ml/                   ← Pod C's territory
├── shared-contracts/        ← API contracts, DB schema (read-only reference)
├── docs/                    ← All reference documents
│   ├── PRD.md               ← Product Requirements Document (the WHAT)
│   ├── MASTER.md            ← Technical bible (the HOW)
│   └── SOP.md               ← Operating procedure (the WORKFLOW)
├── STATUS.md                ← Root-level cross-pod status (all 6 update)
├── docker-compose.yml       ← Runs all services together
├── .gitignore
└── README.md
```

Each pod folder also contains its own `STATUS.md` for intra-pod coordination.

### Branch Strategy

```
main                 ← Always deployable. Merge only at integration checkpoints.
  │
  └── develop        ← Integration branch. All pods merge here.
       │
       ├── pod-a/visitor-view          ← Yashasvi's feature branch
       ├── pod-a/manager-dashboard     ← Aditya's feature branch
       ├── pod-b/auth-and-zones        ← Ayush's feature branch
       ├── pod-b/incidents-and-alerts  ← Akshat's feature branch
       ├── pod-c/forecast-model        ← Shreyashi's feature branch
       └── pod-c/anomaly-bhashini      ← Diya's feature branch
```

### Step-by-Step Git Flow

**Starting a new feature:**
```bash
git checkout develop
git pull origin develop
git checkout -b pod-b/auth-and-zones     # your pod prefix + feature name
```

**While working:**
```bash
git add .
git commit -m "feat(backend): add JWT auth middleware and zones CRUD"
git push origin pod-b/auth-and-zones
```

**When feature is ready:**
1. Go to GitHub → Create Pull Request from `pod-b/auth-and-zones` → `develop`
2. Your pod partner reviews (Akshat reviews Ayush's PR, vice versa)
3. If it touches `shared-contracts/` or root `STATUS.md`, tag someone from the affected pod
4. Merge the PR
5. Delete the feature branch

**Starting next feature:**
```bash
git checkout develop
git pull origin develop
git checkout -b pod-b/websocket-gateway    # new branch from fresh develop
```

**Merging develop → main:**
Only at integration checkpoints (end of Day 2, Day 4, Day 6), after verifying everything works together.

### Commit Message Convention

```
feat(backend): add crowd density endpoint
fix(frontend): fix map tile loading on 2G
feat(ai-ml): implement Prophet forecast model
chore(backend): update dependencies
docs: update root STATUS.md
```

Format: `type(scope): description`

Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`  
Scopes: `frontend`, `backend`, `ai-ml`, `shared`

### Rules

| Rule | Why |
|------|-----|
| Never push directly to `develop` or `main` | Always go through a PR |
| Each person only edits files in their assigned modules | Prevents AI conflicts |
| Pull `develop` before creating any new branch | Avoids stale-branch conflicts |
| Small, frequent PRs (not one giant PR on Day 5) | Easier to review, fewer merge conflicts |
| Always commit `STATUS.md` changes alongside your code | Keeps the coordination log in sync with actual code |

---

## 5. AI AGENT COORDINATION PROTOCOL

### The Three-Layer System

```
┌──────────────────────────────────────────────────────────┐
│                    MASTER.md                              │
│         (Read once on Day 1 — the project bible)          │
│   Architecture, API contracts, DB schema, conventions     │
│              Every AI reads this. Nobody edits.           │
└──────────────────────────────────────────────────────────┘
                          │
         ┌────────────────┼────────────────┐
         ▼                ▼                ▼
┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│ frontend/   │   │ backend/    │   │ ai-ml/      │
│ STATUS.md   │   │ STATUS.md   │   │ STATUS.md   │
│             │   │             │   │             │
│ Pod A       │   │ Pod B       │   │ Pod C       │
│ internal    │   │ internal    │   │ internal    │
│ coordination│   │ coordination│   │ coordination│
└─────────────┘   └─────────────┘   └─────────────┘
         │                │                │
         └────────────────┼────────────────┘
                          ▼
              ┌──────────────────────┐
              │  Root STATUS.md      │
              │  (Cross-pod status)  │
              │  All 6 people update │
              └──────────────────────┘
```

### What Each Person's AI Should Read (In Order)

When you start a work session, feed your AI these files in this order:

1. **`docs/PRD.md`** — Understands WHAT we're building and WHY (problem, vision, features, scope)
2. **`docs/MASTER.md`** — Understands HOW it's built (architecture, API contracts, DB schema, conventions)
3. **`docs/SOP.md`** — Understands HOW we work together (pods, git flow, coordination rules)
4. **Root `STATUS.md`** — Understands what's live across all pods, what's using mocks
5. **Your folder's `STATUS.md`** — Understands what your partner has done, what's in progress, what to not touch

### What Each Person Updates After Finishing Work

1. **Your folder's `STATUS.md`** — Move task to COMPLETED, update file map, log decisions
2. **Root `STATUS.md`** — If you made something available for other pods (e.g., an API endpoint is now live), update the cross-pod status
3. **Commit both** in the same PR as your code

### STATUS.md Template (Per-Folder)

Each pod's STATUS.md should have these sections:

```markdown
# [Pod Name] — STATUS LOG

> **Last updated:** [YYYY-MM-DD HH:MM] by [Person Name]

## 🟢 COMPLETED
| Feature | Files | Done By | Date | Notes |
|---------|-------|---------|------|-------|

## 🟡 IN PROGRESS  
| Feature | Files Being Touched | Being Done By | Notes |
|---------|--------------------|--------------| ------|

## 🔴 PENDING
| Feature | Priority | Assigned To | Dependencies |
|---------|----------|-------------|-------------|

## 📐 ARCHITECTURE DECISIONS
| Decision | Why | Decided By | Date |
|---------|-----|-----------|------|

## 🔌 INTERFACE CHANGES
| What Changed | Old | New | Affects |
|-------------|-----|-----|---------|

## 📁 FILE MAP
(List of files with one-line descriptions)

## 🐛 KNOWN ISSUES
| Issue | Severity | Workaround |
|-------|----------|-----------|
```

### Root STATUS.md Template

```markdown
# SafeSight — Project Status

> **Last updated:** [YYYY-MM-DD HH:MM] by [Person Name]

## 📊 CURRENT CHECKPOINT
Day X of 6 — Checkpoint [N]

## 🔗 CROSS-POD INTEGRATION STATUS

### Backend API Endpoints (Pod B → Pod A consumes)
| Endpoint              | Status         | Owner  | Notes                    |
|----------------------|----------------|--------|--------------------------|
| POST /api/auth/login | ✅ LIVE        | Ayush  | Returns JWT              |
| GET /api/zones       | 🟡 WIP        | Ayush  | Frontend use mock         |
| POST /api/incidents  | 🔴 NOT STARTED | Akshat |                          |

### AI/ML Endpoints (Pod C → Pod B consumes)
| Endpoint             | Status         | Owner     | Notes                   |
|---------------------|----------------|-----------|-------------------------|
| POST /ml/forecast   | 🟡 WIP        | Shreyashi | Returns dummy data       |
| POST /ml/anomaly    | 🔴 NOT STARTED | Diya      |                          |

### Frontend Pages (Pod A)
| Page                 | Status         | Owner     | Using Real API? |
|---------------------|----------------|-----------|-----------------|
| Visitor View        | 🟡 WIP        | Yashasvi  | Mock data       |
| Manager Dashboard   | 🔴 NOT STARTED | Aditya    | —               |

## 🚧 BLOCKERS
| What's Blocked          | Blocked By              | Who Needs to Act |
|------------------------|------------------------|-----------------|

## 🏗️ SHARED INFRA STATUS
| Item                    | Status  | Notes                           |
|------------------------|---------|----------------------------------|
| GitHub repo created     | ✅ / 🔴 |                                  |
| Docker compose working  | ✅ / 🔴 |                                  |
| PostgreSQL + PostGIS    | ✅ / 🔴 |                                  |
| Bhashini API key        | ✅ / 🔴 |                                  |
| IMD API access          | ✅ / 🔴 |                                  |

## 🔄 CONTRACT CHANGES LOG
| Date | What Changed | Changed By | All Pods Notified? |
|------|-------------|-----------|-------------------|
```

---

## 6. REAL-TIME CO-WORKING PROTOCOL

When two pod members are working simultaneously on a call:

### Before Starting
1. Both pull latest `develop`
2. Both read the pod's `STATUS.md`
3. Verbally confirm: "I'm working on X, you're working on Y"
4. Confirm there's **zero file overlap** between X and Y

### While Working
1. Work in your assigned modules only
2. If you need to change a shared file (`common/`, `shared/`), **say it on the call first**
3. Only ONE person changes a shared file at a time

### Sync Every 30–45 Minutes
```
Person A: "I'm pushing now"
  → git add . && git commit -m "..." && git push

Person B: "Pulling"
  → git pull origin develop (or their branch)

Then swap — Person B pushes, Person A pulls.
```

### If Both Need the Same File
**Stop.** Decide on the call who handles it. The other person waits or works on something else. Never let two AIs edit the same file independently.

---

## 7. TIMELINE & CHECKPOINTS

### Day-by-Day Plan

| Day | Date | Focus | Key Deliverables |
|-----|------|-------|-----------------|
| **Day 1** | Aug 20 | **Setup + Foundation** | Repo setup, folder structure created, `MASTER.md` finalized, all dependencies installed, skeleton apps running (Next.js hello world, NestJS hello world, FastAPI hello world), DB schema created, Docker compose working |
| **Day 2** | Aug 21 | **Core Features — Phase 1** | Pod B: Auth + Zones + Geofences endpoints. Pod A: Map view with static heatmap, language toggle. Pod C: Forecast model on sample data, IMD weather client |
| **Day 3** | Aug 22 | **Core Features — Phase 2** | Pod B: Incidents + Alerts + WebSocket. Pod A: Manager dashboard layout, incident queue UI. Pod C: Anomaly detection, Bhashini integration |
| **Day 4** | Aug 23 | **Integration Day** | Connect frontend ↔ backend ↔ AI/ML. End-to-end flow works for demo scenario. Fix integration bugs |
| **Day 5** | Aug 24 | **Polish + Demo Prep** | Offline PWA shell, SMS simulation, UI polish, multilingual demo, demo script rehearsal |
| **Day 6** | Aug 25 | **Final Testing + Submission** | Bug fixes only. Final demo rehearsal. Deployment. Submission |

### Integration Checkpoints

| Checkpoint | When | Success Criteria |
|-----------|------|-----------------|
| **CP-0** | End of Day 1 | Everyone can clone, install, and run all 3 services locally. DB is up. Folder structure matches MASTER.md |
| **CP-1** | End of Day 2 | At least 3 backend endpoints return real data. Frontend shows a map. AI/ML returns a forecast from sample data |
| **CP-2** | End of Day 3 | Backend has all core endpoints. Frontend has all 3 views (even if with mock data for some). AI/ML has forecast + anomaly detection working |
| **CP-3** | End of Day 4 | **End-to-end demo scenario works.** Sensor data → anomaly detected → manager verifies → alert dispatched → responder sees it. All connected, no mocks in the critical path |
| **CP-4** | End of Day 5 | Offline works. Multilingual works. UI is polished. Demo is rehearsed |

### Checkpoint Protocol
At each checkpoint:
1. Everyone pushes their latest work to `develop`
2. Someone (Ayush) merges `develop` → `main`
3. Everyone pulls `main` and verifies everything runs together
4. Root `STATUS.md` is updated with current state
5. Quick 15-min call to identify blockers for the next day

---

## 8. COMMUNICATION RULES

| Channel | What Goes Here |
|---------|---------------|
| **Group Chat (WhatsApp/Discord)** | Quick updates, blockers, "I'm pushing now", questions |
| **Pod Call (2 people)** | Real-time co-working, design discussions, sync pushes |
| **Root STATUS.md** | Cross-pod integration status (what's live, what's mock) |
| **Pod STATUS.md** | Intra-pod status (what I did, what I'm doing, decisions made) |
| **GitHub PRs** | Code review, merge approvals |

### Escalation Rules
- **Blocker within your pod?** → Solve it together on your pod call
- **Blocker from another pod?** (e.g., "I need an API that doesn't exist yet") → Message the group chat immediately, tag the relevant pod
- **Contract/interface change needed?** → Group chat first, get agreement, one person makes the change, everyone pulls
- **Major architecture concern?** → Discuss in group chat, decide by consensus

---

## 9. WHAT TO TELL YOUR AI AGENT

Every person should include these instructions when starting a session with their AI:

### Universal Prompt (Everyone)

```
You are helping me build a hackathon project called SafeSight — an AI-based 
crowd safety PWA for Indian pilgrimage and eco-tourism sites.

BEFORE WRITING ANY CODE, READ THESE FILES IN ORDER:
1. docs/PRD.md — the Product Requirements Document. Understand WHAT we 
   are building, the problem we're solving, the 11 functional modules, 
   the MVP scope, and the privacy-by-design constraints.
2. docs/MASTER.md — the technical bible. Understand the architecture, 
   API contracts (exact endpoints + request/response shapes), DB schema, 
   and coding conventions. This is your single source of truth for HOW 
   things are built.
3. docs/SOP.md — the operating procedure. Understand the team structure, 
   module ownership, git workflow, and coordination protocol.
4. Root STATUS.md — cross-pod integration status. Know what endpoints/
   pages are LIVE vs WIP vs NOT STARTED across all pods.
5. Your pod's STATUS.md — know what your partner has done, what files 
   they're currently touching, and what decisions they've made.

RULES YOU MUST FOLLOW:
- The PRD defines WHAT to build. Do NOT add features not in the PRD.
- MASTER.md defines HOW to build. Follow ALL API contracts exactly.
- Do NOT invent new endpoint shapes, database tables, or interfaces 
  without my explicit approval
- Do NOT modify files outside my assigned modules (listed below)
- Do NOT refactor or rename anything in the common/shared folders
- After finishing work, help me update my pod's STATUS.md
- Use the commit message format: type(scope): description
```

### Pod-Specific Addition

Each person adds their module ownership list (from Section 2) below the universal prompt.

---

## 10. CODING CONVENTIONS

These are locked. No AI deviates from these.

### Backend (NestJS + TypeScript)
- **File naming:** `kebab-case` → `zone.controller.ts`, `alert.service.ts`
- **Class naming:** `PascalCase` → `ZoneController`, `AlertService`
- **One module = one folder** with: `*.module.ts`, `*.controller.ts`, `*.service.ts`, `*.dto.ts`
- **All DTOs** defined in `common/dto/` (shared, locked)
- **Error responses** use NestJS built-in exceptions (`NotFoundException`, `ForbiddenException`, etc.)
- **Environment variables** via `@nestjs/config`, stored in `.env` (not committed)

### Frontend (Next.js + TypeScript)
- **File naming:** `kebab-case` for files, `PascalCase` for components
- **Components:** One component per file, export default
- **Styling:** Tailwind CSS utility classes (no custom CSS unless absolutely necessary)
- **API calls:** Centralized in `shared/api/` using fetch wrappers
- **State:** React hooks + Context API (no Redux for hackathon scope)
- **Pages:** Next.js App Router with route groups `(visitor)`, `(dashboard)`, `(responder)`

### AI/ML (Python + FastAPI)
- **File naming:** `snake_case` → `forecast_model.py`, `anomaly_detector.py`
- **Class naming:** `PascalCase`
- **Function naming:** `snake_case`
- **API models:** Pydantic v2 schemas in `shared/schemas.py`
- **Dependencies:** Listed in `requirements.txt`, pinned versions

### Universal
- **Indentation:** 2 spaces (TypeScript/JS), 4 spaces (Python)
- **Quotes:** Single quotes (TypeScript/JS), double quotes (Python)
- **No `console.log` in production code** — use proper logging
- **No hardcoded URLs** — everything via environment variables or constants file
- **Every endpoint must return proper HTTP status codes** (200, 201, 400, 401, 403, 404, 500)

---

## 11. DEMO SCENARIO

The entire team builds toward **one scripted end-to-end demo** (Scenario B from the PRD):

### Demo Script: "Crush Precursor at a Temple Ghat Staircase"

| Step | What Happens | Which Pod Built This |
|------|-------------|---------------------|
| 1 | Open the PWA as a visitor — no login. See a live heatmap of a temple site with multiple zones in green/yellow | Pod A (Visitor view, Map) |
| 2 | Toggle language to Hindi — entire UI switches | Pod A (i18n) + Pod C (Bhashini) |
| 3 | Show weather widget — live data from IMD | Pod A (Widget) + Pod C (IMD client) + Pod B (Weather endpoint) |
| 4 | Simulated crowd density in Zone C (staircase) starts rising. Heatmap goes yellow → orange → red | Pod C (Forecast engine) + Pod B (Zones API + WebSocket) + Pod A (Heatmap update) |
| 5 | System detects anomaly: high density + falling flow velocity = crush precursor. Incident flagged automatically | Pod C (Anomaly detection) + Pod B (Incidents API) |
| 6 | Switch to Manager Dashboard (login as manager). Incident appears in queue with confidence score and zone highlighted on map | Pod A (Dashboard) + Pod B (Incidents API + WebSocket) |
| 7 | Manager taps "Verify" — one click. Alert is auto-composed with severity and target zone | Pod A (Verify UI) + Pod B (Alerts API) |
| 8 | Visitors near Zone C get a push notification in their language: "Avoid Zone C staircase, use Zone D corridor" | Pod B (Alert dispatch) + Pod A (Push notification) |
| 9 | Switch to Responder Console (login as responder). Incident with GPS pin, severity, context. Tap "Acknowledge" → status: "en route" | Pod A (Responder Console) + Pod B (Responder API) |
| 10 | Show the status flowing back to Manager Dashboard — responder is en route | Pod B (WebSocket status sync) + Pod A (Dashboard update) |
| 11 | Disconnect network → show offline safety essentials page still works (cached by service worker) | Pod A (PWA offline) |
| 12 | Show SOS button works even offline (queues and sends when back online) | Pod A (SOS UI) + Pod B (SOS API + background sync) |

### Priority Rule
> If a feature is not in this demo script, it is **lower priority** than any feature that is. Build the demo path first, then add extras if time allows.

---

## 12. ENVIRONMENT SETUP CHECKLIST

Every team member needs these installed before Day 1:

| Tool | Version | Used By |
|------|---------|---------|
| Node.js | 20 LTS | Pod A, Pod B |
| npm / yarn | Latest | Pod A, Pod B |
| Python | 3.11+ | Pod C |
| pip | Latest | Pod C |
| PostgreSQL | 15+ with PostGIS extension | Pod B (local dev) |
| Redis | 7+ | Pod B (local dev) |
| Docker + Docker Compose | Latest | Everyone |
| Git | Latest | Everyone |
| VS Code / preferred editor | Latest | Everyone |

### Quick Start (Day 1, after repo setup)
```bash
# Clone the repo
git clone https://github.com/team-blueprint/safesight.git
cd safesight

# Start infrastructure (DB, Redis)
docker-compose up -d postgres redis

# Frontend
cd frontend && npm install && npm run dev

# Backend
cd backend && npm install && npm run start:dev

# AI/ML
cd ai-ml && pip install -r requirements.txt && uvicorn api.main:app --reload
```

---

## 13. EMERGENCY PROCEDURES

### "My code broke everything on develop"
1. Don't panic
2. `git revert <commit-hash>` your last merge
3. Push the revert
4. Fix on your feature branch
5. Re-merge when fixed

### "Two people edited the same file"
1. The person who pushed second gets the merge conflict
2. **Call your pod partner** — resolve together, never resolve blindly
3. After resolving, both pull the resolved version

### "We need to change a shared contract mid-development"
1. Announce in group chat: "Need to change X in the API contract"
2. Get verbal OK from affected pods
3. **One person** makes the change in `shared-contracts/` and `common/`
4. Update root `STATUS.md` under CONTRACT CHANGES LOG
5. Everyone pulls before continuing work

### "My AI went rogue and rewrote a bunch of stuff"
1. `git diff` to see what changed
2. `git checkout -- path/to/file` to revert specific files that shouldn't have been touched
3. Or `git stash` everything and start fresh from the last clean commit
4. Re-instruct your AI with stricter module boundaries

---

## 14. DEFINITION OF DONE

A feature is "done" when:

- [ ] Code works locally
- [ ] Follows coding conventions from Section 10
- [ ] Follows API contracts from MASTER.md
- [ ] PR created and reviewed by pod partner
- [ ] Merged to `develop`
- [ ] Pod STATUS.md updated (COMPLETED section, FILE MAP)
- [ ] Root STATUS.md updated (if it affects cross-pod integration)
- [ ] No regressions — other features still work after your merge

---

## REMEMBER

> This is a hackathon. Ship the demo. Everything serves the demo.  
> Don't gold-plate. Don't over-engineer. Don't bikeshed.  
> If it works in the demo, it's good enough.  
> You have 6 days. The demo script in Section 11 is your north star.
