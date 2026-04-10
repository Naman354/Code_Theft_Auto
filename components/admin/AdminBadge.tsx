type AdminBadgeProps = {
  label: string;
  tone?: "cyan" | "pink" | "emerald" | "amber" | "zinc" | "rose";
};

const toneMap: Record<NonNullable<AdminBadgeProps["tone"]>, string> = {
  cyan: "border-cyan-300/45 bg-cyan-400/10 text-cyan-100",
  pink: "border-pink-300/45 bg-pink-400/10 text-pink-100",
  emerald: "border-emerald-300/45 bg-emerald-400/10 text-emerald-100",
  amber: "border-amber-300/45 bg-amber-400/10 text-amber-100",
  zinc: "border-zinc-300/45 bg-zinc-400/10 text-zinc-100",
  rose: "border-rose-400/45 bg-rose-500/10 text-rose-100",
};

export function AdminBadge({ label, tone = "cyan" }: AdminBadgeProps) {
  return (
    <span
      className={`inline-flex max-w-full items-center justify-center whitespace-nowrap rounded-full border px-3 py-1 font-accent text-[10px] uppercase leading-none tracking-[0.18em] sm:tracking-[0.22em] ${toneMap[tone]}`}
    >
      {label}
    </span>
  );
}
