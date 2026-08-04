// Généré par `npm run media:sync` — ne pas éditer à la main.
// La visibilité se règle dans media/media.config.json.
import type { GeneratedMedia } from "@/lib/media-types";

export const generatedMedia = {
  "ray-tracer": {
    "visibility": "public",
    "items": [
      {
        "kind": "image",
        "label": "Degrade",
        "poster": "01-degrade.jpg",
        "preview": [],
        "sources": [
          {
            "file": "01-degrade.jpg",
            "type": "image/jpeg"
          }
        ],
        "width": 1600,
        "height": 900,
        "duration": null,
        "hasAudio": false
      }
    ]
  },
  "samplify": {
    "visibility": "public",
    "items": [
      {
        "kind": "image",
        "label": "Landing",
        "poster": "01-landing.jpg",
        "preview": [],
        "sources": [
          {
            "file": "01-landing.jpg",
            "type": "image/jpeg"
          }
        ],
        "width": 3200,
        "height": 1800,
        "duration": null,
        "hasAudio": false
      }
    ]
  }
} as const satisfies GeneratedMedia;
