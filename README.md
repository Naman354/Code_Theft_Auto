# Code Theft Auto

Next.js app for a team-based coding game. This project now uses **MongoDB + Mongoose only** (no Prisma/PostgreSQL).

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS 4
- MongoDB + Mongoose

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` file:

```env
MONGO_URI=mongodb+srv://<username>:<password>@<cluster-url>/<db-name>
TEAM_SESSION_SECRET=replace-this-with-a-long-random-secret
ADMIN_API_SECRET=replace-this-with-a-separate-admin-secret
TEAM_MAX_MEMBER_COUNT=6
TEAM_MIN_PASSWORD_LENGTH=6
TEAM_MAX_TEAM_NAME_LENGTH=80
```

3. Run dev server:

```bash
npm run dev
```

## API Routes

> Base URL: `http://localhost:3000`

### Quick Reference

| # | Route | Method | Auth | Required Fields |
|---|-------|--------|------|-----------------|
| 1 | `/api/admin/contest-state` | GET | `x-admin-secret` header | None |
| 2 | `/api/admin/start-level` | POST | `x-admin-secret` header | `level` *(optional)* |
| 3 | `/api/admin/next-level` | POST | `x-admin-secret` header | None |
| 4 | `/api/admin/scan-qr` | POST | None | `qrData` |
| 5 | `/api/team/signup` | POST | None | `teamName`, `password`, `members[]` |
| 6 | `/api/team/login` | POST | None | `teamName`, `password` |
| 7 | `/api/team/logout` | POST | 🍪 Cookie | None |
| 8 | `/api/team/state` | GET | 🍪 Cookie | None |
| 9 | `/api/team/current-question` | GET | 🍪 Cookie | None |
| 10 | `/api/team/submit-answer` | POST | 🍪 Cookie | `answer` |
| 11 | `/api/leaderboard` | GET | None | None |

---

### 🔐 Admin Routes

All admin routes require the header: `x-admin-secret: <ADMIN_API_SECRET>`

#### `GET /api/admin/contest-state`

Returns the current global contest state.

```bash
curl -X GET http://localhost:3000/api/admin/contest-state \
  -H "x-admin-secret: <your-secret>"
```

**Response `200`:**
```json
{
  "success": true,
  "contestState": {
    "status": "idle",
    "totalLevels": 3,
    "currentLevel": 1,
    "levelStartedAt": null,
    "levelEndsAt": null,
    "maxPointsPerQuestion": 1000,
    "gracePeriodSeconds": 30,
    "durationSeconds": 300,
    "decayPerSecond": 2,
    "clue1UnlockSeconds": 60,
    "clue1Penalty": 100,
    "clue2UnlockSeconds": 120,
    "clue2Penalty": 150
  }
}
```

---

#### `POST /api/admin/start-level`

Starts a specific level (or current level if `level` is omitted). Sets contest to `"running"`.

**Body:**
```json
{ "level": 1 }
```

```bash
curl -X POST http://localhost:3000/api/admin/start-level \
  -H "x-admin-secret: <your-secret>" \
  -H "Content-Type: application/json" \
  -d '{"level": 1}'
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Level 1 started successfully.",
  "contestState": {
    "status": "running",
    "currentLevel": 1,
    "levelStartedAt": "2026-04-03T05:00:00.000Z",
    "levelEndsAt": "2026-04-03T05:05:00.000Z",
    "durationSeconds": 300
  }
}
```

| Status | Error |
|--------|-------|
| `400` | Level must be a positive integer / exceeds totalLevels |
| `401` | Missing admin credentials |
| `403` | Invalid admin credentials |
| `404` | Level not configured in DB |

---

#### `POST /api/admin/next-level`

Advances the contest to the next level. If no more levels remain, marks contest as `"completed"`.

```bash
curl -X POST http://localhost:3000/api/admin/next-level \
  -H "x-admin-secret: <your-secret>"
```

**Response `200` (advanced):**
```json
{
  "success": true,
  "message": "Level 2 started successfully.",
  "contestState": { "status": "running", "currentLevel": 2, ... }
}
```

**Response `200` (completed):**
```json
{
  "success": true,
  "message": "Contest is complete. No more levels remain.",
  "contestState": { "status": "completed", "levelStartedAt": null, "levelEndsAt": null }
}
```

---

#### `POST /api/admin/scan-qr`

Check-in a student by QR code. Auto-assigns to a team (max 5 per team) and sends an email.  
> ⚠️ Does **not** require the `x-admin-secret` header.

**Body:**
```json
{ "qrData": "2410084" }
```
> Auto-detects: 24-char hex = MongoDB `_id`, otherwise treated as `studentNumber`.

```bash
curl -X POST http://localhost:3000/api/admin/scan-qr \
  -H "Content-Type: application/json" \
  -d '{"qrData": "2410084"}'
```

**Response `200` (new check-in):**
```json
{
  "success": true,
  "alreadyScanned": false,
  "message": "Love Varshney checked in! Team 1 mein add kar diya.",
  "student": { "name": "Love Varshney", "email": "...", "studentNumber": "2410084" },
  "team": { "teamName": "Phantom_Squad_1", "teamNumber": 1, "accessCode": "AB12CD", "currentSize": 3 }
}
```

**Response `200` (already checked in):**
```json
{
  "success": false,
  "alreadyScanned": true,
  "message": "Love Varshney already checked in hai!",
  "student": { "name": "Love Varshney", "email": "...", "studentNumber": "2410084" }
}
```

| Status | Error |
|--------|-------|
| `400` | Missing / invalid `qrData` |
| `404` | Student not found in DB |

---

### 👥 Team Routes

#### `POST /api/team/signup`

Register a new team. Sets a session cookie automatically on success.

**Body:**
```json
{
  "teamName": "ThunderCoders",
  "password": "secure123",
  "members": [
    { "name": "Love Varshney", "studentNumber": "2410084" }
  ]
}
```

**Validation:**
- `teamName`: required, max 80 chars
- `password`: required, min 6 chars
- `members`: at least 1, max 6; each needs `name` and `studentNumber` (7–8 digits, unique)

```bash
curl -X POST http://localhost:3000/api/team/signup \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"teamName":"ThunderCoders","password":"secure123","members":[{"name":"Love Varshney","studentNumber":"2410084"}]}'
```

**Response `201`:**
```json
{
  "success": true,
  "team": {
    "id": "660abc...",
    "teamName": "ThunderCoders",
    "members": [...],
    "totalLockedScore": 0,
    "currentLevel": 1,
    "levelStates": [],
    "lastLoginAt": "2026-04-03T05:00:00.000Z"
  }
}
```

| Status | Error |
|--------|-------|
| `400` | Validation failed (missing fields, bad student number, etc.) |
| `409` | Team name already taken |

---

#### `POST /api/team/login`

Login to an existing team. Sets session cookie.

**Body:**
```json
{ "teamName": "ThunderCoders", "password": "secure123" }
```

```bash
curl -X POST http://localhost:3000/api/team/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"teamName":"ThunderCoders","password":"secure123"}'
```

**Response `200`:**
```json
{
  "success": true,
  "team": { "id": "...", "teamName": "ThunderCoders", "totalLockedScore": 250, "currentLevel": 2, ... }
}
```

| Status | Error |
|--------|-------|
| `400` | Missing teamName or password |
| `401` | Invalid team name or password |

---

#### `POST /api/team/logout`

Clears the session cookie.

```bash
curl -X POST http://localhost:3000/api/team/logout -b cookies.txt
```

**Response `200`:** `{ "success": true }`

---

#### `GET /api/team/state`

Returns full team state (score, level, timer, scoring). Requires login.

```bash
curl -X GET http://localhost:3000/api/team/state -b cookies.txt
```

**Response `200`:**
```json
{
  "success": true,
  "state": {
    "contestStatus": "running",
    "currentLevel": 1,
    "teamCurrentLevel": 1,
    "levelState": { "status": "active", "clue1PenaltyApplied": false, "clue2PenaltyApplied": false },
    "totalLockedScore": 0,
    "timer": { "levelStartedAt": "...", "levelEndsAt": "...", "secondsRemaining": 240 },
    "scoring": { "liveScore": 520, "maxScore": 1000 }
  }
}
```

---

#### `GET /api/team/current-question`

Returns the current question, unlocked clues, and team state. Requires login.

```bash
curl -X GET http://localhost:3000/api/team/current-question -b cookies.txt
```

**Response `200`:**
```json
{
  "success": true,
  "currentQuestion": {
    "levelNumber": 1,
    "question": "What is the capital of France?",
    "clue1": "It starts with P",
    "clue2": "It's on the Seine river",
    "clue1Available": false,
    "clue2Available": false
  },
  "state": { "contestStatus": "running", "currentLevel": 1, "scoring": { "liveScore": 510 }, ... }
}
```

---

#### `POST /api/team/submit-answer`

Submit an answer for the current level. Requires login.

**Body:**
```json
{ "answer": "Paris" }
```

```bash
curl -X POST http://localhost:3000/api/team/submit-answer \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"answer": "Paris"}'
```

**Response `200` (correct):**
```json
{
  "success": true,
  "isCorrect": true,
  "message": "Correct answer submitted successfully.",
  "lockedScore": 850,
  "state": { "currentLevel": 1, "nextLevel": 2, "totalLockedScore": 850, "levelStatus": "solved", "solvedAt": "..." }
}
```

**Response `200` (wrong):**
```json
{
  "success": true,
  "isCorrect": false,
  "message": "Incorrect answer.",
  "state": { "currentLevel": 1, "totalLockedScore": 0, "levelStatus": "active" }
}
```

| Status | Error |
|--------|-------|
| `400` | Empty answer |
| `401` | Not logged in |
| `404` | Level not configured |
| `409` | Already solved / expired / contest not running |

---

### 🏆 Public Routes

#### `GET /api/leaderboard`

Returns top teams ranked by score. No auth needed.

**Query params:** `?limit=5` (optional, default 10, max 10)

```bash
curl -X GET "http://localhost:3000/api/leaderboard?limit=5"
```

**Response `200`:**
```json
{
  "success": true,
  "leaderboard": [
    { "rank": 1, "teamId": "...", "teamName": "ThunderCoders", "totalLockedScore": 2750, "currentLevel": 3, "solvedLevelsCount": 2 },
    { "rank": 2, "teamId": "...", "teamName": "ByteBusters", "totalLockedScore": 2100, "currentLevel": 2, "solvedLevelsCount": 1 }
  ]
}
```

## Data Models

- `Team`: unique team name, normalized team name, password hash, members, total locked score, current level, per-level state, last login timestamps
- `Level`: level number, question, answer, two clues, and per-level scoring/timer configuration
- `ContestState`: singleton global contest status, active level, level timer, and default scoring configuration
- `Submission`: one final locked result per team per level, either `solved` or `expired`, with the locked score snapshot, clue penalty snapshot, and response time
