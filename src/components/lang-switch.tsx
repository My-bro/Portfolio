"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { usePrefs } from "@/lib/prefs";
import { cn } from "@/lib/utils";
import { langLabels } from "@/content/i18n";
import { LANGS } from "@/content/types";

/**
 * La langue est une vraie route (/fr, /en) : les deux pages sont
 * pré-rendues, indexables et partageables. Le profil courant est reporté
 * dans l'URL pour ne pas être perdu au changement de langue.
 */
export function LangSwitch() {
  const { lang, t } = usePrefs();
  const searchParams = useSearchParams();
  const query = searchParams.toString();

  return (
    <div
      className="inline-flex items-center rounded-lg border bg-card p-0.5"
      aria-label={t("lang.label")}
    >
      {LANGS.map((value) => (
        <Link
          key={value}
          href={query ? `/${value}?${query}` : `/${value}`}
          scroll={false}
          hrefLang={value}
          aria-current={value === lang ? "true" : undefined}
          className={cn(
            "rounded-md px-2 py-1 font-mono text-xs transition-colors",
            value === lang
              ? "bg-secondary text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {langLabels[value]}
        </Link>
      ))}
    </div>
  );
}
