"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

import { Section } from "@/components/section";
import { ProfileSwitch } from "@/components/profile-switch";
import { ProjectCard } from "@/components/project-card";
import { ProjectDialog } from "@/components/project-dialog";
import {
  ProjectsTimeline,
  useActiveTek,
  type TimelineStep,
} from "@/components/projects-timeline";
import { trackProjectOpen } from "@/lib/analytics";
import { usePrefs } from "@/lib/prefs";
import { projects } from "@/content/projects";
import type { Lang, Project } from "@/content/types";

/**
 * « 1ʳᵉ année », ou « 4ᵉ — 5ᵉ année » pour ce qui a duré deux ans.
 *
 * Le modèle garde le vocabulaire d'Epitech — `tek` est l'année d'études —
 * mais il ne sort pas d'ici : « Tek 3 » ne dit rien à un recruteur, alors
 * qu'un rang d'année se lit partout.
 */
function yearLabel(project: Project, lang: Lang): string {
  const rank = (year: number) =>
    lang === "fr"
      ? year === 1
        ? "1ʳᵉ"
        : `${year}ᵉ`
      : `${year}${["th", "st", "nd", "rd"][year] ?? "th"}`;
  const unit = lang === "fr" ? "année" : "year";

  return project.tekEnd
    ? `${rank(project.tek)} — ${rank(project.tekEnd)} ${unit}`
    : `${rank(project.tek)} ${unit}`;
}

/** Les années civiles d'un groupe, dédoublonnées : « 2023 · 2024 ». */
function years(group: Project[]): string {
  return [...new Set(group.flatMap((p) => p.period.split(/\s*—\s*/)))]
    .sort()
    .join(" · ");
}

export function ProjectsSection() {
  const { lang, profile, t, hydrated } = usePrefs();
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  /**
   * Avant hydratation, tous les projets sont rendus : le HTML statique est
   * le même quel que soit le profil demandé, et c'est le CSS posé par le
   * script de démarrage qui masque ceux du mauvais profil. React reprend
   * ensuite la main avec la vraie liste.
   *
   * L'ordre, lui, ne dépend pas du profil : la dernière année d'abord,
   * puis en remontant le temps — ce qu'on sait faire aujourd'hui se lit
   * avant ce par quoi on a commencé.
   */
  const visible = useMemo(() => {
    const filtered =
      hydrated && profile !== "all"
        ? projects.filter((p) => p.profiles.includes(profile))
        : [...projects];
    return filtered.sort((a, b) => b.tek - a.tek);
  }, [profile, hydrated]);

  /** Un groupe par année d'études, dans l'ordre de la frise. */
  const groups = useMemo(() => {
    const byTek = new Map<number, Project[]>();
    for (const project of visible) {
      const list = byTek.get(project.tek);
      if (list) list.push(project);
      else byTek.set(project.tek, [project]);
    }
    return [...byTek.entries()]
      .sort(([a], [b]) => b - a)
      .map(([tek, items]) => ({ tek, items }));
  }, [visible]);

  const steps: TimelineStep[] = useMemo(
    () =>
      groups.map(({ tek, items }) => ({
        tek,
        label: yearLabel(items[0], lang),
        years: years(items),
        count: items.length,
      })),
    [groups, lang],
  );

  const activeTek = useActiveTek(groups.map((g) => g.tek));

  const openProject = useCallback(
    (slug: string) => {
      setOpenSlug(slug);
      trackProjectOpen(slug, profile, lang);
    },
    [profile, lang],
  );

  const navigate = useCallback(
    (direction: -1 | 1) => {
      if (!openSlug) return;
      const current = visible.findIndex((p) => p.slug === openSlug);
      if (current === -1) return;
      const next = (current + direction + visible.length) % visible.length;
      openProject(visible[next].slug);
    },
    [openSlug, visible, openProject],
  );

  const active = projects.find((p) => p.slug === openSlug) ?? null;

  return (
    <Section
      id="projects"
      title={t("section.projects.title")}
      lead={t("section.projects.lead")}
      action={<ProfileSwitch />}
    >
      <div className="lg:grid lg:grid-cols-[max-content_minmax(0,1fr)] lg:gap-8">
        <ProjectsTimeline
          steps={steps}
          target={listRef}
          activeTek={activeTek}
          onSelect={(tek) =>
            document.getElementById(`tek-${tek}`)?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            })
          }
        />

        <div ref={listRef} className="space-y-8">
          {groups.map(({ tek, items }) => (
            <div key={tek} className="scroll-mt-40 space-y-4" id={`tek-${tek}`}>
              <div className="flex items-baseline gap-3">
                <h3 className="font-mono text-sm text-brand">{yearLabel(items[0], lang)}</h3>
                <span className="h-px flex-1 bg-border" />
                <span className="font-mono text-xs text-muted-foreground">
                  {years(items)}
                </span>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <AnimatePresence mode="popLayout" initial={false}>
                  {items.map((project) => (
                    <motion.div
                      key={project.slug}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      transition={{ duration: 0.24, ease: [0.22, 0.61, 0.36, 1] }}
                      // Lu par le CSS avant hydratation pour masquer l'autre profil.
                      data-profile-web={project.profiles.includes("web")}
                      data-profile-cpp={project.profiles.includes("cpp")}
                    >
                      <ProjectCard project={project} onOpen={openProject} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>
      </div>

      <ProjectDialog
        project={active}
        open={openSlug !== null}
        onOpenChange={(next) => !next && setOpenSlug(null)}
        onNavigate={navigate}
      />
    </Section>
  );
}
