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
```

3. Run dev server:

```bash
npm run dev
```

## API Routes

- `POST /api/team/signup`
  - Creates a team with a unique manually entered team name, compulsory password, and member list.

- `POST /api/team/login`
  - Restores an existing team session using team name and password.

- `POST /api/team/logout`
  - Clears the current team session cookie.

## Data Models

- `Team`: unique team name, normalized team name, password hash, members, total locked score, current level, per-level state, last login timestamps
- `Level`: level number, question, answer, two clues, and per-level scoring/timer configuration
- `ContestState`: singleton global contest status, active level, level timer, and default scoring configuration
- `Submission`: per-team answer attempts with correctness, locked score snapshot, clue penalty snapshot, and response time
