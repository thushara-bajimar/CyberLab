# CyberLab — Project Plan (Phase 0)

*Learn Cybersecurity by Doing.* This is the planning document written before any code. It is updated when a
decision changes, so it always describes the intended design. The README describes what is actually built.

---

## 1. Problem statement

Beginners usually meet cybersecurity as definitions: "phishing is…", "hashing is…". Reading definitions does not
build the habits a security person needs: looking at a log, reading a URL carefully, checking a file instead of
trusting its name. Real practice labs (virtual machines, CTF servers) are powerful but intimidating to set up and
can be unsafe for a first-year student.

CyberLab gives beginners a **safe, guided, hands-on** place to practise: short scenarios, a simulated terminal,
progressive hints, automatic checking, and an explanation after every challenge.

## 2. Objectives

1. Teach core security concepts through practical challenges, not only reading.
2. Provide a browser terminal that *feels* real but is a **pure simulation** — nothing runs on the host.
3. Give immediate, automatic, server-side feedback and scoring.
4. Show honest progress (only real stored data, never placeholder numbers).
5. Explain every solution: why it is correct, common mistakes, real-world relevance.
6. Stay small, readable and well-documented enough for a student to explain every part.

## 3. Target users

- Engineering / CS students starting cybersecurity.
- Instructors who want a self-paced practical warm-up for a class.
- Anyone curious about security who has never used a terminal.

## 4. MVP scope

| In the MVP | Not in the MVP (future work) |
|---|---|
| 7 modules, 14 challenges (2 per module) | Large challenge library, user-created challenges |
| Simulated terminal with an allowlisted command set | Real shells, containers, VMs, real network tools |
| 3 progressive hints per challenge, hint penalty | Adaptive hints, AI tutor |
| Server-side answer checking and scoring | Leaderboards, competitions |
| Progress tracking for **one local learner profile** | Accounts, login, multiple users, instructor dashboard |
| Dashboard, modules, challenge pages, progress page | Certificates, badges, gamification extras |
| SQLite persistence | Cloud deployment, Postgres |

### Decision: one local guest profile instead of accounts

CyberLab runs on the student's own machine for learning and demonstration. Building login, password hashing,
sessions and account recovery would double the project size without teaching the security topics the platform
is about. The MVP therefore uses **one built-in learner profile** (`users` row id 1).

*Trade-off:* everyone using the same running instance shares one progress record; it is not suitable for a
shared server. Every progress table still has a `user_id` foreign key, so real accounts can be added later
without redesigning the schema.

## 5. Functional requirements

| ID | Requirement |
|---|---|
| F1 | List modules with description, objectives, difficulty and completion status. |
| F2 | Show a module's introduction, concept explanation and its challenges. |
| F3 | Show a challenge: scenario, objective, instructions, resources, difficulty, points, status. |
| F4 | Provide a simulated terminal for challenges that declare a terminal environment. |
| F5 | Reveal hints one at a time; record how many were used. |
| F6 | Accept an answer, check it on the server, return correct/incorrect feedback. |
| F7 | Award points once per challenge using a documented formula; never accept scores from the client. |
| F8 | After completion, show solution, reasoning, concept, commands used, common mistakes, real-world relevance. |
| F9 | Track per-challenge status, attempts, hints used, points, completion time; persist across restarts. |
| F10 | Dashboard: totals, completed, pending, points, completion %, module progress, recent activity, recommended next challenge. |
| F11 | Health endpoint reporting API and database status. |

## 6. Non-functional requirements

- **Safety:** the terminal never executes OS commands, never reads host files, never uses the network.
- **Integrity:** answers, hints not yet revealed, and scoring logic stay on the server.
- **Honesty:** the UI shows only real data or clearly labelled empty states.
- **Usability:** beginner-friendly language, readable terminal, responsive layout, keyboard friendly.
- **Maintainability:** small layered backend, typed code (TypeScript end to end), automated tests.
- **Portability:** runs on Windows/macOS/Linux with Node.js only; no database server.

## 7. Feature breakdown

1. **Dashboard** — aggregates from `/api/dashboard`.
2. **Modules** — list and detail pages.
3. **Challenge engine** — challenge content, answer types, validation, explanation.
4. **Simulated terminal** — parser + virtual filesystem + allowlisted command handlers.
5. **Hints** — ordered hints, one reveal per request, guarded against double reveals.
6. **Scoring** — difficulty base points minus hint penalty, awarded once.
7. **Progress tracking** — per-challenge progress rows + activity log.

### Initial content (14 challenges, implemented in Phase 3)

*Correction (Phase 3):* the first draft of this plan said "6 modules, 12 challenges" but its table listed 7
modules. The implemented course has **7 modules with 2 challenges each**. Points: 9 beginner x 100 + 5
intermediate x 200 = **1,900 points** in total.

| Module | Challenge | Difficulty | Answer | Terminal environment / commands |
|---|---|---|---|---|
| Cybersecurity Fundamentals | The CIA Triad in Practice | beginner | multiple choice | — |
| Cybersecurity Fundamentals | Least Privilege | beginner | multiple choice | — |
| Linux & Command-Line Basics | Find the Onboarding Note | beginner | text | `linux-onboarding`: `pwd`, `ls`, `cd`, `cat` |
| Linux & Command-Line Basics | Hidden Files | beginner | text | `linux-hidden`: `ls -a`, `cat` |
| Networking Fundamentals | Find the Default Gateway | beginner | text | `network-office`: `ipconfig` |
| Networking Fundamentals | Which Server Is Down? | beginner | text | `network-office`: `cat`, `ping` |
| Password Security | Choose the Strongest Password | beginner | multiple choice | — |
| Password Security | Audit Admin Accounts for MFA | intermediate | text | `password-audit`: `cat`, `grep` |
| Cryptography Basics | Encoding Is Not Encryption | beginner | text | `crypto-workbench`: `cat`, `base64 -d` |
| Cryptography Basics | Break a Caesar Cipher | intermediate | text | — |
| Phishing Awareness | Who Really Owns This Link? | beginner | text | — |
| Phishing Awareness | Read the Email Headers | intermediate | text | `phishing-mailbox`: `cat`, `grep` |
| Digital Forensics Basics | Investigate a Brute-Force Attack | intermediate | text | `forensics-server`: `grep` |
| Digital Forensics Basics | Find What the Attacker Left Behind | intermediate | text | `forensics-server`: `find`, `cat` |

`base64` was added to the planned command list for the cryptography challenge (decode only from files; no
pipes). Web Security is deliberately left for later: teaching it well needs more careful simulated scenarios.

## 8. User journeys

1. **First visit:** Dashboard shows 0 / 12 completed, 0 points, and a recommended first challenge.
2. **Solve a terminal challenge:** open challenge → read scenario → type commands in the terminal → find the
   answer → submit → see "Correct, +100 points" and the explanation → dashboard updates.
3. **Get stuck:** reveal Hint 1 (UI states the cost) → still stuck → Hint 2 → solve → reduced points shown.
4. **Wrong answer:** submit → "Not quite" with a gentle message; no points lost; attempts counter increases.
5. **Return later:** restart app → progress, points and activity are still there.

## 9. Technology stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React + TypeScript + Vite | Component model fits cards/terminal/pages; types catch API mismatches; Vite is a fast dev server and bundler. |
| Styling | Tailwind CSS v4 | Utility classes keep styling next to components; no separate design system to maintain. |
| Routing | React Router | Real URLs (`/challenges/linux-hidden-files`) so pages can be bookmarked and refreshed. |
| Icons | lucide-react | Small, tree-shaken SVG icons. |
| Backend | Node.js + Express + TypeScript | Same language as the frontend; Express is minimal and well documented. |
| Validation | zod | Declarative request validation with typed results. |
| Database | SQLite via better-sqlite3 | Single file, no server, transactional; synchronous API keeps code simple. |
| Dev runner | tsx | Runs TypeScript directly in development with reload. |
| Tests | Vitest + supertest | Same test runner for backend and frontend; supertest calls Express in-process. |

Deliberately **not** used: Redis, queues, ORMs, auth providers, AI APIs, Docker, CORS middleware (the Vite dev
proxy makes the API same-origin), dotenv (Node 24 loads `.env` files natively with `--env-file-if-exists`).

## 10. System architecture

A **monolith with two processes in development**:

```
Browser (React SPA)  --/api/*-->  Vite dev server (proxy)  -->  Express API  -->  services  -->  SQLite file
                                                                     |
                                                                     +--> terminal engine (pure TypeScript,
                                                                          in-memory virtual filesystem)
```

Backend layers: `routes` (URL → handler) → `controllers` (HTTP in/out, validation) → `services` (business
rules: scoring, hints, progress) → `repositories` (SQL). The terminal engine is a separate pure module with no
I/O at all.

## 11. Database schema

```
users               (id PK, display_name, created_at)
modules             (id TEXT PK, title, summary, introduction, concept, objectives_json,
                     difficulty, sort_order)
challenges          (id TEXT PK, module_id FK->modules, title, difficulty, answer_type,
                     scenario, objective, instructions_json, resources_json, options_json,
                     terminal_env, answer_json [server-only], explanation_json, sort_order)
challenge_hints     (challenge_id FK->challenges, hint_number, text, PK(challenge_id, hint_number))
challenge_progress  (user_id FK, challenge_id FK, status, attempts, hints_used,
                     points_awarded, started_at, completed_at, PK(user_id, challenge_id))
activity_log        (id PK, user_id FK, challenge_id FK, event_type, detail, created_at)
```

- Content tables (`modules`, `challenges`, `challenge_hints`) are **seeded from version-controlled TypeScript
  files** at startup inside one transaction; progress tables are never touched by seeding.
- CHECK constraints for enumerations (difficulty, status, event type), `hints_used BETWEEN 0 AND 3`.
- Indexes on `challenges(module_id)`, `activity_log(user_id, created_at)`.
- WAL journal mode, foreign keys enforced.

## 12. API design

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | API + database status |
| GET | `/api/dashboard` | All dashboard aggregates |
| GET | `/api/modules` | Modules with progress counts |
| GET | `/api/modules/:moduleId` | Module detail + its challenges with status |
| GET | `/api/challenges` | All challenges (summary + status) |
| GET | `/api/challenges/:challengeId` | Challenge detail; revealed hints only; explanation only when completed |
| POST | `/api/challenges/:challengeId/hints` | Reveal the next hint (`{ "hintNumber": n }` guards double clicks) |
| POST | `/api/challenges/:challengeId/submit` | Check an answer, score it, record progress |
| POST | `/api/terminal/execute` | Run one command in the challenge's simulated environment |
| GET | `/api/progress` | Totals, module completion, per-challenge progress, 20 newest activity entries |
| GET | `/api/activity?limit=&offset=` | Paged activity history (added in Phase 6) |
| POST | `/api/progress/reset` | Delete this learner's progress and activity; body must be `{ "confirm": "RESET" }` (added in Phase 6 at the user's request) |

*Implemented in Phase 5:* the hint endpoint is `POST /api/challenges/:challengeId/hints` with
`{ "hintNumber": n }`; both it and `/submit` return the refreshed challenge so the page updates in place.

All errors use one shape: `{ "error": { "code": "...", "message": "..." } }`.

## 13. Security model for the simulated terminal

1. **No process execution anywhere.** The backend never imports `child_process`, never calls `eval`, `Function`,
   `vm`, or spawns PowerShell. A test scans the source tree to enforce this.
2. **Allowlist dispatch.** The command name is looked up in a fixed `Map` of handler functions; anything else
   returns "command not found" with a hint to type `help`. Each environment narrows the list further
   (e.g. `ping` only exists in networking challenges).
3. **Virtual filesystem.** Files and directories are plain in-memory objects defined in TypeScript. Paths are
   resolved against that tree only; `..` stops at `/`. The host filesystem is never accessed by the engine.
4. **Read-only.** No command writes, deletes or modifies anything, so there is no per-user filesystem state.
5. **No shell operators.** `;`, `&&`, `|`, `>`, `<`, backticks and `$(...)` are rejected with an explanation.
6. **Input limits.** Command ≤ 200 characters, at most 20 arguments, client-sent history ≤ 50 entries,
   JSON body ≤ 10 KB.
7. **Stateless requests.** The client sends `{ challengeId, command, cwd, history }`; the server validates `cwd`
   against the virtual tree (falls back to home) and returns `{ output, cwd, clear }`.
8. **Simulated network.** `ping` / `ipconfig` print predefined output; no packets are sent.
9. **Answers stay on the server.** Running the simulation on the server means challenge files and answers are
   not shipped to the browser in bulk.

## 14. Scoring formula

```
base points      = 100 (beginner) | 200 (intermediate) | 300 (advanced)
hint penalty     = 10% of base for each hint revealed before completion (max 3 hints -> max 30%)
points awarded   = base - hints_used x 0.10 x base        (computed once, on the first correct submission)
```

- Wrong answers cost nothing (learning is encouraged); they increase `attempts`.
- After completion, further submissions and hint reveals do not change points (duplicate protection), and all
  hints are shown for review at no cost.
- The client never sends points; the server computes and stores them.

## 15. Folder structure

```
CyberLab/
├── README.md
├── .gitignore
├── docs/                      plan, documentation, final PDF
├── backend/
│   ├── package.json, tsconfig.json, vitest.config.ts, .env.example
│   ├── src/
│   │   ├── index.ts           starts the HTTP server
│   │   ├── app.ts             builds the Express app (used by tests too)
│   │   ├── config.ts          environment variables with defaults
│   │   ├── db/                connection, schema, seeding
│   │   ├── content/           modules, challenges, hints, terminal environments
│   │   ├── routes/            URL -> controller wiring
│   │   ├── controllers/       request validation + responses
│   │   ├── services/          scoring, hints, progress, dashboard
│   │   ├── repositories/      SQL queries
│   │   ├── validation/        zod schemas for request parameters and bodies
│   │   ├── terminal/          tokenizer, virtual filesystem, command handlers, engine
│   │   └── middleware/        error handling, 404
│   └── tests/
└── frontend/
    ├── package.json, vite.config.ts, tsconfig*.json, index.html
    └── src/
        ├── main.tsx, App.tsx  router + layout
        ├── api/               typed fetch client + response types
        ├── components/        layout, cards, terminal, hint panel, result panel
        ├── pages/             Dashboard, Modules, ModuleDetail, Challenge, Progress, NotFound
        └── hooks/             data-loading hooks
```

## 16. Development phases

| Phase | Deliverable | Verification |
|---|---|---|
| 1 | Foundation: both apps, Tailwind, DB schema, `/api/health`, proxy | both start; health returns DB ok; tests pass |
| 2 | Layout, navigation, dashboard shell with real/empty states | build + manual check |
| 3 | Content + modules/challenges APIs and pages | API tests, content validation tests |
| 4 | Terminal engine + endpoint + UI | engine unit tests incl. malicious input |
| 5 | Hints + submission + scoring | scoring/duplicate tests |
| 6 | Progress, activity, dashboard aggregates | persistence test across app restarts |
| 7 | API hardening (validation, error shape) | full API test suite |
| 8 | Test + security pass | all tests, source scan, manual checks |
| 9 | UI polish | responsive/manual review, build |
| 10 | README + Git cleanup | README matches code |
| — | Documentation PDF, audit, presentation guide | after implementation is audited |

## 17. Testing strategy

- **Backend unit tests:** parser, path resolution, every command, scoring formula, answer normalisation.
- **Security tests:** shell operators, path traversal (`cat ../../../etc/passwd`, `C:\Windows`), long input,
  unknown commands, environment variable syntax, source scan for `child_process`/`eval`.
- **API tests (supertest):** every endpoint, validation errors, 404s, hint ordering, duplicate submissions,
  persistence across a re-opened database file.
- **Frontend:** TypeScript build as a type check; component tests for the terminal and result panel.
- **Manual:** run both apps, complete challenges, restart, confirm progress persists.

## 18. Known technical challenges

- Making terminal output realistic while keeping the command set small and safe.
- Writing challenges whose answers are unambiguous (normalising case/whitespace, accepting equivalent forms).
- Preventing double hint reveals / double scoring from fast repeated clicks (handled with an expected hint
  number and a single SQL transaction per submission).
- Keeping the explanation hidden until completion without making the page feel empty.
