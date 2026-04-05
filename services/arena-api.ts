import type { ArenaLeaderboardEntry, ArenaLevelView } from "@/lib/arena-data";

const ARENA_STORAGE_KEY = "code-theft-arena-token";

type LoginResponse = {
  success: true;
  token: string;
  team: {
    id: string;
    teamName: string;
    members: Array<{ name: string; studentNumber: string }>;
    totalLockedScore: number;
    currentLevel: number;
  };
};

type LevelsResponse = {
  success: true;
  levels: ArenaLevelView[];
  contestState?: {
    totalLockedScore?: number;
    currentLevel?: number;
  };
};

type SubmitResponse = {
  success: true;
  message: string;
  lockedScore?: number;
  isCorrect?: boolean;
};

type LeaderboardResponse = {
  success: true;
  leaderboard: ArenaLeaderboardEntry[];
};

export function getArenaToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(ARENA_STORAGE_KEY);
}

export function setArenaToken(token: string) {
  window.localStorage.setItem(ARENA_STORAGE_KEY, token);
}

export function clearArenaToken() {
  window.localStorage.removeItem(ARENA_STORAGE_KEY);
}

function getArenaHeaders(token?: string | null) {
  const headers = new Headers({
    "Content-Type": "application/json",
  });

  const storedToken = token ?? getArenaToken();

  if (storedToken) {
    headers.set("Authorization", `Bearer ${storedToken}`);
  }

  return headers;
}

async function parseJsonResponse<T>(response: Response) {
  const payload = (await response.json().catch(() => null)) as T | null;

  if (!response.ok) {
    const message =
      (payload && typeof payload === "object" && "error" in payload && String((payload as { error?: unknown }).error)) ||
      "Request failed.";
    throw new Error(message);
  }

  return payload as T;
}

export async function loginArena(username: string, accessCode: string) {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: getArenaHeaders(),
    credentials: "include",
    body: JSON.stringify({
      username,
      accessCode,
    }),
  });

  const payload = await parseJsonResponse<LoginResponse>(response);

  if (payload?.token) {
    setArenaToken(payload.token);
  }

  return payload;
}

export async function fetchArenaLevels(token?: string | null) {
  const response = await fetch("/api/levels", {
    method: "GET",
    headers: getArenaHeaders(token),
    credentials: "include",
    cache: "no-store",
  });

  return parseJsonResponse<LevelsResponse>(response);
}

export async function submitArenaAnswer(input: {
  answer: string;
  levelNumber?: number;
  token?: string | null;
}) {
  const response = await fetch("/api/submit", {
    method: "POST",
    headers: getArenaHeaders(input.token),
    credentials: "include",
    body: JSON.stringify({
      answer: input.answer,
      levelNumber: input.levelNumber,
    }),
  });

  return parseJsonResponse<SubmitResponse>(response);
}

export async function fetchArenaLeaderboard() {
  const response = await fetch("/api/leaderboard", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  return parseJsonResponse<LeaderboardResponse>(response);
}
