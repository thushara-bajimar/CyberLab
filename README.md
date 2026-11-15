# CyberLab — Interactive Cybersecurity Learning Platform

*Learn Cybersecurity by Doing.*

CyberLab is a beginner-friendly platform for practising cybersecurity through guided challenges, a **simulated**
browser terminal, progressive hints, server-side scoring and progress tracking.

> **Project status: Phases 1–4 complete** (foundation, dashboard, modules and challenges, simulated terminal).
> Learners can browse 7 modules and 14 challenges and investigate the 9 terminal challenges in a safe,
> simulated terminal. **Not implemented yet:** revealing hints and checking answers with scoring (Phase 5);
> the challenge page labels these parts "Coming in Phase 5". Because answers cannot be submitted yet, progress
> and points stay at zero. See [docs/PLAN.md](docs/PLAN.md) for the full design.

## What works today

| Area | Status |
|---|---|
| Dashboard | Totals, completion %, points, module progress, recent activity and recommended next challenge, all computed from the database (with clear empty states) |
| Modules | List with progress per module; detail page with introduction, key concepts, objectives and challenges |
| Challenges | List with status filter; detail page with scenario, objective, instructions, resources, hint-cost information, answer form (submit disabled until Phase 5), explanation shown only after completion |
| Course content | 7 modules, 14 challenges, 42 hints, 7 simulated terminal environments, defined in `backend/src/content/` and loaded into SQLite at startup |
| Simulated terminal | Browser terminal with prompt, command history (↑/↓), `clear` / Ctrl+L, error highlighting; commands run in a read-only in-memory environment on the server |
| API | `GET /api/health`, `/api/dashboard`, `/api/modules`, `/api/modules/:moduleId`, `/api/challenges`, `/api/challenges/:challengeId`; `POST /api/terminal/execute` |
| Security of content | Answer rules, unrevealed hints and explanations of unfinished challenges are never sent to the browser (covered by tests) |
| SQLite database | Schema v1 with foreign keys, CHECK constraints, indexes, WAL; guest learner profile; content re-seeded on start without touching progress |
| Tests | 89 backend tests: health, errors, schema, persistence, config, scoring, dashboard, content validation, seeding, content API, terminal engine, terminal security, terminal API |

## Course content

| Module | Challenges |
|---|---|
| Cybersecurity Fundamentals | The CIA Triad in Practice · Least Privilege |
| Linux & Command-Line Basics | Find the Onboarding Note · Hidden Files |
| Networking Fundamentals | Find the Default Gateway · Which Server Is Down? |
| Password Security | Choose the Strongest Password · Audit Admin Accounts for MFA |
| Cryptography Basics | Encoding Is Not Encryption · Break a Caesar Cipher |
| Phishing Awareness | Who Really Owns This Link? · Read the Email Headers |
| Digital Forensics Basics | Investigate a Brute-Force Attack · Find What the Attacker Left Behind |

Every challenge has three progressive hints and an explanation (solution, why it is correct, concept, commands,
common mistakes, real-world relevance). A content test checks that every terminal answer can actually be found
in its simulated environment.

## Simulated terminal

The terminal looks like a Linux shell but is a **simulation**: a small TypeScript program
(`backend/src/terminal/`) that reads fictional files stored as JavaScript objects. It never runs a real
command.

```
browser  --POST /api/terminal/execute { challengeId, command, cwd, history }-->  Express
  -> zod validation (≤ 200 chars, no control characters, ≤ 50 history entries, no extra fields)
  -> tokenizer.ts   split into words; quotes supported; ; & | < > ` $( ) and $VAR rejected with an explanation
  -> engine.ts      look the command up in the allowlist (a Map) for this challenge's environment
  -> commands.ts    pure handler reads the frozen in-memory filesystem / simulated network data
  <- { output, cwd, clear, isError }
```

| Commands | Where |
|---|---|
| `help`, `clear`, `history`, `pwd`, `whoami`, `echo`, `ls [-a] [-l]`, `cd`, `cat` | every terminal challenge |
| `grep [-i] [-c] [-n] [-v] PATTERN FILE...` | password audit, phishing mailbox, forensics |
| `find [PATH] [-name PATTERN] [-type f\|d]` | forensics |
| `ipconfig`, `ping [-c N] HOST` | networking |
| `base64 [-d] FILE` | cryptography |

### Security model

| Threat | Protection |
|---|---|
| Running real commands on the host | No `child_process`, `exec`, `spawn`, `eval`, `Function` or `vm` anywhere in the backend; a test scans the source and fails if any appear |
| Reading host files | The engine imports no filesystem module; paths resolve only inside the in-memory tree and `..` stops at the simulated `/` |
| Changing files | Every environment is deep-frozen; no command writes; tests prove hostile commands leave the environments unchanged |
| Shell tricks (chaining, pipes, redirection, substitution, variables) | Rejected by the tokenizer before any command runs |
| Environment variables / secrets | Variables are rejected; a test sets a canary variable and checks no command can print it |
| Network scanning or attacks | `ping`/`ipconfig` print predefined data; real network tools return an explanation |
| JavaScript prototype tricks (`constructor`, `__proto__`) | Commands are looked up in a `Map`; files with `Object.hasOwn` |
| Denial of service | Body ≤ 10 KB, command ≤ 200 characters, ≤ 20 arguments, output ≤ 400 lines; `grep` matches plain text and `find` uses a linear-time wildcard matcher instead of regular expressions |
| Tampered requests | The working folder sent by the browser is re-validated and falls back to the home folder |

Not covered in the MVP: rate limiting and authentication (the API is meant to run locally, bound to 127.0.0.1).

## Scoring policy

Base points are 100 (beginner), 200 (intermediate) or 300 (advanced). Each hint revealed before solving
removes 10% of the base. Wrong answers cost nothing. Points are awarded once, by the server. The course is
worth 1,900 points. (Hint reveals and answer checking arrive in Phase 5; the formula is already implemented
and tested in `backend/src/services/scoring.ts`.)

## Technology stack (installed versions)

| Layer | Package | Version | Purpose |
|---|---|---|---|
| Frontend | react / react-dom | 19.3.1 | UI components |
| Frontend | typescript | 7.0.2 | Static types (both apps use the same version) |
| Frontend | vite / @vitejs/plugin-react | 8.3.8 / 6.3.0 | Dev server, proxy, production bundler |
| Frontend | tailwindcss / @tailwindcss/vite | 4.3.5 | Utility-first styling |
| Frontend | react-router-dom | 7.18.5 | Page routing (real URLs such as `/challenges/linux-hidden-files`) |
| Frontend | lucide-react | 1.73.0 | SVG icons |
| Frontend | oxlint | 1.93.0 | Linting (from the Vite template) |
| Backend | express | 5.3.0 | HTTP routing and middleware |
| Backend | better-sqlite3 | 13.2.0 | SQLite driver (bundled SQLite 3.54.1) |
| Backend | zod | 4.6.7 | Request validation (URL parameters now; request bodies from Phase 4) |
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

Open http://127.0.0.1:5173. The header should show **Server online**, and the dashboard should list 14
challenges across 7 modules.

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
├── docs/PLAN.md               design and phase plan
├── backend/
│   ├── src/content/           modules, challenges, hints, simulated terminal environments
│   ├── src/db/                connection, schema, seeding
│   ├── src/repositories/      SQL queries
│   ├── src/services/          scoring, dashboard, module, challenge and terminal logic
│   ├── src/terminal/          tokenizer, virtual filesystem, command handlers, engine
│   ├── src/controllers/       request validation and responses
│   ├── src/routes/            URL -> controller wiring
│   └── tests/                 Vitest + supertest
└── frontend/src/
    ├── api/                   typed fetch client and response types
    ├── components/            layout, UI building blocks, content cards, challenge panels
    ├── hooks/useApi.ts        loading / success / error state for API calls
    └── pages/                 Dashboard, Modules, Module detail, Challenges, Challenge, 404
```
