import type { Skill, SkillGroup, Lang, Localized } from "./types";

export const skillGroupLabels: Record<SkillGroup, Localized> = {
  languages: { fr: "Langages", en: "Languages" },
  systems: { fr: "Systèmes & bas niveau", en: "Systems & low-level" },
  web: { fr: "Web & mobile", en: "Web & mobile" },
  infra: { fr: "Infrastructure", en: "Infrastructure" },
  ai: { fr: "IA", en: "AI" },
};

export const skillGroupOrder: readonly SkillGroup[] = [
  "languages",
  "systems",
  "web",
  "infra",
  "ai",
];

export const skills: readonly Skill[] = [
  { label: "C", group: "languages", profiles: ["cpp"] },
  { label: "C++", group: "languages", profiles: ["cpp"] },
  { label: "Rust", group: "languages", profiles: ["cpp"] },
  { label: "Python", group: "languages", profiles: ["web", "cpp"] },
  { label: "TypeScript", group: "languages", profiles: ["web", "cpp"] },
  { label: "SQL", group: "languages", profiles: ["web", "cpp"] },

  { label: "CUDA", group: "systems", profiles: ["cpp"] },
  { label: "CMake", group: "systems", profiles: ["cpp"] },
  { label: "ECS", group: "systems", profiles: ["cpp"] },
  { label: "Concurrence", group: "systems", profiles: ["cpp"] },
  { label: "Hardware", group: "systems", profiles: ["cpp"] },

  { label: "Next.js", group: "web", profiles: ["web"] },
  { label: "React", group: "web", profiles: ["web"] },
  { label: "Nuxt.js", group: "web", profiles: ["web"] },
  { label: "Android / iOS", group: "web", profiles: ["web"] },

  { label: "Docker", group: "infra", profiles: ["web", "cpp"] },
  { label: "Kubernetes", group: "infra", profiles: ["web"] },
  { label: "Terraform", group: "infra", profiles: ["web"] },
  { label: "Ansible", group: "infra", profiles: ["web"] },
  { label: "AWS / Azure", group: "infra", profiles: ["web"] },
  { label: "CI/CD", group: "infra", profiles: ["web", "cpp"] },

  { label: "Infra IA", group: "ai", profiles: ["web", "cpp"] },
  { label: "ONNX", group: "ai", profiles: ["cpp"] },
  { label: "RAG", group: "ai", profiles: ["web"] },
  { label: "GAN", group: "ai", profiles: ["cpp"] },
] as const;

/** Traduit les libellés qui diffèrent en anglais ; le reste est universel. */
const skillLabelEn: Record<string, string> = {
  Concurrence: "Concurrency",
};

export function skillLabel(skill: Skill, lang: Lang): string {
  return lang === "en" ? (skillLabelEn[skill.label] ?? skill.label) : skill.label;
}
