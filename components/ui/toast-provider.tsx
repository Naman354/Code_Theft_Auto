"use client";

import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";

type ToastTone = "success" | "error" | "info";

type ToastInput = {
  title: string;
  description?: string;
  tone?: ToastTone;
  durationMs?: number;
};

type ToastItem = ToastInput & {
  id: number;
};

type ToastContextValue = {
  showToast: (input: ToastInput) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const reduceMotion = useReducedMotion();
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timeoutMap = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismissToast = useCallback((id: number) => {
    const activeTimer = timeoutMap.current.get(id);

    if (activeTimer) {
      clearTimeout(activeTimer);
      timeoutMap.current.delete(id);
    }

    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    ({ durationMs = 3600, tone = "info", ...input }: ToastInput) => {
      const id = Date.now() + Math.floor(Math.random() * 1000);
      const toast: ToastItem = { id, tone, durationMs, ...input };

      setToasts((current) => [...current.slice(-3), toast]);

      const timer = setTimeout(() => {
        dismissToast(id);
      }, durationMs);

      timeoutMap.current.set(id, timer);
    },
    [dismissToast],
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div className="pointer-events-none fixed inset-x-0 top-4 z-[70] flex justify-center px-3 sm:justify-end sm:px-6">
        <div className="flex w-full max-w-md flex-col gap-3">
          <AnimatePresence initial={false}>
            {toasts.map((toast) => (
              <m.div
                key={toast.id}
                className={[
                  "pointer-events-auto overflow-hidden rounded-[1.45rem] border bg-black/85 shadow-[0_18px_40px_rgba(0,0,0,0.4)] backdrop-blur-xl",
                  toast.tone === "success"
                    ? "border-lime-400/40"
                    : toast.tone === "error"
                      ? "border-rose-400/40"
                      : "border-cyan-400/40",
                ].join(" ")}
                initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -14, scale: 0.98 }}
                animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -14, scale: 0.98 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              >
                <div
                  className={[
                    "h-1.5 w-full",
                    toast.tone === "success"
                      ? "bg-[linear-gradient(90deg,#84cc16,#22c55e,#67e8f9)]"
                      : toast.tone === "error"
                        ? "bg-[linear-gradient(90deg,#fb7185,#ef4444,#f97316)]"
                        : "bg-[linear-gradient(90deg,#22d3ee,#60a5fa,#f472b6)]",
                  ].join(" ")}
                />
                <div className="flex items-start gap-3 px-4 py-3">
                  <div
                    className={[
                      "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-xs font-black uppercase",
                      toast.tone === "success"
                        ? "border-lime-300/40 bg-lime-400/10 text-lime-300"
                        : toast.tone === "error"
                          ? "border-rose-300/40 bg-rose-400/10 text-rose-300"
                          : "border-cyan-300/40 bg-cyan-400/10 text-cyan-300",
                    ].join(" ")}
                  >
                    {toast.tone === "success" ? "OK" : toast.tone === "error" ? "!!" : "IN"}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="font-display text-lg uppercase tracking-[0.08em] text-white">
                      {toast.title}
                    </p>
                    {toast.description ? (
                      <p className="mt-1 font-body text-xs uppercase tracking-[0.16em] text-zinc-300">
                        {toast.description}
                      </p>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    onClick={() => dismissToast(toast.id)}
                    className="rounded-full border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-zinc-400 transition hover:border-white/20 hover:text-white"
                  >
                    Close
                  </button>
                </div>
              </m.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used inside ToastProvider.");
  }

  return context;
}
