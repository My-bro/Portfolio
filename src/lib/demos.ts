import dynamic from "next/dynamic";

import type { Project } from "@/content/types";
import type { TranslationKey } from "@/content/i18n";

/**
 * Une entrée par valeur possible de `Project["demo"]`. Centralisé ici parce
 * que project-card.tsx (badge de la vignette) et project-dialog.tsx
 * (composant chargé, titre de section) ont chacun besoin de résoudre un
 * `demo` vers ses clés de traduction — dupliquer la table les aurait fait
 * diverger tôt ou tard.
 */
export const DEMOS: Record<
  NonNullable<Project["demo"]>,
  { Component: React.ComponentType; titleKey: TranslationKey; badgeKey: TranslationKey }
> = {
  raytracer: {
    Component: dynamic(() => import("@/components/raytracer-demo").then((m) => m.RaytracerDemo), { ssr: false }),
    titleKey: "rt.title",
    badgeKey: "rt.badge",
  },
  rtype: {
    Component: dynamic(() => import("@/components/rtype-demo").then((m) => m.RTypeDemo), { ssr: false }),
    titleKey: "rtype.title",
    badgeKey: "rtype.badge",
  },
  myhunter: {
    Component: dynamic(() => import("@/components/myhunter-demo").then((m) => m.MyHunterDemo), { ssr: false }),
    titleKey: "myhunter.title",
    badgeKey: "myhunter.badge",
  },
  myrpg: {
    Component: dynamic(() => import("@/components/myrpg-demo").then((m) => m.MyRpgDemo), { ssr: false }),
    titleKey: "myrpg.title",
    badgeKey: "myrpg.badge",
  },
  area: {
    Component: dynamic(() => import("@/components/area-demo").then((m) => m.AreaDemo), { ssr: false }),
    titleKey: "area.title",
    badgeKey: "area.badge",
  },
  minishell: {
    Component: dynamic(() => import("@/components/minishell-demo").then((m) => m.MinishellDemo), { ssr: false }),
    titleKey: "minishell.title",
    badgeKey: "minishell.badge",
  },
  dante: {
    Component: dynamic(() => import("@/components/dante-demo").then((m) => m.DanteDemo), { ssr: false }),
    titleKey: "dante.title",
    badgeKey: "dante.badge",
  },
  bsq: {
    Component: dynamic(() => import("@/components/bsq-demo").then((m) => m.BsqDemo), { ssr: false }),
    titleKey: "bsq.title",
    badgeKey: "bsq.badge",
  },
  sokoban: {
    Component: dynamic(() => import("@/components/sokoban-demo").then((m) => m.SokobanDemo), { ssr: false }),
    titleKey: "sokoban.title",
    badgeKey: "sokoban.badge",
  },
  radar: {
    Component: dynamic(() => import("@/components/radar-demo").then((m) => m.RadarDemo), { ssr: false }),
    titleKey: "radar.title",
    badgeKey: "radar.badge",
  },
  pushswap: {
    Component: dynamic(() => import("@/components/pushswap-demo").then((m) => m.PushSwapDemo), { ssr: false }),
    titleKey: "pushswap.title",
    badgeKey: "pushswap.badge",
  },
};
