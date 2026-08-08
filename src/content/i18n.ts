import type { Lang } from "./types";

/**
 * Chaînes d'interface. Le contenu éditorial (projets, formations…) vit dans
 * les autres fichiers de `src/content`.
 */
const dictionary = {
  fr: {
    "nav.projects": "Projets",
    "nav.experience": "Expériences",
    "nav.education": "Formations",
    "nav.skills": "Compétences",
    "nav.contact": "Contact",

    "hero.availability": "Disponible",
    "hero.viewProjects": "Voir les projets",
    "hero.contactMe": "Me contacter",

    "profile.label": "Profil",
    "profile.web": "Web",
    "profile.cpp": "C / C++",
    "profile.hint": "Change les projets et les compétences mis en avant.",

    "lang.label": "Langue",
    "theme.label": "Thème",
    "theme.light": "Clair",
    "theme.dark": "Sombre",
    "theme.system": "Système",

    "section.projects.title": "Projets",
    "section.projects.lead":
      "Clique sur un projet pour voir la démo et le détail technique.",
    "section.experience.title": "Expériences",
    "section.education.title": "Formations",
    "section.skills.title": "Compétences",
    "section.contact.title": "Contact",

    "project.open": "Ouvrir",
    "project.close": "Fermer",
    "project.role": "Rôle",
    "project.stack": "Stack",
    "project.highlights": "Points clés",
    "project.links": "Liens",
    "project.award": "Distinction",
    "project.noMedia": "Démo à venir",
    "project.privateMedia": "Démo non publiée",
    "project.privateMediaHint":
      "Les médias de ce projet ne sont pas diffusés publiquement. Demande-les-moi par mail.",
    "project.inBoth": "Présent dans les deux profils",
    "project.prev": "Projet précédent",
    "project.next": "Projet suivant",
    "project.visitSite": "Ouvrir le site",

    "media.play": "Lire",
    "media.pause": "Pause",
    "media.mute": "Couper le son",
    "media.unmute": "Activer le son",
    "media.loading": "Chargement",

    "rtype.title": "Client compilé en WebAssembly",
    "rtype.badge": "WebAssembly",
    "rtype.intro":
      "Le client C++ tourne ici, dans ton navigateur. 13 Mo à charger — rien ne part avant ton clic.",
    "rtype.launch": "Lancer le jeu",
    "rtype.controls": "ZQSD pour se déplacer, Espace pour tirer",
    "rtype.hint":
      "Dans les salons, clique « Refresh », choisis une session, puis ton personnage.",
    "rtype.mode.label": "Mode de jeu",
    "rtype.mode.local": "Local",
    "rtype.mode.online": "En ligne",
    "rtype.mode.localHint":
      "Le serveur est compilé dans le module : toute la partie tient dans l'onglet.",
    "rtype.mode.onlineHint":
      "Le vrai serveur, joint par un relais WebSocket. À plusieurs.",
    "rtype.pad.label": "Commandes",
    "rtype.pad.up": "Monter",
    "rtype.pad.down": "Descendre",
    "rtype.pad.left": "Aller à gauche",
    "rtype.pad.right": "Aller à droite",
    "rtype.pad.shoot": "Tirer",

    "myhunter.title": "Jeu compilé en WebAssembly",
    "myhunter.badge": "WebAssembly",
    "myhunter.intro":
      "Le jeu en C tourne ici, dans ton navigateur. 13 Mo à charger — rien ne part avant ton clic.",
    "myhunter.launch": "Lancer le jeu",
    "myhunter.controls": "Clique sur un ballon avant qu'il n'atteigne sa tour.",
    "myhunter.hint":
      "Chaque tour a ses propres points de vie : trois ballons manqués la détruisent.",

    "myrpg.title": "Jeu compilé en WebAssembly",
    "myrpg.badge": "WebAssembly",
    "myrpg.intro":
      "Le jeu en C tourne ici, dans ton navigateur. 11 Mo à charger — rien ne part avant ton clic.",
    "myrpg.launch": "Lancer le jeu",
    "myrpg.controls": "Flèches ou ZQSD/WASD pour se déplacer, E pour interagir, I pour l'inventaire",
    "myrpg.hint": "Depuis le menu, « Jouer » lance directement la partie — aucune sauvegarde n'existe encore à charger.",

    "area.title": "Démo statique, sans backend",
    "area.badge": "Démo",
    "area.intro":
      "Le vrai front d'Area, rejoué ici en export statique — le backend n'est plus hébergé, ses données sont donc simulées.",
    "area.launch": "Lancer la démo",
    "area.tabLanding": "Accueil",
    "area.tabCreate": "Créer une automatisation",
    "area.tabMobile": "Mobile",
    "area.hint":
      "Certaines actions (connexion, sauvegarde) sont mimées : rien n'est vraiment persisté.",

    "minishell.title": "Shell compilé en WebAssembly",
    "minishell.badge": "WebAssembly",
    "minishell.intro":
      "Le vrai binaire tourne ici. Les commandes internes (cd, env, setenv, exit) sont du vrai code C — les commandes externes (ls, cat…) échouent pour de vraies raisons : pas de vrais binaires système dans un bac à sable WebAssembly.",
    "minishell.launch": "Lancer le shell",
    "minishell.placeholder": "tape une commande…",
    "minishell.hint":
      "cd et setenv gardent leur effet d'une commande à l'autre — c'est bien le même code qui rejoue tout l'historique à chaque fois.",

    "dante.title": "Résolveur compilé en WebAssembly",
    "dante.badge": "WebAssembly",
    "dante.intro":
      "Le vrai solveur BFS tourne ici. Chaque case explorée est tracée en direct, puis le chemin trouvé s'affiche — aucune animation refaite à la main côté navigateur.",
    "dante.launch": "Lancer la résolution",
    "dante.mapLabel": "Labyrinthe",
    "dante.replay": "Rejouer",
    "dante.solving": "Résolution en cours",
    "dante.noSolution": "Aucun chemin trouvé",

    "bsq.title": "Programme compilé en WebAssembly",
    "bsq.badge": "WebAssembly",
    "bsq.intro":
      "Le vrai programme C tourne ici et cherche le plus grand carré de cases libres. Choisis une carte, navigue dedans à la souris — le carré trouvé est mis en évidence.",
    "bsq.launch": "Chercher le plus grand carré",
    "bsq.mapLabel": "Carte",
    "bsq.sizeLabel": "Taille",
    "bsq.resultFound": "Carré trouvé",
    "bsq.resultNone": "Aucun carré trouvé",

    "rt.title": "Moteur compilé en WebAssembly",
    "rt.badge": "WebAssembly",
    "rt.intro":
      "Le moteur C++ tourne ici, dans ton navigateur. Rien n'est téléchargé tant que tu n'as pas lancé le rendu.",
    "rt.launch": "Lancer le rendu",
    "rt.loading": "Chargement du moteur",
    "rt.rendering": "Rendu en cours",
    "rt.scene": "Scène",
    "rt.quality": "Qualité",
    "rt.qualityFast": "Rapide",
    "rt.qualityNormal": "Normale",
    "rt.qualityFine": "Fine",
    "rt.camera": "Caméra",
    "rt.left": "Gauche",
    "rt.right": "Droite",
    "rt.forward": "Avancer",
    "rt.backward": "Reculer",
    "rt.reset": "Recentrer",
    "rt.primitives": "primitives",
    "rt.error": "Le moteur n'a pas pu démarrer",
    "rt.unsupported":
      "Ton navigateur ne prend pas en charge WebAssembly dans un worker.",

    "contact.lead":
      "Ouvert aux opportunités de part-time et de stage de fin d'études.",
    "contact.email": "Écrire un mail",
    "contact.github": "GitHub",
    "contact.languages": "Langues",
    "contact.interests": "Centres d'intérêt",

    "footer.builtWith": "Construit avec Next.js, déployé sur Cloudflare.",
    "footer.source": "Code source",
  },

  en: {
    "nav.projects": "Projects",
    "nav.experience": "Experience",
    "nav.education": "Education",
    "nav.skills": "Skills",
    "nav.contact": "Contact",

    "hero.availability": "Available",
    "hero.viewProjects": "View projects",
    "hero.contactMe": "Get in touch",

    "profile.label": "Profile",
    "profile.web": "Web",
    "profile.cpp": "C / C++",
    "profile.hint": "Switches which projects and skills are highlighted.",

    "lang.label": "Language",
    "theme.label": "Theme",
    "theme.light": "Light",
    "theme.dark": "Dark",
    "theme.system": "System",

    "section.projects.title": "Projects",
    "section.projects.lead":
      "Click a project for the demo and the technical detail.",
    "section.experience.title": "Experience",
    "section.education.title": "Education",
    "section.skills.title": "Skills",
    "section.contact.title": "Contact",

    "project.open": "Open",
    "project.close": "Close",
    "project.role": "Role",
    "project.stack": "Stack",
    "project.highlights": "Highlights",
    "project.links": "Links",
    "project.award": "Award",
    "project.noMedia": "Demo coming soon",
    "project.privateMedia": "Demo not published",
    "project.privateMediaHint":
      "Media for this project isn't published publicly. Email me and I'll share it.",
    "project.inBoth": "Featured in both profiles",
    "project.prev": "Previous project",
    "project.next": "Next project",
    "project.visitSite": "Open the site",

    "media.play": "Play",
    "media.pause": "Pause",
    "media.mute": "Mute",
    "media.unmute": "Unmute",
    "media.loading": "Loading",

    "rtype.title": "Client compiled to WebAssembly",
    "rtype.badge": "WebAssembly",
    "rtype.intro":
      "The C++ client runs right here, in your browser. 13 MB to load — nothing downloads before you click.",
    "rtype.launch": "Run the game",
    "rtype.controls": "ZQSD to move, Space to shoot",
    "rtype.hint":
      "In the sessions screen, hit “Refresh”, pick a session, then your character.",
    "rtype.mode.label": "Game mode",
    "rtype.mode.local": "Local",
    "rtype.mode.online": "Online",
    "rtype.mode.localHint":
      "The server is compiled into the module: the whole game fits in the tab.",
    "rtype.mode.onlineHint":
      "The real server, reached through a WebSocket relay. With others.",
    "rtype.pad.label": "Controls",
    "rtype.pad.up": "Move up",
    "rtype.pad.down": "Move down",
    "rtype.pad.left": "Move left",
    "rtype.pad.right": "Move right",
    "rtype.pad.shoot": "Shoot",

    "myhunter.title": "Game compiled to WebAssembly",
    "myhunter.badge": "WebAssembly",
    "myhunter.intro":
      "The C game runs right here, in your browser. 13 MB to load — nothing downloads before you click.",
    "myhunter.launch": "Run the game",
    "myhunter.controls": "Click a balloon before it reaches its tower.",
    "myhunter.hint":
      "Each tower has its own hit points: three missed balloons bring it down.",

    "myrpg.title": "Game compiled to WebAssembly",
    "myrpg.badge": "WebAssembly",
    "myrpg.intro":
      "The C game runs right here, in your browser. 11 MB to load — nothing downloads before you click.",
    "myrpg.launch": "Run the game",
    "myrpg.controls": "Arrows or WASD/ZQSD to move, E to interact, I for the inventory",
    "myrpg.hint":
      "From the menu, “Play” starts the game directly — there's no save yet to load.",

    "area.title": "Static demo, no backend",
    "area.badge": "Demo",
    "area.intro":
      "Area's real frontend, replayed here as a static export — the backend is no longer hosted, so its data is simulated.",
    "area.launch": "Launch the demo",
    "area.tabLanding": "Home",
    "area.tabCreate": "Create an automation",
    "area.tabMobile": "Mobile",
    "area.hint":
      "Some actions (sign-in, saving) are mocked — nothing actually persists.",

    "minishell.title": "Shell compiled to WebAssembly",
    "minishell.badge": "WebAssembly",
    "minishell.intro":
      "The real binary runs here. Builtins (cd, env, setenv, exit) are real C code — external commands (ls, cat…) fail for real reasons: there are no real system binaries in a WebAssembly sandbox.",
    "minishell.launch": "Launch the shell",
    "minishell.placeholder": "type a command…",
    "minishell.hint":
      "cd and setenv keep their effect across commands — the same code replays the whole history every time.",

    "dante.title": "Solver compiled to WebAssembly",
    "dante.badge": "WebAssembly",
    "dante.intro":
      "The real BFS solver runs here. Every explored cell is traced live, then the found path is drawn — no animation faked in the browser.",
    "dante.launch": "Run the solver",
    "dante.mapLabel": "Maze",
    "dante.replay": "Replay",
    "dante.solving": "Solving",
    "dante.noSolution": "No path found",

    "bsq.title": "Program compiled to WebAssembly",
    "bsq.badge": "WebAssembly",
    "bsq.intro":
      "The real C program runs here, searching for the biggest square of free cells. Pick a map, pan around with the mouse — the found square is highlighted.",
    "bsq.launch": "Find the biggest square",
    "bsq.mapLabel": "Map",
    "bsq.sizeLabel": "Size",
    "bsq.resultFound": "Square found",
    "bsq.resultNone": "No square found",

    "rt.title": "Engine compiled to WebAssembly",
    "rt.badge": "WebAssembly",
    "rt.intro":
      "The C++ engine runs right here, in your browser. Nothing downloads until you start the render.",
    "rt.launch": "Run the renderer",
    "rt.loading": "Loading the engine",
    "rt.rendering": "Rendering",
    "rt.scene": "Scene",
    "rt.quality": "Quality",
    "rt.qualityFast": "Fast",
    "rt.qualityNormal": "Normal",
    "rt.qualityFine": "Fine",
    "rt.camera": "Camera",
    "rt.left": "Left",
    "rt.right": "Right",
    "rt.forward": "Forward",
    "rt.backward": "Back",
    "rt.reset": "Recenter",
    "rt.primitives": "primitives",
    "rt.error": "The engine failed to start",
    "rt.unsupported":
      "Your browser doesn't support WebAssembly inside a worker.",

    "contact.lead":
      "Open to part-time roles and a final-year internship.",
    "contact.email": "Send an email",
    "contact.github": "GitHub",
    "contact.languages": "Languages",
    "contact.interests": "Interests",

    "footer.builtWith": "Built with Next.js, deployed on Cloudflare.",
    "footer.source": "Source code",
  },
} as const;

export type TranslationKey = keyof (typeof dictionary)["fr"];

export function t(lang: Lang, key: TranslationKey): string {
  return dictionary[lang][key];
}

/** Renvoie une fonction de traduction figée sur une langue. */
export function translator(lang: Lang) {
  return (key: TranslationKey) => dictionary[lang][key];
}

export const langLabels: Record<Lang, string> = {
  fr: "FR",
  en: "EN",
};
