import type { Lang } from "./types";

/**
 * Chaînes d'interface. Le contenu éditorial (projets, formations…) vit dans
 * les autres fichiers de `src/content`.
 */
const dictionary = {
  fr: {
    "nav.projects": "Projets",
    "nav.experience": "Expériences",
    "nav.education": "Formations",
    "nav.skills": "Compétences",
    "nav.contact": "Contact",

    "hero.availability": "Disponible",
    "hero.viewProjects": "Voir les projets",
    "hero.contactMe": "Me contacter",

    "profile.label": "Profil",
    "profile.web": "Web",
    "profile.cpp": "C / C++",
    "profile.hint": "Change les projets et les compétences mis en avant.",

    "lang.label": "Langue",
    "theme.label": "Thème",
    "theme.light": "Clair",
    "theme.dark": "Sombre",
    "theme.system": "Système",

    "section.projects.title": "Projets",
    "section.projects.lead":
      "Clique sur un projet pour voir la démo et le détail technique.",
    "section.experience.title": "Expériences",
    "section.education.title": "Formations",
    "section.skills.title": "Compétences",
    "section.contact.title": "Contact",

    "project.open": "Ouvrir",
    "project.close": "Fermer",
    "project.role": "Rôle",
    "project.stack": "Stack",
    "project.highlights": "Points clés",
    "project.links": "Liens",
    "project.award": "Distinction",
    "project.noMedia": "Démo à venir",
    "project.privateMedia": "Démo non publiée",
    "project.privateMediaHint":
      "Les médias de ce projet ne sont pas diffusés publiquement. Demande-les-moi par mail.",
    "project.inBoth": "Présent dans les deux profils",
    "project.prev": "Projet précédent",
    "project.next": "Projet suivant",

    "media.play": "Lire",
    "media.pause": "Pause",
    "media.mute": "Couper le son",
    "media.unmute": "Activer le son",
    "media.loading": "Chargement",

    "contact.lead":
      "Ouvert aux opportunités de part-time et de stage de fin d'études.",
    "contact.email": "Écrire un mail",
    "contact.github": "GitHub",
    "contact.languages": "Langues",
    "contact.interests": "Centres d'intérêt",

    "footer.builtWith": "Construit avec Next.js, déployé sur Cloudflare.",
    "footer.source": "Code source",
  },

  en: {
    "nav.projects": "Projects",
    "nav.experience": "Experience",
    "nav.education": "Education",
    "nav.skills": "Skills",
    "nav.contact": "Contact",

    "hero.availability": "Available",
    "hero.viewProjects": "View projects",
    "hero.contactMe": "Get in touch",

    "profile.label": "Profile",
    "profile.web": "Web",
    "profile.cpp": "C / C++",
    "profile.hint": "Switches which projects and skills are highlighted.",

    "lang.label": "Language",
    "theme.label": "Theme",
    "theme.light": "Light",
    "theme.dark": "Dark",
    "theme.system": "System",

    "section.projects.title": "Projects",
    "section.projects.lead":
      "Click a project for the demo and the technical detail.",
    "section.experience.title": "Experience",
    "section.education.title": "Education",
    "section.skills.title": "Skills",
    "section.contact.title": "Contact",

    "project.open": "Open",
    "project.close": "Close",
    "project.role": "Role",
    "project.stack": "Stack",
    "project.highlights": "Highlights",
    "project.links": "Links",
    "project.award": "Award",
    "project.noMedia": "Demo coming soon",
    "project.privateMedia": "Demo not published",
    "project.privateMediaHint":
      "Media for this project isn't published publicly. Email me and I'll share it.",
    "project.inBoth": "Featured in both profiles",
    "project.prev": "Previous project",
    "project.next": "Next project",

    "media.play": "Play",
    "media.pause": "Pause",
    "media.mute": "Mute",
    "media.unmute": "Unmute",
    "media.loading": "Loading",

    "contact.lead":
      "Open to part-time roles and a final-year internship.",
    "contact.email": "Send an email",
    "contact.github": "GitHub",
    "contact.languages": "Languages",
    "contact.interests": "Interests",

    "footer.builtWith": "Built with Next.js, deployed on Cloudflare.",
    "footer.source": "Source code",
  },
} as const;

export type TranslationKey = keyof (typeof dictionary)["fr"];

export function t(lang: Lang, key: TranslationKey): string {
  return dictionary[lang][key];
}

/** Renvoie une fonction de traduction figée sur une langue. */
export function translator(lang: Lang) {
  return (key: TranslationKey) => dictionary[lang][key];
}

export const langLabels: Record<Lang, string> = {
  fr: "FR",
  en: "EN",
};
