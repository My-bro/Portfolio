import { defineCloudflareConfig } from "@opennextjs/cloudflare";

/**
 * Le site est presque entièrement pré-rendu : pas de cache incrémental à
 * configurer, le Worker ne sert que /api/track et /admin.
 */
export default defineCloudflareConfig({});
