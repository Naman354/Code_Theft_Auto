"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminBadge } from "@/components/admin/AdminBadge";
import { AdminCard } from "@/components/admin/AdminCard";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { fetchArenaLeaderboard, fetchContestState } from "@/services/arena-api";

type DashboardState = {
  loading: boolean;
  error: string | null;
  status: string;
  activeLevel: number;
  totalTeams: number;
  totalSubmissions: number;
};

const initialState: DashboardState = {
  loading: true,
  error: null,
  status: "unknown",
  activeLevel: 0,
  totalTeams: 0,
  totalSubmissions: 0,
};

export default function AdminDashboardPage() {
  const [state, setState] = useState<DashboardState>(initialState);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const [contestPayload, leaderboardPayload] = await Promise.all([
          fetchContestState(),
          fetchArenaLeaderboard(),
        ]);

        if (cancelled) {
          return;
        }

        const teams = leaderboardPayload.leaderboard ?? [];
        setState({
          loading: false,
          error: null,
          status: contestPayload.contestState.status,
          activeLevel: contestPayload.contestState.currentLevel,
          totalTeams: teams.length,
          totalSubmissions: teams.reduce((sum, team) => sum + Math.max(0, team.level - 1), 0),
        });
      } catch (error) {
        if (cancelled) {
          return;
        }

        setState((prev) => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : "Failed to fetch dashboard data.",
        }));
      }
    }

    void loadDashboard();
    const intervalId = window.setInterval(() => void loadDashboard(), 15000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  const statusTone = useMemo(() => {
    if (state.status === "running") return "emerald";
    if (state.status === "paused") return "amber";
    if (state.status === "completed") return "pink";
    return "zinc";
  }, [state.status]);

  return (
    <div className="space-y-5">
      <AdminHeader
        title="Command Dashboard"
        subtitle="Admin Console"
        actions={<AdminBadge label={state.loading ? "SYNCING" : "LIVE"} tone={state.loading ? "amber" : "cyan"} />}
      />

      {state.error ? (
        <div className="rounded-2xl border border-rose-300/35 bg-rose-500/10 px-4 py-3 font-accent text-xs uppercase tracking-[0.22em] text-rose-100">
          {state.error}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminCard
          title="Contest Status"
          value={state.status}
          helper="Live system mode"
          badge={<AdminBadge label={state.status} tone={statusTone} />}
        />
        <AdminCard title="Active Level" value={state.activeLevel || "-"} helper="Current level in play" />
        <AdminCard title="Total Teams" value={state.totalTeams} helper="Teams on leaderboard" />
        <AdminCard title="Total Submissions" value={state.totalSubmissions} helper="Approx solved events" />
      </section>
    </div>
  );
}
