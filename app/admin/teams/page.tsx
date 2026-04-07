"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminBadge } from "@/components/admin/AdminBadge";
import { AdminButton } from "@/components/admin/AdminButton";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminTable } from "@/components/admin/AdminTable";
import { fetchTeams } from "@/services/arena-api";

type TeamRow = {
  id: string;
  teamName: string;
  currentLevel: number;
  score: number;
  penalties: number;
  lastSubmissionAt: string | null;
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

      <section className="rounded-2xl border border-cyan-300/20 bg-black/35 p-5 backdrop-blur-xl">
        <div className="flex flex-wrap gap-3">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search Team..."
            className="min-w-[220px] rounded-xl border border-zinc-700 bg-zinc-900/70 px-3 py-2 text-sm uppercase tracking-[0.14em] text-zinc-100 outline-none transition-all duration-300 focus:border-cyan-300/60 focus:shadow-[0_0_20px_rgba(0,255,255,0.2)]"
          />
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as SortBy)}
            className="rounded-xl border border-zinc-700 bg-zinc-900/70 px-3 py-2 text-sm uppercase tracking-[0.14em] text-zinc-100 outline-none transition-all duration-300 focus:border-cyan-300/60"
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
          { key: "team", header: "Team Name", render: (row) => row.teamName },
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
        ]}
      />
    </div>
  );
}
