"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

import { cn } from "@/lib/utils";
import { usePrefs } from "@/lib/prefs";
import type { ResolvedMediaItem } from "@/lib/media";

/**
 * Lecteur de la fiche projet.
 *
 * La vidéo démarre seule mais en sourdine — c'est la seule façon d'obtenir
 * une lecture automatique acceptée par les navigateurs, et la seule polie.
 * `preload="metadata"` : les vignettes non sélectionnées ne téléchargent rien.
 */
export function MediaPlayer({ items }: { items: ResolvedMediaItem[] }) {
  const { t } = usePrefs();
  const [index, setIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Les appelants remontent le lecteur via `key` au changement de sujet :
  // pas besoin de remettre l'index à zéro depuis un effet.
  const item = items[index] ?? items[0];

  useEffect(() => {
    const video = videoRef.current;
    if (video) video.muted = muted;
  }, [muted, index]);

  if (!item) return null;

  const ratio = item.width > 0 && item.height > 0 ? item.width / item.height : 16 / 9;

  return (
    <div className="space-y-3">
      <div
        className="relative overflow-hidden rounded-lg border bg-black"
        style={{ aspectRatio: ratio }}
      >
        {item.kind === "video" ? (
          <>
            <video
              // La clé force le remontage : nouvelle source, nouvelle lecture.
              key={item.sources[0]?.src}
              ref={videoRef}
              controls
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              poster={item.poster}
              className="size-full object-contain"
            >
              {item.sources.map((source) => (
                <source key={source.src} src={source.src} type={source.type} />
              ))}
            </video>

            {item.hasAudio && (
              <button
                type="button"
                onClick={() => setMuted((m) => !m)}
                aria-label={muted ? t("media.unmute") : t("media.mute")}
                className={cn(
                  "absolute top-3 right-3 rounded-md bg-background/80 p-2",
                  "text-foreground backdrop-blur-sm transition-colors",
                  "hover:bg-background focus-visible:ring-2 focus-visible:ring-ring",
                  "focus-visible:outline-none",
                )}
              >
                {muted ? (
                  <VolumeX className="size-4" />
                ) : (
                  <Volume2 className="size-4" />
                )}
              </button>
            )}
          </>
        ) : (
          <img
            src={item.sources[0]?.src ?? item.poster}
            alt={item.label}
            width={item.width}
            height={item.height}
            className="size-full object-contain"
          />
        )}
      </div>

      {items.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {items.map((entry, i) => (
            <button
              key={entry.poster}
              type="button"
              onClick={() => setIndex(i)}
              aria-current={i === index}
              title={entry.label || undefined}
              className={cn(
                "relative shrink-0 overflow-hidden rounded-md border-2 transition-colors",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                i === index
                  ? "border-olive"
                  : "border-transparent opacity-60 hover:opacity-100",
              )}
            >
              <img
                src={entry.poster}
                alt={entry.label}
                loading="lazy"
                decoding="async"
                className="h-14 w-24 object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {item.label && (
        <p className="font-mono text-xs text-muted-foreground">{item.label}</p>
      )}
    </div>
  );
}
