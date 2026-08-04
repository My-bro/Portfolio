import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Sorties du transcodage média et de la construction Cloudflare.
    ".open-next/**",
    ".wrangler/**",
    ".media-private/**",
    // Servis tels quels : glue Emscripten générée et sous-modules.
    "public/wasm/raytracer.js",
    "vendor/**",
  ]),
  {
    files: ["src/components/media-*.tsx"],
    rules: {
      /**
       * `next/image` passe par l'optimiseur d'images, qui sur Cloudflare
       * consomme des invocations de Worker et demande un loader dédié. Nos
       * affiches sont déjà du WebP dimensionné par `media:sync` : une balise
       * <img> les sert directement depuis le CDN, sans intermédiaire.
       */
      "@next/next/no-img-element": "off",
    },
  },
]);

export default eslintConfig;
