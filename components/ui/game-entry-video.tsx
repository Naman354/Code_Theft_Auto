"use client";

import { useEffect } from "react";
import { m } from "framer-motion";

type GameEntryVideoProps = {
  onComplete: () => void;
  durationMs?: number;
};

export function GameEntryVideo({ onComplete, durationMs = 5000 }: GameEntryVideoProps) {
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      onComplete();
    }, durationMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [durationMs, onComplete]);

  return (
    <m.div
      className="fixed inset-0 z-[9999] bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      <video
        className="h-full w-full object-cover"
        autoPlay
        muted
        playsInline
        preload="auto"
      >
        <source src="/assets/videos/WhatsApp%20Video%202026-04-09%20at%209.36.03%20AM.mp4" type="video/mp4" />
      </video>
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.18),rgba(0,0,0,0.45))]" />
    </m.div>
  );
}
