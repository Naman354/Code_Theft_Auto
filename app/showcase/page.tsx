"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { ARENA_LEVELS, DEFAULT_LEADERBOARD, formatArenaScore } from "@/lib/arena-data";

type ShowcasePayload = {
  success: true;
  contestState: {
    status: "not_started" | "running" | "paused" | "completed";
    currentLevel: number;
    totalLevels: number;
  };
  activeLevel: {
    levelNumber: number;
    title: string;
    difficulty: "Easy" | "Medium" | "Hard" | "Extreme";
    description: string;
    reward: string;
  } | null;
  leaderboard: Array<{
    rank: number;
    teamName: string;
    score: number;
    level: number;
    isDisqualified: boolean;
  }>;
};

const initialPayload: ShowcasePayload = {
  success: true,
  contestState: {
    status: "not_started",
    currentLevel: 1,
    totalLevels: ARENA_LEVELS.length,
  },
  activeLevel: {
    levelNumber: ARENA_LEVELS[0]?.levelNumber ?? 1,
    title: ARENA_LEVELS[0]?.title ?? "LEVEL 1",
    difficulty: ARENA_LEVELS[0]?.difficulty ?? "Easy",
    description: ARENA_LEVELS[0]?.description ?? "Stand by for the first mission.",
    reward: ARENA_LEVELS[0]?.reward ?? "Mission reward pending",
  },
  leaderboard: DEFAULT_LEADERBOARD.map((row) => ({
    ...row,
    isDisqualified: false,
  })),
};

function getStatusLabel(status: ShowcasePayload["contestState"]["status"]) {
  switch (status) {
    case "running":
      return "LIVE NOW";
    case "paused":
      return "PAUSED";
    case "completed":
      return "COMPLETE";
    default:
      return "STANDBY";
  }
}

function getStatusTone(status: ShowcasePayload["contestState"]["status"]) {
  switch (status) {
    case "running":
      return "border-lime-300/40 bg-lime-300/10 text-lime-200";
    case "paused":
      return "border-amber-300/40 bg-amber-300/10 text-amber-200";
    case "completed":
      return "border-fuchsia-300/40 bg-fuchsia-300/10 text-fuchsia-200";
    default:
      return "border-cyan-300/30 bg-cyan-300/10 text-cyan-100";
  }
}

export default function ShowcasePage() {
  const [payload, setPayload] = useState<ShowcasePayload>(initialPayload);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadShowcase() {
      try {
        const response = await fetch("/api/showcase", {
          method: "GET",
          cache: "no-store",
        });

        const nextPayload = (await response.json()) as ShowcasePayload | { error?: string };

        if (!response.ok) {
          throw new Error(
            typeof nextPayload === "object" && nextPayload && "error" in nextPayload
              ? String(nextPayload.error ?? "Failed to load showcase.")
              : "Failed to load showcase.",
          );
        }

        if (!cancelled) {
          setPayload(nextPayload as ShowcasePayload);
          setError(null);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Unable to sync common screen.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadShowcase();
    const intervalId = window.setInterval(() => void loadShowcase(), 10000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  const topThree = useMemo(() => payload.leaderboard.slice(0, 3), [payload.leaderboard]);
  const remainingTeams = useMemo(() => payload.leaderboard.slice(3, 10), [payload.leaderboard]);
  const topScore = payload.leaderboard[0]?.score ?? 0;
  const activeLevel = payload.activeLevel;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#030507] text-white">
      <div className="absolute inset-0">
        <Image
          src="/assets/images/background.png"
          alt="Showcase background"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-15"
        />
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_26%),radial-gradient(circle_at_80%_15%,rgba(250,204,21,0.14),transparent_22%),linear-gradient(180deg,rgba(4,7,12,0.88),rgba(2,4,8,0.98))]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:42px_42px] opacity-[0.08]" />

      <main className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <div className="rounded-[2rem] border border-cyan-300/20 bg-black/40 p-5 shadow-[0_0_40px_rgba(34,211,238,0.1)] backdrop-blur-xl sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="font-chalet text-[0.78rem] uppercase tracking-[0.42em] text-cyan-200/70">
                  Common Screen
                </div>
                <h1 className="mt-3 font-pricedown text-[2.4rem] uppercase tracking-[0.08em] text-cyan-100 sm:text-[3.4rem]">
                  Arena Live
                </h1>
                <p className="mt-3 max-w-2xl font-chalet text-[0.8rem] uppercase leading-6 tracking-[0.14em] text-zinc-300 sm:text-[0.92rem] sm:leading-7 sm:tracking-[0.18em]">
                  One shared event screen for users to track the active mission, contest state, and live leaderboard.
                </p>
              </div>

              <div
                className={[
                  "inline-flex w-fit items-center rounded-full border px-4 py-3 font-chalet text-[0.74rem] uppercase tracking-[0.3em]",
                  getStatusTone(payload.contestState.status),
                ].join(" ")}
              >
                {loading ? "SYNCING" : getStatusLabel(payload.contestState.status)}
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-[1.6rem] border border-white/10 bg-white/5 p-4">
                <div className="font-chalet text-[0.62rem] uppercase tracking-[0.3em] text-zinc-500">Current Level</div>
                <div className="mt-3 font-pricedown text-[2rem] uppercase tracking-[0.08em] text-lime-300">
                  {payload.contestState.currentLevel}
                </div>
              </div>
              <div className="rounded-[1.6rem] border border-white/10 bg-white/5 p-4">
                <div className="font-chalet text-[0.62rem] uppercase tracking-[0.3em] text-zinc-500">Top Score</div>
                <div className="mt-3 font-pricedown text-[2rem] uppercase tracking-[0.08em] text-cyan-200">
                  {formatArenaScore(topScore)}
                </div>
              </div>
              <div className="rounded-[1.6rem] border border-white/10 bg-white/5 p-4">
                <div className="font-chalet text-[0.62rem] uppercase tracking-[0.3em] text-zinc-500">Total Levels</div>
                <div className="mt-3 font-pricedown text-[2rem] uppercase tracking-[0.08em] text-amber-200">
                  {payload.contestState.totalLevels}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-amber-300/20 bg-[linear-gradient(180deg,rgba(38,24,8,0.38),rgba(9,9,12,0.9))] p-5 shadow-[0_0_40px_rgba(250,204,21,0.08)] backdrop-blur-xl sm:p-6">
            <div className="font-chalet text-[0.76rem] uppercase tracking-[0.38em] text-amber-200/70">
              Active Mission
            </div>
            <div className="mt-3 font-pricedown text-[1.9rem] uppercase tracking-[0.08em] text-white sm:text-[2.4rem]">
              {activeLevel?.title.replace(/^LEVEL \d+ - /, "") ?? "Awaiting Launch"}
            </div>
            <div className="mt-3 inline-flex rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-2 font-chalet text-[0.64rem] uppercase tracking-[0.28em] text-amber-100">
              Level {activeLevel?.levelNumber ?? payload.contestState.currentLevel} / {activeLevel?.difficulty ?? "Standby"}
            </div>
            <p className="mt-5 font-chalet text-[0.8rem] uppercase leading-6 tracking-[0.14em] text-zinc-200 sm:text-[0.88rem] sm:leading-7">
              {activeLevel?.description ?? "Contest has not started yet. Stay ready for the first mission briefing."}
            </p>
            <div className="mt-5 rounded-[1.4rem] border border-white/10 bg-black/30 px-4 py-4">
              <div className="font-chalet text-[0.6rem] uppercase tracking-[0.32em] text-zinc-500">Reward</div>
              <div className="mt-2 font-chalet text-[0.78rem] uppercase tracking-[0.18em] text-lime-200">
                {activeLevel?.reward ?? "Reward pending"}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-5 grid flex-1 gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="rounded-[2rem] border border-fuchsia-300/20 bg-black/40 p-5 shadow-[0_0_40px_rgba(217,70,239,0.08)] backdrop-blur-xl sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="font-chalet text-[0.72rem] uppercase tracking-[0.38em] text-fuchsia-200/70">
                  Podium
                </div>
                <div className="mt-2 font-pricedown text-[1.8rem] uppercase tracking-[0.08em] text-white sm:text-[2.2rem]">
                  Top Teams
                </div>
              </div>
              <div className="font-chalet text-[0.64rem] uppercase tracking-[0.28em] text-zinc-500">
                Auto refresh: 10s
              </div>
            </div>

            <div className="mt-6 grid gap-4">
              {topThree.map((team, index) => (
                <div
                  key={`${team.rank}-${team.teamName}`}
                  className={[
                    "rounded-[1.7rem] border px-5 py-5",
                    index === 0
                      ? "border-amber-300/35 bg-[linear-gradient(135deg,rgba(61,42,7,0.55),rgba(11,11,14,0.96))]"
                      : "border-white/10 bg-white/5",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="font-chalet text-[0.62rem] uppercase tracking-[0.34em] text-zinc-500">
                        Rank #{team.rank}
                      </div>
                      <div className="mt-2 truncate font-pricedown text-[1.7rem] uppercase tracking-[0.08em] text-white sm:text-[2rem]">
                        {team.teamName}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-chalet text-[0.62rem] uppercase tracking-[0.3em] text-zinc-500">Score</div>
                      <div className="mt-2 font-pricedown text-[1.6rem] uppercase tracking-[0.08em] text-cyan-200">
                        {formatArenaScore(team.score)}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <span className="rounded-full border border-white/10 bg-black/25 px-3 py-2 font-chalet text-[0.64rem] uppercase tracking-[0.26em] text-zinc-300">
                      Level {team.level}
                    </span>
                    {team.isDisqualified ? (
                      <span className="rounded-full border border-rose-400/35 bg-rose-500/10 px-3 py-2 font-chalet text-[0.64rem] uppercase tracking-[0.26em] text-rose-200">
                        Blocked
                      </span>
                    ) : (
                      <span className="rounded-full border border-emerald-400/35 bg-emerald-500/10 px-3 py-2 font-chalet text-[0.64rem] uppercase tracking-[0.26em] text-emerald-200">
                        Active
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-cyan-300/20 bg-black/40 p-5 shadow-[0_0_40px_rgba(34,211,238,0.08)] backdrop-blur-xl sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="font-pricedown text-[1.8rem] uppercase tracking-[0.08em] text-cyan-100 sm:text-[2.2rem]">
                Full Board
              </div>
              <div className="font-chalet text-[0.64rem] uppercase tracking-[0.28em] text-zinc-500">
                Shared View
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              {remainingTeams.length > 0 ? (
                remainingTeams.map((team) => (
                  <div
                    key={`${team.rank}-${team.teamName}`}
                    className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 rounded-[1.4rem] border border-white/8 bg-white/5 px-4 py-4"
                  >
                    <div className="font-pricedown text-[1.3rem] uppercase tracking-[0.08em] text-zinc-500">
                      #{team.rank}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-chalet text-[0.9rem] uppercase tracking-[0.18em] text-white">
                        {team.teamName}
                      </div>
                      <div className="mt-1 font-chalet text-[0.62rem] uppercase tracking-[0.24em] text-zinc-500">
                        Level {team.level}
                      </div>
                    </div>
                    <div className="text-right font-pricedown text-[1.3rem] uppercase tracking-[0.08em] text-cyan-200">
                      {formatArenaScore(team.score)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[1.4rem] border border-white/8 bg-white/5 px-4 py-8 text-center font-chalet text-[0.78rem] uppercase tracking-[0.22em] text-zinc-400">
                  More teams will appear here as entries come in.
                </div>
              )}
            </div>

            {error ? (
              <div className="mt-4 rounded-[1.2rem] border border-rose-400/20 bg-rose-500/10 px-4 py-3 font-chalet text-[0.7rem] uppercase tracking-[0.16em] text-rose-200">
                {error}
              </div>
            ) : null}
          </div>
        </section>
      </main>
    </div>
  );
}
