# Portfolio — Axel Londas

Portfolio bilingue (FR/EN) à deux profils — **C/C++ & algorithmique** en
premier, **full-stack / DevOps** en second — construit pour tenir dans le
palier gratuit de Cloudflare malgré beaucoup de vidéos.

Next.js 16 · React 19 · Tailwind 4 · shadcn/ui · Motion · Cloudflare Workers · D1

## Démarrer

```bash
npm install
npm run dev
```

→ [localhost:3000](http://localhost:3000) (redirigé vers `/fr`).

`ffmpeg` est nécessaire pour le pipeline média :

```bash
brew install ffmpeg
```

## Ajouter les médias d'un projet

C'est le geste que tu répéteras le plus souvent.

```bash
mkdir -p media/projects/samplify
cp ~/Desktop/demo.mov media/projects/samplify/01-recherche-audio.mov
npm run media:sync
```

Le nom du dossier est le `slug` du projet (ou l'`id` d'une expérience). Le
préfixe numérique fixe l'ordre et disparaît de la légende.

**Rien ne devient public tout seul.** Chaque clé est déclarée dans
[`media/media.config.json`](media/media.config.json) :

| Visibilité | Sortie             | Déployé | Visible                      |
| ---------- | ------------------ | ------- | ---------------------------- |
| `public`   | `public/m/<clé>/`  | oui     | tout le monde                |
| `private`  | `.media-private/`  | **non** | toi seul, en `npm run dev`   |

Toute clé inconnue est créée en `private` et le script te le signale. Un
projet privé reste affiché sur le site : seuls ses médias sont remplacés par
« Démo non publiée ». Repasser une clé en `private` supprime les fichiers déjà
copiés dans `public/`.

Détails et options dans [`media/README.md`](media/README.md).

### Rafraîchir la capture d'un site en ligne

La vignette de Samplify est une capture de sa page d'accueil. Quand le site
change, on la refait :

```bash
npx playwright install chromium
node scripts/site-shot.mjs https://samplify.site/ media/projects/samplify/01-landing.png
npm run media:sync
```

### Vérifier ce qui part en production

```bash
npm run deploy:check
```

Affiche exactement ce que wrangler téléverserait. Les fichiers de
`.media-private/` n'y figurent pas.

## Le raytracer en direct

La fiche du projet Ray-Tracer n'affiche pas une capture : le moteur C++ y
tourne, compilé en WebAssembly. Il vit dans un sous-module :

```bash
git submodule update --init --recursive
```

Le sous-module suit sa branche `webassembly`, qui ajoute la cible Emscripten
sans toucher au moteur — détails dans
[`vendor/raytracer/wasm/README.md`](vendor/raytracer/wasm/README.md).

Le binaire compilé est versionné dans `public/wasm/`, donc **rien à installer
pour déployer**. Pour le régénérer après une modification du moteur :

```bash
source ~/emsdk/emsdk_env.sh
npm run wasm:build
```

Côté site, le calcul tourne dans un Web Worker et l'image remonte par
tranches de lignes : la page ne se fige jamais et le rendu s'affiche à mesure.
Rien n'est téléchargé — ni worker, ni les 260 Ko de moteur — tant que le
visiteur n'a pas cliqué sur « Lancer le rendu ».

Le sous-module est déclaré en HTTPS pour que le clone marche partout. Pour
pousser en SSH :

```bash
git config submodule.vendor/raytracer.url git@github.com:My-bro/raytracer-axel.londas.git
```

## Modifier le contenu

Tout le texte vit dans `src/content/`, en français et en anglais :

| Fichier         | Contenu                                                |
| --------------- | ------------------------------------------------------ |
| `site.ts`       | Nom, contact, accroche, langues, centres d'intérêt      |
| `projects.ts`   | Les cinq projets. `profiles` filtre, l'ordre du tableau range |
| `experience.ts` | Expériences professionnelles                            |
| `education.ts`  | Formations                                             |
| `skills.ts`     | Compétences, groupées et rattachées à un profil        |
| `i18n.ts`       | Libellés d'interface                                   |

`src/content/media.generated.ts` est produit par `media:sync` — ne pas
l'éditer.

Deux points laissés à compléter :

- `experience.ts` — le nom de l'entreprise de la mission DevOps (absent du CV).
- `site.ts` — `showPhone` est à `false`. Le numéro figure sur les CV PDF, mais
  un site public est moissonné par les robots à spam. Passe-le à `true` si tu
  veux l'afficher.

## Déployer sur Cloudflare

```bash
npx wrangler login
npm run deploy
```

`deploy` enchaîne `media:sync`, la construction OpenNext et le téléversement.
Les pages `/fr` et `/en` sont pré-rendues : elles sont servies depuis le CDN
sans réveiller le Worker. Seuls `/api/track` et `/admin` l'invoquent.

Les médias ne sont pas versionnés (voir `.gitignore`), donc le déploiement se
fait **depuis ta machine**. Pour déployer depuis un CI, retire `/public/m/` du
`.gitignore`.

## Metrics

Le site fonctionne sans. Pour les activer :

```bash
npx wrangler d1 create portfolio-metrics
```

Décommente le bloc `d1_databases` de [`wrangler.jsonc`](wrangler.jsonc), colle
l'identifiant, puis :

```bash
npm run db:migrate:local   # base locale, pour npm run dev
npm run db:migrate         # base de production
npx wrangler secret put METRICS_KEY
```

Le tableau de bord est sur `/admin`. Il classe les projets par nombre
d'ouvertures, indique combien de fois chacun a été le **premier** consulté
d'une visite, et son **rang moyen** dans le parcours — c'est ce qui dit
lesquels attirent en priorité. Répartitions par profil, langue, pays et
provenance en dessous.

Rien d'identifiant n'est enregistré : pas d'IP, pas de cookie, pas
d'empreinte. Le pays vient de l'en-tête ajouté par Cloudflare et le référent
est réduit à son nom de domaine. Aucun bandeau de consentement n'est requis.

## Choix techniques

**Vidéo.** Chaque source produit trois sorties : une affiche, une boucle de 6 s
muette en 720 px, et la version complète en 1280 px avec son. Au premier rendu
une carte ne charge que son affiche. La boucle n'arrive qu'après 120 ms de
survol soutenu, et seulement si la carte est proche du viewport ; quand le
curseur repart, l'élément est démonté et le décodeur libéré. La version
complète attend l'ouverture de la fiche. `prefers-reduced-motion` et le mode
économie de données coupent les aperçus.

**Profils.** Un script inline pose `data-profile` sur `<html>` avant peinture
et le CSS masque l'autre profil — un lien `?p=cpp` n'affiche jamais les cartes
web au chargement. React s'abonne ensuite à cet attribut plutôt que d'en tenir
une copie.

**Langues.** `/fr` et `/en` sont deux routes réellement pré-rendues :
indexables, partageables, et `<html lang>` correct pour les lecteurs d'écran.

**Couleurs.** Noir, gris et orange `#D23600`, en oklch. Le mode clair reprend
l'orange exactement (contraste 4,6:1 sur le fond papier) ; sur le noir il
tomberait à 4,1:1, alors le mode sombre l'éclaircit à la même teinte pour
repasser au-dessus. Les gris sont très légèrement chauds pour que l'orange ne
flotte pas sur un neutre froid, et le rouge d'erreur a été décalé vers le
carmin — à sa teinte d'origine il se confondait avec la couleur de marque.

**Positionnement.** Le profil C/C++ est celui par défaut : c'est lui que sert
le HTML statique, lui qui ouvre le sélecteur, et l'accroche annonce le bas
niveau avant le web. Le profil web reste à un clic, sous `?p=web`.

## Commandes

| Commande                | Effet                                            |
| ----------------------- | ------------------------------------------------ |
| `npm run dev`           | Serveur de développement                         |
| `npm run media:sync`    | Transcode et publie les médias                   |
| `npm run wasm:build`    | Recompile le raytracer en WebAssembly            |
| `npm run media:sync:force` | Réencode tout, sans cache                     |
| `npm run build`         | Construction Next                                |
| `npm run preview`       | Construit et sert le Worker en local             |
| `npm run deploy`        | Médias + construction + déploiement Cloudflare   |
| `npm run deploy:check`  | Montre ce qui serait téléversé, sans déployer    |
| `npm run lint`          | ESLint                                           |
| `npm run typecheck`     | TypeScript                                       |
