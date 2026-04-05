"use client";

import type { ArenaLevelView } from "@/lib/arena-data";

type LevelCardProps = {
  level: ArenaLevelView;
  isSelected?: boolean;
  onAction?: (level: ArenaLevelView) => void;
};

const STATUS_STYLES: Record<ArenaLevelView["status"], string> = {
  locked: "border-rose-500/40 text-rose-200",
  unlocked: "border-lime-400/40 text-lime-200",
  active: "border-cyan-400/60 text-cyan-200",
  completed: "border-emerald-400/60 text-emerald-200",
};

export function LevelCard({ level, isSelected, onAction }: LevelCardProps) {
  const buttonLabel =
    level.status === "locked"
      ? "Locked"
      : level.status === "active"
        ? "Start"
        : level.status === "completed"
          ? "Unlocked"
          : "Unlock";

  return (
    <article
      className={[
        "relative overflow-hidden rounded-3xl border bg-zinc-950/80 p-6 shadow-[0_0_35px_rgba(0,255,140,0.09)] backdrop-blur",
        "transition duration-300 hover:-translate-y-1 hover:border-lime-300/60 hover:shadow-[0_0_45px_rgba(0,255,140,0.18)]",
        isSelected ? "border-lime-300/70 ring-1 ring-lime-300/40" : "border-lime-400/20",
      ].join(" ")}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-lime-400 to-transparent" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span
          className={[
            "rounded-full border px-3 py-1 text-xs uppercase tracking-[0.35em]",
            STATUS_STYLES[level.status],
          ].join(" ")}
        >
          {level.status}
        </span>
        <div className="text-right text-xs uppercase tracking-[0.4em] text-lime-300/70">
          {level.difficulty} / {level.duration}
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <h3 className="font-[family-name:var(--font-body)] text-2xl tracking-[0.06em] text-lime-300 sm:text-3xl">
          {level.title}
        </h3>
        <p className="max-w-2xl text-sm leading-7 text-zinc-300/85">{level.description}</p>
        <div className="rounded-2xl border border-lime-400/15 bg-black/50 p-4 text-sm text-zinc-300">
          <div className="text-xs uppercase tracking-[0.35em] text-lime-200/70">Objective</div>
          <p className="mt-2">{level.objective}</p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">{level.reward}</p>
          <button
            type="button"
            onClick={() => onAction?.(level)}
            disabled={level.status === "locked"}
            className={[
              "rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-[0.35em] transition",
              level.status === "locked"
                ? "cursor-not-allowed border border-rose-500/30 bg-rose-500/10 text-rose-200"
                : "border border-lime-400/60 bg-lime-400/15 text-lime-100 hover:bg-lime-300/25",
            ].join(" ")}
          >
            {buttonLabel}
          </button>
        </div>
      </div>
    </article>
  );
}
