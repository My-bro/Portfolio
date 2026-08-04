"use client";

import { GithubIcon } from "@/components/icons";

import { Button } from "@/components/ui/button";
import { LangSwitch } from "@/components/lang-switch";
import { ThemeToggle } from "@/components/theme-toggle";
import { usePrefs } from "@/lib/prefs";
import { site } from "@/content/site";
import type { TranslationKey } from "@/content/i18n";

const NAV: { href: string; key: TranslationKey }[] = [
  { href: "#projects", key: "nav.projects" },
  { href: "#experience", key: "nav.experience" },
  { href: "#education", key: "nav.education" },
  { href: "#skills", key: "nav.skills" },
  { href: "#contact", key: "nav.contact" },
];

export function SiteHeader() {
  const { t } = usePrefs();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-5 sm:px-8">
        <a
          href="#top"
          className="font-mono text-sm font-medium tracking-tight transition-colors hover:text-olive"
        >
          {site.name.toLowerCase().replace(" ", "")}
          <span className="text-olive">.</span>
        </a>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((entry) => (
            <a
              key={entry.href}
              href={entry.href}
              className="rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {t(entry.key)}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <LangSwitch />
          <ThemeToggle />
          <Button asChild variant="ghost" size="icon" aria-label="GitHub">
            <a href={site.github} target="_blank" rel="noreferrer noopener">
              <GithubIcon className="size-4" />
            </a>
          </Button>
        </div>
      </div>
    </header>
  );
}
