# SafeSight - Root Project Status

> **Last updated:** 2026-08-21 17:45 by Diya (Pod C)

## CURRENT CHECKPOINT
Day 2 of 6

## CROSS-POD INTEGRATION STATUS

### AI/ML Endpoints (Pod C -> Pod B consumes)
| Endpoint                    | Status       | Owner     | Notes                                                    |
|-----------------------------|--------------|-----------|----------------------------------------------------------|
| POST /ml/anomaly/detect     | READY        | Diya      | IsolationForest + pattern rules. Needs router registered in main.py by Shreyashi |
| POST /ml/bhashini/translate | READY        | Diya      | Needs BHASHINI_API_KEY in .env; stub fallback active     |
| POST /ml/bhashini/tts       | READY        | Diya      | Needs BHASHINI_API_KEY in .env; silent WAV stub active   |
| POST /ml/bhashini/stt       | READY        | Diya      | Needs BHASHINI_API_KEY in .env; stub fallback active     |
| POST /ml/forecast           | NOT STARTED  | Shreyashi |                                                          |
| GET  /ml/weather/current    | NOT STARTED  | Shreyashi |                                                          |
| POST /ml/weather/hazards    | NOT STARTED  | Shreyashi |                                                          |

### Backend API Endpoints (Pod B -> Pod A consumes)
| Endpoint               | Status      | Owner  | Notes              |
|------------------------|-------------|--------|--------------------|
| POST /api/auth/login   | NOT STARTED | Ayush  |                    |
| GET  /api/zones        | NOT STARTED | Ayush  |                    |
| POST /api/incidents    | NOT STARTED | Akshat |                    |
| POST /api/alerts       | NOT STARTED | Akshat |                    |

### Frontend Pages (Pod A)
| Page               | Status      | Owner    | Notes |
|--------------------|-------------|----------|-------|
| Visitor View       | NOT STARTED | Yashasvi |       |
| Manager Dashboard  | NOT STARTED | Aditya   |       |
| Responder Console  | NOT STARTED | Aditya   |       |

## BLOCKERS
| What is Blocked                        | Blocked By                              | Who Needs to Act |
|----------------------------------------|-----------------------------------------|------------------|
| /ml/anomaly + /ml/bhashini endpoints not reachable | Shreyashi must register Diya's routers in api/main.py | Shreyashi |
| Bhashini API returning live results    | Need BHASHINI_API_KEY + USER_ID from MeitY dashboard | Team/Diya |

## SHARED INFRA STATUS
| Item                   | Status      | Notes                              |
|------------------------|-------------|------------------------------------|
| GitHub repo created    | YES         | Ayush created                      |
| Docker compose working | NOT STARTED |                                    |
| PostgreSQL + PostGIS   | NOT STARTED |                                    |
| Bhashini API key       | NOT SET     | Needed in ai-ml/.env               |
| IMD API access         | NOT STARTED |                                    |
| Git on Diya machine    | NOT INSTALLED | Using API download workaround     |

## CONTRACT CHANGES LOG
| Date | What Changed | Changed By | All Pods Notified? |
|------|-------------|-----------|-------------------|
| —    | No changes — all code follows MASTER.md exactly | — | — |