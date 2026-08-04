"use client";

import { useMemo, useState } from "react";
import { Play } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { MediaPlayer } from "@/components/media-player";
import { Reveal } from "@/components/section";
import { getMedia } from "@/lib/media";
import { trackProjectOpen } from "@/lib/analytics";
import { usePrefs } from "@/lib/prefs";
import { cn } from "@/lib/utils";
import type { TimelineEntry } from "@/content/types";

/**
 * Frise commune aux expériences et aux formations.
 *
 * Une entrée devient cliquable dès qu'un dossier média porte son `id` :
 * dépose des visuels dans `media/projects/sony-csl/` et la ligne Sony
 * s'ouvre sur sa démo.
 */
export function Timeline({ entries }: { entries: readonly TimelineEntry[] }) {
  const { lang, profile, t } = usePrefs();
  const [openId, setOpenId] = useState<string | null>(null);

  const active = entries.find((e) => e.id === openId) ?? null;
  const activeMedia = useMemo(
    () => (active ? getMedia(active.id) : null),
    [active],
  );

  const open = (entry: TimelineEntry) => {
    setOpenId(entry.id);
    trackProjectOpen(entry.id, profile, lang);
  };

  return (
    <>
      <ol className="relative space-y-8 border-l border-border pl-6 sm:pl-8">
        {entries.map((entry, index) => {
          const media = getMedia(entry.id);
          const playable = media.items.length > 0;

          return (
            <Reveal key={entry.id} delay={index * 0.04}>
              <li className="relative">
                <span
                  aria-hidden
                  className="absolute top-1.5 -left-[calc(1.5rem+3.5px)] size-[7px] rounded-full bg-brand ring-4 ring-background sm:-left-[calc(2rem+3.5px)]"
                />

                <div
                  className={cn(
                    "space-y-2.5 rounded-lg transition-colors",
                    playable &&
                      "-m-3 cursor-pointer p-3 hover:bg-card focus-within:bg-card",
                  )}
                  {...(playable
                    ? {
                        role: "button",
                        tabIndex: 0,
                        onClick: () => open(entry),
                        onKeyDown: (event: React.KeyboardEvent) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            open(entry);
                          }
                        },
                      }
                    : {})}
                >
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="font-mono text-xs text-muted-foreground">
                      {entry.period[lang]}
                    </span>
                    {playable && (
                      <span className="inline-flex items-center gap-1 font-mono text-[11px] text-brand">
                        <Play className="size-2.5 fill-current" />
                        {t("project.open")}
                      </span>
                    )}
                  </div>

                  <div className="space-y-0.5">
                    <h3 className="font-medium text-pretty">
                      {entry.title[lang]}
                    </h3>
                    {entry.org && (
                      <p className="text-sm text-brand">{entry.org}</p>
                    )}
                    {entry.location && (
                      <p className="text-xs text-muted-foreground text-pretty">
                        {entry.location[lang]}
                      </p>
                    )}
                  </div>

                  {entry.points[lang].length > 0 && (
                    <ul className="space-y-1.5">
                      {entry.points[lang].map((point) => (
                        <li
                          key={point}
                          className="flex gap-2.5 text-sm text-pretty text-muted-foreground"
                        >
                          <span
                            aria-hidden
                            className="mt-[0.45rem] size-1 shrink-0 rounded-full bg-border"
                          />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {entry.tags && entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {entry.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="font-mono text-[11px] font-normal"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </li>
            </Reveal>
          );
        })}
      </ol>

      <Dialog
        open={openId !== null}
        onOpenChange={(next) => !next && setOpenId(null)}
      >
        <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto p-5 sm:max-w-3xl sm:p-6">
          {active && (
            <>
              <DialogHeader className="pr-8">
                <DialogTitle className="text-xl text-pretty">
                  {active.title[lang]}
                </DialogTitle>
                <DialogDescription className="font-mono text-xs">
                  {active.period[lang]}
                  {active.org && ` · ${active.org}`}
                </DialogDescription>
              </DialogHeader>

              {activeMedia && activeMedia.items.length > 0 && (
                <MediaPlayer key={active.id} items={activeMedia.items} />
              )}

              {active.points[lang].length > 0 && (
                <ul className="space-y-2">
                  {active.points[lang].map((point) => (
                    <li key={point} className="flex gap-2.5 text-sm text-pretty">
                      <span
                        aria-hidden
                        className="mt-[0.45rem] size-1.5 shrink-0 rounded-full bg-brand"
                      />
                      <span className="text-muted-foreground">{point}</span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
