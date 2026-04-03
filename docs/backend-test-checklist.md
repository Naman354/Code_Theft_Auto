# Backend Test Checklist

## Setup

- Set `MONGO_URI`
- Set `TEAM_SESSION_SECRET`
- Set `ADMIN_API_SECRET`
- Optionally set `TEAM_MAX_MEMBER_COUNT=6`
- Start the app with `npm run dev`
- Use a clean test database or test collections

## Team Auth

- Signup succeeds with a unique team name, valid members, and valid password
- Signup fails when `teamName` is missing
- Signup fails when password is missing
- Signup fails when password is shorter than the configured minimum
- Signup fails when team name duplicates an existing team name ignoring case/extra spaces
- Signup fails when any student number is not 7-8 digits
- Signup fails when duplicate student numbers are used within the same team
- Signup fails when member count exceeds `TEAM_MAX_MEMBER_COUNT` if it is configured
- Login succeeds with the correct team name and password
- Login fails with an incorrect password
- Login restores existing team progress and score data
- Logout clears the team session cookie

## Admin Control

- `GET /api/admin/contest-state` fails without `x-admin-secret`
- `GET /api/admin/contest-state` succeeds with the correct `x-admin-secret`
- `POST /api/admin/start-level` starts the requested configured level
- `POST /api/admin/start-level` fails if the requested level does not exist in `Level`
- `POST /api/admin/next-level` advances to the next configured level
- `POST /api/admin/next-level` completes the contest after the final level
- `POST /api/admin/next-level` fails if the next level document is missing

## Question State

- `GET /api/team/state` returns `401` without a valid team session
- `GET /api/team/current-question` returns the current level question when a level is running
- Before 30 seconds, live score remains `1400`
- After 30 seconds, live score decreases by `1` per second
- At 7 minutes, clue 1 becomes visible and `200` points are deducted automatically
- At 12 minutes, clue 2 becomes visible and `250` points are deducted automatically
- If the level document is missing while a level is running, `GET /api/team/current-question` returns `404`

## Submission and Locking

- Wrong answers return `isCorrect: false`
- Wrong answers do not create `Submission` rows
- Correct answers return `isCorrect: true`
- Correct answers lock the score exactly once
- Correct answers create one `Submission` row with `resultType: "solved"`
- Re-submitting after solve returns `409`
- Submitting after expiry returns `409`
- Simultaneous duplicate correct submissions do not create multiple final results

## Expiry

- After the 15-minute limit, the team level state becomes `expired`
- Expired levels lock score `0`
- Expired levels create one `Submission` row with `resultType: "expired"`
- Refreshing state after expiry does not create duplicate expired submissions

## Leaderboard

- `GET /api/leaderboard` returns at most 10 teams
- Leaderboard order is based on `totalLockedScore` only, not live score
- Higher `solvedLevelsCount` breaks score ties
- Earlier `createdAt` breaks ties after solved-level count
- `teamName` is the final stable tie-breaker
