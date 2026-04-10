"use client";

import { AnimatePresence, m } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const HEARTBEAT_INTERVAL_MS = 8_000;

export function AntiCheat() {
  const router = useRouter();
  const [showWarning, setShowWarning] = useState(false);
  // Prevent duplicate tab-switch calls from rapid events
  const reportingRef = useRef(false);

  useEffect(() => {
    let heartbeatId: ReturnType<typeof setInterval> | null = null;

    async function checkStatus() {
      try {
        const res = await fetch("/api/team/state", { credentials: "include" });
        if (res.status === 401 || res.status === 403) {
          router.replace("/?warning=session_invalid");
          return;
        }
        const data = (await res.json()) as { team?: { isDisqualified?: boolean } } | undefined;
        if (data?.team?.isDisqualified) {
          router.replace("/disqualified");
        }
      } catch {
        // Network hiccup — silently ignore
      }
    }

    async function handleTabSwitch() {
      if (document.visibilityState !== "hidden") return;
      if (reportingRef.current) return;

      reportingRef.current = true;

      try {
        const res = await fetch("/api/team/tab-switch", {
          method: "POST",
          credentials: "include",
        });

        if (!res.ok && res.status !== 200) {
          // Server error — redirect to home anyway for safety
          router.replace("/?warning=tab_switched");
          return;
        }

        const data = (await res.json()) as { disqualified?: boolean; tabSwitchCount?: number; showWarning?: boolean };

        if (data.disqualified) {
          router.replace("/disqualified");
        } else if (data.showWarning) {
          // Strike 1: Just show the modal warning
          setShowWarning(true);
        } else {
          // Strike 2: Logout
          router.replace(`/?warning=tab_switched&count=${data.tabSwitchCount ?? "2"}`);
        }
      } catch {
        // Best-effort: redirect to home if we can't reach the server
        router.replace("/?warning=tab_switched");
      } finally {
        reportingRef.current = false;
      }
    }

    document.addEventListener("visibilitychange", handleTabSwitch);

    // Heartbeat: detect remote DQ / session invalidation
    heartbeatId = setInterval(() => {
      void checkStatus();
    }, HEARTBEAT_INTERVAL_MS);

    return () => {
      document.removeEventListener("visibilitychange", handleTabSwitch);
      if (heartbeatId !== null) clearInterval(heartbeatId);
    };
  }, [router]);

  return (
    <AnimatePresence>
      {showWarning && (
        <m.div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 p-6 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="pointer-events-none absolute inset-0 cyber-grid opacity-20" />
          
          <m.div
            className="gta-panel relative max-w-lg overflow-hidden rounded-[2.5rem] border-2 border-red-500/50 bg-[#0a0a0a] p-10 text-center shadow-[0_0_80px_rgba(239,68,68,0.25)]"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: "spring", damping: 20 }}
          >
            {/* Header / Icon */}
            <div className="mb-6 flex justify-center">
              <div className="flex h-20 w-20 animate-pulse items-center justify-center rounded-full bg-red-500/10 text-red-500 shadow-[0_0_30px_rgba(239,68,68,0.3)]">
                <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>

            <h2 className="gta-title gta-glitch mb-4 text-3xl text-red-500" data-text="SECURITY BREACH">
              PROTOCOL VIOLATION
            </h2>

            <p className="mb-8 font-chalet text-[0.8rem] uppercase tracking-[0.25em] leading-relaxed text-zinc-300">
              System detected a tab switch or window blur. 
              Further violations of arena security protocols will result in 
              <span className="mx-1 text-red-400 underline underline-offset-4 decoration-red-500/50">IMMEDIATE TERMINATION</span> 
              of your current session.
            </p>

            <button
              onClick={() => setShowWarning(false)}
              className="gta-button w-full rounded-full border border-red-500/60 bg-red-500/10 py-4 text-[0.7rem] font-bold uppercase tracking-[0.4em] text-red-100 transition-all hover:bg-red-500 hover:text-white hover:shadow-[0_0_30px_rgba(239,68,68,0.4)]"
            >
              I UNDERSTAND - RESUME MISSION
            </button>

            <div className="mt-6 font-chalet text-[0.6rem] uppercase tracking-[0.3em] text-zinc-600">
              Strike 1 of 2 handled by System Administrator
            </div>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
