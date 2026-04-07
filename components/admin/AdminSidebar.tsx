"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/contest", label: "Contest Control" },
  { href: "/admin/teams", label: "Teams Monitor" },
  { href: "/admin/levels", label: "Levels Manager" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="relative overflow-hidden rounded-2xl border border-cyan-300/25 bg-black/40 p-5 backdrop-blur-xl">
      <div className="absolute inset-0 bg-[url('/assets/grid.svg')] opacity-25" />
      <div className="relative z-10">
        <div className="rounded-2xl border border-fuchsia-300/35 bg-fuchsia-400/10 px-4 py-3 shadow-[0_0_20px_rgba(255,0,170,0.22)]">
          <p className="font-display text-2xl uppercase tracking-[0.1em] text-fuchsia-100">CTA Admin</p>
          <p className="mt-1 font-accent text-[10px] uppercase tracking-[0.3em] text-zinc-300">Control Grid</p>
        </div>
        <nav className="mt-6 flex flex-col gap-2">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "rounded-xl border px-4 py-3 font-accent text-xs uppercase tracking-[0.28em] transition-all duration-300",
                  active
                    ? "border-cyan-300/60 bg-cyan-300/15 text-cyan-100 shadow-[0_0_20px_rgba(0,255,255,0.4)]"
                    : "border-zinc-700 bg-zinc-900/60 text-zinc-300 hover:border-cyan-300/55 hover:text-cyan-100",
                ].join(" ")}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
