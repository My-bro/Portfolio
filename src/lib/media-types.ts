/** Formes produites par `scripts/media-sync.mjs`. */

export interface GeneratedMediaSource {
  readonly file: string;
  readonly type: string;
}

export interface GeneratedMediaItem {
  readonly kind: "video" | "image";
  readonly label: string;
  readonly poster: string;
  /** Boucle courte et muette, chargée seulement au survol d'une carte. */
  readonly preview: readonly GeneratedMediaSource[];
  readonly sources: readonly GeneratedMediaSource[];
  readonly width: number;
  readonly height: number;
  readonly duration: number | null;
  readonly hasAudio: boolean;
}

export interface GeneratedMediaEntry {
  readonly visibility: "public" | "private";
  readonly items: readonly GeneratedMediaItem[];
}

export type GeneratedMedia = Record<string, GeneratedMediaEntry>;
