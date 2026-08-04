"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";
import { useInView, useSavesData } from "@/lib/use-in-view";
import type { ResolvedMediaItem } from "@/lib/media";

/** Un survol qui traverse la carte ne doit pas déclencher de téléchargement. */
const HOVER_INTENT_MS = 120;

/**
 * Vignette d'un projet : une affiche fixe, et rien d'autre, tant que
 * l'utilisateur ne montre pas d'intérêt.
 *
 * La boucle d'aperçu n'est montée que si la carte est proche du viewport
 * *et* survolée. Quand le curseur repart, la vidéo est démontée : le
 * décodeur est libéré au lieu de tourner en fond.
 *
 * L'affiche n'est pas superposée à la vidéo mais échangée avec elle :
 * l'attribut `poster` couvre le temps de chargement, ce qui évite d'avoir
 * à suivre un état « prête » qui peut se désynchroniser.
 */
export function MediaPreview({
  item,
  active,
  className,
}: {
  item: ResolvedMediaItem;
  /** Force la lecture — utilisé quand la carte a le focus clavier. */
  active?: boolean;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const savesData = useSavesData();
  const { ref, inView } = useInView<HTMLDivElement>({ rootMargin: "300px" });

  const [hovered, setHovered] = useState(false);
  const intent = useRef<ReturnType<typeof setTimeout> | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const canPlay =
    item.kind === "video" &&
    item.preview.length > 0 &&
    !reduced &&
    !savesData &&
    inView &&
    (hovered || active === true);

  const onEnter = useCallback(() => {
    if (intent.current) clearTimeout(intent.current);
    intent.current = setTimeout(() => setHovered(true), HOVER_INTENT_MS);
  }, []);

  const onLeave = useCallback(() => {
    if (intent.current) clearTimeout(intent.current);
    setHovered(false);
  }, []);

  useEffect(() => {
    return () => {
      if (intent.current) clearTimeout(intent.current);
    };
  }, []);

  // Au démontage, couper explicitement le flux : sans cela le navigateur
  // peut poursuivre un téléchargement déjà engagé.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    return () => {
      video.pause();
      video.removeAttribute("src");
      video.load();
    };
  }, [canPlay]);

  return (
    <div
      ref={ref}
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
      className={cn(
        "relative overflow-hidden bg-muted",
        "aspect-video w-full",
        className,
      )}
    >
      {canPlay ? (
        <video
          ref={videoRef}
          muted
          loop
          autoPlay
          playsInline
          preload="auto"
          poster={item.poster}
          aria-hidden
          className="size-full object-cover"
        >
          {item.preview.map((source) => (
            <source key={source.src} src={source.src} type={source.type} />
          ))}
        </video>
      ) : (
        <img
          src={item.poster}
          alt=""
          width={item.width}
          height={item.height}
          loading="lazy"
          decoding="async"
          className="size-full object-cover"
        />
      )}
    </div>
  );
}
