"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminBadge } from "@/components/admin/AdminBadge";
import { AdminButton } from "@/components/admin/AdminButton";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminTable } from "@/components/admin/AdminTable";
import { fetchTeams, reinstateTeam, toggleTeamBlock } from "@/services/arena-api";

type TeamRow = {
  id: string;
  teamName: string;
  currentLevel: number;
  score: number;
  penalties: number;
  lastSubmissionAt: string | null;
  isDisqualified: boolean;
  tabSwitchCount: number;
};

type SortBy = "score" | "level" | "penalties" | "name";

export default function AdminTeamsPage() {
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("score");

  async function loadTeams() {
    setLoading(true);
    setError(null);
    try {
      const payload = await fetchTeams();
      setTeams(payload.teams);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to fetch teams.");
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleBlock(team: TeamRow, shouldBlock: boolean) {
    const action = shouldBlock ? "block" : "unblock";
    const confirmMsg = shouldBlock 
      ? `Are you sure you want to MANUALLY BLOCK ${team.teamName}? They will be kicked out immediately.`
      : `Are you sure you want to unblock ${team.teamName}? They will be able to log in again immediately.`;

    if (!confirm(confirmMsg)) return;

    try {
      if (shouldBlock) {
        await toggleTeamBlock(team.id, true);
      } else {
        await reinstateTeam(team.id); 
      }
      await loadTeams();
    } catch (err) {
      alert(err instanceof Error ? err.message : `Failed to ${action} team.`);
    }
  }

  useEffect(() => {
    void loadTeams();
  }, []);

  const filteredTeams = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const results = teams.filter((team) => team.teamName.toLowerCase().includes(normalized));

    return [...results].sort((a, b) => {
      if (sortBy === "score") return b.score - a.score;
      if (sortBy === "level") return b.currentLevel - a.currentLevel;
      if (sortBy === "penalties") return b.penalties - a.penalties;
      return a.teamName.localeCompare(b.teamName);
    });
  }, [query, sortBy, teams]);

  return (
    <div className="space-y-5">
      <AdminHeader
        title="Teams Monitor"
        subtitle="Live Team State"
        actions={
          <>
            <AdminBadge label={loading ? "SYNCING" : "LIVE"} tone={loading ? "amber" : "cyan"} />
            <AdminButton type="button" tone="cyan" onClick={() => void loadTeams()} disabled={loading}>
              Refresh
            </AdminButton>
          </>
        }
      />

      {error ? (
        <div className="rounded-2xl border border-rose-300/35 bg-rose-500/10 px-4 py-3 font-accent text-xs uppercase tracking-[0.22em] text-rose-100">
          {error}
        </div>
      ) : null}

      <section className="rounded-2xl border border-cyan-300/20 bg-black/35 p-4 backdrop-blur-xl sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search Team..."
            className="w-full min-w-0 rounded-xl border border-zinc-700 bg-zinc-900/70 px-3 py-2 text-sm uppercase tracking-[0.12em] text-zinc-100 outline-none transition-all duration-300 focus:border-cyan-300/60 focus:shadow-[0_0_20px_rgba(0,255,255,0.2)] sm:min-w-[220px] sm:flex-1 sm:tracking-[0.14em]"
          />
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as SortBy)}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-900/70 px-3 py-2 text-sm uppercase tracking-[0.12em] text-zinc-100 outline-none transition-all duration-300 focus:border-cyan-300/60 sm:w-auto sm:min-w-[180px] sm:tracking-[0.14em]"
          >
            <option value="score">Sort: Score</option>
            <option value="level">Sort: Level</option>
            <option value="penalties">Sort: Penalties</option>
            <option value="name">Sort: Name</option>
          </select>
        </div>
      </section>

      <AdminTable
        rows={filteredTeams}
        rowKey={(team) => team.id}
        emptyLabel={loading ? "Loading teams..." : "No teams found."}
        columns={[
          {
            key: "team",
            header: "Team Name",
            render: (row) => (
              <span className="font-accent text-[0.8rem] tracking-[0.22em] text-cyan-100 sm:text-[0.88rem] sm:tracking-[0.28em]">
                {row.teamName}
              </span>
            ),
          },
          {
            key: "status",
            header: "Status",
            render: (row) =>
              row.isDisqualified ? (
                <AdminBadge label={`BANNED ${row.tabSwitchCount}/3`} tone="rose" />
              ) : (
                <AdminBadge label="ACTIVE" tone="emerald" />
              ),
          },
          { key: "level", header: "Current Level", render: (row) => row.currentLevel },
          { key: "score", header: "Score", render: (row) => row.score.toLocaleString("en-US") },
          { key: "penalties", header: "Penalties", render: (row) => row.penalties },
          {
            key: "lastSubmissionAt",
            header: "Last Submission",
            render: (row) =>
              row.lastSubmissionAt
                ? new Date(row.lastSubmissionAt).toLocaleString("en-US", { hour12: false })
                : "N/A",
          },
          {
            key: "actions",
            header: "Actions",
            render: (row) =>
              row.isDisqualified ? (
                <AdminButton tone="cyan" onClick={() => handleToggleBlock(row, false)}>
                  Unblock
                </AdminButton>
              ) : (
                <AdminButton tone="rose" onClick={() => handleToggleBlock(row, true)}>
                  Block
                </AdminButton>
              ),
          },
        ]}
      />
    </div>
  );
}
