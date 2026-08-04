import type { Localized, Profile } from "./types";

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
    fr: "Paris · Pékin",
    en: "Paris · Beijing",
  } satisfies Localized,
} as const;

/** Intitulé de poste affiché sous le nom, selon le profil actif. */
export const roleByProfile: Record<Profile, Localized> = {
  web: {
    fr: "Développeur Full-Stack / DevOps",
    en: "Full-Stack / DevOps Engineer",
  },
  cpp: {
    fr: "Développeur C / C++",
    en: "C / C++ Software Engineer",
  },
};

/** Accroche de l'en-tête, reprise de celle des CV. */
export const pitch: Localized = {
  fr: "5ᵉ année à Epitech. Je cherche un part-time de septembre à février, puis un stage de fin d'études de mars à fin août.",
  en: "Fifth year at Epitech. Looking for a part-time role from September to February, then a final-year internship from March to the end of August.",
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
