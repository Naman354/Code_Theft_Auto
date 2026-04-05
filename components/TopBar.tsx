"use client";

import Image from "next/image";

type TopBarProps = {
  username: string;
  score: number;
  currentLevel: number;
};

export function TopBar({ username, score, currentLevel }: TopBarProps) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-lime-400/20 bg-zinc-950/80 px-5 py-4 shadow-[0_0_24px_rgba(0,255,140,0.08)] backdrop-blur">
      <div className="flex items-center gap-4">
        <div className="relative h-12 w-12 overflow-hidden rounded-2xl border border-lime-400/30 bg-black">
          <Image
            src="/assets/images/character1.png"
            alt="Avatar"
            fill
            sizes="48px"
            className="object-cover"
          />
        </div>
        <div>
          <div className="font-[family-name:var(--font-accent)] text-xs uppercase tracking-[0.35em] text-lime-300/70">
            Operator
          </div>
          <div className="font-semibold text-zinc-50">{username}</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="rounded-2xl border border-lime-400/20 bg-lime-400/10 px-4 py-2 text-right">
          <div className="font-[family-name:var(--font-accent)] text-[10px] uppercase tracking-[0.35em] text-lime-200/70">
            Score
          </div>
          <div className="mt-1 font-[family-name:var(--font-body)] text-2xl tracking-[0.06em] text-lime-300">
            {score.toLocaleString()}
          </div>
        </div>
        <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-right">
          <div className="font-[family-name:var(--font-accent)] text-[10px] uppercase tracking-[0.35em] text-cyan-200/70">
            Current Node
          </div>
          <div className="mt-1 text-sm font-semibold text-cyan-100">Level {currentLevel}</div>
        </div>
      </div>
    </header>
  );
}
