"use client";

import { useMemo, useState } from "react";
import { Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MediaPlayer } from "@/components/media-player";
import { getMedia } from "@/lib/media";
import { usePrefs } from "@/lib/prefs";
import { cn } from "@/lib/utils";

const WEB_TABS = [
  { key: "landing", src: "/area/index.html" },
  { key: "create", src: "/area/applet/create.html" },
] as const;

type TabKey = (typeof WEB_TABS)[number]["key"] | "mobile";

/**
 * Démo d'Area : son vrai front web, exporté en statique (voir vendor/area,
 * branche demo) puisque le backend n'est plus hébergé — actions et
 * réactions y sont simulées (src/lib/demo-data.ts côté Area). Le client
 * mobile (Flutter), lui, n'est pas rejouable ainsi : ses captures d'écran
 * enregistrées avant l'arrêt du backend servent d'onglet à part.
 *
 * Contrairement aux jeux WebAssembly, le web n'est pas un canevas figé mais
 * un site cliquable : deux onglets pointent l'iframe vers la landing et
 * vers l'écran de création d'automatisation plutôt que de compter sur la
 * nav interne d'Area, qui suppose une session connectée qu'on ne simule pas.
 */
export function AreaDemo() {
  const { t } = usePrefs();
  const [started, setStarted] = useState(false);
  const [tab, setTab] = useState<TabKey>("landing");

  const mobileItems = useMemo(
    () => getMedia("area").items.filter((item) => item.kind === "video"),
    [],
  );

  const activeWebTab = WEB_TABS.find((entry) => entry.key === tab);
  const showMobile = tab === "mobile" && mobileItems.length > 0;

  return (
    <div className="space-y-3">
      {started && (
        <div className="flex flex-wrap gap-1.5">
          {WEB_TABS.map((entry) => (
            <Button
              key={entry.key}
              size="sm"
              variant={entry.key === tab ? "default" : "outline"}
              onClick={() => setTab(entry.key)}
            >
              {t(entry.key === "landing" ? "area.tabLanding" : "area.tabCreate")}
            </Button>
          ))}
          {mobileItems.length > 0 && (
            <Button
              size="sm"
              variant={tab === "mobile" ? "default" : "outline"}
              onClick={() => setTab("mobile")}
            >
              {t("area.tabMobile")}
            </Button>
          )}
        </div>
      )}

      {showMobile ? (
        <MediaPlayer key="area-mobile" items={mobileItems} />
      ) : (
        <div
          className={cn(
            "relative mx-auto w-full overflow-hidden rounded-lg border bg-black",
          )}
        >
          <div className="h-[70vh] max-h-[720px] min-h-[420px] w-full">
            {started && activeWebTab ? (
              <iframe
                key={activeWebTab.src}
                src={activeWebTab.src}
                title="Area"
                className="size-full border-0 bg-white"
                sandbox="allow-scripts allow-same-origin allow-forms"
              />
            ) : (
              <div className="flex size-full flex-col items-center justify-center gap-3 px-6 text-center">
                <p className="max-w-sm text-sm text-balance text-white/70">
                  {t("area.intro")}
                </p>
                <Button onClick={() => setStarted(true)}>
                  <Play className="size-4 fill-current" />
                  {t("area.launch")}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {started && !showMobile && (
        <p className="font-mono text-xs text-muted-foreground">{t("area.hint")}</p>
      )}
    </div>
  );
}
