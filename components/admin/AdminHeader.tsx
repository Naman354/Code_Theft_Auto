import type { ReactNode } from "react";

type AdminHeaderProps = {
  title: string;
  subtitle: string;
  actions?: ReactNode;
};

export function AdminHeader({ title, subtitle, actions }: AdminHeaderProps) {
  return (
    <header className="rounded-2xl border border-fuchsia-300/25 bg-black/35 p-5 backdrop-blur-xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-accent text-xs uppercase tracking-[0.35em] text-fuchsia-100/75">{subtitle}</p>
          <h1 className="mt-2 font-display text-4xl uppercase tracking-[0.1em] text-cyan-100">{title}</h1>
        </div>
        {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
      </div>
    </header>
  );
}
