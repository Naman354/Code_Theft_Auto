"use client";

import { useEffect, useState } from "react";
import { m, useReducedMotion } from "framer-motion";
import { MotionProvider } from "@/components/ui/motion";

type TrailPoint = {
  x: number;
  y: number;
  id: number;
};

export function SiteEffects() {
  return (
    <MotionProvider>
      <AmbientBackdrop />
      <CursorTrail />
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

function CursorTrail() {
  const reduceMotion = useReducedMotion();
  const [points, setPoints] = useState<TrailPoint[]>([]);

  useEffect(() => {
    if (reduceMotion) {
      return;
    }

    let frame = 0;

    const handleMove = (event: PointerEvent) => {
      if (frame) {
        cancelAnimationFrame(frame);
      }

      frame = requestAnimationFrame(() => {
        setPoints((current) => [
          ...current.slice(-8),
          { x: event.clientX, y: event.clientY, id: Date.now() + Math.random() },
        ]);
      });
    };

    window.addEventListener("pointermove", handleMove, { passive: true });

    return () => {
      if (frame) {
        cancelAnimationFrame(frame);
      }
      window.removeEventListener("pointermove", handleMove);
    };
  }, [reduceMotion]);

  if (reduceMotion) {
    return null;
  }

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-50">
      {points.map((point, index) => (
        <m.span
          key={point.id}
          className="absolute block h-3 w-3 rounded-full bg-cyan-300/60 mix-blend-screen"
          style={{ left: point.x - 6, top: point.y - 6 }}
          initial={{ opacity: 0.7, scale: 1 }}
          animate={{ opacity: 0, scale: 2.6 }}
          transition={{ duration: 0.55, ease: "easeOut", delay: index * 0.015 }}
        />
      ))}
    </div>
  );
}
