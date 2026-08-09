"use client";

import { Section, Reveal } from "@/components/section";
import { usePrefs } from "@/lib/prefs";
import { cn } from "@/lib/utils";
import {
  skillGroupLabels,
  skillGroupOrder,
  skillLabel,
  skills,
} from "@/content/skills";

/**
 * Toutes les compétences restent affichées quel que soit le profil : celles
 * qui ne le concernent pas sont estompées plutôt que retirées. On voit d'un
 * coup d'œil ce qui est mis en avant sans perdre le reste.
 */
export function SkillsSection() {
  const { lang, profile, t } = usePrefs();

  return (
    <Section id="skills" title={t("section.skills.title")}>
      <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
        {skillGroupOrder.map((group, index) => {
          const groupSkills = skills.filter((s) => s.group === group);
          if (groupSkills.length === 0) return null;

          return (
            <Reveal key={group} delay={index * 0.04}>
              <div className="space-y-2.5">
                <h3 className="font-mono text-xs tracking-[0.14em] text-muted-foreground uppercase">
                  {skillGroupLabels[group][lang]}
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {groupSkills.map((skill) => {
                    // Sans filtre, rien n'est estompé : il n'y a pas de
                    // camp à mettre en avant plutôt qu'un autre.
                    const highlighted =
                      profile === "all" || skill.profiles.includes(profile);
                    return (
                      <span
                        key={skill.label}
                        className={cn(
                          "rounded-md border px-2.5 py-1 font-mono text-xs transition-colors duration-300",
                          highlighted
                            ? "border-brand/40 bg-brand/10 text-foreground"
                            : "border-border text-muted-foreground/60",
                        )}
                      >
                        {skillLabel(skill, lang)}
                      </span>
                    );
                  })}
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>
    </Section>
  );
}
