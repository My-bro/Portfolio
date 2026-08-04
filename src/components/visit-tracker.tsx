"use client";

import { useEffect } from "react";

import { trackVisit } from "@/lib/analytics";
import { usePrefs } from "@/lib/prefs";

/** Compte une visite par session, pour donner un dénominateur aux projets. */
export function VisitTracker() {
  const { lang } = usePrefs();

  useEffect(() => {
    trackVisit(lang);
  }, [lang]);

  return null;
}
