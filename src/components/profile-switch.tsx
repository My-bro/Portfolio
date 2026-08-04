"use client";

import { motion } from "motion/react";

import { usePrefs } from "@/lib/prefs";
import { cn } from "@/lib/utils";
import { PROFILES, type Profile } from "@/content/types";

/**
 * Bascule entre les deux facettes du CV.
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
      {PROFILES.map((value: Profile) => {
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
                className="absolute inset-0 rounded-md bg-olive"
              />
            )}
            {/* Au-dessus de l'indicateur, qui est peint dans le même plan. */}
            <span className="relative">
              {t(value === "web" ? "profile.web" : "profile.cpp")}
            </span>
          </button>
        );
      })}
    </div>
  );
}
