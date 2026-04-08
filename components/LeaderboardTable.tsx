import type { ArenaLeaderboardEntry } from "@/lib/arena-data";

type LeaderboardTableProps = {
  rows: ArenaLeaderboardEntry[];
};

export function LeaderboardTable({ rows }: LeaderboardTableProps) {
  return (
    <div className="overflow-hidden rounded-[2rem] border border-lime-400/20 bg-zinc-950/80 shadow-[0_0_35px_rgba(0,255,140,0.08)]">
      <div className="border-b border-lime-400/10 px-4 py-4 sm:px-6">
        <p className="text-xs uppercase tracking-[0.3em] text-lime-300/60 sm:tracking-[0.45em]">Leaderboard</p>
      </div>
      <div className="divide-y divide-lime-400/10">
        {rows.map((row) => (
          <div
            key={`${row.rank}-${row.teamName}`}
            className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 px-4 py-4 transition hover:bg-lime-400/5 sm:grid-cols-[auto_1fr_auto_auto] sm:gap-4 sm:px-6"
          >
            <div className="text-sm font-bold text-lime-300">#{row.rank}</div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-zinc-100">{row.teamName}</div>
              <div className="text-xs uppercase tracking-[0.3em] text-zinc-500">Level {row.level}</div>
            </div>
            <div className="hidden text-xs uppercase tracking-[0.35em] text-zinc-500 sm:block">Score</div>
            <div className="text-right text-base font-semibold text-cyan-200 sm:text-lg">
              {row.score.toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

