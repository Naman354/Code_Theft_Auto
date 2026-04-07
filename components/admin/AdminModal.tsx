"use client";

import { AdminButton } from "@/components/admin/AdminButton";

type AdminModalProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  busy?: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function AdminModal({
  open,
  title,
  message,
  confirmLabel,
  busy = false,
  onClose,
  onConfirm,
}: AdminModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 px-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-cyan-300/35 bg-[#05070d]/95 p-6 shadow-[0_0_20px_rgba(0,255,255,0.4)]">
        <h3 className="font-display text-2xl uppercase tracking-[0.08em] text-cyan-100">{title}</h3>
        <p className="mt-4 text-sm uppercase tracking-[0.16em] text-zinc-300">{message}</p>
        <div className="mt-6 flex items-center justify-end gap-3">
          <AdminButton type="button" tone="amber" onClick={onClose} disabled={busy}>
            Cancel
          </AdminButton>
          <AdminButton type="button" tone="pink" onClick={onConfirm} disabled={busy}>
            {busy ? "Working..." : confirmLabel}
          </AdminButton>
        </div>
      </div>
    </div>
  );
}
