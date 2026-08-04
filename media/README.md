# Médias des projets

Le dossier où tu déposes tes captures et tes vidéos. **Rien ici n'est servi
directement** : `npm run media:sync` transcode les fichiers et ne recopie dans
`public/` que ce que tu as explicitement marqué public.

## Déposer un média

```
media/projects/<clé>/
├── 01-recherche.mp4
├── 02-separation-pistes.mov
└── 03-dashboard.png
```

La `<clé>` est le `slug` du projet (`samplify`, `bazarbe`, `area`, `r-type`,
`ray-tracer`) ou l'`id` d'une expérience / formation (`sony-csl`, `epitech`…).
C'est ce qui relie le dossier à l'entrée correspondante du site.

Le préfixe numérique fixe l'ordre d'affichage et disparaît de la légende :
`02-separation-pistes.mov` s'affiche « Separation pistes ».

Puis :

```bash
npm run media:sync
```

## Public ou privé

Chaque clé est déclarée dans [`media.config.json`](media.config.json) :

```json
{
  "samplify": { "visibility": "public" },
  "sony-csl": { "visibility": "private" }
}
```

| Visibilité | Sortie             | Déployé | Visible                          |
| ---------- | ------------------ | ------- | -------------------------------- |
| `public`   | `public/m/<clé>/`  | oui     | tout le monde                    |
| `private`  | `.media-private/`  | non     | seulement toi, en `next dev`     |

**Toute nouvelle clé est créée en `private`.** Le script te le signale ; à toi
de basculer en `public` quand tu veux la diffuser. Un projet privé reste
affiché sur le site — seuls ses médias sont remplacés par « Démo non publiée ».

Repasser une clé de `public` à `private` supprime les fichiers déjà copiés
dans `public/m/` au `media:sync` suivant. Rien ne traîne.

## Ce que produit le script

Pour chaque vidéo :

| Fichier                  | Rôle                                                   |
| ------------------------ | ------------------------------------------------------ |
| `<nom>.poster.webp`      | Affiche fixe — seule chose chargée au premier rendu     |
| `<nom>.preview.mp4/webm` | Boucle de 6 s, muette, 720 px — au survol de la carte   |
| `<nom>.mp4/webm`         | Version complète 1280 px avec son — dans la fiche       |

Les images deviennent du WebP à 1600 px, les GIF sont convertis en vidéo
(souvent dix fois plus léger).

Le ré-encodage est incrémental : un fichier inchangé n'est pas retraité.
`--force` refait tout, `--no-webm` saute le VP9 (deux fois plus rapide, un peu
plus lourd à télécharger).

## Formats acceptés

`.mp4` `.mov` `.m4v` `.webm` `.mkv` `.avi` `.gif`
`.png` `.jpg` `.jpeg` `.webp` `.avif` `.heic`

## Prérequis

```bash
brew install ffmpeg
```

## Ce qui est versionné

Ni tes fichiers sources, ni les sorties : `media/projects/`, `public/m/` et
`.media-private/` sont dans le `.gitignore`. Le dépôt reste léger et les
vidéos ne polluent pas l'historique Git.

En contrepartie, le déploiement se fait depuis ta machine (`npm run deploy`)
après un `media:sync`. Si tu préfères déployer depuis un CI, retire
`public/m/` du `.gitignore` pour que les médias publics soient versionnés.
