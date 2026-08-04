import type { TimelineEntry } from "./types";

export const education: readonly TimelineEntry[] = [
  {
    id: "epitech",
    period: { fr: "2022 — 2027", en: "2022 — 2027" },
    title: {
      fr: "Expert en ingénierie logicielle — BAC+5, RNCP niv. 7",
      en: "Master's in Software Engineering — RNCP level 7",
    },
    org: "Epitech Paris",
    location: {
      fr: "Titre visé par le ministère de l'Enseignement supérieur · spécialisation ingénierie logicielle « lourd »",
      en: "Degree accredited by the French Ministry of Higher Education · systems-oriented software engineering track",
    },
    points: {
      fr: [
        "Pédagogie par projet sans cours magistraux : forte autonomie acquise par la pratique et le pair-à-pair.",
        "Progression technique intensive en C, C++ et Haskell, avec recodage from scratch de fonctions UNIX (ls, echo, malloc).",
        "Architecture logicielle avancée — concurrence, CMake, ECS, Factory, machine learning — puis projets web, cybersécurité et DevOps.",
      ],
      en: [
        "Project-based learning with no lectures: strong autonomy built through practice and peer-to-peer work.",
        "Intensive technical progression in C, C++ and Haskell, rewriting UNIX functions from scratch (ls, echo, malloc).",
        "Advanced software architecture — concurrency, CMake, ECS, Factory, machine learning — then web, cybersecurity and DevOps projects.",
      ],
    },
    tags: ["C", "C++", "Haskell", "ECS", "DevOps"],
  },

  {
    id: "bjtu",
    period: { fr: "2025 — 2026", en: "2025 — 2026" },
    title: {
      fr: "Échange académique",
      en: "Academic exchange",
    },
    org: "Beijing Jiaotong University",
    location: { fr: "Pékin, Chine", en: "Beijing, China" },
    points: {
      fr: [
        "Immersion académique en IA, machine learning, développement mobile et cloud — enseignements suivis en chinois.",
        "Projets de gestion et d'architecture logicielle en groupe avec des étudiants chinois.",
        "Capacité d'adaptation renforcée face à un système d'enseignement différent, et rigueur accrue en gestion de projet.",
      ],
      en: [
        "Academic immersion in AI, machine learning, mobile and cloud development — taught in Mandarin.",
        "Group projects in software management and architecture alongside Chinese students.",
        "Sharpened adaptability within a different education system, and greater rigour in project management.",
      ],
    },
    tags: ["IA", "Machine Learning", "Mobile", "Cloud", "中文"],
  },

  {
    id: "bac",
    period: { fr: "2022", en: "2022" },
    title: {
      fr: "Baccalauréat général — Mathématiques et Sciences informatiques",
      en: "French Baccalauréat — Mathematics and Computer Science",
    },
    org: "",
    points: { fr: [], en: [] },
  },
] as const;
