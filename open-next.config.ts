import { defineCloudflareConfig } from "@opennextjs/cloudflare";

/**
 * Le site est presque entièrement pré-rendu : pas de cache incrémental à
 * configurer, le Worker ne sert que /api/track et /admin.
 */
export default {
  ...defineCloudflareConfig({}),

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
