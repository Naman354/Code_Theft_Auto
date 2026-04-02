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
```

3. Run dev server:

```bash
npm run dev
```

## API Routes

The backend API is being rebuilt around direct team signup/login and contest state routes.
Legacy registration-import, auto-team-generation, and email/access-code login endpoints
have been removed.

## Data Models

- `Team`: unique team name, normalized team name, password hash, members, total locked score, current level, per-level state, last login timestamps
- `Level`: level number, question, answer, two clues, and per-level scoring/timer configuration
- `ContestState`: singleton global contest status, active level, level timer, and default scoring configuration
- `Submission`: per-team answer attempts with correctness, locked score snapshot, clue penalty snapshot, and response time
