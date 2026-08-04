"use client";

import { Mail, MapPin, Phone } from "lucide-react";
import { GithubIcon } from "@/components/icons";

import { Button } from "@/components/ui/button";
import { Section } from "@/components/section";
import { usePrefs } from "@/lib/prefs";
import { interests, languagesSpoken, site } from "@/content/site";

export function ContactSection() {
  const { lang, t } = usePrefs();

  return (
    <Section id="contact" title={t("section.contact.title")} lead={t("contact.lead")}>
      <div className="grid gap-8 sm:grid-cols-2">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <a href={`mailto:${site.email}`}>
                <Mail className="size-4" />
                {t("contact.email")}
              </a>
            </Button>
            <Button asChild variant="outline">
              <a href={site.github} target="_blank" rel="noreferrer noopener">
                <GithubIcon className="size-4" />
                {t("contact.github")}
              </a>
            </Button>
          </div>

          <ul className="space-y-1.5 pt-1 font-mono text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <Mail className="size-3.5 shrink-0" />
              <a
                href={`mailto:${site.email}`}
                className="transition-colors hover:text-brand"
              >
                {site.email}
              </a>
            </li>
            {site.showPhone && (
              <li className="flex items-center gap-2">
                <Phone className="size-3.5 shrink-0" />
                <a
                  href={`tel:${site.phone.replace(/\s/g, "")}`}
                  className="transition-colors hover:text-brand"
                >
                  {site.phone}
                </a>
              </li>
            )}
            <li className="flex items-center gap-2">
              <MapPin className="size-3.5 shrink-0" />
              {site.location[lang]}
            </li>
          </ul>
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <h3 className="font-mono text-xs tracking-[0.14em] text-muted-foreground uppercase">
              {t("contact.languages")}
            </h3>
            <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
              {languagesSpoken.map((entry) => (
                <li key={entry.level} className="flex items-baseline gap-1.5">
                  <span>{entry.label[lang]}</span>
                  <span className="font-mono text-xs text-brand">
                    {entry.level}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-mono text-xs tracking-[0.14em] text-muted-foreground uppercase">
              {t("contact.interests")}
            </h3>
            <p className="text-sm text-pretty text-muted-foreground">
              {interests[lang]}
            </p>
          </div>
        </div>
      </div>
    </Section>
  );
}
