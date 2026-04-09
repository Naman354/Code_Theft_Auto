"use client";

import { m, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { AccessForm } from "@/components/AccessForm";
import { HoverPanel, Reveal, RevealItem, Stagger } from "@/components/ui/motion";
import { fetchRegisteredTeamNames, loginArena, setArenaTeamSnapshot, signupArenaTeam } from "@/services/arena-api";
import character5  from "@/public/assets/images/character5.png";
const navItems = [
  { label: "Mission", href: "#mission" },
  { label: "Leaderboard", href: "#leaderboard" },
  { label: "About", href: "#about" },
];

export default function Home() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registerTeamName, setRegisterTeamName] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerStudents, setRegisterStudents] = useState("");
  const [registeredTeams, setRegisteredTeams] = useState<Array<{ id: string; teamName: string; memberCount: number }>>([]);
  const didLogHydrationRef = useRef(false);

  useEffect(() => {
    if (didLogHydrationRef.current) {
      return;
    }

    didLogHydrationRef.current = true;
    if (process.env.NODE_ENV !== "production") {
      console.log("[registerStudents][mount]", {
        value: JSON.stringify(registerStudents),
        length: registerStudents.length,
        isEmpty: registerStudents === "",
        isWhitespaceOnly: registerStudents.trim().length === 0,
      });
    }
  }, [registerStudents]);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.log("[registerStudents][change]", {
        value: JSON.stringify(registerStudents),
        length: registerStudents.length,
        isEmpty: registerStudents === "",
        isWhitespaceOnly: registerStudents.trim().length === 0,
      });
    }
  }, [registerStudents]);

  useEffect(() => {
    let cancelled = false;

    async function loadRegisteredTeams() {
      try {
        const payload = await fetchRegisteredTeamNames();

        if (!cancelled) {
          setRegisteredTeams(payload.teams ?? []);
        }
      } catch (loadError) {
        if (!cancelled && process.env.NODE_ENV !== "production") {
          console.warn("Failed to fetch registered team names.", loadError);
        }
      }
    }

    void loadRegisteredTeams();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleLogin(teamName: string, password: string) {
    setLoading(true);
    setError(null);

    try {
      const response = await loginArena(teamName, password);
      setArenaTeamSnapshot({
        teamName: response.team.teamName,
        members: response.team.members ?? [],
      });
      router.push("/dashboard");
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Failed to enter the arena.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const studentNumbers = Array.from(
        new Set(
          registerStudents
            .split(/[\s,]+/)
            .map((value) => value.trim())
            .filter(Boolean),
        ),
      );

      const response = await signupArenaTeam({
        teamName: registerTeamName,
        password: registerPassword,
        studentNumbers,
      });

      setArenaTeamSnapshot({
        teamName: response.team.teamName,
        members: response.team.members ?? [],
      });
      setRegisteredTeams((prev) => {
        if (prev.some((team) => team.teamName.toLowerCase() === response.team.teamName.toLowerCase())) {
          return prev;
        }

        return [...prev, {
          id: response.team.id,
          teamName: response.team.teamName,
          memberCount: response.team.members?.length ?? studentNumbers.length,
        }].sort((a, b) => a.teamName.localeCompare(b.teamName));
      });
      router.push("/dashboard");
    } catch (signupError) {
      setError(signupError instanceof Error ? signupError.message : "Team registration failed.");
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
      <div className="noise-overlay absolute inset-0 opacity-[0.1]" />

      <div className="relative z-10">
        <m.header
          className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 px-4 pt-4 sm:flex-row sm:items-center sm:px-6"
          initial={reduceMotion ? false : { opacity: 0, y: -16 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
            <div className="flex items-center gap-3">
            <div className="gta-glow flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-400/30 bg-white/5 shadow-[0_0_20px_rgba(34,211,238,0.18)]">
              <div className="flex items-center gap-1">
                <span className="h-3 w-3 rotate-45 rounded-sm bg-cyan-400" />
                <span className="h-3 w-3 -rotate-45 rounded-sm bg-rose-500" />
                <span className="h-3 w-3 rotate-12 rounded-sm bg-lime-400" />
              </div>
            </div>
            <div>
              <div className="gta-title text-xs font-semibold text-zinc-100 sm:text-sm">
                CODE THEFT AUTO
              </div>
              <div className="font-[family-name:var(--font-accent)] text-[9px] uppercase tracking-[0.24em] text-zinc-400 sm:text-[10px] sm:tracking-[0.35em]">
                cyber challenge system
              </div>
            </div>
          </div>

          <nav className="hidden items-center gap-8 font-[family-name:var(--font-accent)] text-xs uppercase tracking-[0.35em] text-zinc-300 md:flex">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="gta-glitch transition hover:text-cyan-300">
                {item.label}
              </Link>
            ))}
          </nav>
        </m.header>

        <div className="mx-auto mt-4 max-w-7xl px-4 sm:px-6">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
        </div>

        <main className="mx-auto max-w-7xl px-4 pb-16 pt-4 sm:px-6 lg:pt-5">
          <Reveal>
          <section className="gta-panel relative w-full overflow-hidden rounded-[2rem] bg-black/40 px-4 py-8 sm:px-8 sm:py-14 lg:px-14 lg:py-16">
            <div className="pointer-events-none absolute inset-0 cyber-grid opacity-[0.12]" />
            <div className="pointer-events-none absolute inset-0 cyber-scan" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),transparent)] opacity-20" />

            <div className="relative z-10 flex min-h-[320px] flex-col items-center justify-between text-center">
              <div className="w-full">
                <div className="mx-auto max-w-5xl">
                  <h1
                    className="gta-title gta-glitch text-4xl font-black leading-[0.9] text-white sm:text-6xl lg:text-[7.5rem]"
                    style={{
                      WebkitTextStroke: "2px #d946ef",
                      textShadow: "0 0 22px rgba(217,70,239,0.35)",
                    }}
                  >
                    WELCOME TO
                  </h1>
                </div>

                <div className="relative mx-auto mt-5 max-w-6xl">
                  <h2
                    className="gta-title text-[2rem] font-black leading-none sm:text-[3.3rem] lg:text-[6.2rem]"
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
                    CODE THEFT AUTO
                  </h2>
                </div>
              </div>

              <div className="mt-4 flex flex-col items-center gap-10">
                <Stagger className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs uppercase tracking-[0.2em] font-forresten sm:gap-x-10 sm:gap-y-4 sm:text-lg sm:tracking-[0.35em]">
                  <RevealItem><span className="text-zinc-100">Test Your Knowledge</span></RevealItem>
                  <RevealItem><span className="text-orange-400">Rise Through The Ranks</span></RevealItem>
                  <RevealItem><span className="text-zinc-100">Dominate The City</span></RevealItem>
                </Stagger>
                
              </div>
            </div>
          </section>
          </Reveal>

          <Reveal delay={0.08}>
          <section
            id="mission"
            className="mt-4  pt-4"
          >
            <div className="grid items-center gap-6 lg:grid-cols-[0.9fr_1.7fr_0.7fr]">
              <div className="justify-self-center text-center lg:justify-self-start lg:text-left">
                <div className="gta-title text-3xl text-fuchsia-300 sm:text-4xl">
                  CODE THEFT auto
                </div>
              </div>

              <div className="flex items-center justify-center text-center text-[1.15rem] leading-tight text-white sm:text-[1.6rem] lg:text-[2.15rem]">
                <span className="mr-2 text-zinc-300">&quot;</span>
                <span className="font-body font-light font-forresten tracking-[0.05em] sm:tracking-[0.08em]">
                  HEY WELCOME IN. LET&apos;S SEE HOW FOR YOUR SKILLS CAN TAKE YOU
                </span>
                <span className="ml-2 text-zinc-300">&quot;</span>
              </div>

              <m.div
                className="relative mx-auto min-h-[170px] w-[170px] justify-self-center overflow-hidden rounded-[2rem] bg-transparent sm:min-h-[180px] sm:w-[180px] lg:mx-0 lg:justify-self-end"
                animate={reduceMotion ? undefined : { y: [0, -8, 0] }}
                transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
              >
                <Image
                  src={character5}
                  alt="Cyber operator"
                  fill
                  sizes="(max-width: 1024px) 100vw, 22vw"
                  className="object-contain object-[center_bottom]"
                />
              </m.div>
            </div>
          </section>
          </Reveal>

          <Reveal delay={0.12}>
          <section id="leaderboard" className="relative mt-12 flex items-center justify-center sm:mt-16">
            <HoverPanel className="w-full max-w-4xl rounded-[2rem] border border-rose-500/70 bg-black/85 p-4 shadow-[0_0_0_1px_rgba(244,63,94,0.16),0_0_50px_rgba(244,63,94,0.08)] sm:p-8" glowClassName="bg-rose-500/15">
              <div className="gta-panel mx-auto flex max-w-2xl flex-col items-center rounded-[2rem] border border-rose-500/20 bg-black/70 px-4 py-8 sm:px-10 sm:py-10">
                <div className="rounded-md bg-rose-950/80 px-8 py-2">
                  <p className="font-accent font-forresten text-center text-sm uppercase tracking-[0.3em] text-rose-400 sm:text-lg sm:tracking-[0.5em]">
                    RESTRICTED ACCESS
                  </p>
                </div>

                <div className="mt-8 w-full max-w-xl font-forresten sm:mt-12">
                  <div className="mb-4 grid grid-cols-1 gap-2 rounded-2xl border border-rose-500/30 bg-black/50 p-2 sm:grid-cols-2">
                    <m.button
                      type="button"
                      onClick={() => setAuthMode("login")}
                      className={[
                        "gta-button rounded-xl px-3 py-2 text-xs uppercase tracking-[0.18em] transition-all duration-300 sm:tracking-[0.24em]",
                        authMode === "login"
                          ? "bg-cyan-400/20 text-cyan-100 shadow-[0_0_20px_rgba(0,255,255,0.35)]"
                          : "text-zinc-300 hover:text-cyan-100",
                      ].join(" ")}
                      whileHover={reduceMotion ? undefined : { scale: 1.01 }}
                      whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                    >
                      Team Login
                    </m.button>
                    <m.button
                      type="button"
                      onClick={() => setAuthMode("register")}
                      className={[
                        "gta-button rounded-xl px-3 py-2 text-xs uppercase tracking-[0.18em] transition-all duration-300 sm:tracking-[0.24em]",
                        authMode === "register"
                          ? "bg-pink-400/20 text-pink-100 shadow-[0_0_20px_rgba(255,0,170,0.35)]"
                          : "text-zinc-300 hover:text-pink-100",
                      ].join(" ")}
                      whileHover={reduceMotion ? undefined : { scale: 1.01 }}
                      whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                    >
                      Team Register
                    </m.button>
                  </div>

                  {authMode === "login" ? (
                    <AccessForm
                      onSubmit={handleLogin}
                      loading={loading}
                      error={error}
                      eyebrow=""
                      title=""
                      primaryLabel="ENTER TEAM NAME :-"
                      secondaryLabel="ENTER PASSWORD :-"
                      submitLabel="ENTER THE GAME"
                      statusLabel="AUTHORIZING TEAM..."
                      primaryPlaceholder="e.g. ByteRunners"
                      secondaryPlaceholder="********"
                    />
                  ) : (
                    <form
                      onSubmit={handleSignup}
                      className="gta-panel gta-glow rounded-[2rem] border border-lime-400/20 bg-black/70 p-6 backdrop-blur-xl sm:p-8"
                    >
                      <div className="space-y-2 text-center">
                        <p className="text-xs uppercase tracking-[0.45em] text-lime-300/60">NEW TEAM REGISTRATION</p>
                        <h2 className="gta-title text-2xl tracking-[0.08em] text-lime-300 sm:text-3xl">CREATE YOUR CREW</h2>
                      </div>

                      <div className="mt-6 grid gap-4">
                        <label className="grid gap-2">
                          <span className="text-xs uppercase tracking-[0.35em] text-zinc-400">TEAM NAME</span>
                          <input
                            value={registerTeamName}
                            onChange={(event) => setRegisterTeamName(event.target.value)}
                            className="rounded-2xl border border-lime-400/20 bg-zinc-950/90 px-4 py-3 text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-lime-300 focus:ring-2 focus:ring-lime-400/20 focus:shadow-[0_0_22px_rgba(138,255,97,0.14)]"
                            placeholder="e.g. ByteRunners"
                            autoComplete="organization"
                          />
                        </label>

                        <label className="grid gap-2">
                          <span className="text-xs uppercase tracking-[0.35em] text-zinc-400">PASSWORD</span>
                          <input
                            value={registerPassword}
                            onChange={(event) => setRegisterPassword(event.target.value)}
                            type="password"
                            className="rounded-2xl border border-lime-400/20 bg-zinc-950/90 px-4 py-3 text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-lime-300 focus:ring-2 focus:ring-lime-400/20 focus:shadow-[0_0_22px_rgba(138,255,97,0.14)]"
                            placeholder="Create strong password"
                            autoComplete="new-password"
                          />
                        </label>

                        <label className="grid gap-2">
                          <span className="text-xs uppercase tracking-[0.35em] text-zinc-400">
                            STUDENT NUMBERS (space/comma/newline separated)
                          </span>
                          <textarea
                            value={registerStudents}
                            onChange={(event) => setRegisterStudents(event.target.value)}
                            className="relative z-10 min-h-28 rounded-2xl border border-lime-400/20 bg-zinc-950/90 px-4 py-3 font-body text-white outline-none transition placeholder:font-body placeholder:text-zinc-300 placeholder:opacity-100 focus:border-lime-300 focus:ring-2 focus:ring-lime-400/20 focus:shadow-[0_0_22px_rgba(138,255,97,0.14)]"
                            placeholder="e.g. 2510084, 2510085, 2510086"
                          />
                        </label>
                      </div>

                      {error ? (
                        <p className="mt-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                          {error}
                        </p>
                      ) : null}

                      <m.button
                        type="submit"
                        disabled={loading}
                        className="gta-button gta-glitch mt-6 w-full rounded-full border border-lime-300/60 bg-lime-300 px-5 py-3 text-sm font-bold uppercase tracking-[0.35em] text-black transition hover:-translate-y-0.5 hover:bg-lime-200 disabled:cursor-not-allowed disabled:opacity-60"
                        whileHover={reduceMotion ? undefined : { scale: 1.01 }}
                        whileTap={reduceMotion ? undefined : { scale: 0.985 }}
                      >
                        {loading ? "REGISTERING..." : "CREATE TEAM"}
                      </m.button>

                      <div className="mt-6 rounded-2xl border border-cyan-400/20 bg-cyan-500/5 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs uppercase tracking-[0.35em] text-cyan-200">Registered Teams</p>
                          <span className="text-[10px] uppercase tracking-[0.35em] text-cyan-300/70">
                            {registeredTeams.length} crews
                          </span>
                        </div>
                        <div className="mt-3 max-h-44 space-y-2 overflow-y-auto pr-1">
                          {registeredTeams.length ? (
                            registeredTeams.map((team) => (
                              <m.div
                                key={team.id}
                                className="flex items-center justify-between rounded-[1.1rem] border border-cyan-400/10 bg-black/40 px-3 py-2 text-xs uppercase tracking-[0.18em] text-zinc-100"
                                initial={reduceMotion ? false : { opacity: 0, x: -10 }}
                                animate={reduceMotion ? undefined : { opacity: 1, x: 0 }}
                              >
                                <span>{team.teamName}</span>
                                <span className="text-cyan-300/70">{team.memberCount} members</span>
                              </m.div>
                            ))
                          ) : (
                            <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">No teams registered yet.</p>
                          )}
                        </div>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </HoverPanel>

            <div className="absolute bottom-0 right-0 hidden flex-col justify-end gap-4 md:flex">
              <m.div
                className="relative ml-auto h-[170px] w-[150px] overflow-hidden border border-white/10 bg-black/40"
                animate={reduceMotion ? undefined : { y: [0, -6, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              >
                <Image
                  src="/assets/images/map.png"
                  alt="Arena map"
                  fill
                  sizes="150px"
                  className="object-cover"
                />
              </m.div>
            </div>
          </section>
          </Reveal>
        </main>
      </div>
    </div>
  );
}
