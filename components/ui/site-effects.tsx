"use client";

import { m, useReducedMotion } from "framer-motion";
import { MotionProvider } from "@/components/ui/motion";

export function SiteEffects() {
  return (
    <MotionProvider>
      <AmbientBackdrop />
    </MotionProvider>
  );
}

function AmbientBackdrop() {
  const reduceMotion = useReducedMotion();

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
      <m.div
        className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-fuchsia-500/12 blur-3xl"
        animate={
          reduceMotion
            ? undefined
            : {
                x: [0, 48, -22, 0],
                y: [0, 36, 18, 0],
                scale: [1, 1.08, 0.96, 1],
              }
        }
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <m.div
        className="absolute right-[-4rem] top-1/3 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl"
        animate={
          reduceMotion
            ? undefined
            : {
                x: [0, -42, 24, 0],
                y: [0, -36, 22, 0],
                scale: [1, 0.94, 1.06, 1],
              }
        }
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(transparent_0%,rgba(255,255,255,0.02)_48%,transparent_100%)] opacity-30" />
      <div className="noise-overlay absolute inset-0 opacity-[0.09]" />
    </div>
  );
}
