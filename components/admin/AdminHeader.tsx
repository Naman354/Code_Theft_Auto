import type { ReactNode } from "react";

type AdminHeaderProps = {
  title: string;
  subtitle: string;
  actions?: ReactNode;
};

export function AdminHeader({ title, subtitle, actions }: AdminHeaderProps) {
  return (
    <header className="rounded-2xl border border-fuchsia-300/25 bg-black/35 p-5 backdrop-blur-xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div>
          <p className="font-accent text-xs uppercase tracking-[0.35em] text-fuchsia-100/75">{subtitle}</p>
          <h1 className="mt-2 font-display text-3xl uppercase tracking-[0.08em] text-cyan-100 sm:text-4xl sm:tracking-[0.1em]">
            {title}
          </h1>
        </div>
        {actions ? <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto sm:justify-end">{actions}</div> : null}
      </div>
    </header>
  );
}
