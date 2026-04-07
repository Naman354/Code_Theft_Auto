"use client";

import { useEffect, useState } from "react";
import { AdminButton } from "@/components/admin/AdminButton";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminModal } from "@/components/admin/AdminModal";
import { AdminTable } from "@/components/admin/AdminTable";
import { fetchArenaLevels, fetchContestState, seedLevels } from "@/services/arena-api";

type LevelRow = {
  id: string;
  levelNumber: number;
  preview: string;
  maxPoints: number;
  decayRate: number;
  cluePenalties: string;
};

export default function AdminLevelsPage() {
  const [rows, setRows] = useState<LevelRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openModal, setOpenModal] = useState(false);

  async function loadLevels() {
    setLoading(true);
    setError(null);
    try {
      const [levelsPayload, contestPayload] = await Promise.all([fetchArenaLevels(), fetchContestState()]);

      const levels = levelsPayload.levels ?? [];
      const contestState = contestPayload.contestState;
      setRows(
        levels.map((level) => ({
          id: String(level.levelNumber),
          levelNumber: level.levelNumber,
          preview: level.objective || level.description || level.title,
          maxPoints: contestState.maxPointsPerQuestion,
          decayRate: contestState.decayPerSecond,
          cluePenalties: `${contestState.clue1Penalty}/${contestState.clue2Penalty}`,
        })),
      );
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to fetch levels.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadLevels();
  }, []);

  async function reseedLevels() {
    setBusy(true);
    setError(null);
    try {
      await seedLevels();
      setOpenModal(false);
      await loadLevels();
    } catch (seedError) {
      setError(seedError instanceof Error ? seedError.message : "Failed to seed levels.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <AdminHeader
        title="Levels Manager"
        subtitle="Level Configuration"
        actions={
          <AdminButton type="button" tone="pink" onClick={() => setOpenModal(true)} disabled={loading || busy}>
            Reseed Database
          </AdminButton>
        }
      />

      {error ? (
        <div className="rounded-2xl border border-rose-300/35 bg-rose-500/10 px-4 py-3 font-accent text-xs uppercase tracking-[0.22em] text-rose-100">
          {error}
        </div>
      ) : null}

      <AdminTable
        rows={rows}
        rowKey={(row) => row.id}
        emptyLabel={loading ? "Loading levels..." : "No level metadata available."}
        columns={[
          { key: "level", header: "Level", render: (row) => row.levelNumber },
          { key: "preview", header: "Question Preview", render: (row) => row.preview },
          { key: "maxPoints", header: "Max Points", render: (row) => row.maxPoints },
          { key: "decayRate", header: "Decay Rate", render: (row) => row.decayRate },
          { key: "cluePenalties", header: "Clue Penalties", render: (row) => row.cluePenalties },
        ]}
      />

      <AdminModal
        open={openModal}
        title="Reseed Levels Database?"
        message="This will replace existing level records. Continue only if this is intentional."
        confirmLabel="Reseed Levels"
        busy={busy}
        onClose={() => setOpenModal(false)}
        onConfirm={reseedLevels}
      />
    </div>
  );
}
