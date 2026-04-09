"use client";

import { m, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { MotionProvider } from "@/components/ui/motion";

type LoadingScene = {
  id: string;
  src: string;
  title: string;
  caption: string;
  accent: string;
  dialogue: string;
};

type RadioStation = {
  id: string;
  name: string;
  frequency: string;
  vibe: string;
};

const loadingScenes: LoadingScene[] = [
  {
    id: "scene-neon",
    src: "/assets/images/character1.png",
    title: "Downtown Heat",
    caption: "Neon streets buzzing, sirens close, every alley hiding a deal.",
    accent: "from-fuchsia-500/35 via-rose-500/10 to-transparent",
    dialogue: "\"Keep your head down. The city loves winners until it smells smoke.\"",
  },
  {
    id: "scene-chase",
    src: "/assets/images/character4.png",
    title: "Wanted Route",
    caption: "Police chatter spikes while the skyline flashes red and cyan.",
    accent: "from-cyan-400/35 via-sky-500/10 to-transparent",
    dialogue: "\"Lose the tail, grab the package, and do not scratch the ride.\"",
  },
  {
    id: "scene-crew",
    src: "/assets/images/character5.png",
    title: "Back Alley Briefing",
    caption: "Crew huddled near the docks, plotting the next dirty shortcut.",
    accent: "from-amber-400/35 via-yellow-500/10 to-transparent",
    dialogue: "\"Fast money, loud engines, bad plans. Just another quiet night.\"",
  },
];

const loadingTips = [
  "Tip: If the plan sounds legal, you are probably standing in the wrong city.",
  "Tip: Sirens behind you mean you are finally making progress.",
  "Tip: Trust the crew. Distrust the van with tinted windows.",
  "Tip: Loading faster than your getaway driver can text back.",
];

const radioStations: RadioStation[] = [
  { id: "station-neon", name: "NEON FM", frequency: "98.7", vibe: "synthwave pursuit" },
  { id: "station-diesel", name: "DIESEL TALK", frequency: "101.9", vibe: "radio chatter and static" },
  { id: "station-bassline", name: "BASSLINE", frequency: "88.4", vibe: "club beats for bad decisions" },
];

type GtaLoadingScreenProps = {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
};

export function GtaLoadingScreen({
  eyebrow = "Entering Los Code Santos",
  title = "Code Theft Auto",
  subtitle = "Loading the city grid, priming the crew, bribing the traffic lights, and pretending this operation is fully under control.",
}: GtaLoadingScreenProps) {
  const reduceMotion = useReducedMotion();
  const [sceneIndex, setSceneIndex] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);
  const [stationIndex, setStationIndex] = useState(0);
  const [progress, setProgress] = useState(8);

  useEffect(() => {
    if (reduceMotion) {
      setProgress(86);
      return;
    }

    const progressInterval = window.setInterval(() => {
      setProgress((current) => (current >= 100 ? 18 : Math.min(100, current + Math.floor(Math.random() * 12) + 4)));
    }, 950);

    const sceneInterval = window.setInterval(() => {
      setSceneIndex((current) => (current + 1) % loadingScenes.length);
    }, 2400);

    const tipInterval = window.setInterval(() => {
      setTipIndex((current) => (current + 1) % loadingTips.length);
    }, 2600);

    return () => {
      window.clearInterval(progressInterval);
      window.clearInterval(sceneInterval);
      window.clearInterval(tipInterval);
    };
  }, [reduceMotion]);

  const activeScene = loadingScenes[sceneIndex];
  const activeStation = radioStations[stationIndex];
  const wantedLevel = useMemo(() => Math.max(1, Math.min(5, Math.ceil(progress / 20))), [progress]);
  const mapRevealHeight = `${Math.max(16, progress)}%`;

  return (
    <MotionProvider>
      <div className="relative min-h-screen overflow-hidden bg-[#050608] text-white">
        <div className="absolute inset-0">
          <video
            className="h-full w-full object-cover opacity-36"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            aria-hidden="true"
          >
            <source src="/assets/videos/WhatsApp%20Video%202026-04-09%20at%209.36.03%20AM.mp4" type="video/mp4" />
          </video>
          <Image
            src="/assets/images/background.png"
            alt="City skyline"
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-[0.08]"
          />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(244,63,94,0.16),transparent_20%),radial-gradient(circle_at_70%_18%,rgba(34,211,238,0.14),transparent_18%),linear-gradient(180deg,rgba(3,5,8,0.72),rgba(2,3,5,0.96))]" />
        <div className="noise-overlay absolute inset-0 opacity-[0.12]" />

        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <m.div
            className="absolute -left-16 top-10 h-40 w-40 rounded-full bg-fuchsia-500/15 blur-3xl"
            animate={reduceMotion ? undefined : { x: [0, 38, -18, 0], y: [0, 26, 8, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
          <m.div
            className="absolute right-0 top-1/3 h-56 w-56 rounded-full bg-cyan-400/12 blur-3xl"
            animate={reduceMotion ? undefined : { x: [0, -26, 18, 0], y: [0, -20, 10, 0] }}
            transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col justify-between px-4 py-6 sm:px-6 sm:py-8">
          <m.div
            className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <div className="max-w-3xl">
              <p className="font-accent text-[10px] uppercase tracking-[0.55em] text-zinc-400 sm:text-xs">
                {eyebrow}
              </p>
              <h1 className="gta-title mt-3 text-4xl leading-[0.9] text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.18)] sm:text-6xl lg:text-[5.4rem]">
                {title}
              </h1>
              <p className="mt-4 max-w-2xl font-body text-xs uppercase tracking-[0.18em] text-zinc-300 sm:text-sm sm:tracking-[0.26em]">
                {subtitle}
              </p>
            </div>

            <m.button
              type="button"
              onClick={() => setStationIndex((current) => (current + 1) % radioStations.length)}
              className="gta-panel gta-glow self-start rounded-[1.6rem] border border-cyan-400/25 bg-black/55 px-4 py-3 text-left backdrop-blur-xl"
              whileHover={reduceMotion ? undefined : { y: -4, scale: 1.01 }}
              whileTap={reduceMotion ? undefined : { scale: 0.985 }}
            >
              <p className="font-accent text-[10px] uppercase tracking-[0.4em] text-cyan-300/70">
                Tap To Change Station
              </p>
              <div className="mt-2 flex items-center gap-4">
                <div className="rounded-full border border-cyan-300/25 bg-cyan-400/10 px-3 py-1 font-display text-xl uppercase tracking-[0.08em] text-cyan-200">
                  {activeStation.frequency}
                </div>
                <div>
                  <p className="font-display text-lg uppercase tracking-[0.08em] text-white">
                    {activeStation.name}
                  </p>
                  <p className="font-body text-[10px] uppercase tracking-[0.2em] text-zinc-400">
                    {activeStation.vibe}
                  </p>
                </div>
              </div>
            </m.button>
          </m.div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
            <m.div
              key={activeScene.id}
              className="gta-panel relative overflow-hidden rounded-[2.2rem] border border-white/10 bg-black/45 p-4 sm:p-5"
              initial={reduceMotion ? false : { opacity: 0, scale: 0.98, y: 16 }}
              animate={reduceMotion ? undefined : { opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.45 }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${activeScene.accent}`} />
              <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.06),transparent_30%)]" />

              <div className="relative grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
                <div className="relative min-h-[380px] overflow-hidden rounded-[1.8rem] border border-white/10 bg-black/60">
                  <Image
                    src={activeScene.src}
                    alt={activeScene.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 40vw"
                    className="object-cover object-top"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_35%,rgba(0,0,0,0.58))]" />
                  <div className="absolute left-4 top-4 rounded-full border border-white/10 bg-black/45 px-3 py-1">
                    <span className="font-accent text-[10px] uppercase tracking-[0.35em] text-zinc-300">
                      Scene 0{sceneIndex + 1}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col justify-between gap-5">
                  <div>
                    <p className="font-accent text-[10px] uppercase tracking-[0.45em] text-rose-300/80">
                      Rapid Cut Feed
                    </p>
                    <h2 className="gta-title mt-3 text-3xl leading-none text-white sm:text-5xl">
                      {activeScene.title}
                    </h2>
                    <p className="mt-4 max-w-xl font-body text-xs uppercase tracking-[0.18em] text-zinc-200 sm:text-sm sm:tracking-[0.24em]">
                      {activeScene.caption}
                    </p>
                  </div>

                  <div className="rounded-[1.6rem] border border-white/10 bg-black/45 p-4">
                    <p className="font-body text-[11px] uppercase tracking-[0.26em] text-amber-300">
                      Character Chatter
                    </p>
                    <p className="mt-3 font-accent text-sm uppercase tracking-[0.14em] text-zinc-100 sm:text-base">
                      {activeScene.dialogue}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <StatChip label="Police Heat" value={`${wantedLevel}/5`} tone="text-rose-300" />
                    <StatChip label="Cash Stack" value={`$${(progress * 275).toLocaleString()}`} tone="text-amber-300" />
                    <StatChip label="Map Reveal" value={`${progress}%`} tone="text-cyan-300" />
                  </div>
                </div>
              </div>
            </m.div>

            <div className="flex flex-col gap-6">
              <div className="gta-panel relative overflow-hidden rounded-[2rem] border border-white/10 bg-black/50 p-4 sm:p-5">
                <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#fb7185,#facc15,#22d3ee)]" />
                <p className="font-accent text-[10px] uppercase tracking-[0.45em] text-zinc-400">
                  Wanted Meter
                </p>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <p className="font-display text-2xl uppercase tracking-[0.08em] text-white sm:text-2xl">
                    Heat Rising
                  </p>
                  <div className="rounded-full border border-white/10 bg-black/35 px-3 py-1 font-body text-xs uppercase tracking-[0.2em] text-zinc-300">
                    {progress}%
                  </div>
                </div>
                <div className="mt-5 flex items-center gap-2">
                  {Array.from({ length: 5 }, (_, index) => (
                    <m.span
                      key={index}
                      className={index < wantedLevel ? "text-amber-400" : "text-zinc-700"}
                      animate={reduceMotion || index >= wantedLevel ? undefined : { scale: [1, 1.16, 1] }}
                      transition={{ duration: 0.7, repeat: Infinity, repeatDelay: 1.2, delay: index * 0.08 }}
                    >
                      <svg viewBox="0 0 24 24" className="h-8 w-8 fill-current" aria-hidden="true">
                        <path d="M12 2.5 15 9l7 .9-5.1 4.7L18.2 21 12 17.4 5.8 21l1.3-6.4L2 9.9 9 9z" />
                      </svg>
                    </m.span>
                  ))}
                </div>
                <div className="mt-6 h-3 overflow-hidden rounded-full bg-white/10">
                  <m.div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#ef4444,#f59e0b,#fde047)]"
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                  />
                </div>
              </div>

              <div className="gta-panel relative overflow-hidden rounded-[2rem] border border-white/10 bg-black/50 p-4 sm:p-5">
                <p className="font-accent text-[10px] uppercase tracking-[0.45em] text-zinc-400">
                  Territory Reveal
                </p>
                <div className="relative mt-4 overflow-hidden rounded-[1.6rem] border border-white/10 bg-black/50">
                  <div className="relative aspect-[4/3]">
                    <Image
                      src="/assets/images/map.png"
                      alt="City map"
                      fill
                      sizes="(max-width: 1024px) 100vw, 28vw"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black/55" />
                    <m.div
                      className="absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,rgba(34,211,238,0.1),rgba(34,211,238,0.42))]"
                      animate={{ height: mapRevealHeight }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:32px_32px]" />
                  </div>
                </div>
              </div>

              <div className="gta-panel relative overflow-hidden rounded-[2rem] border border-white/10 bg-black/50 p-4 sm:p-5">
                <p className="font-accent text-[10px] uppercase tracking-[0.45em] text-zinc-400">
                  Loading Banter
                </p>
                <m.p
                  key={tipIndex}
                  className="mt-4 font-body text-xs uppercase tracking-[0.16em] text-zinc-100 sm:text-sm sm:tracking-[0.22em]"
                  initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                  animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  {loadingTips[tipIndex]}
                </m.p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="font-accent text-[10px] uppercase tracking-[0.45em] text-zinc-500">
                Asset Pipeline
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge text="Neon streets" />
                <Badge text="Police chatter" />
                <Badge text="Crew dossier" />
                <Badge text="Map overlays" />
                <Badge text="Engine static" />
              </div>
            </div>

            <div className="w-full max-w-xl">
              <div className="mb-2 flex items-center justify-between gap-4">
                <p className="font-display text-xl uppercase tracking-[0.08em] text-white sm:text-2xl">
                  Rolling The World In
                </p>
                <span className="font-accent text-xs uppercase tracking-[0.3em] text-cyan-300">
                  {progress}/100
                </span>
              </div>
              <div className="h-4 overflow-hidden rounded-full border border-white/10 bg-white/5 p-1">
                <m.div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#fb7185,#f97316,#facc15,#22d3ee)] shadow-[0_0_24px_rgba(34,211,238,0.25)]"
                  animate={{ width: `${Math.max(progress, 10)}%` }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </MotionProvider>
  );
}

function StatChip({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-[1.3rem] border border-white/10 bg-black/35 px-4 py-3">
      <p className="font-accent text-[10px] uppercase tracking-[0.35em] text-zinc-500">{label}</p>
      <p className={`mt-2 font-display text-xl uppercase tracking-[0.08em] ${tone}`}>{value}</p>
    </div>
  );
}

function Badge({ text }: { text: string }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-body text-[10px] uppercase tracking-[0.22em] text-zinc-300">
      {text}
    </span>
  );
}
