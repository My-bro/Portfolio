"use client";

import { Suspense } from "react";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PrefsProvider } from "@/lib/prefs";
import type { Lang } from "@/content/types";

export function Providers({
  lang,
  children,
}: {
  lang: Lang;
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      {/* PrefsProvider lit les search params : Suspense garde la page
          statiquement pré-rendue malgré tout. */}
      <Suspense fallback={null}>
        <PrefsProvider lang={lang}>
          <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
        </PrefsProvider>
      </Suspense>
    </ThemeProvider>
  );
}
