"use client";

import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { m, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { GtaLoadingScreen } from "@/components/ui/gta-loading-screen";
import { AntiCheat } from "@/components/AntiCheat";
import { HoverPanel, Reveal, RevealItem, Stagger } from "@/components/ui/motion";
import { useToast } from "@/components/ui/toast-provider";
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

type ScriptLanguage = "python" | "java" | "cpp" | "c";

const LANGUAGE_LABELS: Record<ScriptLanguage, string> = {
  python: "Python",
  java: "Java",
  cpp: "C++",
  c: "C",
};

function normalizeLanguage(input: string | null | undefined): ScriptLanguage | null {
  switch ((input ?? "").toLowerCase()) {
    case "python":
    case "py":
      return "python";
    case "java":
      return "java";
    case "cpp":
    case "c++":
      return "cpp";
    case "c":
      return "c";
    default:
      return null;
  }
}

function buildFallbackSecurityScripts(questionText: string): Array<{ language: ScriptLanguage; code: string }> {
  const missionText = questionText.trim() || "Decode the mission input and return the final answer.";

  return [
    {
      language: "python",
      code: [
        "# encrypted access routine",
        "mission = '''" + missionText + "'''",
        "",
        "def crack_access_code(data: str) -> str:",
        "    # TODO: decode the pattern and return the final answer",
        "    return \"\"",
        "",
        "print(crack_access_code(mission))",
      ].join("\n"),
    },
    {
      language: "java",
      code: [
        "// encrypted access routine",
        "public class MissionHack {",
        "    public static String crackAccessCode(String mission) {",
        "        // TODO: decode the pattern and return the final answer",
        "        return \"\";",
        "    }",
        "",
        "    public static void main(String[] args) {",
        `        String mission = "${missionText.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}";`,
        "        System.out.println(crackAccessCode(mission));",
        "    }",
        "}",
      ].join("\n"),
    },
    {
      language: "cpp",
      code: [
        "// encrypted access routine",
        "#include <iostream>",
        "#include <string>",
        "using namespace std;",
        "",
        "string crackAccessCode(const string& mission) {",
        "    // TODO: decode the pattern and return the final answer",
        '    return "";',
        "}",
        "",
        "int main() {",
        `    string mission = R"(${missionText})";`,
        "    cout << crackAccessCode(mission) << endl;",
        "    return 0;",
        "}",
      ].join("\n"),
    },
    {
      language: "c",
      code: [
        "/* encrypted access routine */",
        "#include <stdio.h>",
        "",
        "char* crack_access_code(const char* mission) {",
        "    // TODO: decode the pattern and return the final answer",
        '    return "";',
        "}",
        "",
        "int main(void) {",
        `    const char* mission = "${missionText.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}";`,
        '    printf("%s\\n", crack_access_code(mission));',
        "    return 0;",
        "}",
      ].join("\n"),
    },
  ];
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

  const reduceMotion = useReducedMotion();
  const { showToast } = useToast();
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
  const [showSuccessPop, setShowSuccessPop] = useState(false);
  const [currentQuestionPayload, setCurrentQuestionPayload] = useState<CurrentQuestionPayload | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<ScriptLanguage>("python");

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
      if (document.visibilityState !== "visible") {
        return;
      }

      void (async () => {
        try {
          const questionPayload = await fetchCurrentQuestion(getArenaToken());

          if (cancelled) {
            return;
          }

          setCurrentQuestionPayload(questionPayload);
          if (typeof questionPayload.state.totalLockedScore === "number") {
            setScore(questionPayload.state.totalLockedScore);
          }

          if (questionPayload.state.contestStatus === "completed") {
            window.location.href = "/dashboard";
          }
        } catch {
          if (!cancelled) {
            setError((currentError) => currentError ?? "Live mission sync was interrupted.");
          }
        }
      })();
    }, 10000);

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
        const successMessage = (payload as { message?: string }).message ?? "Access granted.";
        setMessage(successMessage);
        setShowSuccessPop(true);
        showToast({
          title: "Mission Cleared",
          description: successMessage,
          tone: "success",
        });
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
        const infoMessage = (payload as { message?: string }).message ?? "Incorrect answer.";
        setMessage(infoMessage);
        showToast({
          title: "Access Denied",
          description: infoMessage,
          tone: "info",
        });
      }
    } catch (submitError) {
      const submitErrorMessage = submitError instanceof Error ? submitError.message : "Submission failed.";
      setError(submitErrorMessage);
      showToast({
        title: "Transmission Failed",
        description: submitErrorMessage,
        tone: "error",
      });
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    if (!showSuccessPop) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setShowSuccessPop(false);
    }, 2400);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [showSuccessPop]);

  useEffect(() => {
    if (!currentQuestionPayload) {
      return;
    }

    if (
      currentQuestionPayload.state.levelState.status !== "solved" &&
      currentQuestionPayload.state.contestStatus !== "completed"
    ) {
      setMessage(null);
    }
  }, [
    currentQuestionPayload?.state.contestStatus,
    currentQuestionPayload?.state.currentLevel,
    currentQuestionPayload?.state.levelState.status,
  ]);
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
  const contestNotStarted = currentQuestionPayload?.state.contestStatus === "not_started";
  const clueOne = isSelectedLevelLive ? activeQuestion?.clue1 : null;
  const clueTwo = isSelectedLevelLive ? activeQuestion?.clue2 : null;
  const selectedQuestionBody =
    contestNotStarted
      ? "The arena is locked. Wait for the admin to start the contest before the first mission goes live."
      : isSelectedLevelLive && activeQuestion?.question
        ? activeQuestion.question
        : selectedLevel.description;
  const selectedObjective =
    contestNotStarted
      ? "Stand by for admin launch."
      : isSelectedLevelLive
      ? `Live score: ${currentQuestionPayload?.state.scoring.liveScore ?? 0}`
      : selectedLevel.objective;
  const securityScripts = useMemo(() => {
    const liveSnippets = isSelectedLevelLive ? activeQuestion?.snippets ?? [] : [];
    const mappedSnippets = liveSnippets
      .map((snippet) => {
        const language = normalizeLanguage(snippet.language);

        if (!language) {
          return null;
        }

        return {
          language,
          code: snippet.code,
        };
      })
      .filter((snippet): snippet is { language: ScriptLanguage; code: string } => Boolean(snippet));

    if (mappedSnippets.length > 0) {
      return mappedSnippets;
    }

    return buildFallbackSecurityScripts(selectedQuestionBody);
  }, [activeQuestion?.snippets, isSelectedLevelLive, selectedQuestionBody]);
  const showSecurityScriptPanel = selectedLevel.challengeType === "coding";
  const activeSecurityScript =
    securityScripts.find((snippet) => snippet.language === selectedLanguage) ?? securityScripts[0];
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

  useEffect(() => {
    if (!securityScripts.some((snippet) => snippet.language === selectedLanguage)) {
      setSelectedLanguage(securityScripts[0]?.language ?? "python");
    }
  }, [securityScripts, selectedLanguage]);

  if (loading) {
    return (
      <GtaLoadingScreen
        eyebrow="Building Mission Brief"
        title="Level Intake"
        subtitle="Unpacking the file, warming the intel feed, and checking whether the cops already know your name."
      />
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white">
      <AntiCheat />
      {showSuccessPop ? (
        <div className="pointer-events-none fixed inset-0 z-[65] flex items-center justify-center px-4 sm:px-6">
          <m.div
            className="relative w-full max-w-3xl overflow-hidden rounded-[2.2rem] border border-lime-300/30 bg-[linear-gradient(135deg,rgba(7,12,8,0.96),rgba(10,22,13,0.94)_45%,rgba(8,12,18,0.96))] p-6 text-center shadow-[0_30px_120px_rgba(0,0,0,0.58),0_0_50px_rgba(132,204,22,0.12)] sm:p-8"
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.84, y: 28 }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 18 }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(132,204,22,0.28),transparent_34%),radial-gradient(circle_at_80%_20%,rgba(34,211,238,0.16),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.04),transparent_40%)]" />
            <div className="noise-overlay absolute inset-0 opacity-[0.08]" />

            <div className="relative flex flex-col items-center">
              <div className="mb-4 inline-flex items-center rounded-full border border-lime-300/25 bg-lime-300/10 px-4 py-2">
                <span className="font-forresten text-[10px] uppercase tracking-[0.45em] text-lime-200 sm:text-xs">
                  Mission Passed
                </span>
              </div>

              <div className="relative flex h-40 w-40 items-center justify-center sm:h-48 sm:w-48">
                <div className="absolute inset-0 rounded-full bg-lime-400/10 blur-2xl" />
                <div className="absolute inset-4 rounded-full border border-lime-300/25" />
                <div className="absolute inset-0 rounded-full border border-cyan-300/15" />
                <div className="relative h-full w-full">
                  <DotLottieReact
                    src="https://lottie.host/8fa82278-f8f6-40a0-ba4d-8c4c56fc4fdc/3WrLopYzDw.lottie"
                    loop={false}
                    autoplay
                  />
                </div>
              </div>

              <div className="relative mt-2">
                <div className="gta-title text-[2rem] leading-none text-lime-300 drop-shadow-[0_0_18px_rgba(132,204,22,0.3)] sm:text-[2.9rem]">
                  MISSION PASSED
                </div>
                <div className="mt-3 font-body text-[0.72rem] uppercase tracking-[0.22em] text-zinc-100 sm:text-sm sm:tracking-[0.3em]">
                  Crew response accepted. The city just lit up your name.
                </div>
              </div>

              <div className="mt-6 grid w-full gap-3 sm:grid-cols-3">
                <div className="rounded-[1.2rem] border border-white/10 bg-white/5 px-4 py-3">
                  <div className="font-accent text-[10px] uppercase tracking-[0.35em] text-zinc-500">
                    Status
                  </div>
                  <div className="mt-2 font-display text-xl uppercase tracking-[0.08em] text-lime-300">
                    Success
                  </div>
                </div>
                <div className="rounded-[1.2rem] border border-white/10 bg-white/5 px-4 py-3">
                  <div className="font-accent text-[10px] uppercase tracking-[0.35em] text-zinc-500">
                    Outcome
                  </div>
                  <div className="mt-2 font-display text-xl uppercase tracking-[0.08em] text-cyan-300">
                    Access
                  </div>
                </div>
                <div className="rounded-[1.2rem] border border-white/10 bg-white/5 px-4 py-3">
                  <div className="font-accent text-[10px] uppercase tracking-[0.35em] text-zinc-500">
                    Crew
                  </div>
                  <div className="mt-2 truncate font-display text-xl uppercase tracking-[0.08em] text-amber-300">
                    {teamName}
                  </div>
                </div>
              </div>
            </div>
          </m.div>
        </div>
      ) : null}

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
      <div className="noise-overlay absolute inset-0 opacity-[0.1]" />
      <div className="relative z-10 min-h-screen px-3 pb-4 pt-2 sm:px-4 lg:px-5">
        <div className="mx-auto flex w-full max-w-[1360px] flex-col gap-4">
          <m.header
            className="grid gap-4 sm:gap-5 xl:grid-cols-[auto_minmax(0,1fr)_auto] xl:items-center"
            initial={reduceMotion ? false : { opacity: 0, y: -16 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <Link href="/dashboard" aria-label="Back to dashboard" className="justify-self-start pt-1">
              <m.div whileHover={reduceMotion ? undefined : { scale: 1.04 }} whileTap={reduceMotion ? undefined : { scale: 0.97 }}>
              <DecorativeButton className="gta-button h-[58px] w-[58px] rounded-[1.25rem] text-slate-900 sm:h-[64px] sm:w-[64px]">
                <svg viewBox="0 0 24 24" className="h-7 w-7 stroke-current" fill="none" aria-hidden="true">
                  <path d="M4 5h6v14H4zM14 5h6v14h-6z" strokeWidth="1.6" />
                </svg>
              </DecorativeButton>
              </m.div>
            </Link>

            <div className="flex min-w-0 flex-col items-center justify-center gap-2 space-y-0 pt-1 text-center sm:pt-3 xl:px-6">
              <div className="gta-title gta-glitch text-[1.2rem] leading-none text-fuchsia-500 drop-shadow-[0_0_12px_rgba(217,70,239,0.55)] min-[420px]:text-[1.45rem] sm:text-[2.1rem] lg:text-[2.7rem]">
                CODE THEFT ARENA
              </div>
              <div className="mt-1 hidden font-chalet text-[0.62rem] uppercase tracking-[0.22em] text-zinc-300/80 md:block min-[420px]:text-[0.68rem] sm:text-[0.78rem] sm:tracking-[0.34em] lg:text-[0.82rem] lg:tracking-[0.42em]">
                Secure connection established
              </div>
              <div className="flex justify-center">
              <div className="inline-flex max-w-full items-center gap-3 rounded-full border border-cyan-400/50 bg-cyan-400/10 px-4 py-2 shadow-[0_0_18px_rgba(34,211,238,0.18)]">
                <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-cyan-300" />
                <span className="max-w-[170px] truncate text-center font-pricedown text-sm uppercase tracking-[0.08em] text-cyan-200 [text-shadow:0_0_12px_rgba(34,211,238,0.7)] animate-pulse min-[420px]:max-w-[220px] min-[420px]:text-base sm:max-w-[260px] sm:text-lg lg:max-w-[340px] lg:text-xl">
                  {teamName}
                </span>
              </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 xl:flex xl:flex-nowrap xl:justify-self-end">
              <div className="rounded-[1.25rem] bg-[#201c0f] px-4 py-3 text-center shadow-[0_0_0_1px_rgba(255,255,255,0.03)] sm:px-6">
                <div className="font-pricedown text-[1rem] uppercase tracking-[0.08em] text-amber-300 min-[420px]:text-[1.1rem] sm:text-[1.4rem] lg:text-[1.8rem] sm:tracking-[0.1em]">
                  Total Points
                </div>
                <div className="mt-1 font-pricedown text-[1.35rem] leading-none text-white min-[420px]:text-[1.5rem] sm:text-[2rem] lg:text-[2.4rem]">
                  {score.toLocaleString()}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="rounded-[1.35rem] border-4 border-cyan-400 px-3 py-2 text-center sm:px-5 sm:py-1.5">
                  <div className="font-pricedown text-[1.5rem] leading-none tracking-[0.08em] text-white min-[420px]:text-[1.7rem] sm:text-[2.3rem] lg:text-[3rem]">
                    {timer}
                  </div>
                </div>
              </div>
            </div>
          </m.header>

          <main className="grid gap-5 xl:grid-cols-[260px_minmax(0,1fr)] xl:items-start">
            <aside className="space-y-5">
              <Reveal>
              <section className="gta-panel overflow-hidden rounded-[2rem] bg-[#131313] pb-4 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
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

                <Stagger className="space-y-3 px-3">
                  {rosterRows.map((row) => (
                    <RevealItem
                      key={row.id}
                      className="flex items-stretch rounded-[1.35rem] bg-[#242424] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)]"
                    >
                      <div className="flex w-full flex-wrap items-center gap-2 border-l-2 border-[#ff3a4d] px-2 py-2 sm:flex-nowrap">
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
                        <div className="w-full rounded-full bg-emerald-950 px-3 py-1 text-center font-chalet text-[0.56rem] uppercase tracking-[0.1em] text-emerald-300 min-[420px]:ml-auto min-[420px]:w-auto min-[420px]:max-w-[130px] min-[420px]:truncate min-[420px]:text-[0.62rem] min-[420px]:tracking-[0.18em]">
                          {row.name}
                        </div>
                      </div>
                    </RevealItem>
                  ))}
                </Stagger>
              </section>
              </Reveal>

              <Reveal delay={0.08}>
              <section className="gta-panel overflow-hidden rounded-[2rem] bg-[#131313] pb-4 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
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

                <Stagger className="space-y-5 px-4">
                  {levels.map((level) => {
                    const isActive = level.status === "active";
                    const isUnlocked =
                      !contestNotStarted &&
                      (level.status === "unlocked" || level.status === "completed" || isActive);

                    return (
                      <m.button
                        key={level.levelNumber}
                        type="button"
                        onClick={() => isUnlocked && setSelectedLevelNumber(level.levelNumber)}
                        className={[
                          "flex w-full items-start gap-3 text-left transition",
                          isUnlocked ? "cursor-pointer hover:translate-x-0.5" : "cursor-not-allowed opacity-90",
                        ].join(" ")}
                        whileHover={reduceMotion || !isUnlocked ? undefined : { x: 4 }}
                        whileTap={reduceMotion || !isUnlocked ? undefined : { scale: 0.99 }}
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
                      </m.button>
                    );
                  })}
                </Stagger>
              </section>
              </Reveal>
            </aside>

            <section className="space-y-5">
              <Reveal>
              <div className="space-y-1">
                <div className="gta-title text-[1.7rem] leading-none text-cyan-400 min-[420px]:text-[2rem] sm:text-[2.6rem] lg:text-[3.3rem]">
                  {formatLevelLabel(selectedLevel.levelNumber)}
                </div>
                <div className="h-[4px] bg-[#18952d]" />
              </div>
              </Reveal>

              <Reveal delay={0.06}>
              <HoverPanel className="gta-panel relative min-h-[342px] overflow-hidden rounded-[2.25rem] bg-[#171717] shadow-[0_0_0_1px_rgba(255,255,255,0.03)]" glowClassName="bg-cyan-400/10">
                <div className="absolute left-0 top-0 h-full w-[12px] bg-[linear-gradient(180deg,#d9d9d9,#8d8d8d)]" />
                <div className="absolute left-0 top-0 h-[4px] w-full bg-[linear-gradient(90deg,#18952d,#2dd4bf,#facc15)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.08),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent_22%)]" />
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:32px_32px] opacity-[0.12]" />

                <div className="relative grid gap-5 px-5 py-6 sm:px-8 sm:py-8 lg:grid-cols-[minmax(0,1fr)_190px]">
                  <div className="space-y-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="font-pricedown text-[1.2rem] uppercase tracking-[0.08em] text-white min-[420px]:text-[1.35rem] sm:text-[1.8rem] lg:text-[2.15rem]">
                          Question-{selectedLevel.levelNumber}
                        </div>
                        <div className="mt-2 font-chalet text-[0.58rem] uppercase tracking-[0.34em] text-cyan-300/70 sm:text-[0.68rem]">
                          Classified Heist Dossier
                        </div>
                      </div>

                      <div className="w-fit rounded-[1.35rem] border border-amber-300/20 bg-[#252120] px-4 py-3 shadow-[0_12px_30px_rgba(0,0,0,0.3)]">
                        <div className="font-pricedown text-[1.15rem] uppercase tracking-[0.08em] text-white sm:text-[1.45rem]">
                          Wanted Level
                        </div>
                        <div className="mt-1 flex justify-start">
                          <StarMeter value={wantedLevel} />
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4">

                      <div className="rounded-[1.7rem] border border-cyan-400/15 bg-[linear-gradient(180deg,rgba(5,15,21,0.95),rgba(5,8,13,0.9))] px-4 py-4 sm:px-5">
                        <div className="font-chalet text-[0.58rem] uppercase tracking-[0.38em] text-cyan-300/70 sm:text-[0.64rem]">
                          Mission Brief
                        </div>
                        <div className="mt-3 whitespace-pre-line break-words font-chalet text-[0.74rem] uppercase leading-6 tracking-[0.08em] text-zinc-200/90 min-[420px]:text-[0.8rem] sm:text-[0.92rem] sm:leading-7 sm:tracking-[0.22em] lg:text-[0.98rem] lg:leading-8">
                          {selectedQuestionBody}
                        </div>
                      </div>

                      {showSecurityScriptPanel ? (
                        <div className="rounded-[1.7rem] border border-fuchsia-400/15 bg-[linear-gradient(180deg,rgba(17,8,20,0.96),rgba(7,10,17,0.92))] px-4 py-4 sm:px-5">
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                              <div className="font-chalet text-[0.58rem] uppercase tracking-[0.38em] text-fuchsia-300/75 sm:text-[0.64rem]">
                                Security Script
                              </div>
                              <div className="mt-2 font-chalet text-[0.6rem] uppercase tracking-[0.22em] text-zinc-500 sm:text-[0.66rem]">
                                Encrypted pattern loaded. Pick a language and crack the vault.
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {securityScripts.map((snippet) => {
                                const isActiveLanguage = snippet.language === activeSecurityScript?.language;

                                return (
                                  <button
                                    key={snippet.language}
                                    type="button"
                                    onClick={() => setSelectedLanguage(snippet.language)}
                                    className={[
                                      "rounded-full border px-3 py-2 font-chalet text-[0.62rem] uppercase tracking-[0.28em] transition",
                                      isActiveLanguage
                                        ? "border-fuchsia-300/50 bg-fuchsia-300/14 text-fuchsia-100 shadow-[0_0_18px_rgba(217,70,239,0.16)]"
                                        : "border-white/10 bg-white/5 text-zinc-400 hover:border-fuchsia-300/25 hover:text-zinc-200",
                                    ].join(" ")}
                                  >
                                    {LANGUAGE_LABELS[snippet.language]}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div className="mt-4 overflow-hidden rounded-[1.45rem] border border-white/10 bg-[#071019] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)]">
                            <div className="flex flex-col items-start justify-between gap-2 border-b border-white/8 bg-black/35 px-4 py-3 sm:flex-row sm:items-center sm:gap-3">
                              <div className="break-all font-chalet text-[0.58rem] uppercase tracking-[0.16em] text-zinc-400 sm:tracking-[0.34em]">
                                encrypted-pattern://mission-{selectedLevel.levelNumber}
                              </div>
                              <div className="font-chalet text-[0.58rem] uppercase tracking-[0.3em] text-cyan-300/70">
                                {activeSecurityScript ? LANGUAGE_LABELS[activeSecurityScript.language] : "Script"}
                              </div>
                            </div>
                            <pre className="overflow-x-auto px-4 py-4 font-mono text-[0.7rem] leading-6 text-cyan-100 sm:text-[0.8rem] sm:leading-7"><code>{activeSecurityScript?.code ?? "// secure script unavailable"}</code></pre>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-[1.7rem] border border-fuchsia-400/15 bg-[linear-gradient(180deg,rgba(17,8,20,0.96),rgba(7,10,17,0.92))] px-4 py-4 sm:px-5">
                          <div className="font-chalet text-[0.58rem] uppercase tracking-[0.38em] text-fuchsia-300/75 sm:text-[0.64rem]">
                            Logic Brief
                          </div>
                          <div className="mt-2 font-chalet text-[0.6rem] uppercase tracking-[0.22em] text-zinc-500 sm:text-[0.66rem]">
                            This mission is reasoning-based. No code template is needed for this round.
                          </div>
                          <div className="mt-4 rounded-[1.45rem] border border-white/10 bg-[#071019] px-4 py-4 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)]">
                            <div className="font-chalet text-[0.62rem] uppercase tracking-[0.28em] text-cyan-300/70">
                              Read the brief, decode the pattern mentally, and submit only the final answer.
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="grid gap-4 lg:grid-cols-2">
                        <div className="rounded-[1.7rem] border border-amber-400/12 bg-black/35 px-4 py-4 sm:px-5">
                          <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
                            <div className="font-chalet text-[0.58rem] uppercase tracking-[0.38em] text-amber-300/75 sm:text-[0.64rem]">
                              Clue 1
                            </div>
                            <div className="font-chalet text-[0.54rem] uppercase tracking-[0.28em] text-zinc-500">
                              -{currentQuestionPayload?.state.scoring.clue1Penalty ?? "-"} pts
                            </div>
                          </div>
                          <div className="mt-3 break-words font-chalet text-[0.72rem] uppercase leading-6 tracking-[0.08em] text-zinc-200/90 sm:text-[0.82rem] sm:tracking-[0.18em]">
                            {isSelectedLevelLive
                              ? clueOne ?? `Locked. Reveals in ${formatArenaTime(countdownToClueOne)} while the timer is running.`
                              : "Select the active level to view clue 1."}
                          </div>
                        </div>

                        <div className="rounded-[1.7rem] border border-rose-400/12 bg-black/35 px-4 py-4 sm:px-5">
                          <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
                            <div className="font-chalet text-[0.58rem] uppercase tracking-[0.38em] text-rose-300/75 sm:text-[0.64rem]">
                              Clue 2
                            </div>
                            <div className="font-chalet text-[0.54rem] uppercase tracking-[0.28em] text-zinc-500">
                              -{currentQuestionPayload?.state.scoring.clue2Penalty ?? "-"} pts
                            </div>
                          </div>
                          <div className="mt-3 break-words font-chalet text-[0.72rem] uppercase leading-6 tracking-[0.08em] text-zinc-200/90 sm:text-[0.82rem] sm:tracking-[0.18em]">
                            {isSelectedLevelLive
                              ? clueTwo ?? `Locked. Reveals in ${formatArenaTime(countdownToClueTwo)} while the timer is running.`
                              : "Select the active level to view clue 2."}
                          </div>
                        </div>
                      </div>

                      <div className="font-chalet text-[0.62rem] uppercase tracking-[0.22em] text-zinc-500 sm:text-[0.72rem] sm:tracking-[0.28em]">
                        Objective: {selectedObjective}
                      </div>
                    </div>
                  </div>

                  <m.div
                    className="pointer-events-none hidden lg:block"
                    animate={reduceMotion ? undefined : { y: [0, -8, 0] }}
                    transition={{ duration: 4.6, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Image
                      src="/assets/images/character4.png"
                      alt="Mission operator"
                      width={180}
                      height={180}
                      className="h-auto w-[180px] object-contain drop-shadow-[0_20px_30px_rgba(0,0,0,0.5)]"
                    />
                    <p className="mt-2 max-w-[180px] text-right font-chalet text-[0.58rem] uppercase leading-5 tracking-[0.35em] text-zinc-400">
                      &quot;Read the pattern, choose the script, then make your move.&quot;
                    </p>
                  </m.div>
                </div>
              </HoverPanel>
              </Reveal>

              <Reveal delay={0.08}>
              <section className="gta-panel min-h-[94px] rounded-[1.75rem] bg-[#171717] px-4 py-4 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] sm:px-5">
                <div className="font-pricedown text-[1.25rem] uppercase leading-none tracking-[0.08em] text-white min-[420px]:text-[1.4rem] sm:text-[1.75rem] lg:text-[1.95rem]">
                  Answer :-
                </div>
                <div className="mt-5 border-b border-white/12 pb-2">
                  <input
                    value={answer}
                    onChange={(event) => setAnswer(event.target.value.replace(/[^a-zA-Z0-9 ]/g, ""))}
                    disabled={answerDisabled}
                    className="w-full border-0 bg-transparent font-chalet text-[0.82rem] uppercase tracking-[0.12em] text-white outline-none placeholder:text-zinc-600 min-[420px]:text-[0.9rem] sm:text-[0.95rem] sm:tracking-[0.2em]"
                    placeholder={answerPlaceholder}
                  />
                </div>
                <p className="mt-2 font-sans text-[10px] uppercase tracking-[0.08em] text-cyan-400/60 sm:tracking-[0.15em]">
                  ℹ️ Only letters, numbers, and spaces are allowed. Special characters are automatically filtered.
                </p>
              </section>
              </Reveal>

              <Reveal delay={0.1}>
              <HoverPanel className="gta-panel relative overflow-hidden rounded-[2rem] bg-[#171717] shadow-[0_0_0_1px_rgba(255,255,255,0.03)]" glowClassName="bg-fuchsia-500/10">
                <div className="absolute left-0 top-0 h-[4px] w-full bg-[#18952d]" />
                <div className="grid gap-6 px-4 py-4 sm:px-5 lg:grid-cols-[minmax(0,1fr)_170px] lg:items-start">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="border-l-4 border-white/90 pl-3">
                        <div className="font-pricedown text-[1.2rem] uppercase leading-none tracking-[0.08em] text-cyan-400 min-[420px]:text-[1.35rem] sm:text-[1.65rem] lg:text-[1.85rem]">
                          Mission Status
                        </div>
                      </div>
                    </div>

                    <div className="min-h-[170px] max-w-2xl break-words font-chalet text-[0.72rem] uppercase leading-5 tracking-[0.08em] text-zinc-200 min-[420px]:text-[0.8rem] sm:text-[0.86rem] sm:leading-7 sm:tracking-[0.18em] lg:text-[0.9rem] lg:leading-8 lg:tracking-[0.24em]">
                      <div>
                        {isSelectedLevelLive
                          ? "Primary dossier synchronized. Security scripts and clue channels are active inside the question box."
                          : "Viewing archived blueprint data. Switch to the live level for the active mission dossier."}
                      </div>
                      <div className="mt-4 border-t border-white/10 pt-4 text-[0.64rem] tracking-[0.16em] text-zinc-500 sm:text-[0.72rem] sm:tracking-[0.24em] lg:tracking-[0.28em]">
                        Penalties: {currentQuestionPayload?.state.scoring.clue1Penalty ?? "-"} / {currentQuestionPayload?.state.scoring.clue2Penalty ?? "-"}
                      </div>
                      <div className="mt-2 text-[0.64rem] tracking-[0.16em] text-zinc-500 sm:text-[0.72rem] sm:tracking-[0.24em] lg:tracking-[0.28em]">
                        Status: {currentQuestionPayload?.state.contestStatus ?? "unknown"} / {currentLevelState?.status ?? "unknown"}
                      </div>
                      <div className="mt-2 text-[0.64rem] tracking-[0.16em] text-zinc-500 sm:text-[0.72rem] sm:tracking-[0.24em] lg:tracking-[0.28em]">
                        Live Score: {currentQuestionPayload?.state.scoring.liveScore ?? "-"}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-start lg:justify-end">
                    <m.div
                      className="relative h-[190px] w-[150px] overflow-hidden rounded-[1.4rem] border border-white/10 bg-black/30 shadow-[0_0_24px_rgba(0,0,0,0.45)]"
                      animate={reduceMotion ? undefined : { y: [0, -6, 0] }}
                      transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <Image
                        src="/assets/images/map.png"
                        alt="Mission map"
                        fill
                        sizes="150px"
                        className="object-cover"
                      />
                    </m.div>
                  </div>
                </div>
              </HoverPanel>
              </Reveal>

              {message ? (
                <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-4 font-pricedown text-[1.2rem] uppercase tracking-[0.08em] text-cyan-100 sm:text-[1.45rem]">
                  {message}
                </div>
              ) : null}
              {error ? (
                <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-5 py-4 font-pricedown text-[1.2rem] uppercase tracking-[0.08em] text-rose-200 sm:text-[1.45rem]">
                  {error}
                </div>
              ) : null}

              <div className="flex flex-col items-start gap-3 pb-2 sm:flex-row sm:flex-wrap sm:items-center">
                <m.button
                  type="button"
                  onClick={handleSubmit}
                  disabled={answerDisabled}
                  className="gta-button gta-glitch w-full rounded-[0.75rem] bg-[#fbbf24] px-5 py-3 font-pricedown text-[1.4rem] uppercase tracking-[0.08em] text-[#1b1368] transition hover:-translate-y-0.5 hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60 min-[420px]:w-auto min-[420px]:text-[1.65rem] sm:px-6 sm:text-3xl"
                  whileHover={reduceMotion || answerDisabled ? undefined : { scale: 1.02 }}
                  whileTap={reduceMotion || answerDisabled ? undefined : { scale: 0.985 }}
                >
                  {submitting ? "Submitting..." : actionLabel}
                </m.button>

                <div className="font-chalet text-[0.64rem] uppercase tracking-[0.08em] text-zinc-500 sm:text-[0.72rem] sm:tracking-[0.24em] lg:tracking-[0.28em]">
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
