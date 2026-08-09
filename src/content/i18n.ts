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
      "Le vrai binaire tourne ici : découpage de la ligne, built-ins, environnement, tout est le code C du projet. fork() et execve() n'ayant ni processus ni binaire à atteindre sous WebAssembly, le portage fournit ses propres ls, cat, grep… et des pipes reliés par de vraies redirections dup2().",
    "minishell.launch": "Lancer le shell",
    "minishell.placeholder": "tape une commande…",
    "minishell.hint":
      "Les pipes, le point-virgule et les enchaînements && / || fonctionnent. cd et setenv gardent leur effet d'une commande à l'autre : le même binaire rejoue tout l'historique à chaque fois.",

    "dante.title": "Résolveur compilé en WebAssembly",
    "dante.badge": "WebAssembly",
    "dante.intro":
      "Le vrai solveur BFS tourne ici. Chaque case explorée est tracée en direct, puis le chemin trouvé s'affiche — aucune animation refaite à la main côté navigateur.",
    "dante.launch": "Lancer la résolution",
    "dante.mapLabel": "Labyrinthe",
    "dante.replay": "Rejouer",
    "dante.solving": "Résolution en cours",
    "dante.noSolution": "Aucun chemin trouvé",
    "dante.createLabel": "Créer",
    "dante.perfect": "parfait",
    "dante.imperfect": "imparfait",
    "dante.generate": "Générer",

    "bsq.title": "Programme compilé en WebAssembly",
    "bsq.badge": "WebAssembly",
    "bsq.intro":
      "Le vrai programme C tourne ici et cherche le plus grand carré de cases libres. Choisis une carte, navigue dedans à la souris — le carré trouvé est mis en évidence.",
    "bsq.launch": "Chercher le plus grand carré",
    "bsq.mapLabel": "Carte",
    "bsq.sizeLabel": "Taille",
    "bsq.resultFound": "Carré trouvé",
    "bsq.resultNone": "Aucun carré trouvé",
    "bsq.createLabel": "Créer",
    "bsq.densityLabel": "Obstacles",
    "bsq.generate": "Générer",

    "radar.title": "Simulation compilée en WebAssembly",
    "radar.badge": "WebAssembly",
    "radar.intro":
      "Le vrai code du radar tourne ici. Écrit en CSFML, il dessine à travers un shim qui redirige la couche graphique vers SDL2 — celui de R-Type et de My RPG, étendu pour les cercles de portée et les boîtes orientées.",
    "radar.launch": "Lancer la simulation",
    "radar.hint":
      "Chaque avion suit le cap et la vitesse que lui donne le script de vol ; les cercles rouges sont les portées des tours, les boîtes les zones de détection des appareils.",

    "sokoban.title": "Jeu compilé en WebAssembly",
    "sokoban.badge": "WebAssembly",
    "sokoban.intro":
      "Le vrai jeu tourne ici. Sa boucle bloquante autour de getch() a été découpée en un appel par touche : chaque flèche envoie son code ncurses au binaire, qui renvoie l'écran qu'il aurait dessiné dans un terminal.",
    "sokoban.launch": "Lancer la partie",
    "sokoban.mapLabel": "Carte",
    "sokoban.restart": "Recommencer",
    "sokoban.keysLabel": "Flèches ou ZQSD",
    "sokoban.moves": "Coups",
    "sokoban.won": "Caisses rangées",
    "sokoban.lost": "Caisse bloquée — recommence",

    "pushswap.title": "Tri compilé en WebAssembly",
    "pushswap.badge": "WebAssembly",
    "pushswap.intro":
      "Le binaire C ne dessine rien : il reçoit les entiers en argv et écrit sa suite d'opérations sur la sortie standard. La démo la rejoue sur les deux piles — ce qui bouge est le vrai tri, pas une reconstitution en JavaScript.",
    "pushswap.launch": "Lancer le tri",
    "pushswap.stackLabel": "Pile",
    "pushswap.createLabel": "Créer",
    "pushswap.sizeLabel": "Taille",
    "pushswap.generate": "Mélanger",
    "pushswap.opsLabel": "Opérations",
    "pushswap.sorted": "pile triée",
    "pushswap.already": "Pile déjà triée : aucune opération",

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
      "The real binary runs here: line parsing, builtins, environment — all the project's C code. Since fork() and execve() have no process or binary to reach under WebAssembly, the port ships its own ls, cat, grep… and pipes wired with real dup2() redirections.",
    "minishell.launch": "Launch the shell",
    "minishell.placeholder": "type a command…",
    "minishell.hint":
      "Pipes, semicolons and && / || chaining all work. cd and setenv keep their effect across commands: the same binary replays the whole history every time.",

    "dante.title": "Solver compiled to WebAssembly",
    "dante.badge": "WebAssembly",
    "dante.intro":
      "The real BFS solver runs here. Every explored cell is traced live, then the found path is drawn — no animation faked in the browser.",
    "dante.launch": "Run the solver",
    "dante.mapLabel": "Maze",
    "dante.replay": "Replay",
    "dante.solving": "Solving",
    "dante.noSolution": "No path found",
    "dante.createLabel": "Create",
    "dante.perfect": "perfect",
    "dante.imperfect": "imperfect",
    "dante.generate": "Generate",

    "bsq.title": "Program compiled to WebAssembly",
    "bsq.badge": "WebAssembly",
    "bsq.intro":
      "The real C program runs here, searching for the biggest square of free cells. Pick a map, pan around with the mouse — the found square is highlighted.",
    "bsq.launch": "Find the biggest square",
    "bsq.mapLabel": "Map",
    "bsq.sizeLabel": "Size",
    "bsq.resultFound": "Square found",
    "bsq.resultNone": "No square found",
    "bsq.createLabel": "Create",
    "bsq.densityLabel": "Obstacles",
    "bsq.generate": "Generate",

    "radar.title": "Simulation compiled to WebAssembly",
    "radar.badge": "WebAssembly",
    "radar.intro":
      "The radar's own code runs here. Written in CSFML, it draws through a shim that redirects the graphics layer onto SDL2 — the one from R-Type and My RPG, extended for range circles and oriented boxes.",
    "radar.launch": "Run the simulation",
    "radar.hint":
      "Each aircraft follows the heading and speed given by the flight script; the red circles are tower ranges, the boxes the aircraft detection zones.",

    "sokoban.title": "Game compiled to WebAssembly",
    "sokoban.badge": "WebAssembly",
    "sokoban.intro":
      "The real game runs here. Its blocking loop around getch() was cut into one call per keypress: each arrow sends its ncurses code to the binary, which returns the screen it would have drawn in a terminal.",
    "sokoban.launch": "Start the game",
    "sokoban.mapLabel": "Map",
    "sokoban.restart": "Restart",
    "sokoban.keysLabel": "Arrows or WASD",
    "sokoban.moves": "Moves",
    "sokoban.won": "All crates stored",
    "sokoban.lost": "Crate stuck — start over",

    "pushswap.title": "Sort compiled to WebAssembly",
    "pushswap.badge": "WebAssembly",
    "pushswap.intro":
      "The C binary draws nothing: it takes the integers from argv and writes its sequence of operations to standard output. The demo replays that on the two stacks — what moves is the real sort, not a JavaScript rerun.",
    "pushswap.launch": "Run the sort",
    "pushswap.stackLabel": "Stack",
    "pushswap.createLabel": "Create",
    "pushswap.sizeLabel": "Size",
    "pushswap.generate": "Shuffle",
    "pushswap.opsLabel": "Operations",
    "pushswap.sorted": "stack sorted",
    "pushswap.already": "Stack already sorted: no operations",

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
