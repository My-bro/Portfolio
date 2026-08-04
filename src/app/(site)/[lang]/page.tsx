import { SiteHeader } from "@/components/site-header";
import { Hero } from "@/components/hero";
import { ProjectsSection } from "@/components/projects-section";
import {
  EducationSection,
  ExperienceSection,
} from "@/components/experience-section";
import { SkillsSection } from "@/components/skills-section";
import { ContactSection } from "@/components/contact-section";
import { Footer } from "@/components/footer";
import { VisitTracker } from "@/components/visit-tracker";

import { site } from "@/content/site";
import { projects } from "@/content/projects";
import { skills } from "@/content/skills";
import type { Lang } from "@/content/types";

function structuredData(lang: Lang) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: site.name,
    email: `mailto:${site.email}`,
    url: `${site.url}/${lang}`,
    sameAs: [site.github],
    jobTitle:
      lang === "fr"
        ? "Développeur C/C++ et algorithmique, full-stack et DevOps"
        : "C/C++ and algorithms engineer, full-stack and DevOps",
    knowsAbout: skills.map((s) => s.label),
    alumniOf: [
      { "@type": "CollegeOrUniversity", name: "Epitech Paris" },
      { "@type": "CollegeOrUniversity", name: "Beijing Jiaotong University" },
    ],
    subjectOf: projects.map((project) => ({
      "@type": "CreativeWork",
      name: project.name,
      description: project.tagline[lang],
    })),
  };
}

export default async function PortfolioPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  return (
    <>
      <SiteHeader />

      <main id="top" className="mx-auto max-w-5xl px-5 sm:px-8">
        <Hero />
        <ProjectsSection />
        <ExperienceSection />
        <EducationSection />
        <SkillsSection />
        <ContactSection />
        <Footer />
      </main>

      <VisitTracker />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData(lang as Lang)),
        }}
      />
    </>
  );
}
