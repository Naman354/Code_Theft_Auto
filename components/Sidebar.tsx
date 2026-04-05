"use client";

import type { ArenaLevelView } from "@/lib/arena-data";

type SidebarProps = {
  levels: ArenaLevelView[];
  activeLevel: number;
  onSelectLevel: (levelNumber: number) => void;
};

export function Sidebar({ levels, activeLevel, onSelectLevel }: SidebarProps) {
  return (
    <aside className="rounded-3xl border border-lime-400/20 bg-zinc-950/80 p-4 shadow-[0_0_30px_rgba(0,255,140,0.08)] backdrop-blur">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="font-[family-name:var(--font-accent)] text-xs uppercase tracking-[0.35em] text-lime-300/70">
            Arena Map
          </div>
          <h2 className="mt-1 font-[family-name:var(--font-body)] text-2xl tracking-[0.06em] text-lime-300">
            Levels
          </h2>
        </div>
        <div className="rounded-full border border-lime-400/30 px-3 py-1 text-xs uppercase tracking-[0.35em] text-lime-200">
          5 nodes
        </div>
      </div>

      <nav className="space-y-2">
        {levels.map((level) => {
          const isActive = level.levelNumber === activeLevel;
          return (
            <button
              key={level.levelNumber}
              type="button"
              onClick={() => onSelectLevel(level.levelNumber)}
              className={[
                "flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition",
                isActive
                  ? "border-lime-300/70 bg-lime-400/10 shadow-[0_0_24px_rgba(0,255,140,0.16)]"
                  : "border-white/5 bg-white/[0.02] hover:border-lime-400/30 hover:bg-lime-400/5",
              ].join(" ")}
            >
              <div>
                <div className="text-[11px] uppercase tracking-[0.3em] text-zinc-500">
                  {level.levelNumber}
                </div>
                <div className="mt-1 text-sm font-medium text-zinc-100">{level.title}</div>
              </div>
              <span
                className={[
                  "rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.3em]",
                  level.status === "completed"
                    ? "border-emerald-400/40 text-emerald-200"
                    : level.status === "active"
                      ? "border-cyan-400/40 text-cyan-200"
                      : level.status === "unlocked"
                        ? "border-lime-400/40 text-lime-200"
                        : "border-rose-400/40 text-rose-200",
                ].join(" ")}
              >
                {level.status}
              </span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
