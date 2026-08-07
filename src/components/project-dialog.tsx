"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
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

// Chargée seulement quand une fiche la réclame : le composant reste hors du
// bundle principal, et le moteur WASM hors du réseau tant qu'on ne clique pas.
const RaytracerDemo = dynamic(
  () => import("@/components/raytracer-demo").then((m) => m.RaytracerDemo),
  { ssr: false },
);

const RTypeDemo = dynamic(
  () => import("@/components/rtype-demo").then((m) => m.RTypeDemo),
  { ssr: false },
);

const MyHunterDemo = dynamic(
  () => import("@/components/myhunter-demo").then((m) => m.MyHunterDemo),
  { ssr: false },
);

const MyRpgDemo = dynamic(
  () => import("@/components/myrpg-demo").then((m) => m.MyRpgDemo),
  { ssr: false },
);

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
      {/* Pleine largeur : la démo du raytracer et les vidéos ont enfin la
          place de s'afficher en entier. Le contenu passe en deux colonnes
          au-delà de lg, sans quoi les paragraphes s'étireraient sur toute
          la largeur de l'écran et deviendraient illisibles. */}
      <DialogContent className="max-h-[94vh] max-w-[96vw] overflow-y-auto p-5 sm:max-w-[96vw] sm:p-6">
        {project && (
          <>
            <DialogHeader className="pr-8">
              <div className="flex flex-wrap items-center gap-2">
                <DialogTitle className="font-mono text-2xl">
                  {project.name}
                </DialogTitle>
                {project.profiles.length > 1 && (
                  <Badge variant="outline" className="font-mono text-[11px]">
                    c++ · web
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

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
              <div className="space-y-2">
                {/* Quand le projet embarque une démo exécutable, elle
                    remplace le lecteur : les visuels ne servent alors que de
                    miniature sur la carte. */}
                {project.demo ? (
                  <>
                    <h4 className="font-mono text-xs tracking-[0.14em] text-muted-foreground uppercase">
                      {t(
                        project.demo === "rtype"
                          ? "rtype.title"
                          : project.demo === "myhunter"
                            ? "myhunter.title"
                            : project.demo === "myrpg"
                              ? "myrpg.title"
                              : "rt.title",
                      )}
                    </h4>
                    {project.demo === "rtype" ? (
                      <RTypeDemo />
                    ) : project.demo === "myhunter" ? (
                      <MyHunterDemo />
                    ) : project.demo === "myrpg" ? (
                      <MyRpgDemo />
                    ) : (
                      <RaytracerDemo />
                    )}
                  </>
                ) : project.website && media?.items[0] ? (
                  /* Produit en ligne : la capture renvoie vers le site plutôt
                     que de prétendre le rejouer ici. */
                  <div className="space-y-3">
                    <a
                      href={project.website}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="group/site relative block overflow-hidden rounded-lg border transition-colors hover:border-brand/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    >
                      <img
                        src={media.items[0].poster}
                        alt={project.name}
                        width={media.items[0].width}
                        height={media.items[0].height}
                        className="w-full"
                      />
                      <span
                        aria-hidden
                        className="absolute inset-0 flex items-center justify-center bg-background/0 opacity-0 transition-all duration-200 group-hover/site:bg-background/55 group-hover/site:opacity-100"
                      >
                        <span className="flex items-center gap-2 rounded-md bg-brand px-3 py-2 text-sm font-medium text-primary-foreground">
                          <ExternalLink className="size-4" />
                          {new URL(project.website).host}
                        </span>
                      </span>
                    </a>
                    <Button asChild className="w-full">
                      <a
                        href={project.website}
                        target="_blank"
                        rel="noreferrer noopener"
                      >
                        {t("project.visitSite")}
                        <ExternalLink className="size-4" />
                      </a>
                    </Button>
                  </div>
                ) : media && media.items.length > 0 ? (
                  <MediaPlayer key={project.slug} items={media.items} />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-12 text-center">
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
                          className="text-brand underline underline-offset-2"
                        >
                          {site.email}
                        </a>
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-5">
                {project.award && (
                  <div className="flex items-center gap-2 rounded-lg border border-brand/30 bg-brand/5 px-3 py-2 text-sm">
                    <Trophy className="size-4 shrink-0 text-brand" />
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
                          className="mt-[0.45rem] size-1.5 shrink-0 rounded-full bg-brand"
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
