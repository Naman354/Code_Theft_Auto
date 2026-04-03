# Code Theft Auto 🚗💨

A high-stakes, team-based coding competition platform built with **Next.js 16** and **MongoDB**. Teams compete to solve algorithmic challenges under time pressure, navigating through levels of increasing difficulty while managing "score decay" and strategic clue reveals.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: MongoDB + Mongoose (uses a "Day 1" Registration database for student verification)
- **Auth**: Iron Session (Team) & Secret Header (Admin)

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

#### Body for `/api/admin/seed-levels`:
```json
{
  "levels": [
    {
      "levelNumber": 1,
      "question": "Reverse a linked list...",
      "answer": "ans123",
      "clue1": "Use three pointers...",
      "maxPoints": 1000,
      "gracePeriodSeconds": 30,
      "decayPerSecond": 1,
      "clue1UnlockSeconds": 120,
      "clue1Penalty": 150
    }
  ]
}
```

---

### 👥 Team Routes

| Route | Method | Auth | Required Fields |
|-------|--------|------|-----------------|
| `/api/team/signup` | `POST` | None | `teamName`, `password`, `studentNumbers[]` |
| `/api/team/login` | `POST` | None | `teamName`, `password` |
| `/api/team/logout` | `POST` | Cookie | None |
| `/api/team/state` | `GET` | Cookie | None (returns live status/timer) |
| `/api/team/current-question` | `GET` | Cookie | None (returns question/clues) |
| `/api/team/submit-answer` | `POST` | Cookie | `answer` |

---

### 🏆 Public Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/leaderboard` | `GET` | returns top ranked teams. |

---

## 🏗️ Data Models

- **Team**: Stores members, locked scores, and progress state.
- **Level**: Configuration for each challenge and its scoring metrics.
- **ContestState**: Singleton managing the global "running" status and timers.
- **Submission**: Audit log of every locked result (solved/expired).
- **Registration (User)**: The "Day 1" database of authorized participants.
