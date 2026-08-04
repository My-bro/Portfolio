import type { TimelineEntry } from "./types";

/**
 * Expériences professionnelles, communes aux deux profils (comme dans les
 * CV). L'`id` sert aussi de clé média : dépose des visuels dans
 * `media/projects/<id>/` pour rendre une expérience cliquable.
 */
export const experience: readonly TimelineEntry[] = [
  {
    id: "sony-csl",
    period: { fr: "Oct. 2024 — Avr. 2025", en: "Oct. 2024 — Apr. 2025" },
    title: {
      fr: "Recherche & Développement",
      en: "Research & Development",
    },
    org: "Sony Computer Science Laboratories",
    location: { fr: "Paris 5ᵉ", en: "Paris, France" },
    points: {
      fr: [
        "Conception d'un step sequencer générant des percussions par IA (GAN), à partir d'un modèle ONNX développé en interne chez Sony.",
        "Inférence optimisée sous la seconde grâce à l'accélération matérielle de la Jetson Orin de NVIDIA.",
        "Boîtier imprimé en 3D, circuit imprimé et soudure d'une matrice de boutons, reliée à un Arduino pilotant la Jetson via USB.",
      ],
      en: [
        "Designed a step sequencer that generates percussion with AI (GAN), driven by an ONNX model built in-house at Sony.",
        "Sub-second inference thanks to hardware acceleration on NVIDIA's Jetson Orin.",
        "3D-printed enclosure, custom PCB and a hand-soldered button matrix, wired to an Arduino driving the Jetson over USB.",
      ],
    },
    tags: ["GAN", "ONNX", "Jetson Orin", "Arduino", "Hardware"],
  },

  {
    // TODO : renseigner le nom de l'entreprise, absent du CV.
    id: "devops-ia-cloud",
    period: { fr: "Mai 2025 — Août 2025", en: "May 2025 — Aug. 2025" },
    title: {
      fr: "Ingénieur DevOps Full-Stack (IA & Cloud)",
      en: "Full-Stack DevOps Engineer (AI & Cloud)",
    },
    org: "Levallois-Perret",
    points: {
      fr: [
        "Responsable du projet de bout en bout : réunions client, choix de la stack, mise en production d'un RAG sur Azure via Terraform et CI/CD.",
        "Temps de réponse réduit de 30 % grâce à l'intégration d'un système de mise en cache du contexte.",
        "Refonte complète du front-end en Nuxt.js, l'expérience utilisateur gagnant au rendu côté serveur (SSR).",
      ],
      en: [
        "Owned the project end to end: client meetings, stack decisions, and shipping a RAG system to production on Azure via Terraform and CI/CD.",
        "Cut response time by 30% by introducing context caching.",
        "Rebuilt the front-end in Nuxt.js, improving the user experience through server-side rendering.",
      ],
    },
    tags: ["RAG", "Azure", "Terraform", "CI/CD", "Nuxt.js"],
  },

  {
    id: "junior-conseil-taker",
    period: { fr: "Jan. 2025 — aujourd'hui", en: "Jan. 2025 — present" },
    title: {
      fr: "Développeur freelance",
      en: "Freelance developer",
    },
    org: "Junior Conseil Taker",
    location: {
      fr: "ESN dirigée par des étudiants d'Epitech",
      en: "Student-run consultancy at Epitech",
    },
    points: {
      fr: [
        "Missions de développement et de conseil pour des entreprises clientes.",
        "Participation à des audits et recommandations sur des solutions logicielles adaptées aux besoins des clients.",
      ],
      en: [
        "Development and consulting engagements for client companies.",
        "Contributed to audits and recommended software solutions matched to each client's needs.",
      ],
    },
    tags: ["Freelance", "Audit", "Conseil"],
  },

  {
    id: "etna",
    period: { fr: "Fév. 2024 — Avr. 2024", en: "Feb. 2024 — Apr. 2024" },
    title: {
      fr: "Accompagnateur pédagogique",
      en: "Teaching assistant",
    },
    org: "ETNA",
    location: {
      fr: "En parallèle d'Epitech",
      en: "Alongside Epitech",
    },
    points: {
      fr: [
        "Accompagnement d'élèves en reconversion vers l'informatique.",
        "Coaching et suivi personnalisé des étudiants.",
        "Enseignement de TypeScript, Python et HTML/CSS.",
      ],
      en: [
        "Supported students retraining into software development.",
        "One-to-one coaching and progress tracking.",
        "Taught TypeScript, Python and HTML/CSS.",
      ],
    },
    tags: ["TypeScript", "Python", "HTML/CSS"],
  },
] as const;
