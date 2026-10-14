#!/usr/bin/env node
/**
 * demo-shot — capture la démo d'un projet telle que le site la joue.
 *
 *   node scripts/demo-shot.mjs <url> <projet> <bouton> <sortie.png> [--theme=dark|light] [--wait=<ms>]
 *
 * Les démos écrites en React dessinent sur un <canvas> avec les tokens
 * `--demo-*` du thème : leur vignette vieillit donc à chaque changement de
 * palette. Plutôt que de retoucher l'image, on rejoue la démo et on
 * photographie le canevas — ce qui montre la démo telle qu'elle est
 * aujourd'hui, et non telle qu'elle était le jour de la capture.
 *
 * `<projet>` est le nom affiché sur la carte (« Push-swap ») : c'est la
 * seule prise dont le script a besoin, parce que c'est le seul libellé que
 * voit l'utilisateur. `--target` vise un autre élément que le canevas, pour
 * les démos qui dessinent en DOM (My navy, minilibC).
 *
 * `--wait` règle le moment du déclenchement, et c'est tout l'enjeu : un tri
 * photographié trop tôt n'a rien trié, un labyrinthe trop tard est déjà
 * résolu depuis longtemps. La valeur dépend de la démo.
 *
 * La capture sort au rapport de la carte, en 2x — comme une capture d'écran
 * sur un écran Retina — puis passe par `npm run media:sync` comme n'importe
 * quel média.
 *
 * Prérequis, à installer une fois :
 *   npx playwright install chromium
 */

import process from "node:process";
import { chromium } from "playwright";

const argv = process.argv.slice(2);
const opt = (name, fallback) => {
  const hit = argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};
const theme = opt("theme", "dark");
// Le rapport des vignettes de cartes.
const RATIO = 16 / 9;
const wait = Number(opt("wait", 4000));
// Hauteur de fenêtre imposée : pour un canevas carré, on l'agrandit au
// lieu de chercher le 16/9, et c'est le recadrage qui s'en charge ensuite.
const height = Number(opt("height", 0));
const target = opt("target", "canvas");
const [url, project, out] = argv.filter((a) => !a.startsWith("--"));

if (!url || !project || !out || Number.isNaN(wait)) {
  console.error(
    "usage : node scripts/demo-shot.mjs <url> <projet> <sortie.png> [--theme=dark|light] [--wait=<ms>] [--height=<px>] [--target=<sélecteur>]\n" +
      'exemple : node scripts/demo-shot.mjs http://localhost:3000/fr "Push-swap" media/projects/push-swap/01-tri-en-cours.png --wait=5000',
  );
  process.exit(1);
}

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1280, height: 900 },
  deviceScaleFactor: 2,
});

// next-themes lit le thème avant la première peinture : le poser ici évite
// la bascule claire/sombre au chargement, qui se verrait sur la capture.
await page.addInitScript((value) => {
  try {
    localStorage.setItem("theme", value);
  } catch {}
}, theme);

await page.goto(url, { waitUntil: "networkidle" });

// Les cartes portent « <nom> — Ouvrir » en nom accessible, et la fiche
// s'ouvre dans une boîte de dialogue.
await page.getByRole("button", { name: new RegExp(`^${project} — `) }).click();
const dialog = page.getByRole("dialog");
await dialog.waitFor({ state: "visible" });

// Les démos légères démarrent seules ; les lourdes gardent leur écran de
// lancement, qu'il faut donc franchir quand il est là.
const launch = dialog.getByRole("button", { name: /^(Lancer|Chercher|Ex\u00e9cuter|Run|Start|Find)/ }).first();
if (await launch.count()) await launch.click();

const canvas = dialog.locator(target).first();
await canvas.waitFor({ state: "visible" });

/**
 * Les cartes affichent leurs médias en 16/9 et recadrent le reste : une
 * capture au mauvais rapport perdrait le haut et le bas de la scène. La
 * hauteur du canevas se déduisant de celle de la fenêtre, on ajuste la
 * seconde jusqu'à ce que la première tombe juste — deux passes suffisent,
 * la relation étant linéaire.
 */
let viewport = page.viewportSize();
if (height) {
  viewport = { ...viewport, height };
  await page.setViewportSize(viewport);
  await page.waitForTimeout(250);
}
for (let pass = 0; pass < (height ? 0 : 4); pass++) {
  const box = await canvas.boundingBox();
  const target = box.width / RATIO;
  if (Math.abs(box.height - target) < 2) break;
  viewport = { ...viewport, height: Math.round(viewport.height + target - box.height) };
  await page.setViewportSize(viewport);
  await page.waitForTimeout(250);
}

await page.waitForTimeout(wait);
await canvas.screenshot({ path: out });

const box = await canvas.boundingBox();
console.log(`  ${project.padEnd(12)} ${theme.padEnd(5)} ${out}  (${Math.round(box.width)}x${Math.round(box.height)} css)`);

await browser.close();
