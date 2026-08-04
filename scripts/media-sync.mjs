#!/usr/bin/env node
/**
 * media-sync — transcode les médias de projets et ne publie que ceux
 * explicitement marqués « public ».
 *
 *   media/projects/<clé>/*.{mp4,mov,gif,png,jpg,…}   ← tu déposes ici
 *        │
 *        ├─ visibility "public"  → public/m/<clé>/    (déployé)
 *        └─ visibility "private" → .media-private/<clé>/ (jamais déployé,
 *                                   servi seulement en `next dev`)
 *
 * Toute nouvelle clé est créée en « private » : rien ne devient public par
 * accident. Bascule-la dans media/media.config.json quand tu es prêt.
 *
 * Chaque vidéo produit deux variantes :
 *   • <nom>.preview.{webm,mp4}  court, muet, léger → aperçu dans la carte
 *   • <nom>.{webm,mp4}          complet, avec son → lecture dans la fiche
 * plus une affiche <nom>.poster.webp (ou .jpg selon ffmpeg), pour ne jamais
 * charger de vidéo avant que l'utilisateur ne le demande.
 *
 * Usage :
 *   node scripts/media-sync.mjs [--force] [--no-webm] [--quiet]
 */

import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const ROOT = path.resolve(import.meta.dirname, "..");
const MEDIA_DIR = path.join(ROOT, "media", "projects");
const CONFIG_PATH = path.join(ROOT, "media", "media.config.json");
const PUBLIC_OUT = path.join(ROOT, "public", "m");
const PRIVATE_OUT = path.join(ROOT, ".media-private");
const CACHE_PATH = path.join(ROOT, ".media-private", ".cache.json");
const MANIFEST_PATH = path.join(ROOT, "src", "content", "media.generated.ts");

const VIDEO_EXT = new Set([".mp4", ".mov", ".m4v", ".webm", ".mkv", ".avi", ".gif"]);
const IMAGE_EXT = new Set([".png", ".jpg", ".jpeg", ".webp", ".avif", ".heic"]);

/** Limite d'un fichier servi par Cloudflare Workers Assets. */
const CF_ASSET_LIMIT = 25 * 1024 * 1024;

const args = new Set(process.argv.slice(2));
const FORCE = args.has("--force");
const WEBM = !args.has("--no-webm");
const QUIET = args.has("--quiet");

const c = {
  dim: (s) => `[2m${s}[0m`,
  green: (s) => `[32m${s}[0m`,
  yellow: (s) => `[33m${s}[0m`,
  red: (s) => `[31m${s}[0m`,
  bold: (s) => `[1m${s}[0m`,
};

const log = (...a) => !QUIET && console.log(...a);

// ---------------------------------------------------------------- utils

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

function run(cmd, cmdArgs) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, cmdArgs, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => (stdout += d));
    child.stderr.on("data", (d) => (stderr += d));
    child.on("error", reject);
    child.on("close", (code) =>
      code === 0
        ? resolve(stdout)
        : reject(new Error(`${cmd} a échoué (${code})\n${stderr.slice(-1500)}`)),
    );
  });
}

async function hasBinary(bin) {
  try {
    await run(bin, ["-version"]);
    return true;
  } catch {
    return false;
  }
}

/**
 * Toutes les compilations de ffmpeg n'embarquent pas libwebp. On préfère le
 * WebP quand il est là, sinon on retombe sur du JPEG : un peu plus lourd,
 * mais lisible partout et surtout disponible partout.
 */
const WEBP = {
  ext: "webp",
  type: "image/webp",
  posterArgs: ["-c:v", "libwebp", "-quality", "76"],
  imageArgs: ["-c:v", "libwebp", "-quality", "82"],
};

const JPEG = {
  ext: "jpg",
  type: "image/jpeg",
  posterArgs: ["-c:v", "mjpeg", "-q:v", "5"],
  imageArgs: ["-c:v", "mjpeg", "-q:v", "3"],
};

/** Résolu au démarrage par `detectImageFormat()`. */
let IMAGE = WEBP;

async function detectImageFormat() {
  try {
    const encoders = await run("ffmpeg", ["-hide_banner", "-encoders"]);
    IMAGE = /\blibwebp\b/.test(encoders) ? WEBP : JPEG;
  } catch {
    IMAGE = JPEG;
  }
  return IMAGE;
}

/** `01-recherche-audio.mp4` → `Recherche audio` */
function labelFromFilename(file) {
  const stem = path.basename(file, path.extname(file));
  const cleaned = stem.replace(/^\d+[-_. ]+/, "").replace(/[-_]+/g, " ").trim();
  if (!cleaned) return "";
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function slugifyStem(file) {
  return path
    .basename(file, path.extname(file))
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "media";
}

async function probe(file) {
  const out = await run("ffprobe", [
    "-v", "error",
    "-select_streams", "v:0",
    "-show_entries", "stream=width,height:format=duration",
    "-of", "json",
    file,
  ]);
  const parsed = JSON.parse(out);
  const stream = parsed.streams?.[0] ?? {};
  const duration = Number.parseFloat(parsed.format?.duration ?? "");
  return {
    width: stream.width ?? 0,
    height: stream.height ?? 0,
    duration: Number.isFinite(duration) ? Math.round(duration * 100) / 100 : null,
  };
}

async function hasAudioStream(file) {
  const out = await run("ffprobe", [
    "-v", "error",
    "-select_streams", "a",
    "-show_entries", "stream=index",
    "-of", "csv=p=0",
    file,
  ]);
  return out.trim().length > 0;
}

/** Empreinte source (taille + mtime + réglages) pour sauter le ré-encodage. */
async function fingerprint(file) {
  const st = await fs.stat(file);
  return createHash("sha1")
    .update(`${st.size}:${Math.round(st.mtimeMs)}:webm=${WEBM}:img=${IMAGE.ext}:v4`)
    .digest("hex")
    .slice(0, 16);
}

// ------------------------------------------------------------ transcode

/** Largeur paire imposée : les encodeurs yuv420p refusent l'impair. */
const scaleTo = (w) => `scale='min(${w},iw)':-2:flags=lanczos`;

async function encodeMp4(input, output, { width, crf, audio }) {
  await run("ffmpeg", [
    "-y", "-loglevel", "error",
    "-i", input,
    "-vf", scaleTo(width),
    "-c:v", "libx264",
    "-profile:v", "high",
    "-preset", "slow",
    "-crf", String(crf),
    "-pix_fmt", "yuv420p",
    // Place l'index en tête : la lecture démarre sans charger tout le fichier.
    "-movflags", "+faststart",
    ...(audio ? ["-c:a", "aac", "-b:a", "128k"] : ["-an"]),
    output,
  ]);
}

async function encodeWebm(input, output, { width, crf, audio }) {
  await run("ffmpeg", [
    "-y", "-loglevel", "error",
    "-i", input,
    "-vf", scaleTo(width),
    "-c:v", "libvpx-vp9",
    "-crf", String(crf),
    "-b:v", "0",
    "-row-mt", "1",
    "-deadline", "good",
    "-cpu-used", "3",
    ...(audio ? ["-c:a", "libopus", "-b:a", "96k"] : ["-an"]),
    output,
  ]);
}

async function encodePoster(input, output, { width, at }) {
  await run("ffmpeg", [
    "-y", "-loglevel", "error",
    // -ss avant -i : recherche rapide sur l'image-clé la plus proche.
    "-ss", String(at),
    "-i", input,
    "-frames:v", "1",
    "-vf", scaleTo(width),
    ...IMAGE.posterArgs,
    output,
  ]);
}

async function encodeImage(input, output, { width }) {
  await run("ffmpeg", [
    "-y", "-loglevel", "error",
    "-i", input,
    "-vf", scaleTo(width),
    ...IMAGE.imageArgs,
    output,
  ]);
}

// ----------------------------------------------------------------- main

async function loadConfig() {
  if (!(await exists(CONFIG_PATH))) {
    await fs.mkdir(path.dirname(CONFIG_PATH), { recursive: true });
    await fs.writeFile(CONFIG_PATH, "{}\n");
    return {};
  }
  const raw = await fs.readFile(CONFIG_PATH, "utf8");
  try {
    return JSON.parse(raw || "{}");
  } catch (err) {
    throw new Error(`media/media.config.json est illisible : ${err.message}`);
  }
}

async function loadCache() {
  if (FORCE || !(await exists(CACHE_PATH))) return {};
  try {
    return JSON.parse(await fs.readFile(CACHE_PATH, "utf8"));
  } catch {
    return {};
  }
}

async function listKeys() {
  if (!(await exists(MEDIA_DIR))) return [];
  const entries = await fs.readdir(MEDIA_DIR, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory() && !e.name.startsWith("."))
    .map((e) => e.name)
    .sort();
}

async function listSources(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && !e.name.startsWith("."))
    .map((e) => e.name)
    .filter((n) => {
      const ext = path.extname(n).toLowerCase();
      return VIDEO_EXT.has(ext) || IMAGE_EXT.has(ext);
    })
    .sort((a, b) => a.localeCompare(b, "fr", { numeric: true }));
}

async function processVideo(input, outDir, stem, cache, cacheKey) {
  const meta = await probe(input);
  const audio = await hasAudioStream(input);
  const isGif = path.extname(input).toLowerCase() === ".gif";
  const duration = meta.duration;

  const fp = await fingerprint(input);
  const cached = cache[cacheKey];
  const outputs = {
    poster: `${stem}.poster.${IMAGE.ext}`,
    previewMp4: `${stem}.preview.mp4`,
    previewWebm: WEBM ? `${stem}.preview.webm` : null,
    fullMp4: `${stem}.mp4`,
    fullWebm: WEBM ? `${stem}.webm` : null,
  };

  const allPresent = (
    await Promise.all(
      Object.values(outputs)
        .filter(Boolean)
        .map((f) => exists(path.join(outDir, f))),
    )
  ).every(Boolean);

  if (cached?.fp === fp && allPresent) {
    return { ...cached.item, cached: true };
  }

  // Affiche : 1 s après le début, ou 15 % pour les plans très courts.
  const posterAt = duration && duration < 3 ? duration * 0.15 : 1;
  await encodePoster(input, path.join(outDir, outputs.poster), {
    width: 1280,
    at: posterAt,
  });

  // Aperçu : 6 s muettes, 720 px — ce qui se charge au survol d'une carte.
  const previewInput = input;
  const trimArgs = duration && duration > 6 ? ["-t", "6"] : [];
  await run("ffmpeg", [
    "-y", "-loglevel", "error",
    "-i", previewInput,
    ...trimArgs,
    "-vf", scaleTo(720),
    "-c:v", "libx264", "-profile:v", "high", "-preset", "slow",
    "-crf", "30", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an",
    path.join(outDir, outputs.previewMp4),
  ]);
  if (outputs.previewWebm) {
    await run("ffmpeg", [
      "-y", "-loglevel", "error",
      "-i", previewInput,
      ...trimArgs,
      "-vf", scaleTo(720),
      "-c:v", "libvpx-vp9", "-crf", "40", "-b:v", "0",
      "-row-mt", "1", "-deadline", "good", "-cpu-used", "4", "-an",
      path.join(outDir, outputs.previewWebm),
    ]);
  }

  // Version complète : 1280 px, son conservé (le lecteur démarre muet).
  const keepAudio = audio && !isGif;
  await encodeMp4(input, path.join(outDir, outputs.fullMp4), {
    width: 1280,
    crf: 24,
    audio: keepAudio,
  });
  if (outputs.fullWebm) {
    await encodeWebm(input, path.join(outDir, outputs.fullWebm), {
      width: 1280,
      crf: 34,
      audio: keepAudio,
    });
  }

  const item = {
    kind: "video",
    label: labelFromFilename(input),
    poster: outputs.poster,
    preview: [
      ...(outputs.previewWebm
        ? [{ file: outputs.previewWebm, type: "video/webm" }]
        : []),
      { file: outputs.previewMp4, type: "video/mp4" },
    ],
    sources: [
      ...(outputs.fullWebm ? [{ file: outputs.fullWebm, type: "video/webm" }] : []),
      { file: outputs.fullMp4, type: "video/mp4" },
    ],
    width: meta.width || 1280,
    height: meta.height || 720,
    duration,
    hasAudio: keepAudio,
  };

  cache[cacheKey] = { fp, item };
  return item;
}

async function processImage(input, outDir, stem, cache, cacheKey) {
  const fp = await fingerprint(input);
  const out = `${stem}.${IMAGE.ext}`;
  const cached = cache[cacheKey];

  if (cached?.fp === fp && (await exists(path.join(outDir, out)))) {
    return { ...cached.item, cached: true };
  }

  await encodeImage(input, path.join(outDir, out), { width: 1600 });
  const meta = await probe(input);

  const item = {
    kind: "image",
    label: labelFromFilename(input),
    poster: out,
    preview: [],
    sources: [{ file: out, type: IMAGE.type }],
    width: meta.width || 1600,
    height: meta.height || 900,
    duration: null,
    hasAudio: false,
  };

  cache[cacheKey] = { fp, item };
  return item;
}

function serialiseManifest(manifest) {
  const body = JSON.stringify(manifest, null, 2);
  return `// Généré par \`npm run media:sync\` — ne pas éditer à la main.
// La visibilité se règle dans media/media.config.json.
import type { GeneratedMedia } from "@/lib/media-types";

export const generatedMedia = ${body} as const satisfies GeneratedMedia;
`;
}

async function main() {
  if (!(await hasBinary("ffmpeg")) || !(await hasBinary("ffprobe"))) {
    console.error(
      c.red("ffmpeg / ffprobe introuvables.") +
        "\nInstalle-les puis relance :\n\n  brew install ffmpeg\n",
    );
    process.exit(1);
  }

  await detectImageFormat();
  if (IMAGE === JPEG) {
    log(
      c.dim(
        "ffmpeg sans libwebp : les affiches seront en JPEG. " +
          "`brew install ffmpeg` fournit généralement le WebP, plus léger.",
      ),
    );
  }

  const config = await loadConfig();
  const cache = await loadCache();
  const keys = await listKeys();

  await fs.mkdir(PUBLIC_OUT, { recursive: true });
  await fs.mkdir(PRIVATE_OUT, { recursive: true });

  if (keys.length === 0) {
    log(
      c.yellow("Aucun dossier dans media/projects/."),
      "\nCrée par exemple media/projects/samplify/ et dépose-y tes vidéos.",
    );
  }

  // Nouvelles clés : privées par défaut, pour ne rien publier par accident.
  const added = [];
  for (const key of keys) {
    if (!config[key]) {
      config[key] = { visibility: "private" };
      added.push(key);
    }
  }

  const manifest = {};
  let published = 0;
  let withheld = 0;
  const oversized = [];

  for (const key of keys) {
    const visibility =
      config[key].visibility === "public" ? "public" : "private";
    const srcDir = path.join(MEDIA_DIR, key);
    const outDir = path.join(
      visibility === "public" ? PUBLIC_OUT : PRIVATE_OUT,
      key,
    );

    // Une clé repassée en privé ne doit rien laisser derrière elle.
    const strandedDir = path.join(
      visibility === "public" ? PRIVATE_OUT : PUBLIC_OUT,
      key,
    );
    if (await exists(strandedDir)) {
      await fs.rm(strandedDir, { recursive: true, force: true });
      log(c.dim(`  nettoyé ${path.relative(ROOT, strandedDir)}`));
    }

    await fs.mkdir(outDir, { recursive: true });
    const sources = await listSources(srcDir);

    if (sources.length === 0) {
      manifest[key] = { visibility, items: [] };
      continue;
    }

    log(
      `${c.bold(key)} ${c.dim(`(${visibility})`)} — ${sources.length} fichier(s)`,
    );

    const items = [];
    const usedStems = new Set();

    for (const name of sources) {
      const input = path.join(srcDir, name);
      let stem = slugifyStem(name);
      while (usedStems.has(stem)) stem = `${stem}-1`;
      usedStems.add(stem);

      const ext = path.extname(name).toLowerCase();
      const cacheKey = `${key}/${name}:${visibility}`;

      try {
        const item = VIDEO_EXT.has(ext)
          ? await processVideo(input, outDir, stem, cache, cacheKey)
          : await processImage(input, outDir, stem, cache, cacheKey);

        const { cached, ...clean } = item;
        items.push(clean);
        log(`  ${cached ? c.dim("=") : c.green("+")} ${name}`);
      } catch (err) {
        console.error(`  ${c.red("×")} ${name} — ${err.message}`);
      }
    }

    // Fichiers de sortie orphelins (source renommée ou supprimée).
    const expected = new Set(
      items.flatMap((i) => [
        i.poster,
        ...i.preview.map((p) => p.file),
        ...i.sources.map((s) => s.file),
      ]),
    );
    for (const f of await fs.readdir(outDir)) {
      if (!expected.has(f)) {
        await fs.rm(path.join(outDir, f), { force: true });
        log(c.dim(`  supprimé ${f}`));
      }
    }

    if (visibility === "public") {
      for (const f of expected) {
        const st = await fs.stat(path.join(outDir, f)).catch(() => null);
        if (st && st.size > CF_ASSET_LIMIT) {
          oversized.push(`${key}/${f} (${(st.size / 1e6).toFixed(1)} Mo)`);
        }
      }
      published += items.length;
    } else {
      withheld += items.length;
    }

    manifest[key] = { visibility, items };
  }

  // Dossiers publiés dont la source a disparu.
  for (const dir of [PUBLIC_OUT, PRIVATE_OUT]) {
    for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
      if (!entry.isDirectory() || keys.includes(entry.name)) continue;
      await fs.rm(path.join(dir, entry.name), { recursive: true, force: true });
      log(c.dim(`nettoyé ${path.relative(ROOT, path.join(dir, entry.name))}`));
    }
  }

  await fs.writeFile(CONFIG_PATH, `${JSON.stringify(config, null, 2)}\n`);
  await fs.writeFile(CACHE_PATH, JSON.stringify(cache));
  await fs.writeFile(MANIFEST_PATH, serialiseManifest(manifest));

  log("");
  log(
    `${c.green(`${published} média(s) publié(s)`)} dans public/m/ · ` +
      `${withheld} gardé(s) en privé dans .media-private/`,
  );

  if (added.length > 0) {
    log(
      `\n${c.yellow("Nouveau(x) dossier(s) détecté(s) :")} ${added.join(", ")}` +
        `\nIls sont ${c.bold("privés")} par défaut. Pour en publier un, passe-le à` +
        ` "public" dans media/media.config.json puis relance la commande.`,
    );
  }

  if (oversized.length > 0) {
    log(
      `\n${c.yellow("Au-delà de la limite de 25 Mo par fichier de Cloudflare :")}\n  ` +
        oversized.join("\n  ") +
        `\nRaccourcis la vidéo source, ou baisse la résolution.`,
    );
  }
}

main().catch((err) => {
  console.error(c.red(`\nmedia-sync : ${err.message}`));
  process.exit(1);
});
