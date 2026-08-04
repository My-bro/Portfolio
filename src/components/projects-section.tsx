"use client";

import { useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

import { Section } from "@/components/section";
import { ProfileSwitch } from "@/components/profile-switch";
import { ProjectCard } from "@/components/project-card";
import { ProjectDialog } from "@/components/project-dialog";
import { trackProjectOpen } from "@/lib/analytics";
import { usePrefs } from "@/lib/prefs";
import { projects } from "@/content/projects";

export function ProjectsSection() {
  const { lang, profile, t, hydrated } = usePrefs();
  const [openSlug, setOpenSlug] = useState<string | null>(null);

  /**
   * Avant hydratation, tous les projets sont rendus : le HTML statique est
   * le même quel que soit le profil demandé, et c'est le CSS posé par le
   * script de démarrage qui masque ceux du mauvais profil. React reprend
   * ensuite la main avec la vraie liste.
   */
  const visible = useMemo(
    () =>
      hydrated
        ? projects.filter((p) => p.profiles.includes(profile))
        : [...projects],
    [profile, hydrated],
  );

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
      <div className="grid gap-5 sm:grid-cols-2">
        <AnimatePresence mode="popLayout" initial={false}>
          {visible.map((project) => (
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

      <ProjectDialog
        project={active}
        open={openSlug !== null}
        onOpenChange={(next) => !next && setOpenSlug(null)}
        onNavigate={navigate}
      />
    </Section>
  );
}
