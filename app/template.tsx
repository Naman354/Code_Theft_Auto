"use client";

import { m, useReducedMotion } from "framer-motion";
import { MotionProvider } from "@/components/ui/motion";

export default function Template({ children }: { children: React.ReactNode }) {
  const reduceMotion = useReducedMotion();

  return (
    <MotionProvider>
      <m.div
        initial={reduceMotion ? false : { opacity: 0, y: 18, scale: 0.995 }}
        animate={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </m.div>
    </MotionProvider>
  );
}
