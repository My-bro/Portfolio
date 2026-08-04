import type { MetadataRoute } from "next";
import { site } from "@/content/site";
import { LANGS } from "@/content/types";

export default function sitemap(): MetadataRoute.Sitemap {
  return LANGS.map((lang) => ({
    url: `${site.url}/${lang}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: lang === "fr" ? 1 : 0.9,
    alternates: {
      languages: Object.fromEntries(
        LANGS.map((other) => [other, `${site.url}/${other}`]),
      ),
    },
  }));
}
