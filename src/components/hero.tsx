"use client";

import { ArrowDown, Mail } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { Button } from "@/components/ui/button";
import { TypedName } from "@/components/typed-name";
import { usePrefs } from "@/lib/prefs";
import { availability, pitch, roleByProfile, site } from "@/content/site";

export function Hero() {
  const { lang, profile, t } = usePrefs();

  return (
    <section className="relative isolate">
      {/* Halo brand très diffus : donne un point de fuite sans rien surcharger. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-24 -z-10 h-96 opacity-[0.18] blur-3xl"
        style={{
          background:
            "radial-gradient(42rem 20rem at 22% 0%, var(--brand), transparent 70%)",
        }}
      />

      <div className="flex flex-col gap-8 pt-20 pb-16 sm:pt-28 sm:pb-24">
        <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand opacity-60 [animation-duration:2.4s]" />
            <span className="relative inline-flex size-2 rounded-full bg-brand" />
          </span>
          <span className="font-mono tracking-wide uppercase">
            {t("hero.availability")}
          </span>
          <span className="text-border">/</span>
          <span>{site.location[lang]}</span>
        </div>

        <div className="space-y-4">
          <h1 className="font-mono text-4xl font-semibold tracking-tight text-balance sm:text-6xl lg:text-7xl">
            <TypedName text={site.name} />
          </h1>

          {/* Hauteur minimale réservée : le changement de profil ne doit pas
              décaler le paragraphe suivant, sans pour autant rogner un
              intitulé qui passerait à la ligne sur petit écran. */}
          <div className="min-h-7 sm:min-h-8">
            <AnimatePresence mode="wait" initial={false}>
              <motion.p
                key={profile}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="text-lg text-brand sm:text-xl"
              >
                {roleByProfile[profile][lang]}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        <div className="max-w-xl space-y-2.5">
          <p className="text-pretty text-foreground/85">{pitch[lang]}</p>
          <p className="text-sm text-pretty text-muted-foreground">
            {availability[lang]}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button asChild size="lg">
            <a href="#projects">
              {t("hero.viewProjects")}
              <ArrowDown className="size-4" />
            </a>
          </Button>
          <Button asChild variant="outline" size="lg">
            <a href={`mailto:${site.email}`}>
              <Mail className="size-4" />
              {t("hero.contactMe")}
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
