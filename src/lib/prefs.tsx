"use client";

import {
  createContext,
  use,
  useCallback,
  useMemo,
  useSyncExternalStore,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Lang, Profile } from "@/content/types";
import { translator, type TranslationKey } from "@/content/i18n";
import { useHydrated } from "./use-hydrated";

const STORAGE_KEY = "portfolio.profile";
const QUERY_KEY = "p";

/**
 * Script exécuté avant le premier rendu : il pose `data-profile` sur <html>
 * pour que le CSS masque les projets du mauvais profil dès la première image.
 * Sans lui, les cartes du profil web clignoteraient sur un lien `?p=cpp`.
 */
export const PROFILE_BOOTSTRAP_SCRIPT = `(function(){try{var p=new URLSearchParams(location.search).get("${QUERY_KEY}");if(p!=="web"&&p!=="cpp"){p=localStorage.getItem("${STORAGE_KEY}")}if(p!=="web"&&p!=="cpp"){p="web"}document.documentElement.dataset.profile=p}catch(e){document.documentElement.dataset.profile="web"}})()`;

/**
 * L'attribut `data-profile` de <html> fait autorité : c'est ce que le script
 * ci-dessus écrit avant peinture, et ce que le CSS lit. React s'y abonne
 * plutôt que d'en tenir une copie, ce qui évite tout désaccord entre les deux.
 */
function subscribeProfile(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-profile"],
  });
  return () => observer.disconnect();
}

function readProfile(): Profile {
  return document.documentElement.dataset.profile === "cpp" ? "cpp" : "web";
}

interface PrefsValue {
  lang: Lang;
  profile: Profile;
  setProfile: (profile: Profile) => void;
  t: (key: TranslationKey) => string;
  /** Faux tant que React n'a pas repris la main après le script ci-dessus. */
  hydrated: boolean;
}

const PrefsContext = createContext<PrefsValue | null>(null);

export function PrefsProvider({
  lang,
  children,
}: {
  lang: Lang;
  children: React.ReactNode;
}) {
  const hydrated = useHydrated();
  const profile = useSyncExternalStore(
    subscribeProfile,
    readProfile,
    // Le HTML statique est toujours généré pour le profil web.
    () => "web" as const,
  );

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setProfile = useCallback(
    (next: Profile) => {
      document.documentElement.dataset.profile = next;
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // Navigation privée : le choix ne survivra pas au rechargement.
      }

      // L'URL reste partageable sans provoquer de navigation ni de scroll.
      const params = new URLSearchParams(searchParams.toString());
      if (next === "web") params.delete(QUERY_KEY);
      else params.set(QUERY_KEY, next);
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const value = useMemo<PrefsValue>(
    () => ({ lang, profile, setProfile, t: translator(lang), hydrated }),
    [lang, profile, setProfile, hydrated],
  );

  return <PrefsContext value={value}>{children}</PrefsContext>;
}

export function usePrefs(): PrefsValue {
  const ctx = use(PrefsContext);
  if (!ctx) throw new Error("usePrefs doit être utilisé dans un PrefsProvider");
  return ctx;
}
