"use client";

import { Section } from "@/components/section";
import { Timeline } from "@/components/timeline";
import { usePrefs } from "@/lib/prefs";
import { experience } from "@/content/experience";
import { education } from "@/content/education";

export function ExperienceSection() {
  const { t } = usePrefs();
  return (
    <Section id="experience" title={t("section.experience.title")}>
      <Timeline entries={experience} />
    </Section>
  );
}

export function EducationSection() {
  const { t } = usePrefs();
  return (
    <Section id="education" title={t("section.education.title")}>
      <Timeline entries={education} />
    </Section>
  );
}
