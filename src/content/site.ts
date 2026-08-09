import type { Localized, ProfileFilter } from "./types";

export const site = {
  name: "Axel Londas",
  /** Utilisé pour les URLs absolues (OG, sitemap). Surcharge : NEXT_PUBLIC_SITE_URL. */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://axellondas.dev",
  email: "axel.londas@epitech.eu",
  github: "https://github.com/My-bro",
  githubHandle: "My-bro",

  /**
   * Le numéro figure sur les CV PDF mais un site public est moissonné par
   * les robots à spam. Passe à `true` si tu veux l'afficher quand même.
   */
  showPhone: false,
  phone: "+33 7 67 17 68 94",

  location: {
    fr: "Paris",
    en: "Paris",
  } satisfies Localized,
} as const;

/** Intitulé de poste affiché sous le nom, selon le profil actif. */
export const roleByProfile: Record<ProfileFilter, Localized> = {
  all: {
    fr: "Développeur C / C++ & Full-Stack",
    en: "C / C++ & full-stack engineer",
  },
  cpp: {
    fr: "Développeur C / C++ & algorithmique",
    en: "C / C++ & algorithms engineer",
  },
  web: {
    fr: "Développeur Full-Stack / DevOps",
    en: "Full-Stack / DevOps engineer",
  },
};

/**
 * Accroche : elle dit dans quel ordre lire le profil — le bas niveau est
 * le métier, le web est la seconde corde, et les deux sont revendiqués.
 */
export const pitch: Localized = {
  fr: "Le bas niveau d'abord : moteur de rendu et moteur de jeu écrits from scratch en C++, algorithmique, réseau UDP/TCP. Et je sais emmener un produit web jusqu'en production — microservices, Kubernetes, CI/CD.",
  en: "Low-level first: a rendering engine and a game engine written from scratch in C++, algorithms, UDP/TCP networking. And I know how to take a web product all the way to production — microservices, Kubernetes, CI/CD.",
};

/** Recherche en cours, reprise de l'en-tête des CV. */
export const availability: Localized = {
  fr: "5ᵉ année à Epitech. Part-time de septembre à février, puis stage de fin d'études de mars à fin août.",
  en: "Fifth year at Epitech. Part-time from September to February, then a final-year internship from March to the end of August.",
};

export const languagesSpoken: { label: Localized; level: string }[] = [
  { label: { fr: "Français", en: "French" }, level: "C2" },
  { label: { fr: "Anglais", en: "English" }, level: "B2" },
  { label: { fr: "Chinois", en: "Chinese" }, level: "HSK 3" },
];

export const interests: Localized = {
  fr: "Piano · Guitare · Beatmaking · Basket · Foot US · Jeux vidéo · Musculation",
  en: "Piano · Guitar · Beatmaking · Basketball · Football · Video games · Weightlifting",
};
