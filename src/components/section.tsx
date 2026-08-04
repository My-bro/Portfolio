"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export function Section({
  id,
  title,
  lead,
  action,
  children,
  className,
}: {
  id: string;
  title: string;
  lead?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={cn("scroll-mt-24 py-14 sm:py-20", className)}>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <h2 className="font-mono text-sm tracking-[0.18em] text-muted-foreground uppercase">
            {title}
          </h2>
          {lead && <p className="text-xl text-foreground sm:text-2xl">{lead}</p>}
        </div>
        {action}
      </div>
      <div aria-hidden className="rule-olive mb-8 h-px w-full" />
      {children}
    </section>
  );
}

/**
 * Apparition à l'entrée dans le viewport : 12 px et 380 ms, une seule fois.
 * Volontairement discret — l'animation accompagne la lecture, elle ne
 * la met pas en scène.
 */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.38, ease: [0.22, 0.61, 0.36, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
