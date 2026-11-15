# CyberLab — Interactive Cybersecurity Learning Platform

*Learn Cybersecurity by Doing.*

CyberLab is a beginner-friendly platform for practising cybersecurity through guided challenges, a **simulated**
browser terminal, progressive hints, server-side scoring and progress tracking.

> **Project status: Phase 1 (foundation) complete.** The frontend, backend, database schema and health check
> are working. Modules, challenges, the terminal, hints, scoring and progress are planned for Phases 2–7 and
> are **not implemented yet**. See [docs/PLAN.md](docs/PLAN.md) for the full design.

## What works today

| Area | Status |
|---|---|
| React + TypeScript + Vite + Tailwind frontend | Builds; shows live API/database status |
| Express + TypeScript API | `GET /api/health`; standard JSON error shape; 10 KB body limit |
| SQLite database | All tables created on startup (schema v1); guest learner profile; WAL mode |
| Dev proxy | Vite forwards `/api/*` to the backend, so no CORS setup is needed |
| Backend tests | 11 tests (health, errors, schema constraints, persistence, config) |

## Technology stack (installed versions)

| Layer | Package | Version | Purpose |
|---|---|---|---|
| Frontend | react / react-dom | 19.3.1 | UI components |
| Frontend | typescript | 7.0.2 | Static types (both apps use the same version) |
| Frontend | vite / @vitejs/plugin-react | 8.3.8 / 6.3.0 | Dev server, proxy, production bundler |
| Frontend | tailwindcss / @tailwindcss/vite | 4.3.5 | Utility-first styling |
| Frontend | react-router-dom | 7.18.5 | Page routing (used from Phase 2) |
| Frontend | lucide-react | 1.73.0 | SVG icons |
| Frontend | oxlint | 1.93.0 | Linting (from the Vite template) |
| Backend | express | 5.3.0 | HTTP routing and middleware |
| Backend | better-sqlite3 | 13.2.0 | SQLite driver (bundled SQLite 3.54.1) |
| Backend | zod | 4.6.7 | Request validation (used from Phase 3) |
| Backend (dev) | tsx | 4.23.15 | Runs TypeScript directly with auto-reload |
| Backend (dev) | vitest / supertest | 5.1.0 / 7.3.2 | Unit and HTTP tests |

Runtime used during development: Node.js 24.18.0, npm 11.16.0. The backend requires Node.js 22.12 or newer
(it uses the built-in `--env-file-if-exists` flag instead of the `dotenv` package).

## Getting started (Windows PowerShell)

```powershell
# 1. Install dependencies (once)
cd backend;  npm install;  cd ..
cd frontend; npm install;  cd ..

# 2. Terminal 1 - backend API on http://127.0.0.1:4000
cd backend
npm run dev

# 3. Terminal 2 - frontend on http://127.0.0.1:5173
cd frontend
npm run dev
```

Open http://127.0.0.1:5173. The status card should show **API ok** and **Database ok (schema v1)**.

Optional backend settings live in `backend/.env` (copy `backend/.env.example`): `PORT`, `HOST`,
`DATABASE_PATH`. The database file is created automatically at `backend/data/cyberlab.sqlite` and is not
committed to Git.

## Scripts

| Folder | Command | What it does |
|---|---|---|
| backend | `npm run dev` | Start the API with auto-reload |
| backend | `npm test` | Run the backend test suite |
| backend | `npm run typecheck` | Type-check source and tests |
| backend | `npm run build` / `npm start` | Compile to `dist/` and run the compiled server |
| frontend | `npm run dev` | Start the Vite dev server |
| frontend | `npm run build` | Type-check and build to `dist/` |
| frontend | `npm run lint` | Lint with oxlint |

## Repository layout

```
CyberLab/
├── docs/PLAN.md          design and phase plan
├── backend/              Express + TypeScript API, SQLite schema, tests
└── frontend/             React + TypeScript + Vite + Tailwind app
```
