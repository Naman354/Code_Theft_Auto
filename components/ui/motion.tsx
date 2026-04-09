"use client";

import {
  LazyMotion,
  domAnimation,
  m,
  useReducedMotion,
  type HTMLMotionProps,
  type Variants,
} from "framer-motion";
import type { ReactNode } from "react";

type MotionProviderProps = {
  children: ReactNode;
};

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  distance?: number;
};

type StaggerProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  stagger?: number;
};

type HoverPanelProps = HTMLMotionProps<"div"> & {
  children: ReactNode;
  glowClassName?: string;
};

const revealVariants: Variants = {
  hidden: { opacity: 0, y: 28, scale: 0.985 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const staggerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export function MotionProvider({ children }: MotionProviderProps) {
  return <LazyMotion features={domAnimation}>{children}</LazyMotion>;
}

export function Reveal({ children, className, delay = 0, distance = 28 }: RevealProps) {
  const reduceMotion = useReducedMotion();

  return (
    <m.div
      className={className}
      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: distance, scale: 0.985 }}
      whileInView={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={
        reduceMotion
          ? undefined
          : {
              duration: 0.7,
              delay,
              ease: [0.22, 1, 0.36, 1],
            }
      }
    >
      {children}
    </m.div>
  );
}

export function Stagger({ children, className, delay = 0, stagger = 0.1 }: StaggerProps) {
  const reduceMotion = useReducedMotion();

  return (
    <m.div
      className={className}
      variants={
        reduceMotion
          ? undefined
          : {
              ...staggerVariants,
              visible: {
                transition: {
                  delayChildren: delay,
                  staggerChildren: stagger,
                },
              },
            }
      }
      initial={reduceMotion ? undefined : "hidden"}
      whileInView={reduceMotion ? undefined : "visible"}
      viewport={{ once: true, amount: 0.12 }}
    >
      {children}
    </m.div>
  );
}

export function RevealItem({
  children,
  className,
  delay = 0,
  distance = 24,
}: RevealProps) {
  const reduceMotion = useReducedMotion();

  return (
    <m.div
      className={className}
      variants={reduceMotion ? undefined : revealVariants}
      transition={reduceMotion ? undefined : { delay }}
      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: distance, scale: 0.985 }}
      whileInView={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.18 }}
    >
      {children}
    </m.div>
  );
}

export function HoverPanel({ children, className, glowClassName, ...props }: HoverPanelProps) {
  const reduceMotion = useReducedMotion();

  return (
    <m.div
      className={["group relative", className].filter(Boolean).join(" ")}
      whileHover={reduceMotion ? undefined : { y: -6, scale: 1.01 }}
      whileTap={reduceMotion ? undefined : { scale: 0.99 }}
      transition={{ type: "spring", stiffness: 280, damping: 22 }}
      {...props}
    >
      <div
        className={[
          "pointer-events-none absolute -inset-px rounded-[inherit] opacity-0 blur-xl transition duration-300 group-hover:opacity-100",
          glowClassName ?? "bg-cyan-400/20",
        ].join(" ")}
      />
      <div className="relative">{children}</div>
    </m.div>
  );
}
