"use client";

import { useState } from "react";

type AccessFormProps = {
  onSubmit: (primaryValue: string, secondaryValue: string) => Promise<void>;
  loading?: boolean;
  error?: string | null;
  eyebrow?: string;
  title?: string;
  primaryLabel?: string;
  secondaryLabel?: string;
  submitLabel?: string;
  statusLabel?: string;
  primaryPlaceholder?: string;
  secondaryPlaceholder?: string;
};

export function AccessForm({
  onSubmit,
  loading,
  error,
  eyebrow = "Secure Access",
  title = "ENTER THE SYSTEM",
  primaryLabel = "Username",
  secondaryLabel = "Access Code",
  submitLabel = "ENTER THE SYSTEM",
  statusLabel = "AUTHORIZING...",
  primaryPlaceholder = "operator_07",
  secondaryPlaceholder = "********",
}: AccessFormProps) {
  const [primaryValue, setPrimaryValue] = useState("");
  const [secondaryValue, setSecondaryValue] = useState("");

  return (
    <form
      className="rounded-[2rem] border border-lime-400/20 bg-black/70 p-6 shadow-[0_0_40px_rgba(0,255,140,0.14)] backdrop-blur-xl sm:p-8"
      onSubmit={async (event) => {
        event.preventDefault();
        await onSubmit(primaryValue, secondaryValue);
      }}
    >
      <div className="space-y-2 text-center">
        <p className="font-[family-name:var(--font-accent)] text-xs uppercase tracking-[0.28em] text-lime-300/60 sm:tracking-[0.45em]">
          {eyebrow}
        </p>
        {title ? (
          <h2 className="font-[family-name:var(--font-body)] text-2xl tracking-[0.08em] text-lime-300 sm:text-4xl">
            {title}
          </h2>
        ) : null}
      </div>

      <div className="mt-8 grid gap-4">
        <label className="grid gap-2">
          <span className="text-xs uppercase tracking-[0.35em] text-zinc-400">{primaryLabel}</span>
          <input
            value={primaryValue}
            onChange={(event) => setPrimaryValue(event.target.value)}
            className="rounded-2xl border border-lime-400/20 bg-zinc-950/90 px-4 py-3 text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-lime-300 focus:ring-2 focus:ring-lime-400/20"
            placeholder={primaryPlaceholder}
            autoComplete="username"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-xs uppercase tracking-[0.35em] text-zinc-400">{secondaryLabel}</span>
          <input
            value={secondaryValue}
            onChange={(event) => setSecondaryValue(event.target.value)}
            type="password"
            className="rounded-2xl border border-lime-400/20 bg-zinc-950/90 px-4 py-3 text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-lime-300 focus:ring-2 focus:ring-lime-400/20"
            placeholder={secondaryPlaceholder}
            autoComplete="current-password"
          />
        </label>
      </div>

      {error ? (
        <p className="mt-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="mt-6 w-full rounded-full border border-lime-300/60 bg-lime-300 px-5 py-3 text-sm font-bold uppercase tracking-[0.2em] text-black transition hover:-translate-y-0.5 hover:bg-lime-200 disabled:cursor-not-allowed disabled:opacity-60 sm:tracking-[0.35em]"
      >
        {loading ? statusLabel : submitLabel}
      </button>
    </form>
  );
}
