# SafeSight — Root Project Status

> **Last updated:** 2026-08-23 20:05 by Akshat & Ayush (Pod B Leads)

---

## 📍 CURRENT CHECKPOINT
**Day 3 of 6 — Full Integration & End-to-End Testing (Pods A, B, C LIVE)**

---

## 🔄 CROSS-POD INTEGRATION STATUS

### AI/ML Endpoints (Pod C → Pod B & Pod A consume)
| Endpoint | Method | Status | Owner | Notes |
|---|---|---|---|---|
| `/ml/forecast` | POST | 🟢 LIVE | Shreyashi | Prophet crowd forecaster with heuristic fallback |
| `/ml/weather/current` | GET | 🟢 LIVE | Shreyashi | Current IMD weather, 24h forecast & 10m cache |
| `/ml/weather/hazards` | POST | 🟢 LIVE | Shreyashi | Multi-hazard rule matrix (flood, landslide, lightning, heat) |
| `/ml/anomaly/detect` | POST | 🟢 LIVE | Diya | IsolationForest + 2-tier crush precursor pattern rules |
| `/ml/bhashini/translate` | POST | 🟢 LIVE | Diya | Bhashini ULCA API + MyMemory free translation fallback |
| `/ml/bhashini/tts` | POST | 🟢 LIVE | Diya | Bhashini TTS + gTTS audio generation fallback |
| `/ml/bhashini/stt` | POST | 🟢 LIVE | Diya | Bhashini ASR pipeline for voice alerts/SOS |

### Backend API Endpoints (Pod B → Pod A consumes)
| Endpoint | Method | Status | Owner | Notes / Contract |
|---|---|---|---|---|
| `/api/auth/login` | POST | 🟢 LIVE | Ayush | JWT authentication & RBAC (24h tokens) |
| `/api/auth/refresh` | POST | 🟢 LIVE | Ayush | Access & refresh token rotation |
| `/api/auth/me` | GET | 🟢 LIVE | Ayush | Authenticated user profile |
| `/api/zones` | GET / POST | 🟢 LIVE | Ayush | Zone management & live density telemetry |
| `/api/zones/:id` | GET / PUT | 🟢 LIVE | Ayush | Zone details with GeoJSON polygons |
| `/api/zones/:id/density` | GET / PATCH | 🟢 LIVE | Ayush | Time-series density readings & headcount updates |
| `/api/geofences` | GET / POST / PUT / DEL | 🟢 LIVE | Ayush | Geofence boundaries and perimeter rules |
| `/api/weather/:siteId` | GET | 🟢 LIVE | Ayush | Backend proxy to AI/ML `/ml/weather/current` |
| `/api/incidents` | GET / POST | 🟢 LIVE | Akshat | Incident CRUD & detection workflow |
| `/api/incidents/:id/verify` | PATCH | 🟢 LIVE | Akshat | 1-tap verify/dismiss incident action |
| `/api/incidents/:id/status` | PATCH | 🟢 LIVE | Akshat | Responding/resolved status update |
| `/api/alerts` | GET / POST | 🟢 LIVE | Akshat | Multi-channel alert dispatch & 60s auto-escalation |
| `/api/alerts/:id/acknowledge` | PATCH | 🟢 LIVE | Akshat | 1-tap alert acknowledge flow |
| `/api/sos` | POST / GET | 🟢 LIVE | Akshat | Public emergency SOS & auto-incident creation |
| `/api/sos/:id/status` | PATCH | 🟢 LIVE | Akshat | Responder auto-assignment & status update |
| `/api/transport/parking` | GET | 🟢 LIVE | Akshat | Live parking occupancy & availability |
| `/api/transport/shuttles` | GET | 🟢 LIVE | Akshat | Live shuttle schedules & route timelines |
| `/api/transport/:id` | PUT | 🟢 LIVE | Akshat | Manager transport updates |
| WebSocket Gateway | WS | 🟢 LIVE | Akshat | Real-time Socket.io events on `ws://localhost:3001` |

### Frontend Pages (Pod A)
| Page / View | Status | Owner | Notes |
|---|---|---|---|
| Visitor Landing & PWA | 🟢 LIVE | Yashasvi | Map, heatmap density overlay, safe route finder & weather widget |
| 1-Tap SOS Emergency Console | 🟢 LIVE | Yashasvi | Direct GPS victim dispatch & emergency speed-dial |
| Manager Command Dashboard | 🟢 LIVE | Aditya | Real-time command center, KPI telemetry & hazard radar |
| Incident Triage Queue UI | 🟢 LIVE | Aditya | Live queue with 1-tap verify/dismiss |
| Responder Mobile Console | 🟢 LIVE | Aditya | Field triage, navigation & status workflow |

---

## 🚫 BLOCKERS
| What is Blocked | Blocked By | Who Needs to Act |
|---|---|---|
| None | All core microservices & routers live | Cross-pod E2E testing ready |

---

## 🛠️ SHARED INFRA & DEVELOPER TOOLS STATUS
| Item | Status | Notes |
|---|---|---|
| One-Click Startup Script (`./start.sh`) | 🟢 LIVE | Auto-launches DB, Backend (:3001), AI/ML (:8000), and opens Swagger Docs in browser |
| One-Click Shutdown Script (`./stop.sh`) | 🟢 LIVE | Gracefully terminates all background services and frees ports |
| GitHub Repository | 🟢 LIVE | All Pod A, B, and C branches integrated into `develop` |
| Docker Compose | 🟢 LIVE | PostgreSQL 15 (PostGIS 3.4) on :5432, Redis on :6379, AI/ML on :8000 |
| AI/ML Dockerfile | 🟢 LIVE | `python:3.11-slim` multi-stage build on port 8000 |
| Backend (NestJS) | 🟢 LIVE | All 18 endpoints + WebSocket Gateway on port 3001 |
| Frontend (Next.js PWA) | 🟢 LIVE | Running on port 3000 |
| Swagger API Docs | 🟢 LIVE | Interactive docs at `http://localhost:3001/api/docs` |
| Bhashini Fallback | 🟢 LIVE | MyMemory + gTTS active for live demo without MeitY keys |
| IMD Weather Fallback | 🟢 LIVE | Real-time realistic weather synthesis active |

---

## 📝 CONTRACT CHANGES LOG
| Date | What Changed | Changed By | All Pods Notified? |
|---|---|---|---|
| 2026-08-23 | Added `start.sh` and `stop.sh` one-click automation scripts and cleaned `.gitignore` | Akshat | ✅ Yes |
| 2026-08-23 | Unified all 4 AI/ML router groups in `api/main.py` and added Dockerfile | Shreyashi & Diya | ✅ Yes |
| 2026-08-22 | Added Swagger ApiQuery optional decorators & Transport Demo Seeder | Akshat | ✅ Yes |
| 2026-08-21 | Added initial Pod B endpoints and shared DTOs | Ayush & Akshat | ✅ Yes |
