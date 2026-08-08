import type { Project } from "./types";

/**
 * Projets des deux CV. `profiles` décide de l'apparition dans le profil
 * C/C++, web ou les deux.
 *
 * L'ordre du tableau est l'ordre d'affichage : les projets bas niveau
 * ouvrent la liste, si bien que le profil C/C++ montre R-Type puis
 * Ray-Tracer, et le profil web ouvre sur Samplify.
 *
 * La visibilité des médias ne se règle pas ici mais dans
 * `media/media.config.json` : voir `media/README.md`.
 */
export const projects: readonly Project[] = [
  {
    slug: "r-type",
    name: "R-Type",
    profiles: ["cpp"],
    period: "2024",
    role: {
      fr: "Moteur de jeu & réseau",
      en: "Game engine & networking",
    },
    tagline: {
      fr: "Jeu multijoueur type Space Invaders en C++, compatible Windows, macOS et Linux.",
      en: "A multiplayer Space Invaders-style game in C++, running on Windows, macOS and Linux.",
    },
    highlights: {
      fr: [
        "Protocole UDP pour minimiser la latence, combiné au TCP pour la transmission fiable des données critiques.",
        "Moteur de jeu bâti sur une architecture ECS, pour structurer le code et réduire les temps de chargement.",
        "Interface en pixel art accessible et intuitive, avec un design sonore cohérent à l'univers du jeu.",
        "Écrit intégralement à la main, sans assistance d'IA.",
      ],
      en: [
        "UDP to keep latency low, paired with TCP for reliable delivery of critical data.",
        "Game engine built on an ECS architecture, which structured the codebase and cut load times.",
        "Accessible, intuitive pixel-art interface with sound design matched to the game's universe.",
        "Written entirely by hand, without AI assistance.",
      ],
    },
    stack: ["C++", "ECS", "UDP", "TCP", "CMake", "WebAssembly"],
    demo: "rtype",
    links: [
      {
        label: "github.com/My-bro/r-type",
        href: "https://github.com/My-bro/r-type-axel.londas",
      },
    ],
  },

  {
    slug: "ray-tracer",
    name: "Ray-Tracer",
    profiles: ["cpp"],
    period: "2024",
    role: {
      fr: "Moteur de rendu 3D from scratch",
      en: "3D rendering engine from scratch",
    },
    tagline: {
      fr: "Moteur de rendu 3D écrit intégralement en C++, sans bibliothèque graphique.",
      en: "A 3D rendering engine written from scratch in C++, with no graphics library.",
    },
    highlights: {
      fr: [
        "Simulation mathématique précise de plus de dix solides géométriques à partir de formules analytiques.",
        "Modélisation réaliste des réflexions lumineuses et de l'occlusion ambiante, optimisée via CUDA.",
        "Gestion dynamique des scènes pour une meilleure modularité et extensibilité du moteur.",
        "Écrit intégralement à la main, sans assistance d'IA.",
      ],
      en: [
        "Precise mathematical simulation of more than ten geometric solids from analytic formulas.",
        "Realistic modelling of light reflection and ambient occlusion, optimised with CUDA.",
        "Dynamic scene management for a more modular and extensible engine.",
        "Written entirely by hand, without AI assistance.",
      ],
    },
    stack: ["C++", "CUDA", "Maths 3D", "Ray tracing", "WebAssembly"],
    demo: "raytracer",
    links: [
      {
        label: "github.com/My-bro/raytracer",
        href: "https://github.com/My-bro/raytracer-axel.londas",
      },
    ],
  },

  {
    slug: "my-rpg",
    name: "My RPG",
    profiles: ["cpp"],
    period: "2025",
    role: {
      fr: "Jeu 2D en C & CSFML",
      en: "2D game in C & CSFML",
    },
    tagline: {
      fr: "RPG en vue de dessus écrit en C, sans moteur : combats, inventaire, dialogues et sauvegarde.",
      en: "A top-down RPG written in C, no engine: battles, inventory, dialogue and saved games.",
    },
    highlights: {
      fr: [
        "Système de combat complet, avec ses écrans et son enchaînement de tours.",
        "Déplacement et animation du personnage sur une carte en pixel art, gérés image par image.",
        "Inventaire, dialogues et sauvegarde de la partie, chacun avec son format de fichier.",
        "Rendu et entrées via CSFML, la liaison C de SFML — aucune couche de moteur au-dessus.",
      ],
      en: [
        "A full battle system, with its own screens and turn sequencing.",
        "Character movement and animation across a pixel-art map, driven frame by frame.",
        "Inventory, dialogue and saved games, each with its own file format.",
        "Rendering and input through CSFML, SFML's C binding — with no engine layer above it.",
      ],
    },
    stack: ["C", "CSFML", "Makefile", "Pixel art", "WebAssembly"],
    demo: "myrpg",
    links: [
      {
        label: "github.com/My-bro/myrpg",
        href: "https://github.com/My-bro/myrpg-axel.londas",
      },
    ],
  },

  {
    slug: "my-hunter",
    name: "My Hunter",
    profiles: ["cpp"],
    period: "2025",
    role: {
      fr: "Projet Epitech · Jeu en C & CSFML",
      en: "Epitech project · Game in C & CSFML",
    },
    tagline: {
      fr: "Refaire Duck Hunt en C, sans moteur : projet Epitech transposé dans l'univers de Clash Royale.",
      en: "Duck Hunt rebuilt in C, without an engine: an Epitech project moved to the Clash Royale universe.",
    },
    highlights: {
      fr: [
        "Exercice imposé : reproduire Duck Hunt à partir de rien, en C et sur CSFML — pas de moteur, pas de bibliothèque de jeu.",
        "Ici les canards deviennent des ballons de Clash Royale, qu'il faut crever avant qu'ils n'atteignent les tours.",
        "Sprites animés par découpage d'une planche, avec une horloge propre à chaque animation.",
        "Détection du clic sur la cible, musique de fond et bruitages, le tout chargé et mixé par CSFML.",
      ],
      en: [
        "The brief: rebuild Duck Hunt from nothing, in C on top of CSFML — no engine, no game library.",
        "Here the ducks become Clash Royale balloons, to be popped before they reach the towers.",
        "Sprites animated by slicing a sheet, each animation running on its own clock.",
        "Click-on-target detection, background music and sound effects, all loaded and mixed through CSFML.",
      ],
    },
    stack: ["C", "CSFML", "Makefile", "WebAssembly"],
    demo: "myhunter",
    links: [
      {
        label: "github.com/My-bro/myhunter",
        href: "https://github.com/My-bro/myhunter-axel.londas",
      },
    ],
  },

  {
    slug: "samplify",
    name: "Samplify",
    profiles: ["cpp", "web"],
    period: "2024 — 2025",
    role: {
      fr: "Chef de projet · 5 développeurs",
      en: "Project lead · team of 5",
    },
    tagline: {
      fr: "SaaS de recherche et de traitement audio pour producteurs de musique.",
      en: "A SaaS for audio search and processing, built for music producers.",
    },
    highlights: {
      fr: [
        "Vision produit, organisation et répartition des tâches sur une équipe de 5 développeurs, jusqu'au démarchage d'influenceurs.",
        "Séparation de sources audio par IA (HT-Demucs) en 4 pistes — voix, batterie, basse, autres — avec détection du BPM et extraction MIDI.",
        "Architecture microservices (Docker Swarm, Portainer) avec worker GPU à la demande sur Vast.ai pour contenir les coûts d'inférence.",
      ],
      en: [
        "Product vision, task planning and delegation across a team of 5 developers, through to influencer outreach.",
        "AI source separation (HT-Demucs) into 4 stems — vocals, drums, bass, other — with BPM detection and MIDI extraction.",
        "Microservice architecture (Docker Swarm, Portainer) with on-demand GPU workers on Vast.ai to keep inference costs down.",
      ],
    },
    stack: [
      "Next.js",
      "Python",
      "HT-Demucs",
      "Docker Swarm",
      "Portainer",
      "GPU / Vast.ai",
    ],
    website: "https://samplify.site",
  },

  {
    slug: "bazarbe",
    name: "Bazarbe",
    profiles: ["web"],
    period: "2024 — 2025",
    role: {
      fr: "Développeur produit & infrastructure",
      en: "Product & infrastructure engineer",
    },
    tagline: {
      fr: "SaaS de veille d'annonces sur web, Android et iOS, avec alertes en temps réel.",
      en: "A listings-watch SaaS on web, Android and iOS, with real-time alerts.",
    },
    highlights: {
      fr: [
        "Alertes en temps réel sur les articles publiés sur Vinted et eBay.",
        "Infrastructure cloud-native scalable, build et déploiement automatisés via Ansible.",
        "DevOps avancé : Docker Swarm, Portainer, monitoring backend et intégration des paiements via Stripe.",
        "Produit orienté utilisateur : prise en compte des retours clients et animation d'une communauté.",
      ],
      en: [
        "Real-time alerts on new listings published to Vinted and eBay.",
        "Scalable cloud-native infrastructure, with build and deploy automated through Ansible.",
        "Advanced DevOps: Docker Swarm, Portainer, backend monitoring and Stripe payment integration.",
        "User-driven product work: acting on customer feedback and running the community.",
      ],
    },
    stack: [
      "TypeScript",
      "Ansible",
      "Docker Swarm",
      "Portainer",
      "Stripe",
      "Android",
      "iOS",
    ],
    links: [{ label: "bazarbe.live", href: "https://bazarbe.live" }],
  },

  {
    slug: "area",
    name: "Area",
    profiles: ["web"],
    period: "2024",
    role: {
      fr: "Développeur full-stack & architecture",
      en: "Full-stack & architecture",
    },
    tagline: {
      fr: "SaaS multiplateforme d'automatisation de workflows, comparable à n8n ou Zapier.",
      en: "A cross-platform workflow automation SaaS, in the vein of n8n or Zapier.",
    },
    highlights: {
      fr: [
        "Plus de 289 automatisations de services majeurs : Google Drive, YouTube, Twitch, Amazon, GitHub…",
        "Architecture microservices scalable, orchestrée via Kubernetes et hébergée sur AWS.",
        "Latence système réduite de plus de 40 % grâce à l'optimisation de l'architecture.",
      ],
      en: [
        "More than 289 automations across major services: Google Drive, YouTube, Twitch, Amazon, GitHub and more.",
        "Scalable microservice architecture, orchestrated with Kubernetes and hosted on AWS.",
        "System latency cut by over 40% through architectural optimisation.",
      ],
    },
    stack: ["Kubernetes", "AWS", "Microservices", "Web", "Android", "iOS"],
    award: {
      fr: "Meilleur projet de la promotion",
      en: "Best project of the year group",
    },
    demo: "area",
  },

  {
    slug: "minishell",
    name: "Minishell",
    profiles: ["cpp"],
    period: "2023",
    role: {
      fr: "Projet Epitech · Shell en C",
      en: "Epitech project · Shell in C",
    },
    tagline: {
      fr: "Ré-implémentation d'un shell Unix en C, sans bibliothèque externe.",
      en: "A from-scratch reimplementation of a Unix shell in C, no external library.",
    },
    highlights: {
      fr: [
        "Parsing de la ligne de commande, pipes et point-virgule, sans lexer/parser généré.",
        "Built-ins internes (cd, env, setenv, unsetenv, exit) et commandes externes via fork/execve.",
        "Environnement géré par liste chaînée, propagé aux processus enfants.",
      ],
      en: [
        "Command-line parsing, pipes and semicolons, no generated lexer/parser.",
        "Internal builtins (cd, env, setenv, unsetenv, exit) and external commands via fork/execve.",
        "Linked-list-backed environment, propagated to child processes.",
      ],
    },
    stack: ["C", "Makefile", "POSIX", "WebAssembly"],
    demo: "minishell",
    links: [
      {
        label: "github.com/My-bro/minishell",
        href: "https://github.com/My-bro/Minishell2.Axel-Londas",
      },
    ],
  },

  {
    slug: "dante",
    name: "Dante",
    profiles: ["cpp"],
    period: "2023",
    role: {
      fr: "Projet Epitech · Génération & résolution de labyrinthe",
      en: "Epitech project · Maze generation & solving",
    },
    tagline: {
      fr: "Génère des labyrinthes imparfaits et les résout par parcours en largeur.",
      en: "Generates imperfect mazes and solves them with a breadth-first search.",
    },
    highlights: {
      fr: [
        "Générateur de labyrinthe « imparfait » : arbre couvrant percé de boucles additionnelles.",
        "Résolveur en C, BFS from scratch avec sa propre file et sa reconstruction de chemin.",
        "Aucune bibliothèque graphique : tout l'affichage passe par l'écriture brute du plan résolu.",
      ],
      en: [
        "\"Imperfect\" maze generator: a spanning tree with extra loops carved in.",
        "From-scratch BFS solver in C, with its own queue and path reconstruction.",
        "No graphics library: the solved layout is written out as plain text.",
      ],
    },
    stack: ["C", "Makefile", "BFS", "WebAssembly"],
    demo: "dante",
    links: [
      {
        label: "github.com/My-bro/dante",
        href: "https://github.com/My-bro/Dante.axel-londas",
      },
    ],
  },

  {
    slug: "bsq",
    name: "BSQ",
    profiles: ["cpp"],
    period: "2022",
    role: {
      fr: "Projet Epitech · Algorithmique",
      en: "Epitech project · Algorithms",
    },
    tagline: {
      fr: "Trouve le plus grand carré de cases libres dans une carte, par programmation dynamique.",
      en: "Finds the biggest square of free cells in a map, via dynamic programming.",
    },
    highlights: {
      fr: [
        "Programmation dynamique classique du « plus grand carré », en C, sans dépendance.",
        "Conçu pour des cartes jusqu'à 10 000 × 10 000 cases, allouées ligne par ligne.",
        "Deux modes : carte fournie en fichier, ou générée depuis un motif répété.",
      ],
      en: [
        "Classic \"biggest square\" dynamic programming, in C, no dependencies.",
        "Built for maps up to 10,000 × 10,000 cells, allocated row by row.",
        "Two modes: a map read from a file, or generated from a repeating pattern.",
      ],
    },
    stack: ["C", "Makefile", "Dynamic programming", "WebAssembly"],
    demo: "bsq",
    links: [
      {
        label: "github.com/My-bro/bsq",
        href: "https://github.com/My-bro/BSQ.axel-londas",
      },
    ],
  },
] as const;

export const projectSlugs: readonly string[] = projects.map((p) => p.slug);

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}
