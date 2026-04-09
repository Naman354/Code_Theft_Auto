"use client";

import { m, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { MotionProvider } from "@/components/ui/motion";

const cards = [
  {
    id: "character-1",
    src: "/assets/images/character1.png",
    title: "Crew Online",
    tone: "from-fuchsia-500/25 to-transparent",
  },
  {
    id: "character-2",
    src: "/assets/images/character2.png",
    title: "Target Locked",
    tone: "from-cyan-400/25 to-transparent",
  },
  {
    id: "character-3",
    src: "/assets/images/character3.png",
    title: "Mission Sync",
    tone: "from-amber-400/25 to-transparent",
  },
];

export function GtaLoadingScreen() {
  const reduceMotion = useReducedMotion();

  return (
    <MotionProvider>
      <div className="relative min-h-screen overflow-hidden bg-[#040506] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(217,70,239,0.16),transparent_25%),radial-gradient(circle_at_75%_10%,rgba(34,211,238,0.14),transparent_20%),linear-gradient(180deg,#07090d_0%,#030304_100%)]" />
        <div className="noise-overlay absolute inset-0 opacity-[0.12]" />

        <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-4 py-14 sm:px-6">
          <m.div
            className="text-center"
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="font-accent text-xs uppercase tracking-[0.55em] text-zinc-400 sm:text-sm">
              Loading The City
            </p>
            <h1 className="mt-3 font-display text-5xl uppercase tracking-[0.12em] text-white drop-shadow-[0_0_18px_rgba(255,255,255,0.18)] sm:text-7xl">
              Code Theft Auto
            </h1>
          </m.div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {cards.map((card, index) => (
              <m.div
                key={card.id}
                className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-black/45 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
                initial={reduceMotion ? false : { opacity: 0, y: 24 }}
                animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.1 * index }}
              >
                <div className={`absolute inset-0 bg-gradient-to-b ${card.tone}`} />
                <div className="relative aspect-[4/5] overflow-hidden rounded-[1.5rem] border border-white/10 bg-zinc-950">
                  <Image src={card.src} alt={card.title} fill sizes="(max-width: 768px) 100vw, 30vw" className="object-cover" />
                </div>
                <div className="relative mt-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-accent text-[10px] uppercase tracking-[0.45em] text-zinc-500">
                      Loading Card 0{index + 1}
                    </p>
                    <p className="mt-2 font-body text-lg uppercase tracking-[0.18em] text-zinc-100">
                      {card.title}
                    </p>
                  </div>
                  <div className="h-9 w-9 rounded-full border border-cyan-300/35 bg-cyan-300/10" />
                </div>
              </m.div>
            ))}
          </div>

          <div className="mt-10">
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <m.div
                className="h-full w-1/3 rounded-full bg-[linear-gradient(90deg,#fb7185,#facc15,#22d3ee)]"
                animate={reduceMotion ? undefined : { x: ["-10%", "220%"] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
          </div>
        </div>
      </div>
    </MotionProvider>
  );
}
