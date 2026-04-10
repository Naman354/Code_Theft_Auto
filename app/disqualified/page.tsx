"use client";

import { m, useReducedMotion } from "framer-motion";
import Image from "next/image";

export default function DisqualifiedPage() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black text-white">
      {/* Background image */}
      <div className="absolute inset-0">
        <Image
          src="/assets/images/background.png"
          alt="Cyberpunk city background"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-10"
        />
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,30,30,0.22),transparent_36%),radial-gradient(circle_at_75%_18%,rgba(255,79,79,0.12),transparent_22%),linear-gradient(180deg,rgba(0,0,0,0.55),rgba(0,0,0,0.97))]" />
      <div className="noise-overlay absolute inset-0 opacity-[0.1]" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center px-4 text-center">
        {/* Animated skull / ban icon */}
        <m.div
          className="mb-6 text-red-500"
          animate={reduceMotion ? undefined : { scale: [1, 1.06, 1], opacity: [1, 0.8, 1] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <svg viewBox="0 0 24 24" className="mx-auto h-28 w-28 fill-current drop-shadow-[0_0_32px_rgba(239,68,68,0.55)]" aria-hidden="true">
            <path d="M12 2a7 7 0 0 0-7 7c0 2.49 1.31 4.67 3.28 5.93L8 17h8l-.28-2.07A7 7 0 0 0 12 2Zm-1 16v1a1 1 0 0 0 2 0v-1h-2ZM8 18h8" />
            <path d="M3 3 21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-red-400" fill="none" />
          </svg>
        </m.div>

        {/* Wanted-style red strip */}
        <div className="mb-5 rounded-full border border-red-500/50 bg-red-500/10 px-6 py-2 shadow-[0_0_18px_rgba(239,68,68,0.2)]">
          <span className="font-chalet text-[0.7rem] uppercase tracking-[0.42em] text-red-300">
            System Flag — Permanent
          </span>
        </div>

        <m.h1
          className="gta-title gta-glitch mb-4 text-[2.8rem] leading-none text-red-500 drop-shadow-[0_0_22px_rgba(239,68,68,0.45)] sm:text-[4.5rem] lg:text-[6rem]"
          initial={reduceMotion ? false : { opacity: 0, y: -24 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          DISQUALIFIED
        </m.h1>

        <m.p
          className="mb-10 max-w-xl font-chalet text-[0.82rem] uppercase tracking-[0.22em] text-zinc-300/80 sm:text-[1rem] sm:tracking-[0.3em]"
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.18 }}
        >
          Your crew has been flagged for repeated protocol violations.
          This session has been permanently terminated by the arena system.
        </m.p>

        {/* Stats panel */}
        <m.div
          className="mb-10 grid w-full max-w-sm grid-cols-2 gap-3"
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="rounded-[1.35rem] border border-white/8 bg-[#151515] px-4 py-4 text-center">
            <div className="font-chalet text-[0.6rem] uppercase tracking-[0.38em] text-zinc-500">Reason</div>
            <div className="mt-2 font-pricedown text-lg uppercase tracking-[0.08em] text-red-400">Tab Switching</div>
          </div>
          <div className="rounded-[1.35rem] border border-white/8 bg-[#151515] px-4 py-4 text-center">
            <div className="font-chalet text-[0.6rem] uppercase tracking-[0.38em] text-zinc-500">Status</div>
            <div className="mt-2 font-pricedown text-lg uppercase tracking-[0.08em] text-zinc-300">Permanent</div>
          </div>
        </m.div>

        {/* Divider */}
        <div className="mb-8 flex w-full max-w-sm items-center gap-3">
          <div className="h-px flex-1 bg-red-500/40" />
          <div className="font-chalet text-[0.62rem] uppercase tracking-[0.38em] text-zinc-600">Arena Grid</div>
          <div className="h-px flex-1 bg-red-500/40" />
        </div>

        <m.p
          className="font-chalet text-[0.72rem] uppercase tracking-[0.22em] text-zinc-500"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={reduceMotion ? undefined : { opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          Contact an admin if you believe this is an error.
        </m.p>
      </div>
    </div>
  );
}
