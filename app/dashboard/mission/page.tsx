"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ARENA_LEVELS, formatArenaTime, type ArenaLevelView } from "@/lib/arena-data";
import {
  fetchCurrentQuestion,
  fetchArenaLevels,
  fetchArenaTeamState,
  getArenaTeamMembers,
  getArenaToken,
  setArenaTeamSnapshot,
  submitArenaAnswer,
} from "@/services/arena-api";

function getFallbackLevels(): ArenaLevelView[] {
  return ARENA_LEVELS.map((level, index) => ({
    ...level,
    status: index === 0 ? "active" : "locked",
  }));
}

function formatLevelLabel(levelNumber: number) {
  return `LEVEL ${levelNumber}`;
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

function getBlueprintLabel(level: ArenaLevelView) {
  return `lvl ${level.levelNumber}: ${level.title.replace(/^LEVEL \d+ - /, "")}`;
}

function StarMeter({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: ARENA_LEVELS.length }, (_, index) => (
        <svg
          key={index}
          viewBox="0 0 24 24"
          className={[
            "h-6 w-6",
            index < value ? "fill-amber-400 text-amber-400" : "fill-black/70 text-black/70",
          ].join(" ")}
          aria-hidden="true"
        >
          <path d="M12 2.5 15 9l7 .9-5.1 4.7L18.2 21 12 17.4 5.8 21l1.3-6.4L2 9.9 9 9z" />
        </svg>
      ))}
    </div>
  );
}

function DecorativeButton({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "inline-flex items-center justify-center rounded-[1.3rem] border border-white/10 bg-white/95 text-[#c61c63] shadow-[0_10px_30px_rgba(0,0,0,0.35)]",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

export default function MissionPage() {
  type CurrentQuestionPayload = Awaited<ReturnType<typeof fetchCurrentQuestion>>;

  const [teamName, setTeamName] = useState("VANSHIKA");
  const [teamMembers, setTeamMembers] = useState<Array<{ name: string; studentNumber: string }>>([]);
  const [score, setScore] = useState(0);
  const [levels, setLevels] = useState<ArenaLevelView[]>(getFallbackLevels());
  const [selectedLevelNumber, setSelectedLevelNumber] = useState(1);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [currentQuestionPayload, setCurrentQuestionPayload] = useState<CurrentQuestionPayload | null>(null);

  const selectedLevel = useMemo(
    () => levels.find((level) => level.levelNumber === selectedLevelNumber) ?? levels[0],
    [levels, selectedLevelNumber],
  );

  const isSelectedLevelLive = currentQuestionPayload?.currentQuestion?.levelNumber === selectedLevel.levelNumber;
  const timer = isSelectedLevelLive
    ? formatArenaTime(currentQuestionPayload.state.timer.timeRemainingSeconds)
    : selectedLevel.timeRemaining ?? selectedLevel.duration;
  const wantedLevel = Math.max(1, Math.min(ARENA_LEVELS.length, selectedLevel.levelNumber));

  useEffect(() => {
    const token = getArenaToken();
    const storedName = typeof window === "undefined" ? null : window.sessionStorage.getItem("code-theft-arena-name");
    if (storedName) {
      setTeamName(storedName);
    }
    const storedMembers = getArenaTeamMembers();
    if (storedMembers.length) {
      setTeamMembers(storedMembers);
    }

    let cancelled = false;

    async function loadArenaState() {
      try {
        const [payload, teamPayload, questionPayload] = await Promise.all([
          fetchArenaLevels(token),
          fetchArenaTeamState(token),
          fetchCurrentQuestion(token),
        ]);
        if (cancelled) {
          return;
        }

        const fetchedLevels = (payload as { levels?: ArenaLevelView[] }).levels;
        const contestState = (payload as { contestState?: { totalLockedScore?: number } }).contestState;

        if (fetchedLevels?.length) {
          setLevels(fetchedLevels);
          setSelectedLevelNumber(
            fetchedLevels.find((level) => level.status === "active")?.levelNumber ??
              fetchedLevels.find((level) => level.status === "unlocked")?.levelNumber ??
              fetchedLevels[0].levelNumber,
          );
        } else {
          setLevels(getFallbackLevels());
        }

        if (typeof contestState?.totalLockedScore === "number") {
          setScore(contestState.totalLockedScore);
        }

        if (teamPayload?.team) {
          setTeamName(teamPayload.team.teamName);
          setTeamMembers(teamPayload.team.members ?? []);
          setArenaTeamSnapshot({
            teamName: teamPayload.team.teamName,
            members: teamPayload.team.members ?? [],
          });
        }

        setCurrentQuestionPayload(questionPayload);
        if (typeof questionPayload.state.totalLockedScore === "number") {
          setScore(questionPayload.state.totalLockedScore);
        }

        if (questionPayload.state.contestStatus === "completed" && !cancelled) {
          window.location.href = "/dashboard";
          return;
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
        setLevels(getFallbackLevels());
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadArenaState();
    const intervalId = window.setInterval(() => {
      void loadArenaState();
    }, 5000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  async function handleSubmit() {
    if (!selectedLevel || selectedLevel.status === "locked") {
      return;
    }

    setSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const payload = await submitArenaAnswer({
        answer,
        levelNumber: selectedLevel.levelNumber,
        token: getArenaToken(),
      });

      if ((payload as { isCorrect?: boolean }).isCorrect) {
        setMessage((payload as { message?: string }).message ?? "Access granted.");
        setAnswer("");
        const [refreshedLevelsPayload, refreshedQuestionPayload] = await Promise.all([
          fetchArenaLevels(getArenaToken()),
          fetchCurrentQuestion(getArenaToken()),
        ]);
        const refreshedLevels = (refreshedLevelsPayload as { levels?: ArenaLevelView[] }).levels;
        if (refreshedLevels?.length) {
          setLevels(refreshedLevels);
        }
        setCurrentQuestionPayload(refreshedQuestionPayload);
        setScore(refreshedQuestionPayload.state.totalLockedScore ?? score);
      } else {
        setMessage((payload as { message?: string }).message ?? "Incorrect answer.");
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  }
  const rosterRows = teamMembers.length
    ? teamMembers.map((member, index) => ({
        id: `${member.studentNumber}-${index}`,
        name: member.name,
        studentId: member.studentNumber,
      }))
    : [
        {
          id: `${teamName.toUpperCase()}-fallback`,
          name: teamName,
          studentId: "N/A",
        },
      ];
  const activeQuestion = currentQuestionPayload?.currentQuestion;
  const clueOne = isSelectedLevelLive ? activeQuestion?.clue1 : null;
  const clueTwo = isSelectedLevelLive ? activeQuestion?.clue2 : null;
  const selectedQuestionBody =
    isSelectedLevelLive && activeQuestion?.question ? activeQuestion.question : selectedLevel.description;
  const selectedObjective =
    isSelectedLevelLive
      ? `Live score: ${currentQuestionPayload?.state.scoring.liveScore ?? 0}`
      : selectedLevel.objective;
  const currentTimerState = currentQuestionPayload?.state.timer;
  const currentLevelState = currentQuestionPayload?.state.levelState;
  const currentScoringState = currentQuestionPayload?.state.scoring;
  const countdownToClueOne = currentScoringState
    ? Math.max(0, currentScoringState.clue1UnlockSeconds - (currentTimerState?.elapsedSeconds ?? 0))
    : 0;
  const countdownToClueTwo = currentScoringState
    ? Math.max(0, currentScoringState.clue2UnlockSeconds - (currentTimerState?.elapsedSeconds ?? 0))
    : 0;
  const answerDisabled =
    submitting ||
    !isSelectedLevelLive ||
    currentQuestionPayload?.state.contestStatus !== "running" ||
    currentLevelState?.status === "solved" ||
    currentLevelState?.status === "expired";
  const answerPlaceholder =
    currentQuestionPayload?.state.contestStatus === "paused"
      ? "Level paused by admin..."
      : currentLevelState?.status === "solved"
        ? "Waiting for admin to start the next level..."
        : currentLevelState?.status === "expired"
          ? "This level has expired."
          : "Enter your answer...";
  const actionLabel =
    currentQuestionPayload?.state.contestStatus === "paused"
      ? "Paused"
      : currentQuestionPayload?.state.contestStatus !== "running"
        ? "Waiting For Admin"
        : currentLevelState?.status === "solved"
          ? "Answered"
          : currentLevelState?.status === "expired"
            ? "Expired"
            : "Submit Answer";

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white">
      <div className="absolute inset-0">
        <Image
          src="/assets/images/background.png"
          alt="Cyberpunk background"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-10"
        />
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,79,79,0.18),transparent_20%),radial-gradient(circle_at_75%_18%,rgba(34,211,238,0.14),transparent_18%),linear-gradient(180deg,rgba(0,0,0,0.36),rgba(0,0,0,0.95))]" />
      <div className="relative z-10 min-h-screen px-3 pb-4 pt-2 sm:px-4 lg:px-5">
        <div className="mx-auto flex w-full max-w-[1360px] flex-col gap-4">
          <header className="flex flex-col gap-4 xl:grid xl:grid-cols-[auto_1fr_auto] xl:items-start">
            <Link href="/dashboard" aria-label="Back to dashboard" className="pt-1">
              <DecorativeButton className="h-[54px] w-[54px] rounded-[1.1rem] text-slate-900 sm:h-[64px] sm:w-[64px]">
                <svg viewBox="0 0 24 24" className="h-7 w-7 stroke-current" fill="none" aria-hidden="true">
                  <path d="M4 5h6v14H4zM14 5h6v14h-6z" strokeWidth="1.6" />
                </svg>
              </DecorativeButton>
            </Link>

            <div className="pt-3 space-y-3">
              <div className="font-pricedown text-[1.65rem] uppercase leading-none tracking-[0.08em] text-fuchsia-500 drop-shadow-[0_0_12px_rgba(217,70,239,0.55)] sm:text-[2.7rem] sm:tracking-[0.1em]">
                CODE THEFT ARENA
              </div>
              <div className="mt-2 font-chalet text-[0.68rem] uppercase tracking-[0.28em] text-zinc-300/80 sm:text-[0.82rem] sm:tracking-[0.42em]">
                Secure connection established
              </div>
              <div className="inline-flex items-center gap-3 rounded-full border border-cyan-400/50 bg-cyan-400/10 px-4 py-2 shadow-[0_0_18px_rgba(34,211,238,0.18)]">
                <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-cyan-300" />
                <span className="font-pricedown text-lg uppercase tracking-[0.16em] text-cyan-200 [text-shadow:0_0_12px_rgba(34,211,238,0.7)] animate-pulse sm:text-xl">
                  {teamName}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-start gap-3 xl:flex-nowrap">
              <div className="rounded-[1.25rem] bg-[#201c0f] px-4 py-2 text-center shadow-[0_0_0_1px_rgba(255,255,255,0.03)] sm:px-7">
                <div className="font-pricedown text-[1.2rem] uppercase tracking-[0.08em] text-amber-300 sm:text-[1.8rem] sm:tracking-[0.1em]">
                  Total Points
                </div>
                <div className="mt-1 font-pricedown text-[1.5rem] leading-none text-white sm:text-[2.4rem]">
                  {score.toLocaleString()}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="ml-auto rounded-full bg-white p-1">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-fuchsia-600 text-white">
                    <span className="font-pricedown text-xl leading-none">N</span>
                  </div>
                </div>
                <div className="rounded-[1.35rem] border-4 border-cyan-400 px-3 py-1 text-center sm:px-5 sm:py-1.5">
                  <div className="font-pricedown text-[1.8rem] leading-none tracking-[0.08em] text-white sm:text-[3rem]">
                    {timer}
                  </div>
                </div>
              </div>
            </div>
          </header>

          <main className="grid gap-5 lg:grid-cols-[210px_minmax(0,1fr)]">
            <aside className="space-y-5">
              <section className="overflow-hidden bg-[#131313] pb-4 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
                <div className="h-[6px] bg-[#18952d]" />
                <div className="flex items-center gap-3 px-3 py-4">
                  <div className="text-red-500">
                    <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current" aria-hidden="true">
                      <path d="M8.5 11.5a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm7 0a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7Z" />
                      <path d="M4 20.5c0-3.8 2.9-6.5 6.5-6.5S17 16.7 17 20.5v.5H4v-.5Zm11.2-.5h4.8V20c0-2.7-1.8-4.8-4.1-5.5 1.4 1.2 2.2 2.9 2.2 5v.5h-2.9Z" />
                    </svg>
                  </div>
                  <h2 className="font-pricedown text-[1.95rem] uppercase tracking-[0.08em] text-white">
                    Crew Roster
                  </h2>
                </div>

                <div className="space-y-3 px-3">
                  {rosterRows.map((row) => (
                    <div
                      key={row.id}
                      className="flex items-stretch bg-[#242424] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)]"
                    >
                      <div className="flex w-full items-center gap-2 border-l-2 border-[#ff3a4d] px-2 py-2">
                        <div className="flex h-7 w-7 items-center justify-center border border-white/70 bg-[#1a1a1a] text-white">
                          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
                            <path d="M12 12.2a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2.3c-4.2 0-8 2.4-8 5.6V22h16v-1.9c0-3.2-3.8-5.6-8-5.6Z" />
                          </svg>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-chalet text-[0.86rem] uppercase tracking-[0.22em] text-zinc-100">
                            {row.name}
                          </div>
                          <div className="font-chalet text-[0.7rem] uppercase tracking-[0.28em] text-zinc-400">
                            {row.studentId}
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

              <section className="overflow-hidden bg-[#131313] pb-4 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
                <div className="h-[6px] bg-[#18952d]" />
                <div className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <div className="text-red-500">
                      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
                        <path d="M7 11V8a5 5 0 0 1 10 0v3h1a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h1Zm2 0h6V8a3 3 0 0 0-6 0v3Zm3 4a2 2 0 0 0-1 3.75V20h2v-1.25A2 2 0 0 0 12 15Z" />
                      </svg>
                    </div>
                    <h2 className="font-pricedown text-[1.9rem] uppercase tracking-[0.08em] text-white">
                      Mission Blueprint
                    </h2>
                  </div>
                </div>

                <div className="space-y-5 px-4">
                  {levels.map((level) => {
                    const isActive = level.status === "active";
                    const isUnlocked = level.status === "unlocked" || level.status === "completed" || isActive;

                    return (
                      <button
                        key={level.levelNumber}
                        type="button"
                        onClick={() => isUnlocked && setSelectedLevelNumber(level.levelNumber)}
                        className={[
                          "flex w-full items-start gap-3 text-left transition",
                          isUnlocked ? "cursor-pointer hover:translate-x-0.5" : "cursor-not-allowed opacity-90",
                        ].join(" ")}
                      >
                        <div
                          className={[
                            "mt-1 flex h-8 w-8 items-center justify-center rounded-full border",
                            isActive
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
                            <span className="font-bold">{level.levelNumber}</span>
                          )}
                        </div>

                        <div className="flex-1 pb-2">
                          <div
                            className={[
                              "font-chalet text-[0.66rem] uppercase tracking-[0.38em]",
                              isActive ? "text-red-400" : "text-zinc-400",
                            ].join(" ")}
                          >
                            {getLevelStatusLabel(level.status)}
                          </div>
                          <div
                            className={[
                              "mt-1 font-chalet text-[0.88rem] uppercase tracking-[0.2em]",
                              "text-zinc-100",
                            ].join(" ")}
                          >
                            {getBlueprintLabel(level)}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            </aside>

            <section className="space-y-5">
              <div className="space-y-1">
                <div className="font-pricedown text-[2.35rem] uppercase leading-none tracking-[0.12em] text-cyan-400 sm:text-[3.3rem]">
                  {formatLevelLabel(selectedLevel.levelNumber)}
                </div>
                <div className="h-[4px] bg-[#18952d]" />
              </div>

              <section className="relative min-h-[342px] overflow-hidden bg-[#171717] shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
                <div className="absolute left-0 top-0 h-full w-[14px] bg-[#d8d8d8]" />
                <div className="absolute left-0 top-0 h-[4px] w-full bg-[#18952d]" />

                <div className="relative ml-auto w-fit rounded-bl-[1.6rem] bg-[#252120] px-4 py-3 sm:absolute sm:right-0 sm:top-0 sm:px-5 sm:py-4">
                  <div className="font-pricedown text-[1.7rem] uppercase tracking-[0.08em] text-white sm:text-[2rem]">
                    Wanted Level
                  </div>
                  <div className="mt-1">
                    <StarMeter value={wantedLevel} />
                  </div>
                </div>

                <div className="flex min-h-[342px] flex-col px-5 py-6 sm:px-8 sm:py-8 sm:pr-44">
                  <div className="font-pricedown text-[1.55rem] uppercase tracking-[0.08em] text-white sm:text-[2.15rem]">
                    Question-1
                  </div>
                  <div className="mt-4 max-w-3xl font-chalet text-[0.82rem] uppercase leading-6 tracking-[0.14em] text-zinc-200/90 sm:text-[1rem] sm:leading-8 sm:tracking-[0.24em]">
                    {selectedQuestionBody}
                  </div>

                  <div className="mt-auto max-w-3xl font-chalet text-[0.74rem] uppercase tracking-[0.2em] text-zinc-400 sm:tracking-[0.3em]">
                    Objective: {selectedObjective}
                  </div>
                </div>

                <div className="pointer-events-none absolute right-2 top-10 hidden lg:block">
                  <Image
                    src="/assets/images/character4.png"
                    alt="Mission operator"
                    width={180}
                    height={180}
                    className="h-auto w-[180px] object-contain drop-shadow-[0_20px_30px_rgba(0,0,0,0.5)]"
                  />
                  <p className="mt-2 max-w-[180px] text-right font-chalet text-[0.58rem] uppercase leading-5 tracking-[0.35em] text-zinc-400">
                    &quot;Start simple. Focus, and you will get the hang of it&quot;
                  </p>
                </div>
              </section>

              <section className="min-h-[94px] bg-[#171717] px-4 py-4 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] sm:px-5">
                <div className="font-pricedown text-[1.6rem] uppercase leading-none tracking-[0.08em] text-white sm:text-[1.95rem]">
                  Answer -1
                </div>
                <div className="mt-5 border-b border-white/12 pb-2">
                  <input
                    value={answer}
                    onChange={(event) => setAnswer(event.target.value)}
                    disabled={answerDisabled}
                    className="w-full border-0 bg-transparent font-chalet text-[0.95rem] uppercase tracking-[0.2em] text-white outline-none placeholder:text-zinc-600"
                    placeholder={answerPlaceholder}
                  />
                </div>
              </section>

              <section className="relative overflow-hidden bg-[#171717] shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
                <div className="absolute left-0 top-0 h-[4px] w-full bg-[#18952d]" />
                <div className="grid gap-6 px-4 py-4 sm:px-5 lg:grid-cols-[minmax(0,1fr)_170px] lg:items-start">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="border-l-4 border-white/90 pl-3">
                        <div className="font-pricedown text-[1.55rem] uppercase leading-none tracking-[0.08em] text-cyan-400 sm:text-[1.85rem]">
                          Live Intel
                        </div>
                      </div>
                    </div>

                    <div className="min-h-[170px] max-w-2xl font-chalet text-[0.82rem] uppercase leading-6 tracking-[0.14em] text-zinc-200 sm:text-[0.9rem] sm:leading-8 sm:tracking-[0.24em]">
                      {isSelectedLevelLive ? (
                        <>
                          <div>
                            {clueOne ??
                              `Clue 1 locked. Reveals in ${formatArenaTime(countdownToClueOne)} while the level timer is running.`}
                          </div>
                          <div className="mt-4 border-t border-white/10 pt-4">
                            {clueTwo ??
                              `Clue 2 locked. Reveals in ${formatArenaTime(countdownToClueTwo)} while the level timer is running.`}
                          </div>
                        </>
                      ) : (
                        <>
                          <div>Hints are only streamed for the current live level.</div>
                          <div className="mt-4 border-t border-white/10 pt-4 text-[0.72rem] tracking-[0.28em] text-zinc-500">
                            Select the active level to view admin-controlled clue releases.
                          </div>
                        </>
                      )}
                      <div className="mt-4 text-[0.72rem] tracking-[0.28em] text-zinc-500">
                        Penalties: {currentQuestionPayload?.state.scoring.clue1Penalty ?? "-"} / {currentQuestionPayload?.state.scoring.clue2Penalty ?? "-"}
                      </div>
                      <div className="mt-2 text-[0.72rem] tracking-[0.28em] text-zinc-500">
                        Status: {currentQuestionPayload?.state.contestStatus ?? "unknown"} / {currentLevelState?.status ?? "unknown"}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-start lg:justify-end">
                    <div className="relative h-[190px] w-[150px] overflow-hidden border border-white/10 bg-black/30 shadow-[0_0_24px_rgba(0,0,0,0.45)]">
                      <Image
                        src="/assets/images/map.png"
                        alt="Mission map"
                        fill
                        sizes="150px"
                        className="object-cover"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {message ? (
                <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100">
                  {message}
                </div>
              ) : null}
              {error ? (
                <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                  {error}
                </div>
              ) : null}

              <div className="flex flex-wrap items-center gap-3 pb-2">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={answerDisabled}
                  className="rounded-[0.55rem] bg-[#fbbf24] px-5 py-3 font-pricedown text-2xl uppercase tracking-[0.08em] text-[#1b1368] transition hover:-translate-y-0.5 hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60 sm:px-6 sm:text-3xl"
                >
                  {submitting ? "Submitting..." : actionLabel}
                </button>

                <div className="font-chalet text-[0.72rem] uppercase tracking-[0.28em] text-zinc-500">
                  {loading
                    ? "Syncing arena..."
                    : currentLevelState?.status === "solved"
                      ? "Waiting for admin to launch the next level"
                      : currentQuestionPayload?.state.contestStatus === "paused"
                        ? "Level paused by admin"
                        : "Ready"}
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
