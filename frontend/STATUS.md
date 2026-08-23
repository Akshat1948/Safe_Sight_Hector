# [POD NAME] — STATUS LOG

<!--
  ╔══════════════════════════════════════════════════════════════════════╗
  ║  🤖 AI AGENTS: YOU MUST READ THIS ENTIRE FILE BEFORE MAKING       ║
  ║     ANY CHANGES TO CODE IN THIS FOLDER.                            ║
  ║                                                                    ║
  ║  This file is the coordination protocol between two humans         ║
  ║  and their AI agents working in the same codebase folder.          ║
  ║  Ignoring this file WILL cause conflicts and reverted work.        ║
  ╚══════════════════════════════════════════════════════════════════════╝
-->

> **Last updated:** [YYYY-MM-DD HH:MM] by [Person Name]

---

## 🟢 COMPLETED

List every completed feature/task with the files it touched, so the other person's AI knows what exists and should NOT be rewritten or restructured.

| # | Feature / Task | Files Created/Modified | Done By | Date | Notes |
|---|---------------|----------------------|---------|------|-------|
| 1 | _Example: Auth middleware_ | `src/middleware/auth.ts`, `src/guards/roles.guard.ts` | Ayush | Aug 21 | Uses JWT + RBAC, tokens expire in 24h |

---

## 🟡 IN PROGRESS

List what is currently being worked on, so the other person's AI does NOT touch these files.

| # | Feature / Task | Files Being Touched | Being Done By | Approach / Notes |
|---|---------------|--------------------|--------------|-----------------| 
| 1 | _Example: Alert engine_ | `src/services/alert.service.ts` | Akshat | Using event-driven pattern with Redis pub/sub |

> ⚠️ **AI RULE:** If a file is listed here as "in progress" by the other person, DO NOT modify it. Work on something else or wait for it to move to COMPLETED.

---

## 🔴 PENDING / TODO

Tasks that haven't been started yet. Either person can pick these up.

| # | Feature / Task | Priority | Assigned To | Dependencies |
|---|---------------|----------|-------------|-------------|
| 1 | _Example: WebSocket setup_ | HIGH | Unassigned | Needs auth middleware (COMPLETED #1) |

---

## 📐 ARCHITECTURE DECISIONS

Record every significant decision so the other person's AI doesn't undo it or choose a conflicting approach.

| # | Decision | Why | Decided By | Date |
|---|---------|-----|-----------|------|
| 1 | _Example: Using NestJS Guards for RBAC instead of middleware_ | Cleaner decorator pattern, built-in NestJS support | Ayush | Aug 21 |

> ⚠️ **AI RULE:** Do NOT change or refactor patterns listed here without explicit human approval. These are deliberate choices.

---

## 🔌 INTERFACE CHANGES (CROSS-POD IMPACT)

If you changed anything that affects another pod (API endpoint shape, WebSocket event name, shared type, DB schema), log it here AND notify the team chat.

| # | What Changed | Old | New | Affects | Notified? |
|---|-------------|-----|-----|---------|----------|
| 1 | _Example: `/api/incidents` response now includes `zoneId`_ | `{ id, type, severity }` | `{ id, type, severity, zoneId }` | Frontend (Pod A) | ✅ Yes |

---

## 📁 FILE MAP

Brief description of what each key file/module does. Update this as new files are created.

```
src/
├── main.ts                  — App entry point
├── app.module.ts            — Root module
├── middleware/
│   └── ...
├── modules/
│   ├── zones/               — Zone CRUD + density endpoints
│   ├── incidents/           — Incident detection + management
│   ├── alerts/              — Alert composition + dispatch
│   └── ...
└── ...
```

---

## 🐛 KNOWN ISSUES

| # | Issue | Severity | Workaround | Filed By |
|---|-------|----------|-----------|----------|
| 1 | _Example: WebSocket disconnects after 60s idle_ | Low | Client sends ping every 30s | Akshat |

---

## 📝 HOW TO UPDATE THIS FILE

After finishing any work session:

1. Move your task from **IN PROGRESS** → **COMPLETED** (with files list)
2. Add any new tasks you discovered to **PENDING**
3. Update the **FILE MAP** if you created new files
4. If you changed any shared interface, add to **INTERFACE CHANGES** and tell the group chat
5. Log any significant decisions in **ARCHITECTURE DECISIONS**
6. Update the **"Last updated"** timestamp at the top
7. **Commit this file** in the same PR as your code changes
