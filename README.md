# Code Theft Auto 🚗💨

A high-stakes, team-based coding competition platform built with **Next.js 16** and **MongoDB**. Inspired by the high-octane aesthetic of the *Grand Theft Auto* series, teams compete to solve algorithmic challenges in a "cyber city" environment, navigating through levels of increasing difficulty while managing real-time score decay and strategic clue reveals.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Animations**: Framer Motion (System-wide reveals, staggers, and hover effects)
- **Database**: MongoDB + Mongoose (uses a "Day 1" Registration database for student verification)
- **Auth**: Iron Session (Team) & Secret Header (Admin)

---

## 🌆 Immersive Experience

The latest update brings a complete visual overhaul designed to immerse players in the "Code Theft Auto" world:

### 🎮 GTA-Inspired Interface
- **Dynamic Loading Screens**: Specialized GTA-style character cards and progress bars during navigation.
- **Cyberpunk Aesthetic**: Custom radial gradients, noise overlays, and scanline effects create a "dark city" atmosphere.
- **Typography**: Heavily stylized fonts (Pricedown, Chalet, Forresten) for that authentic high-stakes feel.

### ⚡ Interactive Elements
- **Crew Roster**: A live view of your team members, stylized as a "Most Wanted" list with connection status.
- **Mission Blueprint**: Clear visualization of level progression, mission status (Cleared/Active/Locked), and "Wanted Level" star meter.
- **Live Intel Streams**: Strategic clues that reveal themselves automatically over time, accompanied by tactical penalties.
- **Motion System**: Smooth, performant transitions using Framer Motion for every panel, button, and reveal.

---

## 🏁 Game Flow & Lifecycle

The contest follows a structured lifecycle managed by the Admin and participated in by Teams.

### 1. Preparation (Admin)
The Admin populates the database with challenges using the `seed-levels` API. Each level contains the question, answer, and its specific scoring parameters (max points, decay rates, clue unlock times).

### 2. Registration & Verification (Team)
Teams sign up by choosing a name and providing the student numbers of their members.
> **Verification**: The system checks the `registrations` collection (Day 1 database) to ensure every student number is valid and registered for the event. Fake or unregistered numbers will block the signup.

### 3. Level Progression Loop
- **Level Start**: The Admin triggers `start-level`. This sets the global timer for all teams.
- **Active Phase**: Teams view the question and clues. 
- **Scoring**: Points are calculated in real-time (see mechanics below).
- **Submission**: Teams submit answers. A correct answer "locks" the live score for that team and that level.
- **Next Level**: Once the duration expires or most teams have finished, the Admin moves to the `next-level`.

---

## 📊 Game Mechanics (Scoring & Decay)

Performance is measured by speed and accuracy. The "Live Score" for an active question decreases over time.

### 🛑 Point Reduction Rules
1. **Initial Score**: Every question starts with a `maxPointsPerQuestion` (e.g., 1000).
2. **Grace Period**: For the first `X` seconds (e.g., 30s), points do **not** decay.
3. **Time Decay**: After the grace period, points decrease by a set `decayPerSecond`.
   - `decayScore = (elapsedTime - gracePeriod) * decayRate`
4. **Clue Penalties**: Clues become available automatically after a certain amount of time.
   - **Clue 1**: Unlocks after `T1` seconds, applying `Penalty 1`.
   - **Clue 2**: Unlocks after `T2` seconds, applying `Penalty 2`.
   - *Note: These penalties are applied automatically as soon as the time threshold is passed.*

### 🛡️ Final Score Calculation
`Locked Score = Math.max(0, MaxPoints - DecayScore - AppliedPenalties)`

---

## ⚙️ Setup

### 1. Environment Variables
Create a `.env` file in the root directory:

```env
# MongoDB Connection
MONGO_URI=mongodb+srv://...

# Security Secrets
TEAM_SESSION_SECRET=long-random-string-at-least-32-chars
ADMIN_API_SECRET=your-admin-secret-header

# Contest Defaults
TEAM_MAX_MEMBER_COUNT=6
TEAM_MIN_PASSWORD_LENGTH=6
TEAM_MAX_TEAM_NAME_LENGTH=80
```

### 2. Installation & Running
```bash
npm install
npm run dev
```

---


## 📡 API Reference

### 🔐 Admin Routes
*All require `x-admin-secret: <ADMIN_API_SECRET>` header.*

| Route | Method | Description |
|-------|--------|-------------|
| `/api/admin/contest-state` | `GET` | Returns global status and timer info. |
| `/api/admin/start-level` | `POST` | Starts a specific or next available level. |
| `/api/admin/next-level` | `POST` | Advances the global contest to the next phase. |
| `/api/admin/seed-levels` | `POST` | Bulk-uploads Level data (Overwrites existing). |


#### 1. `GET /api/admin/contest-state`
**Response:**
```json
{
  "success": true,
  "contestState": {
    "status": "idle",
    "totalLevels": 10,
    "currentLevel": 1,
    "levelStartedAt": "2026-04-03T10:00:00Z",
    "levelEndsAt": "2026-04-03T10:15:00Z",
    "maxPointsPerQuestion": 1000,
    "gracePeriodSeconds": 30,
    "durationSeconds": 900,
    "decayPerSecond": 1,
    "clue1UnlockSeconds": 300,
    "clue1Penalty": 150,
    "clue2UnlockSeconds": 600,
    "clue2Penalty": 250
  }
}
```

#### 2. `POST /api/admin/start-level`
**Request Body:**
```json
{ "level": 1 } 
```
*(Optional: Omit `level` to start the next one)*

#### 3. `POST /api/admin/seed-levels`
**Request Body:**
```json
{
  "levels": [
    {
      "levelNumber": 1,
      "question": "Reverse a linked list...",
      "answer": "ans123",
      "clue1": "Use three pointers...",
      "clue2": "Second clue here...",
      "maxPoints": 1000,
      "gracePeriodSeconds": 30,
      "durationSeconds": 900,
      "decayPerSecond": 1,
      "clue1UnlockSeconds": 300,
      "clue1Penalty": 150,
      "clue2UnlockSeconds": 600,
      "clue2Penalty": 250
    }
  ]
}
```

---

### 👥 Team Routes

| Route | Method | Auth |
|-------|--------|------|
| `/api/team/signup` | `POST` | None |
| `/api/team/login` | `POST` | None |
| `/api/team/logout` | `POST` | Cookie |
| `/api/team/state` | `GET` | Cookie |
| `/api/team/current-question` | `GET` | Cookie |
| `/api/team/submit-answer` | `POST` | Cookie |

#### 1. `POST /api/team/signup`
**Request Body:**
```json
{
  "teamName": "TeamAlpha",
  "password": "securePass123",
  "studentNumbers": ["2510001", "2510002"]
}
```

#### 2. `GET /api/team/state`
**Response:**
```json
{
  "success": true,
  "state": {
    "contestStatus": "running",
    "currentLevel": 1,
    "teamCurrentLevel": 1,
    "levelState": { "status": "active", "clue1PenaltyApplied": false },
    "totalLockedScore": 4500,
    "timer": { "levelEndsAt": "...", "timeRemainingSeconds": 420 },
    "scoring": { "liveScore": 850, "timeDecay": 50, "cluePenaltyTotal": 0 }
  }
}
```

---

### 🏆 Public Routes

#### 1. `GET /api/leaderboard`
**Query Params:** `?limit=5`
**Response:**
```json
{
  "success": true,
  "leaderboard": [
    { "rank": 1, "teamName": "TeamAlpha", "totalLockedScore": 5350, "currentLevel": 2 },
    { "rank": 2, "teamName": "TeamBeta", "totalLockedScore": 4200, "currentLevel": 1 }
  ]
}
```

---

## 🏗️ Data Models

- **Team**: Stores members, locked scores, and progress state.
- **Level**: Configuration for each challenge and its scoring metrics.
- **ContestState**: Singleton managing the global "running" status and timers.
- **Submission**: Audit log of every locked result (solved/expired).
- **Registration (User)**: The "Day 1" database of authorized participants.
