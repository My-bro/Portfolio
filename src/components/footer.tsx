"use client";

import { usePrefs } from "@/lib/prefs";
import { site } from "@/content/site";

export function Footer() {
  const { t } = usePrefs();

  return (
    <footer className="border-t border-border/60 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-xs text-muted-foreground">
        <p>
          © {new Date().getFullYear()} {site.name}
        </p>
        <p className="flex items-center gap-3">
          <span>{t("footer.builtWith")}</span>
          <a
            href={`${site.github}/Portfolio`}
            target="_blank"
            rel="noreferrer noopener"
            className="transition-colors hover:text-brand"
          >
            {t("footer.source")}
          </a>
        </p>
      </div>
    </footer>
  );
}
