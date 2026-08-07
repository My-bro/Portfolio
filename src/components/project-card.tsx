"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { ArrowUpRight, ExternalLink, Lock, Play } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { MediaPreview } from "@/components/media-preview";
import { getMedia, pickByTheme } from "@/lib/media";
import { usePrefs } from "@/lib/prefs";
import { useHydrated } from "@/lib/use-hydrated";
import { cn } from "@/lib/utils";
import type { Project } from "@/content/types";

export function ProjectCard({
  project,
  onOpen,
}: {
  project: Project;
  onOpen: (slug: string) => void;
}) {
  const { lang, t } = usePrefs();
  const [focused, setFocused] = useState(false);

  // Le thème résolu dépend du système : inconnu du serveur, donc on
  // s'aligne sur `defaultTheme="dark"` (providers.tsx) tant que le client
  // n'a pas repris la main, pour ne pas désaccorder rendu serveur et client.
  const { resolvedTheme } = useTheme();
  const hydrated = useHydrated();
  const dark = !hydrated || resolvedTheme !== "light";

  const media = getMedia(project.slug);
  const cover = pickByTheme(media.items, dark);

  return (
    <button
      type="button"
      onClick={() => onOpen(project.slug)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      aria-label={`${project.name} — ${t("project.open")}`}
      className={cn(
        "group relative flex h-full w-full flex-col overflow-hidden rounded-xl border",
        "bg-card text-left transition-colors duration-200",
        "hover:border-brand/50 focus-visible:border-brand/50",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
      )}
    >
      <div className="relative">
        {cover ? (
          <MediaPreview item={cover} active={focused} />
        ) : (
          <div className="flex aspect-video w-full items-center justify-center bg-muted">
            <span className="font-mono text-xs text-muted-foreground">
              {project.demo ? (
                // Pas de vidéo, mais mieux : le moteur tourne dans la fiche.
                <span className="flex items-center gap-1.5 text-brand">
                  <Play className="size-3 fill-current" />
                  {t(project.demo === "rtype" ? "rtype.title" : "rt.title")}
                </span>
              ) : media.withheld ? (
                <span className="flex items-center gap-1.5">
                  <Lock className="size-3" />
                  {t("project.privateMedia")}
                </span>
              ) : (
                t("project.noMedia")
              )}
            </span>
          </div>
        )}

        {(cover?.kind === "video" || project.demo || project.website) && (
          <span
            aria-hidden
            className={cn(
              "absolute bottom-3 left-3 flex items-center gap-1.5 rounded-md",
              "bg-background/85 px-2 py-1 font-mono text-[11px] backdrop-blur-sm",
              "transition-opacity duration-200 group-hover:opacity-0",
              (project.demo || project.website) && "text-brand",
            )}
          >
            {project.website ? (
              <ExternalLink className="size-3" />
            ) : (
              <Play className="size-3 fill-current" />
            )}
            {project.website
              ? new URL(project.website).host
              : project.demo === "rtype"
                ? t("rtype.badge")
                : project.demo === "myhunter"
                  ? t("myhunter.badge")
                  : project.demo === "myrpg"
                    ? t("myrpg.badge")
                    : project.demo === "area"
                      ? t("area.badge")
                      : project.demo
                        ? t("rt.badge")
                        : t("project.open")}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h3 className="font-mono text-lg leading-none font-medium">
              {project.name}
            </h3>
            <p className="text-xs text-muted-foreground">
              {project.period} · {project.role[lang]}
            </p>
          </div>
          <ArrowUpRight
            aria-hidden
            className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand"
          />
        </div>

        <p className="text-pretty text-sm text-muted-foreground">
          {project.tagline[lang]}
        </p>

        <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
          {project.stack.slice(0, 4).map((tech) => (
            <Badge key={tech} variant="secondary" className="font-mono text-[11px]">
              {tech}
            </Badge>
          ))}
          {project.stack.length > 4 && (
            <Badge variant="outline" className="font-mono text-[11px]">
              +{project.stack.length - 4}
            </Badge>
          )}
        </div>
      </div>
    </button>
  );
}
