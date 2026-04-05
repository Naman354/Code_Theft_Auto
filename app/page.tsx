"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AccessForm } from "@/components/AccessForm";
import { loginArena } from "@/services/arena-api";
import character5  from "@/public/assets/images/character5.png";
const navItems = [
  { label: "Mission", href: "#mission" },
  { label: "Leaderboard", href: "#leaderboard" },
  { label: "About", href: "#about" },
];

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(username: string, accessCode: string) {
    setLoading(true);
    setError(null);

    try {
      const response = await loginArena(username, accessCode);
      window.localStorage.setItem("code-theft-arena-name", response.team.teamName);
      router.push("/dashboard");
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Failed to enter the arena.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen overflow-hidden bg-black text-white">
      <div className="absolute inset-0">
        <Image
          src="/assets/images/background.png"
          alt="Cyberpunk city background"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-20"
        />
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(236,72,153,0.12),transparent_30%),radial-gradient(circle_at_70%_20%,rgba(34,211,238,0.12),transparent_22%),linear-gradient(180deg,rgba(0,0,0,0.35),rgba(0,0,0,0.92))]" />

      <div className="relative z-10">
        <header className="mx-auto flex max-w-7xl items-start justify-between gap-4 px-4 pt-4 sm:px-6">
            <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-400/30 bg-white/5 shadow-[0_0_20px_rgba(34,211,238,0.18)]">
              <div className="flex items-center gap-1">
                <span className="h-3 w-3 rotate-45 rounded-sm bg-cyan-400" />
                <span className="h-3 w-3 -rotate-45 rounded-sm bg-rose-500" />
                <span className="h-3 w-3 rotate-12 rounded-sm bg-lime-400" />
              </div>
            </div>
            <div>
              <div className="font-[family-name:var(--font-body)] text-sm font-semibold tracking-[0.18em] text-zinc-100">
                CODE THEFT ARENA
              </div>
              <div className="font-[family-name:var(--font-accent)] text-[10px] uppercase tracking-[0.35em] text-zinc-400">
                cyber challenge system
              </div>
            </div>
          </div>

          <nav className="hidden items-center gap-8 font-[family-name:var(--font-accent)] text-xs uppercase tracking-[0.35em] text-zinc-300 md:flex">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="transition hover:text-cyan-300">
                {item.label}
              </Link>
            ))}
          </nav>
        </header>

        <div className="mx-auto mt-4 max-w-7xl px-4 sm:px-6">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
        </div>

        <main className="mx-auto max-w-7xl pb-16 pt-4  lg:pt-5">
          <section className="relative overflow-hidden rounded-[2rem] bg-black/40 px-5 py-10 sm:px-8 sm:py-14 lg:px-14 lg:py-16 w-full">
            <div className="pointer-events-none absolute inset-0 cyber-grid opacity-[0.12]" />
            <div className="pointer-events-none absolute inset-0 cyber-scan" />

            <div className="relative z-10 flex min-h-[320px] flex-col items-center justify-between text-center">
              <div className="w-full">
                <div className="mx-auto max-w-5xl">
                  <h1
                    className="font-[family-name:var(--font-display)] text-6xl font-black uppercase leading-[0.9] tracking-[0.1em] text-white sm:text-8xl lg:text-[7.5rem]"
                    style={{
                      WebkitTextStroke: "3px #d946ef",
                      textShadow: "0 0 22px rgba(217,70,239,0.35)",
                    }}
                  >
                    WELCOME TO
                  </h1>
                </div>

                <div className="relative mx-auto mt-5 max-w-6xl">
                  <h2
                    className="font-[family-name:var(--font-display)] text-[3.1rem] font-black uppercase leading-none tracking-[0.12em] sm:text-[4.8rem] lg:text-[6.2rem]"
                    style={{
                      backgroundImage: "url('/assets/images/background.png')",
                      backgroundSize: "cover",
                      backgroundPosition: "center 48%",
                      WebkitBackgroundClip: "text",
                      backgroundClip: "text",
                      color: "transparent",
                      WebkitTextStroke: "1px rgba(251,191,36,0.35)",
                      textShadow: "0 14px 24px rgba(0,0,0,0.45)",
                    }}
                  >
                    CODE THEFT ARENA
                  </h2>
                </div>
              </div>

              <div className="mt-4 flex flex-col items-center gap-10">
                <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-sm uppercase tracking-[0.35em] sm:text-lg font-forresten">
                  <span className="text-zinc-100">Test Your Knowledge</span>
                  <span className="text-orange-900">Rise Through The Ranks</span>
                  <span className="text-zinc-100">Dominate The City</span>
                </div>
              </div>
            </div>
          </section>

          <section
            id="mission"
            className="mt-4  pt-4"
          >
            <div className="grid items-center gap-8 lg:grid-cols-[0.9fr_1.7fr_0.7fr]">
              <div className="justify-self-start">
                <div className="font-display text-3xl uppercase tracking-[0.16em] text-fuchsia-300 sm:text-4xl">
                  CODE THEFT ARENA
                </div>
              </div>

              <div className="flex items-center justify-center text-center text-[1.75rem] leading-tight text-white sm:text-[2.15rem]">
                <span className="mr-2 text-zinc-300">&quot;</span>
                <span className="font-body font-light font-forresten tracking-[0.08em]">
                  HEY WELCOME IN. LET&apos;S SEE HOW FOR YOUR SKILLS CAN TAKE YOU
                </span>
                <span className="ml-2 text-zinc-300">&quot;</span>
              </div>

              <div className="relative min-h-[180px] min-w-[180px]  justify-self-end overflow-hidden rounded-[2rem]  bg-transparent">
                <Image
                  src={character5}
                  alt="Cyber operator"
                  fill
                  sizes="(max-width: 1024px) 100vw, 22vw"
                  className="object-contain object-[center_bottom]"
                />
              </div>
            </div>
          </section>

          <section id="leaderboard" className="mt-16 relative flex items-center justify-center">
            <div className="rounded-[2rem] w-3/5 border border-rose-500/70 bg-black/85 p-8 shadow-[0_0_0_1px_rgba(244,63,94,0.16),0_0_50px_rgba(244,63,94,0.08)]">
              <div className="mx-auto flex max-w-2xl flex-col items-center rounded-[2rem] border border-rose-500/20 bg-black/70 px-6 py-10 sm:px-10">
                <div className="rounded-md bg-rose-950/80 px-8 py-2">
                  <p className="font-accent text-center text-lg uppercase tracking-[0.5em] text-rose-400 font-forresten">
                    RESTRICTED ACCESS
                  </p>
                </div>

                <div className="mt-12 w-full font-forresten max-w-xl">
                  <AccessForm
                    onSubmit={handleLogin}
                    loading={loading}
                    error={error}
                    eyebrow=""
                    title=""
                    primaryLabel="ENTER YOUR STUDENT ID :-"
                    secondaryLabel="ENTER YOUR NAME :-"
                    submitLabel="ENTER THE GAME"
                    statusLabel="AWAITING CREDENTIAL..."
                    primaryPlaceholder=""
                    secondaryPlaceholder=""
                  />
                </div>
              </div>
            </div>

            <div className="absolute bottom-0 right-0 flex flex-col justify-end gap-4">
              <div className="relative ml-auto h-[170px] w-[150px] overflow-hidden border border-white/10 bg-black/40">
                <Image
                  src="/assets/images/map.png"
                  alt="Arena map"
                  fill
                  sizes="150px"
                  className="object-cover"
                />
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
