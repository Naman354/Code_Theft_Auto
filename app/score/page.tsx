"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { LeaderboardTable } from "@/components/LeaderboardTable";
import { DEFAULT_LEADERBOARD, formatArenaScore, type ArenaLeaderboardEntry } from "@/lib/arena-data";
import { fetchArenaLeaderboard } from "@/services/arena-api";

export default function ScorePage() {
  const [rows, setRows] = useState<ArenaLeaderboardEntry[]>(DEFAULT_LEADERBOARD);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadLeaderboard() {
      try {
        const payload = await fetchArenaLeaderboard();
        if (cancelled) {
          return;
        }
        const fetched = (payload as { leaderboard?: ArenaLeaderboardEntry[] }).leaderboard;
        if (fetched?.length) {
          setRows(fetched);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to fetch live leaderboard. Showing fallback data.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadLeaderboard();

    return () => {
      cancelled = true;
    };
  }, []);

  const topScore = rows[0]?.score ?? 0;

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src="/assets/images/background.png"
          alt="Cyberpunk scoreboard background"
          fill
          sizes="100vw"
          className="object-cover opacity-15"
        />
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,255,140,0.14),transparent_24%),linear-gradient(180deg,rgba(4,5,7,0.82),rgba(4,5,7,0.98))]" />
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.45em] text-lime-300/60">Scoreboard</p>
            <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl tracking-[0.14em] text-lime-300 sm:text-6xl">
              Mission Score
            </h1>
          </div>
          <Link
            href="/dashboard"
            className="rounded-full border border-lime-300/40 bg-lime-300/10 px-5 py-3 text-xs font-bold uppercase tracking-[0.35em] text-lime-100 transition hover:-translate-y-0.5 hover:bg-lime-300/20"
          >
            Back to Dashboard
          </Link>
        </div>

        <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <LeaderboardTable rows={rows} />
          <div className="space-y-6">
            <article className="cyber-panel rounded-[2rem] p-6">
              <p className="text-xs uppercase tracking-[0.45em] text-cyan-300/60">Top Run</p>
              <div className="mt-4">
                <div className="text-sm uppercase tracking-[0.35em] text-zinc-500">High Score</div>
                <div className="mt-2 font-[family-name:var(--font-display)] text-4xl tracking-[0.12em] text-cyan-200">
                  {formatArenaScore(topScore)}
                </div>
              </div>
            </article>
            <article className="cyber-panel rounded-[2rem] p-6">
              <p className="text-xs uppercase tracking-[0.45em] text-lime-300/60">Status</p>
              <div className="mt-4 space-y-3 text-sm leading-7 text-zinc-300">
                <p>{loading ? "Loading live scoreboard..." : "Live scoreboard synced."}</p>
                {error ? <p className="text-rose-200">{error}</p> : null}
              </div>
            </article>
          </div>
        </section>
      </div>
    </div>
  );
}

