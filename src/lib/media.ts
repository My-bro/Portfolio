import { generatedMedia } from "@/content/media.generated";
import type { GeneratedMedia } from "./media-types";

/**
 * Résout le manifeste généré en URLs utilisables.
 *
 * Les médias publics sont servis depuis `public/m/` (donc par le CDN
 * Cloudflare). Les médias privés ne sont jamais copiés dans `public/` : en
 * développement ils passent par une route locale, en production ils
 * n'existent tout simplement pas côté serveur.
 */

const media = generatedMedia as GeneratedMedia;

const PUBLIC_BASE = "/m";
const PRIVATE_BASE = "/api/private-media";
const isDev = process.env.NODE_ENV === "development";

export interface ResolvedSource {
  src: string;
  type: string;
}

export interface ResolvedMediaItem {
  kind: "video" | "image";
  label: string;
  poster: string;
  preview: ResolvedSource[];
  sources: ResolvedSource[];
  width: number;
  height: number;
  duration: number | null;
  hasAudio: boolean;
}

export interface ResolvedMedia {
  key: string;
  visibility: "public" | "private";
  items: ResolvedMediaItem[];
  /** Des médias existent mais ne sont pas diffusés dans cet environnement. */
  withheld: boolean;
}

const EMPTY: ResolvedMedia = {
  key: "",
  visibility: "private",
  items: [],
  withheld: false,
};

export function getMedia(key: string): ResolvedMedia {
  const entry = media[key];
  if (!entry) return { ...EMPTY, key };

  const servable = entry.visibility === "public" || isDev;
  if (!servable) {
    return {
      key,
      visibility: entry.visibility,
      items: [],
      withheld: entry.items.length > 0,
    };
  }

  const base =
    entry.visibility === "public"
      ? `${PUBLIC_BASE}/${key}`
      : `${PRIVATE_BASE}/${key}`;

  return {
    key,
    visibility: entry.visibility,
    withheld: false,
    items: entry.items.map((item) => ({
      kind: item.kind,
      label: item.label,
      poster: `${base}/${item.poster}`,
      preview: item.preview.map((s) => ({ src: `${base}/${s.file}`, type: s.type })),
      sources: item.sources.map((s) => ({ src: `${base}/${s.file}`, type: s.type })),
      width: item.width,
      height: item.height,
      duration: item.duration,
      hasAudio: item.hasAudio,
    })),
  };
}

/** Vrai dès qu'un visuel est affichable : pilote l'état cliquable des cartes. */
export function hasMedia(key: string): boolean {
  return getMedia(key).items.length > 0;
}

/**
 * Certains projets ont une capture en plus de leur visuel par défaut — son
 * nom de fichier finit alors par `-clair` (ex. `02-landing-clair.jpg`), ce
 * qui donne un `label` finissant par « clair » une fois passé par
 * `media:sync`. Le thème du portfolio choisit alors laquelle montrer ;
 * les projets à capture unique ne sont pas concernés, `items[0]` sort
 * toujours quel que soit `dark`.
 */
export function pickByTheme(
  items: readonly ResolvedMediaItem[],
  dark: boolean,
): ResolvedMediaItem | undefined {
  const light = items.find((item) => item.label.toLowerCase().endsWith("clair"));
  if (!light) return items[0];
  return dark ? (items.find((item) => item !== light) ?? items[0]) : light;
}
