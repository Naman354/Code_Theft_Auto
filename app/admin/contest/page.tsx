"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminBadge } from "@/components/admin/AdminBadge";
import { AdminButton } from "@/components/admin/AdminButton";
import { AdminCard } from "@/components/admin/AdminCard";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminModal } from "@/components/admin/AdminModal";
import { fetchContestState, nextLevel, restartGame, restartLevel, seedLevels, startLevel, stopGame, stopLevel, type AdminContestState } from "@/services/arena-api";

type ActionType = "start" | "next" | "seed" | "stop" | "restart" | "stop_game" | "restart_game" | null;

export default function AdminContestPage() {
  const [contestState, setContestState] = useState<AdminContestState | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalAction, setModalAction] = useState<ActionType>(null);
  const [startLevelNumber, setStartLevelNumber] = useState(1);

  async function loadState() {
    setLoading(true);
    setError(null);
    try {
      const payload = await fetchContestState();
      setContestState(payload.contestState);
      setStartLevelNumber(payload.contestState.currentLevel || 1);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to fetch contest state.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadState();
  }, []);

  const modalConfig = useMemo(() => {
    if (modalAction === "start") {
      return {
        title: "Start Current Level?",
        message: "This will start the currently selected level timer for all teams.",
        confirmLabel: "Start Level",
      };
    }
    if (modalAction === "next") {
      return {
        title: "Advance To Next Level?",
        message: "This action cannot be undone and immediately shifts contest progression.",
        confirmLabel: "Advance",
      };
    }
    if (modalAction === "stop") {
      return {
        title: "Pause Current Level?",
        message: "This freezes the current level timer and clue progression until you start the same level again.",
        confirmLabel: "Pause Level",
      };
    }
    if (modalAction === "restart") {
      return {
        title: "Restart Selected Level?",
        message: "This resets team progress for the selected level and starts its timer again from zero.",
        confirmLabel: "Restart Level",
      };
    }
    if (modalAction === "stop_game") {
      return {
        title: "Stop Entire Game?",
        message: "This ends the contest for all teams and sends them back to the landing dashboard state.",
        confirmLabel: "Stop Game",
      };
    }
    if (modalAction === "restart_game") {
      return {
        title: "Restart Entire Game?",
        message: "This resets all teams, scores, submissions, and returns the contest to Level 1.",
        confirmLabel: "Restart Game",
      };
    }
    if (modalAction === "seed") {
      return {
        title: "Reseed Levels?",
        message: "This will replace existing levels data with the seeding payload.",
        confirmLabel: "Reseed",
      };
    }
    return null;
  }, [modalAction]);

  async function executeAction() {
    if (!modalAction) {
      return;
    }

    setBusy(true);
    setError(null);
    try {
      if (modalAction === "start") {
        await startLevel({ level: startLevelNumber });
      } else if (modalAction === "next") {
        await nextLevel();
      } else if (modalAction === "stop") {
        await stopLevel();
      } else if (modalAction === "restart") {
        await restartLevel({ level: startLevelNumber });
      } else if (modalAction === "stop_game") {
        await stopGame();
      } else if (modalAction === "restart_game") {
        await restartGame();
      } else if (modalAction === "seed") {
        await seedLevels();
      }

      setModalAction(null);
      await loadState();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Admin action failed.");
    } finally {
      setBusy(false);
    }
  }

  const statusTone = contestState?.status === "running" ? "emerald" : contestState?.status === "paused" ? "amber" : "zinc";

  return (
    <div className="space-y-5">
      <AdminHeader
        title="Contest Control"
        subtitle="Operations"
        actions={<AdminBadge label={loading ? "SYNCING" : contestState?.status ?? "unknown"} tone={statusTone} />}
      />

      {error ? (
        <div className="rounded-2xl border border-rose-300/35 bg-rose-500/10 px-4 py-3 font-accent text-xs uppercase tracking-[0.22em] text-rose-100">
          {error}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminCard title="Current Level" value={contestState?.currentLevel ?? "-"} helper="Live active level" />
        <AdminCard
          title="Contest Timer"
          value={
            contestState?.levelEndsAt
              ? new Date(contestState.levelEndsAt).toLocaleTimeString("en-US", { hour12: false })
              : "N/A"
          }
          helper="Level ends at (local time)"
        />
        <AdminCard title="Decay / Sec" value={contestState?.decayPerSecond ?? "-"} helper="Score decay speed" />
        <AdminCard
          title="Hint Windows"
          value={
            contestState
              ? `${contestState.clue1UnlockSeconds}s / ${contestState.clue2UnlockSeconds}s`
              : "-"
          }
          helper="Clue 1 and clue 2 unlock timers"
        />
        <AdminCard
          title="Elapsed Time"
          value={contestState ? `${contestState.elapsedSeconds}s` : "-"}
          helper="Frozen when the level is paused"
        />
      </section>

      <section className="rounded-2xl border border-cyan-300/20 bg-black/35 p-5 backdrop-blur-xl">
        <h2 className="font-display text-3xl uppercase tracking-[0.08em] text-cyan-100">Controls</h2>
        <div className="mt-4 max-w-xs rounded-2xl border border-zinc-700 bg-zinc-900/60 p-4">
          <label className="grid gap-2">
            <span className="font-accent text-xs uppercase tracking-[0.28em] text-zinc-300">Level To Start</span>
            <input
              type="number"
              min={1}
              value={startLevelNumber}
              onChange={(event) => setStartLevelNumber(Math.max(1, Number(event.target.value || 1)))}
              className="rounded-xl border border-zinc-700 bg-black/40 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-cyan-300/60"
            />
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <AdminButton type="button" tone="cyan" onClick={() => setModalAction("start")} disabled={busy || loading}>
            {contestState?.status === "paused" && startLevelNumber === contestState.currentLevel ? "Resume Level" : "Start Level"}
          </AdminButton>
          <AdminButton type="button" tone="pink" onClick={() => setModalAction("next")} disabled={busy || loading}>
            Next Level
          </AdminButton>
          <AdminButton
            type="button"
            tone="amber"
            onClick={() => setModalAction("stop")}
            disabled={busy || loading || contestState?.status !== "running"}
          >
            Stop Level
          </AdminButton>
          <AdminButton type="button" tone="pink" onClick={() => setModalAction("restart")} disabled={busy || loading}>
            Restart Level
          </AdminButton>
          <AdminButton type="button" tone="amber" onClick={() => setModalAction("seed")} disabled={busy || loading}>
            Seed Levels
          </AdminButton>
        </div>
        <div className="mt-4 flex flex-wrap gap-3 border-t border-zinc-800 pt-4">
          <AdminButton type="button" tone="amber" onClick={() => setModalAction("stop_game")} disabled={busy || loading}>
            Stop Game
          </AdminButton>
          <AdminButton type="button" tone="pink" onClick={() => setModalAction("restart_game")} disabled={busy || loading}>
            Restart Game
          </AdminButton>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-zinc-700 bg-zinc-900/60 p-4">
            <p className="font-accent text-xs uppercase tracking-[0.28em] text-zinc-300">Duration Seconds</p>
            <p className="mt-2 font-display text-2xl text-fuchsia-100">{contestState?.durationSeconds ?? "-"}</p>
          </div>
          <div className="rounded-2xl border border-zinc-700 bg-zinc-900/60 p-4">
            <p className="font-accent text-xs uppercase tracking-[0.28em] text-zinc-300">Clue Penalties</p>
            <p className="mt-2 font-display text-2xl text-fuchsia-100">
              {contestState?.clue1Penalty ?? "-"} / {contestState?.clue2Penalty ?? "-"}
            </p>
          </div>
        </div>
      </section>

      {modalConfig ? (
        <AdminModal
          open
          title={modalConfig.title}
          message={modalConfig.message}
          confirmLabel={modalConfig.confirmLabel}
          busy={busy}
          onClose={() => setModalAction(null)}
          onConfirm={executeAction}
        />
      ) : null}
    </div>
  );
}
