type AdminBadgeProps = {
  label: string;
  tone?: "cyan" | "pink" | "emerald" | "amber" | "zinc";
};

const toneMap: Record<NonNullable<AdminBadgeProps["tone"]>, string> = {
  cyan: "border-cyan-300/45 bg-cyan-400/10 text-cyan-100",
  pink: "border-pink-300/45 bg-pink-400/10 text-pink-100",
  emerald: "border-emerald-300/45 bg-emerald-400/10 text-emerald-100",
  amber: "border-amber-300/45 bg-amber-400/10 text-amber-100",
  zinc: "border-zinc-300/45 bg-zinc-400/10 text-zinc-100",
};

export function AdminBadge({ label, tone = "cyan" }: AdminBadgeProps) {
  return (
    <span
      className={`rounded-full border px-3 py-1 font-accent text-[10px] uppercase tracking-[0.28em] ${toneMap[tone]}`}
    >
      {label}
    </span>
  );
}
