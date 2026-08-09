"use client";

import { motion } from "motion/react";

import { usePrefs } from "@/lib/prefs";
import { cn } from "@/lib/utils";
import { PROFILE_FILTERS, type ProfileFilter } from "@/content/types";

const LABEL: Record<ProfileFilter, "profile.all" | "profile.cpp" | "profile.web"> = {
  all: "profile.all",
  cpp: "profile.cpp",
  web: "profile.web",
};

/**
 * Bascule entre les deux facettes du CV — et « tout », qui est l'état de
 * départ : rien n'oblige un visiteur à choisir un camp avant d'avoir vu
 * quoi que ce soit.
 *
 * L'indicateur glisse d'un onglet à l'autre via `layoutId` : une seule
 * animation partagée, plutôt qu'une transition sur chaque bouton.
 */
export function ProfileSwitch({ className }: { className?: string }) {
  const { profile, setProfile, t } = usePrefs();

  return (
    <div
      role="radiogroup"
      aria-label={t("profile.label")}
      className={cn(
        "relative inline-flex items-center rounded-lg border bg-card p-1",
        className,
      )}
    >
      {PROFILE_FILTERS.map((value: ProfileFilter) => {
        const selected = profile === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => setProfile(value)}
            className={cn(
              "relative rounded-md px-3 py-1.5 font-mono text-xs transition-colors",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              selected
                ? "text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {selected && (
              <motion.span
                aria-hidden
                layoutId="profile-switch-indicator"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
                className="absolute inset-0 rounded-md bg-brand"
              />
            )}
            {/* Au-dessus de l'indicateur, qui est peint dans le même plan. */}
            <span className="relative">{t(LABEL[value])}</span>
          </button>
        );
      })}
    </div>
  );
}
