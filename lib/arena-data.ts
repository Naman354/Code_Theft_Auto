export type ArenaLevelStatus = "locked" | "unlocked" | "active" | "completed";

export type ArenaLevelDefinition = {
  levelNumber: number;
  title: string;
  challengeType: "logic" | "coding";
  difficulty: "Easy" | "Medium" | "Hard" | "Extreme";
  duration: string;
  description: string;
  objective: string;
  reward: string;
  demoAnswer: string;
};

export type ArenaLevelView = ArenaLevelDefinition & {
  status: ArenaLevelStatus;
  score?: number;
  timeRemaining?: string;
};

export type ArenaLeaderboardEntry = {
  rank: number;
  teamName: string;
  score: number;
  level: number;
};

export type ArenaContestSnapshot = {
  status: "not_started" | "running" | "paused" | "completed";
  currentLevel: number;
  totalLevels: number;
  totalLockedScore?: number;
};

export const ARENA_LEVELS: ArenaLevelDefinition[] = [
  {
    levelNumber: 1,
    title: "LEVEL 1 - LOGIC GATE",
    challengeType: "logic",
    difficulty: "Easy",
    duration: "15:00",
    description: "Solve the opening logic prompt and unlock the first relay node.",
    objective: "Read the pattern carefully and submit the final logical answer.",
    reward: "Logic gate bypassed",
    demoAnswer: "LOGIC",
  },
  {
    levelNumber: 2,
    title: "LEVEL 2 - LOGIC FIREWALL",
    challengeType: "coding",
    difficulty: "Medium",
    duration: "15:00",
    description: "Route the correct path through a shifting firewall matrix.",
    objective: "Bypass the logic walls without tripping the trace.",
    reward: "Firewall patterns decoded",
    demoAnswer: "FIREWALL",
  },
  {
    levelNumber: 3,
    title: "LEVEL 3 - CODE DECRYPTION",
    challengeType: "coding",
    difficulty: "Medium",
    duration: "15:00",
    description: "Recover the hidden sequence before the timer burns out.",
    objective: "Decrypt the signal and rebuild the sequence.",
    reward: "Encrypted payload recovered",
    demoAnswer: "DECRYPT",
  },
  {
    levelNumber: 4,
    title: "LEVEL 4 - DECODING PUZZLE",
    challengeType: "logic",
    difficulty: "Hard",
    duration: "15:00",
    description: "Unpack the fragments and reconstruct the live signal.",
    objective: "Solve the decoding layer and stabilize the channel.",
    reward: "Puzzle fragments restored",
    demoAnswer: "DECODE",
  },
];

export const DEFAULT_LEADERBOARD: ArenaLeaderboardEntry[] = [
  { rank: 1, teamName: "NEON//ROOT", score: 6930, level: 4 },
  { rank: 2, teamName: "BYTE_RAZORS", score: 6420, level: 4 },
  { rank: 3, teamName: "ZERO_TRACE", score: 5980, level: 4 },
  { rank: 4, teamName: "CRYPTIC LAB", score: 5480, level: 3 },
  { rank: 5, teamName: "GLITCH UNIT", score: 4925, level: 3 },
];

export function getArenaLevelByNumber(levelNumber: number) {
  return ARENA_LEVELS.find((level) => level.levelNumber === levelNumber) ?? null;
}

export function formatArenaScore(score: number) {
  return new Intl.NumberFormat("en-US").format(score);
}

export function formatArenaTime(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

