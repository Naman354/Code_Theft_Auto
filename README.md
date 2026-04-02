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
# Optional: used by /api/admin/migrate-users
LEGACY_USERS_COLLECTION=legacy_users
```

3. Run dev server:

```bash
npm run dev
```

## API Routes

- `POST /api/auth/login`
  - Body: `{ "email": "user@example.com", "accessCode": "GTA-ABCDE" }`
  - `accessCode` is optional; if provided and valid, user gets assigned to that team.

- `POST /api/admin/generate-teams`
  - Body: `{ "teamSize": 4 }` (optional, default 4)
  - Creates teams from unassigned users and assigns users to teams.

- `POST /api/admin/migrate-users`
  - Migrates users from `LEGACY_USERS_COLLECTION` into primary `User` collection.

## Data Models

- `User`: name, email, teamId, isAdmin, createdAt
- `Team`: teamName, accessCode, totalPoints, currentLevel, isFinalist, createdAt
- `Level`: levelNumber, type, questionData, answerHash, clue1, clue2
- `Submission`: teamId, levelNumber, pointsAwarded, cluesUsed, isSolved, submittedAt
