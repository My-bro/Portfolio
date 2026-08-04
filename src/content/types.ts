/**
 * Types du contenu du portfolio.
 *
 * Tout le texte visible est bilingue : un `Localized` est un simple
 * dictionnaire { fr, en }, ce qui évite une librairie d'i18n complète
 * pour un site d'une seule page.
 */

export const LANGS = ["fr", "en"] as const;
export type Lang = (typeof LANGS)[number];

export const PROFILES = ["web", "cpp"] as const;
/** Les deux facettes du CV : full-stack/DevOps et C/C++. */
export type Profile = (typeof PROFILES)[number];

/**
 * `private` = les médias du projet ne sont jamais copiés dans `public/`.
 * Ils restent sur la machine et ne partent pas en production.
 */
export type Visibility = "public" | "private";

export type Localized = Record<Lang, string>;
export type LocalizedList = Record<Lang, string[]>;

export interface ProjectLink {
  label: string;
  href: string;
}

export interface Project {
  /** Identifiant stable : sert de clé média, d'ancre et de clé de metrics. */
  slug: string;
  name: string;
  /** Profils dans lesquels le projet apparaît. */
  profiles: readonly Profile[];
  /** Remonte le projet en tête de liste dans les profils concernés. */
  featured?: boolean;
  period: string;
  role: Localized;
  tagline: Localized;
  highlights: LocalizedList;
  stack: readonly string[];
  links?: readonly ProjectLink[];
  award?: Localized;
}

export interface TimelineEntry {
  id: string;
  /** Localisé : les abréviations de mois diffèrent d'une langue à l'autre. */
  period: Localized;
  title: Localized;
  org: string;
  location?: Localized;
  points: LocalizedList;
  tags?: readonly string[];
}

export type SkillGroup = "languages" | "systems" | "web" | "infra" | "ai";

export interface Skill {
  label: string;
  group: SkillGroup;
  /** Profils qui mettent la compétence en avant ; les autres la grisent. */
  profiles: readonly Profile[];
}
