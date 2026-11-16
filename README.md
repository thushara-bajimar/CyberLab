# CyberLab — Interactive Cybersecurity Learning Platform

*Learn Cybersecurity by Doing.*

CyberLab is a beginner-friendly platform for practising cybersecurity through guided challenges, a **simulated**
browser terminal, progressive hints, server-side scoring and progress tracking.

> **Project status: Phases 1–6 complete** (foundation, dashboard, modules and challenges, simulated terminal,
> hints and scoring, progress tracking with reset). Every challenge can be completed end to end, and progress is
> stored in SQLite and survives restarts. Still planned: API hardening, a security test pass and UI polish
> (Phases 7–9). See [docs/PLAN.md](docs/PLAN.md) for the full design.

## What works today

| Area | Status |
|---|---|
| Dashboard | Totals, completion %, points, module progress, recent activity and recommended next challenge, all computed from the database (with clear empty states) |
| Modules | List with progress per module; detail page with introduction, key concepts, objectives and challenges |
| Challenges | List with status filter; detail page with scenario, objective, instructions, resources, progressive hints (cost shown and confirmed before revealing), answer form with instant server-side feedback, completion summary, explanation unlocked after completion |
| Course content | 7 modules, 14 challenges, 42 hints, 7 simulated terminal environments, defined in `backend/src/content/` and loaded into SQLite at startup |
| Progress | Progress page: totals (completed, started, points, attempts, hints), module completion with finish times, every challenge's status / attempts / hints / points / completion time, full activity history with paging, and a **reset** that requires typing RESET |
| Simulated terminal | Browser terminal with prompt, command history (↑/↓), `clear` / Ctrl+L, error highlighting; commands run in a read-only in-memory environment on the server |
| API | `GET /api/health`, `/api/dashboard`, `/api/modules`, `/api/modules/:moduleId`, `/api/challenges`, `/api/challenges/:challengeId`, `/api/progress`, `/api/activity?limit=&offset=`; `POST /api/challenges/:challengeId/hints`, `/api/challenges/:challengeId/submit`, `/api/terminal/execute`, `/api/progress/reset` |
| Security of content | Answer rules, unrevealed hints and explanations of unfinished challenges are never sent to the browser (covered by tests) |
| SQLite database | Schema v1 with foreign keys, CHECK constraints, indexes, WAL; guest learner profile; content re-seeded on start without touching progress |
| Tests | 128 backend tests: health, errors, schema, persistence, config, scoring, dashboard, content validation, seeding, content API, terminal engine, terminal security, terminal API, answer checking, hints and submissions, progress, activity paging, reset, HTTP security (headers, CSRF, DNS rebinding, methods, injection, errors) |

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

### API security (all endpoints)

| Threat | Protection | Code |
|---|---|---|
| Another website triggering actions in your browser (CSRF), e.g. a hidden form that resets progress | Every POST must be `application/json` (otherwise 415). Forms cannot send JSON, and a cross-site JSON request needs a CORS preflight, which the API never approves (no CORS headers at all) | `middleware/security.ts` `requireJson` |
| DNS rebinding: a malicious site points its own domain at 127.0.0.1 to reach the local API | Requests whose `Host` header is not `localhost`, `127.0.0.1` or `[::1]` are refused (403); extra names via `ALLOWED_HOSTS` | `hostGuard` |
| Content sniffing, framing, caching of personal data | `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Content-Security-Policy: default-src 'none'; frame-ancestors 'none'`, `Referrer-Policy: no-referrer`, `Cross-Origin-Resource-Policy: same-origin`, `Cache-Control: no-store` | `securityHeaders` |
| Malformed or hostile input | zod schemas on every parameter and body; strict objects (unknown fields such as `points` or `__proto__` rejected); 10 KB body limit | `validation/` |
| SQL injection | Only parameterised queries (`?` placeholders); tested with injection payloads | `repositories/` |
| Information leaks in errors | One error shape; validation errors never echo values; unexpected errors return a generic 500 | `middleware/errorHandler.ts` |
| Exposure to the network | Binds to 127.0.0.1 by default; starting with another `HOST` prints a warning | `index.ts` |
| Vulnerable dependencies | `npm audit` reported 0 known vulnerabilities in both apps (16 Nov 2026) | — |

Wrong methods on known paths return 405 with an `Allow` header; unknown paths return a JSON 404.

Not covered in the MVP: rate limiting and authentication (the API is meant to run locally, bound to 127.0.0.1).

## Progress and reset

Progress lives in two tables: `challenge_progress` (one row per started challenge: status, attempts, hints
used, points, start and completion time) and `activity_log` (one row per hint, wrong attempt or completion).
Because they are in the SQLite file, progress survives restarts. A challenge with no row is "not started".

`POST /api/progress/reset` with the body `{ "confirm": "RESET" }` deletes this learner's rows from both tables in
one transaction and returns how many were removed. Course content is not touched, and any other value of
`confirm` (including `reset`) is rejected. The Progress page only enables its reset button after RESET is typed.

## Scoring policy

```
points awarded = base - hints used x 10% of base
base           = 100 beginner | 200 intermediate | 300 advanced
```

| Situation | What happens |
|---|---|
| Hint revealed before solving | Costs 10% of the base; the page states the exact cost and asks for confirmation first |
| Same hint requested again (double click, retry) | Ignored: the request names the hint number, so a repeat changes nothing |
| Hint requested out of order | Refused (HTTP 409) |
| Wrong answer | No points lost; the attempt is counted and logged |
| Correct answer | Points computed by the server from the hints actually used; explanation and all hints unlocked |
| Submitting again after completion | Reported as already completed; points, attempts and activity unchanged |
| Client sends points or a status | Rejected: request bodies are strict and accept only `hintNumber` or `answer` |

Typed answers are compared after normalisation (case, surrounding spaces, repeated spaces and wrapping
quotes are ignored), so `"tux-4821"` matches `TUX-4821`. Multiple-choice answers are option ids.

Each action runs in one SQLite transaction, and the updates carry guard conditions
(`WHERE status = 'in_progress'`, `WHERE hints_used = ?`), so even simultaneous requests cannot award points
twice. Code: `backend/src/services/scoring.ts`, `answerChecker.ts`, `challengeActionService.ts`.

*Known trade-off:* because wrong answers are free, a multiple-choice question can be solved by guessing.
This keeps the platform encouraging for beginners; the explanation shown afterwards is where the learning
happens. The course is worth 1,900 points in total.

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
