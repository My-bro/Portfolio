import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    // La racine n'a pas de contenu propre : chaque langue a sa page.
    return [{ source: "/", destination: "/fr", permanent: false }];
  },

  async headers() {
    return [
      {
        // Vaut pour `next dev` et `next start`. En production sur Cloudflare,
        // ces fichiers sont servis par Workers Assets : c'est `public/_headers`
        // qui s'applique.
        source: "/m/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=604800, stale-while-revalidate=86400",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

// Rend les bindings Cloudflare (D1, variables) accessibles depuis `next dev`.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
void initOpenNextCloudflareForDev();
