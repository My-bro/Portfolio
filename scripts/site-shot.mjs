#!/usr/bin/env node
/**
 * site-shot — capture la page d'accueil d'un site en ligne.
 *
 *   node scripts/site-shot.mjs <url> <sortie.png> [--scroll=<px>] [--click=<sélecteur>]
 *
 * Sert à produire la vignette des projets qui tournent en production et que
 * le portfolio ne peut pas rejouer : mieux vaut une capture fidèle et
 * refaisable qu'un visuel figé qu'on oublie de mettre à jour.
 *
 * L'image sort en 1600x900 — le format des cartes — et passe ensuite par
 * `npm run media:sync` comme n'importe quel média.
 *
 * `--scroll` descend la page avant de déclencher. Le haut d'une page
 * d'accueil est souvent une accroche et du vide ; ce qui montre le produit
 * — des pochettes d'album, une grille de résultats — commence en dessous de
 * la ligne de flottaison, et une vignette prise à zéro le coupe.
 *
 * `--click` clique un élément avant la capture — le bouton clair/sombre
 * d'un site qui en propose deux, pour prendre l'autre variante.
 *
 * Prérequis, à installer une fois :
 *   npx playwright install chromium
 */

import process from "node:process";

const argv = process.argv.slice(2);
const scrollArg = argv.find((a) => a.startsWith("--scroll="));
const scroll = scrollArg ? Number(scrollArg.slice("--scroll=".length)) : 0;
const clickArg = argv.find((a) => a.startsWith("--click="));
const click = clickArg ? clickArg.slice("--click=".length) : null;
const [url, out] = argv.filter((a) => !a.startsWith("--"));

if (!url || !out || Number.isNaN(scroll)) {
  console.error(
    "usage : node scripts/site-shot.mjs <url> <sortie.png> [--scroll=<px>] [--click=<sélecteur>]\n" +
      "exemple : node scripts/site-shot.mjs https://samplify.site/ media/projects/samplify/01-landing.png --scroll=300",
  );
  process.exit(1);
}

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.error(
    "playwright est introuvable. Installe-le puis relance :\n\n" +
      "  npm i -D playwright && npx playwright install chromium\n",
  );
  process.exit(1);
}

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1600, height: 900 },
  // Rendu en 2x : la vignette reste nette sur écran Retina.
  deviceScaleFactor: 2,
});

try {
  await page.goto(url, { waitUntil: "networkidle", timeout: 60_000 });
  // Laisse les polices et les animations d'entrée se poser.
  await page.waitForTimeout(2500);

  // Les widgets tiers — bulle de support, barre d'accessibilité, bandeau de
  // cookies — n'ont rien à faire sur une vignette de portfolio.
  await page.addStyleTag({
    content: `
      iframe[title*="eedback" i], iframe[id*="eedback" i],
      [class*="feedback" i], [id*="feedback" i],
      [class*="accessib" i], [id*="accessib" i],
      [class*="cookie" i], [id*="cookie" i],
      [aria-label*="feedback" i], [aria-label*="accessib" i] { display: none !important; }
    `,
  });

  // Dernier filet : tout ce qui flotte en bas à droite est un widget.
  await page.evaluate(() => {
    for (const el of document.body.querySelectorAll("*")) {
      const style = getComputedStyle(el);
      if (style.position !== "fixed") continue;
      const box = el.getBoundingClientRect();
      const nearCorner =
        box.bottom > window.innerHeight - 140 &&
        box.right > window.innerWidth - 320 &&
        box.width < 420;
      if (nearCorner) el.style.display = "none";
    }
  });

  if (click) {
    await page.click(click);
    // Laisse la transition claire/sombre (couleurs, parfois un fondu) se poser.
    await page.waitForTimeout(500);
  }

  if (scroll > 0) {
    await page.evaluate((y) => window.scrollTo(0, y), scroll);
    // Les entrées au défilement — apparitions, chargements différés — ont
    // besoin d'un instant, sans quoi on capture des trous.
    await page.waitForTimeout(1200);
  }

  await page.waitForTimeout(400);
  await page.screenshot({ path: out });
  console.log(`capturé : ${await page.title()} -> ${out}`);
} finally {
  await browser.close();
}
