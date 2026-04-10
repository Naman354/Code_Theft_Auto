import type { ArenaLeaderboardEntry, ArenaLevelView } from "@/lib/arena-data";

const ARENA_STORAGE_KEY = "code-theft-arena-token";
const TEAM_NAME_STORAGE_KEY = "code-theft-arena-name";
const TEAM_MEMBERS_STORAGE_KEY = "code-theft-arena-members";

type TeamMember = { name: string; studentNumber: string };

type LoginResponse = {
  success: true;
  token?: string;
  team: {
    id: string;
    teamName: string;
    members: TeamMember[];
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

type TeamAuthResponse = {
  success: true;
  team: {
    id: string;
    teamName: string;
    members: TeamMember[];
    totalLockedScore: number;
    currentLevel: number;
  };
};

export type AdminContestState = {
  status: "not_started" | "running" | "paused" | "completed";
  totalLevels: number;
  currentLevel: number;
  levelStartedAt: string | null;
  levelEndsAt: string | null;
  elapsedSeconds: number;
  maxPointsPerQuestion: number;
  gracePeriodSeconds: number;
  durationSeconds: number;
  decayPerSecond: number;
  clue1UnlockSeconds: number;
  clue1Penalty: number;
  clue2UnlockSeconds: number;
  clue2Penalty: number;
};

type ContestStateResponse = {
  success: true;
  contestState: AdminContestState;
};

type AdminActionResponse = {
  success: true;
  message: string;
  contestState?: Partial<AdminContestState>;
};

type AdminTeamsResponse = {
  success: true;
  totalTeams: number;
  teams: Array<{
    id: string;
    teamName: string;
    currentLevel: number;
    score: number;
    penalties: number;
    lastSubmissionAt: string | null;
    isDisqualified: boolean;
    tabSwitchCount: number;
  }>;
};

type TeamStateResponse = {
  success: true;
  team: {
    id: string;
    teamName: string;
    members: TeamMember[];
    totalLockedScore: number;
    currentLevel: number;
  };
  state: Record<string, unknown>;
};

type AdminSessionResponse = {
  success: true;
};

type RegisteredTeamNamesResponse = {
  success: true;
  totalTeams: number;
  teams: Array<{
    id: string;
    teamName: string;
    memberCount: number;
  }>;
};

type CurrentQuestionResponse = {
  success: true;
  currentQuestion: {
    levelNumber: number;
    question: string;
    snippets: Array<{
      language: string;
      code: string;
    }>;
    clue1: string | null;
    clue2: string | null;
  } | null;
  state: {
    contestStatus: "not_started" | "running" | "paused" | "completed";
    currentLevel: number;
    teamCurrentLevel: number;
    totalLockedScore: number;
    timer: {
      levelStartedAt: string | null;
      levelEndsAt: string | null;
      elapsedSeconds: number;
      timeRemainingSeconds: number;
      durationSeconds: number;
    };
    scoring: {
      maxPointsPerQuestion: number;
      gracePeriodSeconds: number;
      decayPerSecond: number;
      clue1UnlockSeconds: number;
      clue1Penalty: number;
      clue2UnlockSeconds: number;
      clue2Penalty: number;
      timeDecay: number;
      cluePenaltyTotal: number;
      liveScore: number;
    };
    levelState: {
      levelNumber: number;
      status: "not_started" | "active" | "solved" | "expired";
      lockedScore: number;
      clue1PenaltyApplied: boolean;
      clue1PenaltyAppliedAt: string | null;
      clue2PenaltyApplied: boolean;
      clue2PenaltyAppliedAt: string | null;
      solvedAt?: string | null;
      expiredAt?: string | null;
    };
  };
};

export function getArenaToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.sessionStorage.getItem(ARENA_STORAGE_KEY);
}

export function setArenaToken(token: string) {
  window.sessionStorage.setItem(ARENA_STORAGE_KEY, token);
}

export function clearArenaToken() {
  window.sessionStorage.removeItem(ARENA_STORAGE_KEY);
}

export function setArenaTeamSnapshot(input: { teamName: string; members: TeamMember[] }) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(TEAM_NAME_STORAGE_KEY, input.teamName);
  window.sessionStorage.setItem(TEAM_MEMBERS_STORAGE_KEY, JSON.stringify(input.members));
}

export function getArenaTeamMembers() {
  if (typeof window === "undefined") {
    return [] as TeamMember[];
  }

  const raw = window.sessionStorage.getItem(TEAM_MEMBERS_STORAGE_KEY);

  if (!raw) {
    return [] as TeamMember[];
  }

  try {
    const parsed = JSON.parse(raw) as TeamMember[];
    return Array.isArray(parsed) ? parsed : ([] as TeamMember[]);
  } catch {
    return [] as TeamMember[];
  }
}

export function setAdminSecret(secret: string) {
  void secret;
}

export function clearAdminSecret() {
  return;
}

export async function loginAdmin(secret: string) {
  const response = await fetch("/api/admin/session", {
    method: "POST",
    headers: new Headers({
      "Content-Type": "application/json",
    }),
    credentials: "include",
    body: JSON.stringify({ secret }),
  });

  return parseJsonResponse<AdminSessionResponse>(response);
}

export async function logoutAdmin() {
  const response = await fetch("/api/admin/session", {
    method: "DELETE",
    credentials: "include",
  });

  clearAdminSecret();
  return parseJsonResponse<AdminSessionResponse>(response);
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

function getAdminHeaders(token?: string | null) {
  return getArenaHeaders(token);
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

export async function loginArena(teamName: string, password: string) {
  const response = await fetch("/api/team/login", {
    method: "POST",
    headers: getArenaHeaders(),
    credentials: "include",
    body: JSON.stringify({
      teamName,
      password,
    }),
  });

  const payload = await parseJsonResponse<LoginResponse>(response);

  if (payload?.team) {
    setArenaTeamSnapshot({
      teamName: payload.team.teamName,
      members: payload.team.members ?? [],
    });
  }

  return payload;
}

export async function signupArenaTeam(input: {
  teamName: string;
  password: string;
  studentNumbers: string[];
}) {
  const response = await fetch("/api/team/signup", {
    method: "POST",
    headers: getArenaHeaders(),
    credentials: "include",
    body: JSON.stringify({
      teamName: input.teamName,
      password: input.password,
      studentNumbers: input.studentNumbers,
    }),
  });

  const payload = await parseJsonResponse<TeamAuthResponse>(response);

  if (payload?.team) {
    setArenaTeamSnapshot({
      teamName: payload.team.teamName,
      members: payload.team.members ?? [],
    });
  }

  return payload;
}

export async function logoutArenaTeam() {
  const response = await fetch("/api/team/logout", {
    method: "POST",
    headers: getArenaHeaders(),
    credentials: "include",
  });

  clearArenaToken();
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(TEAM_NAME_STORAGE_KEY);
    window.sessionStorage.removeItem(TEAM_MEMBERS_STORAGE_KEY);
  }
  return parseJsonResponse<{ success: true }>(response);
}

export async function fetchArenaTeamState(token?: string | null) {
  const response = await fetch("/api/team/state", {
    method: "GET",
    headers: getArenaHeaders(token),
    credentials: "include",
    cache: "no-store",
  });

  return parseJsonResponse<TeamStateResponse>(response);
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

export async function fetchRegisteredTeamNames() {
  const response = await fetch("/api/team/names", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  return parseJsonResponse<RegisteredTeamNamesResponse>(response);
}

export async function fetchCurrentQuestion(token?: string | null) {
  const response = await fetch("/api/team/current-question", {
    method: "GET",
    headers: getArenaHeaders(token),
    credentials: "include",
    cache: "no-store",
  });

  return parseJsonResponse<CurrentQuestionResponse>(response);
}

export async function fetchContestState(token?: string | null) {
  const response = await fetch("/api/admin/contest-state", {
    method: "GET",
    headers: getAdminHeaders(token),
    credentials: "include",
    cache: "no-store",
  });

  return parseJsonResponse<ContestStateResponse>(response);
}

export async function startLevel(input?: { level?: number; token?: string | null }) {
  const response = await fetch("/api/admin/start-level", {
    method: "POST",
    headers: getAdminHeaders(input?.token),
    credentials: "include",
    body: JSON.stringify({
      level: input?.level,
    }),
  });

  return parseJsonResponse<AdminActionResponse>(response);
}

export async function nextLevel(token?: string | null) {
  const response = await fetch("/api/admin/next-level", {
    method: "POST",
    headers: getAdminHeaders(token),
    credentials: "include",
  });

  return parseJsonResponse<AdminActionResponse>(response);
}

export async function stopLevel(token?: string | null) {
  const response = await fetch("/api/admin/stop-level", {
    method: "POST",
    headers: getAdminHeaders(token),
    credentials: "include",
  });

  return parseJsonResponse<AdminActionResponse>(response);
}

export async function restartLevel(input?: { level?: number; token?: string | null }) {
  const response = await fetch("/api/admin/restart-level", {
    method: "POST",
    headers: getAdminHeaders(input?.token),
    credentials: "include",
    body: JSON.stringify({
      level: input?.level,
    }),
  });

  return parseJsonResponse<AdminActionResponse>(response);
}

export async function stopGame(token?: string | null) {
  const response = await fetch("/api/admin/stop-game", {
    method: "POST",
    headers: getAdminHeaders(token),
    credentials: "include",
  });

  return parseJsonResponse<AdminActionResponse>(response);
}

export async function restartGame(token?: string | null) {
  const response = await fetch("/api/admin/restart-game", {
    method: "POST",
    headers: getAdminHeaders(token),
    credentials: "include",
  });

  return parseJsonResponse<AdminActionResponse>(response);
}

export async function seedLevels(input?: {
  levels?: Array<Record<string, unknown>>;
  token?: string | null;
}) {
  const response = await fetch("/api/admin/seed-levels", {
    method: "POST",
    headers: getAdminHeaders(input?.token),
    credentials: "include",
    body: JSON.stringify({
      levels: input?.levels,
    }),
  });

  return parseJsonResponse<AdminActionResponse>(response);
}

export async function fetchTeams(token?: string | null) {
  const response = await fetch("/api/admin/teams", {
    method: "GET",
    headers: getAdminHeaders(token),
    credentials: "include",
    cache: "no-store",
  });

  return parseJsonResponse<AdminTeamsResponse>(response);
}

export async function reinstateTeam(teamId: string, token?: string | null) {
  const response = await fetch("/api/admin/teams/reinstate", {
    method: "POST",
    headers: getAdminHeaders(token),
    credentials: "include",
    body: JSON.stringify({ teamId }),
  });

  return parseJsonResponse<AdminActionResponse>(response);
}

export async function toggleTeamBlock(teamId: string, isBlocked: boolean, token?: string | null) {
  const response = await fetch("/api/admin/teams/toggle-block", {
    method: "POST",
    headers: getAdminHeaders(token),
    credentials: "include",
    body: JSON.stringify({ teamId, isBlocked }),
  });

  return parseJsonResponse<AdminActionResponse>(response);
}
