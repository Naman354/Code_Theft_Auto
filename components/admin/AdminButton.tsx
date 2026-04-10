import type { ButtonHTMLAttributes, ReactNode } from "react";

type AdminButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  tone?: "cyan" | "pink" | "amber" | "rose";
};

const toneClasses: Record<NonNullable<AdminButtonProps["tone"]>, string> = {
  cyan: "border-cyan-300/60 bg-cyan-400/10 text-cyan-100 hover:bg-cyan-400/20 shadow-[0_0_20px_rgba(0,255,255,0.4)]",
  pink: "border-pink-300/60 bg-pink-400/10 text-pink-100 hover:bg-pink-400/20 shadow-[0_0_20px_rgba(255,0,170,0.34)]",
  amber:
    "border-amber-300/60 bg-amber-300/10 text-amber-100 hover:bg-amber-300/20 shadow-[0_0_20px_rgba(245,158,11,0.3)]",
  rose: "border-rose-400/60 bg-rose-500/10 text-rose-100 hover:bg-rose-500/20 shadow-[0_0_20px_rgba(255,29,72,0.34)]",
};

export function AdminButton({ children, className, tone = "cyan", ...props }: AdminButtonProps) {
  return (
    <button
      className={`rounded-2xl border px-4 py-2 font-accent text-xs uppercase tracking-[0.24em] transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-40 ${toneClasses[tone]} ${className ?? ""}`}
      {...props}
    >
      {children}
    </button>
  );
}
