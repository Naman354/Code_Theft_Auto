"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ARENA_LEVELS, type ArenaLevelView } from "@/lib/arena-data";
import {
  fetchArenaLevels,
  fetchArenaTeamState,
  getArenaTeamMembers,
  getArenaToken,
  logoutArenaTeam,
} from "@/services/arena-api";

function getFallbackLevels(): ArenaLevelView[] {
  return ARENA_LEVELS.map((level, index) => ({
    ...level,
    status: index === 0 ? "active" : "locked",
  }));
}

function getLevelStatusLabel(status: ArenaLevelView["status"]) {
  switch (status) {
    case "active":
      return "IN PROGRESS...";
    case "completed":
      return "CLEARED...";
    case "unlocked":
      return "READY...";
    default:
      return "LOCKED...";
  }
}

export default function DashboardPage() {
  const router = useRouter();
  const [teamName, setTeamName] = useState("SYSTEM OPERATOR");
  const [teamMembers, setTeamMembers] = useState<Array<{ name: string; studentNumber: string }>>([]);
  const [levels, setLevels] = useState<ArenaLevelView[]>(getFallbackLevels());
  const [timer, setTimer] = useState("15:00");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const activeLevel = useMemo(
    () => levels.find((level) => level.status === "active") ?? levels[0] ?? getFallbackLevels()[0],
    [levels],
  );

  const wantedStars = useMemo(() => {
    return Array.from({ length: 5 }, (_, index) => index < Math.max(1, Math.min(5, activeLevel.levelNumber)));
  }, [activeLevel.levelNumber]);

  useEffect(() => {
    const storedName = window.localStorage.getItem("code-theft-arena-name");
    if (storedName) {
      setTeamName(storedName);
    }
    const storedMembers = getArenaTeamMembers();
    if (storedMembers.length) {
      setTeamMembers(storedMembers);
    }

    let cancelled = false;

    async function loadArenaSnapshot() {
      try {
        const token = getArenaToken();
        const [payload, teamPayload] = await Promise.all([fetchArenaLevels(token), fetchArenaTeamState(token)]);
        if (cancelled) {
          return;
        }

        const fetchedLevels = (payload as { levels?: ArenaLevelView[] }).levels;
        if (fetchedLevels?.length) {
          setLevels(fetchedLevels);
          const active = fetchedLevels.find((level) => level.status === "active") ?? fetchedLevels[0];
          setTimer(active.timeRemaining ?? active.duration);
        } else {
          const fallbackLevels = getFallbackLevels();
          setLevels(fallbackLevels);
          setTimer(fallbackLevels[0].duration);
        }

        if (teamPayload?.team) {
          setTeamName(teamPayload.team.teamName);
          setTeamMembers(teamPayload.team.members ?? []);
          window.localStorage.setItem("code-theft-arena-name", teamPayload.team.teamName);
        }
      } catch (loadError) {
        if (cancelled) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Secure connection unavailable. Using fallback arena state.",
        );
        const fallbackLevels = getFallbackLevels();
        setLevels(fallbackLevels);
        setTimer(fallbackLevels[0].duration);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadArenaSnapshot();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleLogout() {
    try {
      await logoutArenaTeam();
    } catch {
      // Ignore logout failures and return the user to entry page.
    } finally {
      window.localStorage.removeItem("code-theft-arena-name");
      router.push("/");
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white">
      <div className="absolute inset-0">
        <Image
          src="/assets/images/background.png"
          alt="Cyberpunk city background"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-15"
        />
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,79,79,0.14),transparent_28%),radial-gradient(circle_at_75%_18%,rgba(34,211,238,0.14),transparent_18%),linear-gradient(180deg,rgba(0,0,0,0.45),rgba(0,0,0,0.95))]" />

      <div className="relative z-10 flex min-h-screen flex-col px-3 pb-4 pt-3 sm:px-5 sm:pb-5 sm:pt-4 lg:px-6">
        <header className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="font-pricedown text-[2rem] uppercase leading-none tracking-[0.12em] text-fuchsia-500 drop-shadow-[0_0_14px_rgba(217,70,239,0.45)] sm:text-[2.7rem]">
              CODE THEFT ARENA
            </div>
            <div className="font-chalet text-[0.72rem] uppercase tracking-[0.42em] text-zinc-300/80 sm:text-[0.85rem]">
              Secure connection established
            </div>
          </div>

          <div className="flex flex-col items-end gap-3">
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full border border-rose-400/50 bg-rose-500/10 px-4 py-2 text-[10px] uppercase tracking-[0.28em] text-rose-100 transition-all duration-300 hover:bg-rose-500/20"
            >
              Logout
            </button>
            <div className="rounded-[1.6rem] border-4 border-cyan-400 bg-black px-4 py-2 text-right shadow-[0_0_24px_rgba(34,211,238,0.15)] sm:px-5 sm:py-3">
              <div className="font-pricedown text-[2.7rem] leading-none tracking-[0.08em] text-white sm:text-[4rem]">
                {timer}
              </div>
            </div>
          </div>
        </header>

        <main className="mt-4 grid flex-1 gap-5 lg:grid-cols-[220px_minmax(0,1fr)] xl:gap-6">
          <aside className="space-y-5">
            <section className="overflow-hidden border-t-[6px] border-t-red-500 bg-[#151515] pb-4">
              <div className="flex items-center gap-3 px-3 py-4 sm:px-4">
                <div className="flex h-6 w-6 items-center justify-center text-red-400">
                  <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current" aria-hidden="true">
                    <path d="M8.5 11.5a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm7 0a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7Z" />
                    <path d="M4 20.5c0-3.8 2.9-6.5 6.5-6.5S17 16.7 17 20.5v.5H4v-.5Zm11.2-.5h4.8V20c0-2.7-1.8-4.8-4.1-5.5 1.4 1.2 2.2 2.9 2.2 5v.5h-2.9Z" />
                  </svg>
                </div>
                <h2 className="font-pricedown text-2xl uppercase tracking-[0.08em] text-white">
                  Crew Roster
                </h2>
              </div>

              <div className="space-y-3 px-3">
                {(teamMembers.length
                  ? teamMembers
                  : [{ name: teamName, studentNumber: "N/A" }]).map((member, index) => (
                  <div
                    key={`${member.studentNumber}-${index}`}
                    className="flex items-stretch overflow-hidden bg-[#242424] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)]"
                  >
                    <div className="flex w-full items-center gap-2 border-l-2 border-red-500 px-2 py-2">
                      <div className="flex h-7 w-7 items-center justify-center border border-white/70 bg-[#1a1a1a] text-white">
                        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
                          <path d="M12 12.2a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2.3c-4.2 0-8 2.4-8 5.6V22h16v-1.9c0-3.2-3.8-5.6-8-5.6Z" />
                        </svg>
                      </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-chalet text-[0.88rem] uppercase tracking-[0.2em] text-zinc-100">
                          {member.name}
                          </div>
                          <div className="font-chalet text-[0.72rem] uppercase tracking-[0.28em] text-zinc-400">
                          {member.studentNumber}
                          </div>
                        </div>
                      <div className="bg-emerald-950 px-3 py-1 text-[0.62rem] uppercase tracking-[0.22em] text-emerald-400">
                        Connected
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="overflow-hidden border-t-[6px] border-t-red-500 bg-[#151515] pb-4">
              <div className="px-4 py-4">
                <h2 className="font-pricedown text-2xl uppercase tracking-[0.08em] text-white">
                  Mission Blueprint
                </h2>
              </div>

              <div className="space-y-4 px-4">
                {levels.slice(0, 4).map((level, index) => (
                  <div key={level.levelNumber} className="flex items-start gap-3">
                    <div
                      className={[
                        "mt-1 flex h-7 w-7 items-center justify-center rounded-full border",
                        level.status === "active"
                          ? "border-red-400 bg-red-500/15 text-red-400"
                          : level.status === "completed"
                            ? "border-emerald-400 bg-emerald-500/15 text-emerald-300"
                            : "border-zinc-700 bg-zinc-900 text-zinc-500",
                      ].join(" ")}
                    >
                      {level.status === "locked" ? (
                        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
                          <path d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5Zm-3 8V7a3 3 0 1 1 6 0v3H9Zm3 4a2 2 0 0 1 1 3.75V19h-2v-1.25A2 2 0 0 1 12 14Z" />
                        </svg>
                      ) : (
                        <span className="text-[0.7rem] font-bold">{index + 1}</span>
                      )}
                    </div>

                    <div className="flex-1 pb-2">
                      <div
                        className={[
                          "font-chalet text-[0.65rem] uppercase tracking-[0.42em]",
                          level.status === "active" ? "text-red-400" : "text-zinc-400",
                        ].join(" ")}
                      >
                        {getLevelStatusLabel(level.status)}
                      </div>
                      <div className="mt-1 font-chalet text-[0.9rem] uppercase tracking-[0.22em] text-zinc-100">
                        lvl {level.levelNumber}: {level.title.replace(/^LEVEL \d+ - /, "")}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </aside>

          <section className="relative min-h-[620px] overflow-hidden border-t-[6px] border-t-red-500 bg-[#171717] px-6 py-8 sm:px-8 sm:py-10">
            <div className="absolute right-0 top-0 rounded-bl-[1.8rem] bg-[#252120] px-4 py-4 sm:px-5 sm:py-5">
              <div className="font-pricedown text-2xl uppercase tracking-[0.08em] text-white sm:text-[2.3rem]">
                Wanted Level
              </div>
              <div className="mt-1 flex items-center gap-1 text-2xl sm:text-[2rem]">
                {wantedStars.map((filled, index) => (
                  <span key={index} className={filled ? "text-amber-400" : "text-black/75"}>
                    ★
                  </span>
                ))}
              </div>
            </div>

            <div className="flex min-h-[520px] flex-col items-center justify-center text-center">
              <div className="text-red-500">
                <svg viewBox="0 0 24 24" className="mx-auto h-24 w-24 fill-current sm:h-28 sm:w-28" aria-hidden="true">
                  <path d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5Zm-3 8V7a3 3 0 1 1 6 0v3H9Zm3 4a2 2 0 0 1 1 3.75V19h-2v-1.25A2 2 0 0 1 12 14Z" />
                </svg>
              </div>

              <h1 className="mt-8 max-w-4xl font-pricedown text-[2.3rem] uppercase leading-none tracking-[0.12em] text-[#0d9f24] sm:text-[3.5rem] lg:text-[4.7rem]">
                {activeLevel.title}
              </h1>

              <Link
                href="/dashboard/mission"
                className="mt-10 inline-flex items-center justify-center rounded-[0.6rem] bg-[#fbbf24] px-6 py-4 font-pricedown text-4xl uppercase tracking-[0.08em] text-[#1b1368] transition hover:-translate-y-0.5 hover:bg-amber-300"
              >
                Unlock
              </Link>

              <p className="mt-12 max-w-3xl font-chalet text-[0.95rem] uppercase tracking-[0.24em] text-zinc-100 sm:text-[1.15rem]">
                {"\"You just pinged the system. Now let's see if you can break it.\""}
              </p>
            </div>

            <div className="absolute bottom-2 right-2 hidden sm:block">
              <div className="relative h-[190px] w-[145px] overflow-hidden border border-white/10 bg-black/40 shadow-[0_0_24px_rgba(0,0,0,0.45)]">
                <Image
                  src="/assets/images/map.png"
                  alt="Arena map"
                  fill
                  sizes="145px"
                  className="object-cover"
                />
              </div>
            </div>
          </section>
        </main>

        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="h-px flex-1 bg-red-500/60" />
          <div className="text-[0.72rem] uppercase tracking-[0.34em] text-zinc-600">
            {loading ? "Syncing arena..." : error ? "Fallback state active" : "Ready"}
          </div>
          <div className="h-px flex-1 bg-red-500/60" />
        </div>
      </div>
    </div>
  );
}
