import type { ReactNode } from "react";

type AdminCardProps = {
  title: string;
  value: ReactNode;
  helper?: ReactNode;
  badge?: ReactNode;
};

export function AdminCard({ title, value, helper, badge }: AdminCardProps) {
  return (
    <article className="rounded-2xl border border-cyan-300/20 bg-black/35 p-5 backdrop-blur-xl shadow-[0_0_20px_rgba(0,255,255,0.18)] transition-all duration-300 hover:border-cyan-300/45">
      <div className="flex items-start justify-between gap-4">
        <h3 className="font-accent text-xs uppercase tracking-[0.34em] text-cyan-100/80">{title}</h3>
        {badge}
      </div>
      <div className="mt-4 font-display text-4xl uppercase tracking-[0.08em] text-fuchsia-200">{value}</div>
      {helper ? <p className="mt-3 text-xs uppercase tracking-[0.28em] text-zinc-300/70">{helper}</p> : null}
    </article>
  );
}
