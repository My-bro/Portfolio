import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

/**
 * Le site est presque entièrement pré-rendu : le Worker ne sert vraiment que
 * /api/track et /admin.
 *
 * Cela ne dispense pas d'un cache incrémental, contrairement à ce qu'on
 * pourrait croire. C'est lui qui range le HTML pré-rendu et que Next relit à
 * la première requête : sans lui, /fr n'était nulle part, et le Worker
 * répondait NoFallbackError sur une page pourtant générée au build.
 *
 * Celui-ci lit les assets statiques — donc rien à provisionner, ni R2 ni KV,
 * ce qui convient au palier gratuit. Il ne sait pas écrire, et c'est très
 * bien : il n'y a ici aucune revalidation à la demande.
 */
const config = {
  ...defineCloudflareConfig({ incrementalCache: staticAssetsIncrementalCache }),

  /**
   * Comment OpenNext construit l'application Next avant de l'empaqueter.
   *
   * Par défaut il lance `npm run build` — c'est-à-dire, ici, lui-même :
   * c'est ce script que Cloudflare appelle, et c'est donc lui qui doit
   * produire le bundle Worker. On lui désigne Next directement pour rompre
   * la boucle.
   *
   * L'alternative aurait été un second script à renseigner à la main dans
   * les réglages Cloudflare — que personne ne devinerait après un clone.
   */
  buildCommand: "npx next build",
};

export default config;
