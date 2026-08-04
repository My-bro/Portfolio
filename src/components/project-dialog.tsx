"use client";

import { useMemo } from "react";
import { ArrowLeft, ArrowRight, ExternalLink, Lock, Trophy } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MediaPlayer } from "@/components/media-player";
import { getMedia } from "@/lib/media";
import { usePrefs } from "@/lib/prefs";
import { site } from "@/content/site";
import type { Project } from "@/content/types";

export function ProjectDialog({
  project,
  open,
  onOpenChange,
  onNavigate,
}: {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate: (direction: -1 | 1) => void;
}) {
  const { lang, t } = usePrefs();
  const media = useMemo(
    () => (project ? getMedia(project.slug) : null),
    [project],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto p-5 sm:max-w-3xl sm:p-6">
        {project && (
          <>
            <DialogHeader className="pr-8">
              <div className="flex flex-wrap items-center gap-2">
                <DialogTitle className="font-mono text-2xl">
                  {project.name}
                </DialogTitle>
                {project.profiles.length > 1 && (
                  <Badge variant="outline" className="font-mono text-[11px]">
                    web · c++
                  </Badge>
                )}
              </div>
              <DialogDescription className="text-base text-pretty">
                {project.tagline[lang]}
              </DialogDescription>
              <p className="font-mono text-xs text-muted-foreground">
                {project.period} · {project.role[lang]}
              </p>
            </DialogHeader>

            {media && media.items.length > 0 ? (
              <MediaPlayer key={project.slug} items={media.items} />
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-12 text-center">
                <Lock className="size-5 text-muted-foreground" />
                <p className="text-sm font-medium">
                  {media?.withheld
                    ? t("project.privateMedia")
                    : t("project.noMedia")}
                </p>
                {media?.withheld && (
                  <p className="max-w-xs text-xs text-muted-foreground">
                    {t("project.privateMediaHint")}{" "}
                    <a
                      href={`mailto:${site.email}`}
                      className="text-olive underline underline-offset-2"
                    >
                      {site.email}
                    </a>
                  </p>
                )}
              </div>
            )}

            {project.award && (
              <div className="flex items-center gap-2 rounded-lg border border-olive/30 bg-olive/5 px-3 py-2 text-sm">
                <Trophy className="size-4 shrink-0 text-olive" />
                <span>{project.award[lang]}</span>
              </div>
            )}

            <div className="space-y-2">
              <h4 className="font-mono text-xs tracking-[0.14em] text-muted-foreground uppercase">
                {t("project.highlights")}
              </h4>
              <ul className="space-y-2">
                {project.highlights[lang].map((point) => (
                  <li key={point} className="flex gap-2.5 text-sm text-pretty">
                    <span
                      aria-hidden
                      className="mt-[0.45rem] size-1.5 shrink-0 rounded-full bg-olive"
                    />
                    <span className="text-muted-foreground">{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-mono text-xs tracking-[0.14em] text-muted-foreground uppercase">
                {t("project.stack")}
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {project.stack.map((tech) => (
                  <Badge
                    key={tech}
                    variant="secondary"
                    className="font-mono text-[11px]"
                  >
                    {tech}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
              <div className="flex flex-wrap gap-2">
                {project.links?.map((link) => (
                  <Button key={link.href} asChild variant="outline" size="sm">
                    <a href={link.href} target="_blank" rel="noreferrer noopener">
                      {link.label}
                      <ExternalLink className="size-3.5" />
                    </a>
                  </Button>
                ))}
              </div>

              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onNavigate(-1)}
                  aria-label={t("project.prev")}
                >
                  <ArrowLeft className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onNavigate(1)}
                  aria-label={t("project.next")}
                >
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
