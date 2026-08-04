import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { notFound } from "next/navigation";

import "../../globals.css";

import { Providers } from "@/components/providers";
import { PROFILE_BOOTSTRAP_SCRIPT } from "@/lib/prefs";
import { cn } from "@/lib/utils";
import { site } from "@/content/site";
import { LANGS, type Lang } from "@/content/types";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" });

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

/** Seules /fr et /en existent. */
export const dynamicParams = false;

const descriptions: Record<Lang, string> = {
  fr: "Portfolio d'Axel Londas — développeur C/C++ et algorithmique, également full-stack et DevOps. Projets, expériences et démos.",
  en: "Axel Londas' portfolio — C/C++ and algorithms engineer, also full-stack and DevOps. Projects, experience and demos.",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const l = (LANGS as readonly string[]).includes(lang) ? (lang as Lang) : "fr";

  return {
    metadataBase: new URL(site.url),
    title: {
      default: `${site.name} — ${
        l === "fr" ? "Développeur C/C++ & Full-Stack" : "C/C++ & Full-Stack Engineer"
      }`,
      template: `%s — ${site.name}`,
    },
    description: descriptions[l],
    alternates: {
      canonical: `/${l}`,
      languages: { fr: "/fr", en: "/en" },
    },
    openGraph: {
      type: "website",
      siteName: site.name,
      locale: l === "fr" ? "fr_FR" : "en_US",
      url: `/${l}`,
      title: site.name,
      description: descriptions[l],
    },
    twitter: { card: "summary_large_image" },
    robots: { index: true, follow: true },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f9f7f4" },
    { media: "(prefers-color-scheme: dark)", color: "#131110" },
  ],
};

export default async function SiteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!(LANGS as readonly string[]).includes(lang)) notFound();

  return (
    <html
      lang={lang}
      data-profile="cpp"
      suppressHydrationWarning
      className={cn(geist.variable, geistMono.variable)}
    >
      <head>
        {/* Avant peinture : évite que les projets du mauvais profil
            apparaissent une fraction de seconde. */}
        <script
          dangerouslySetInnerHTML={{ __html: PROFILE_BOOTSTRAP_SCRIPT }}
        />
      </head>
      <body className="font-sans">
        <Providers lang={lang as Lang}>{children}</Providers>
      </body>
    </html>
  );
}
