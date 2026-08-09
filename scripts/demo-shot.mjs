#!/usr/bin/env node
/**
 * demo-shot — capture la vignette d'une démo WebAssembly du portfolio.
 *
 *   node scripts/demo-shot.mjs <slug> <sortie.png> [--url=http://localhost:3000] [--theme=dark|light]
 *
 * Les projets C n'ont pas de captures d'écran d'époque : leur seule image
 * fidèle est la démo elle-même, qui tourne déjà dans le site. Plutôt que de
 * dessiner une vignette à la main — qui mentirait dès la première
 * modification de la démo — on joue le scénario et on photographie le
 * résultat. Refaire les vignettes est alors une commande, pas un travail.
 *
 * Le cadrage est calculé en 16/9 autour du panneau de démo, format des
 * cartes de projet. L'image sort ensuite par `npm run media:sync` comme
 * n'importe quel autre média.
 *
 * Prérequis :
 *   npm run dev            (dans un autre terminal)
 *   npx playwright install chromium
 */

import process from "node:process";

const argv = process.argv.slice(2);
const option = (name, fallback) => {
  const found = argv.find((a) => a.startsWith(`--${name}=`));
  return found ? found.slice(name.length + 3) : fallback;
};
const url = option("url", "http://localhost:3000");
const theme = option("theme", "dark");
const [slug, out] = argv.filter((a) => !a.startsWith("--"));

/**
 * Un scénario par démo : ce qu'il faut lancer pour que la vignette montre
 * le projet en train de faire son travail, plutôt qu'un écran d'accueil.
 */
const SCENARIOS = {
  dante: {
    card: "Dante",
    launch: "Lancer la résolution",
    async play(page) {
      await page.getByRole("button", { name: "Générer" }).click();
      await waitIdle(page, "Résolution en cours");
    },
  },
  bsq: {
    card: "BSQ",
    launch: "Chercher le plus grand carré",
    async play(page) {
      await page.getByRole("button", { name: "Générer" }).click();
      await page.waitForFunction(
        () => document.body.innerText.includes("Carré trouvé"),
        null,
        { timeout: 30_000 },
      );
      await page.waitForTimeout(400);
    },
  },
  navy: {
    card: "My navy",
    launch: "Lancer la partie",
    // Deux camps côte à côte : le cadre se prend sur la largeur. Le panneau
    // étant plus plat qu'un 16/9, la hauteur manquante est prise au-dessus,
    // sur le titre de la fiche, plutôt qu'en dessous où commence la page.
    frame: "width",
    async play(page) {
      // Quelques échanges pour que les deux grilles portent des touches et
      // que le journal des salves ne soit pas vide.
      const shots = [
        ["C1", 1],
        ["A1", 3],
        ["C2", 1],
        ["B1", 3],
        ["D4", 1],
      ];
      for (const [coord, board] of shots) {
        await page.locator(`[role=dialog] [aria-label='${coord}']`).nth(board).click();
        await page.waitForTimeout(500);
      }
    },
  },
  sokoban: {
    card: "Sokoban",
    launch: "Lancer la partie",
    // Le canevas occupe tout le panneau mais la carte est centrée dedans :
    // rogner depuis son bord gauche couperait la moitié de l'entrepôt.
    align: "center",
    async play(page) {
      // Une partie entamée : le joueur a quitté sa position de départ et
      // pousse une caisse. Les touches partent sur la fenêtre, comme
      // depuis un vrai clavier.
      for (const key of ["ArrowRight", "ArrowRight", "ArrowDown", "ArrowRight"]) {
        await page.keyboard.press(key);
        await page.waitForTimeout(250);
      }
      await page.waitForTimeout(400);
    },
  },
  pushswap: {
    card: "Push-swap",
    launch: "Lancer le tri",
    async play(page) {
      await page.getByRole("button", { name: /Inversé/ }).click();
      // Au milieu du tri : les deux piles portent des barres, ce que ni le
      // départ ni l'arrivée ne montrent.
      await page.waitForTimeout(5000);
    },
  },
  minishell: {
    card: "Minishell",
    launch: "Lancer le shell",
    async play(page) {
      const session = [
        "ls",
        "cat projets.txt | sort | head -n 3",
        "cat notes.txt | sort | uniq",
        "setenv PROJET minishell",
        "env | grep PROJET",
        "cd projets && ls",
      ];
      for (const line of session) {
        await page.getByPlaceholder("tape une commande…").fill(line);
        await page.keyboard.press("Enter");
        await page.waitForTimeout(1500);
      }
    },
  },
};

/** Attend que le texte d'activité (« Résolution en cours ») disparaisse. */
async function waitIdle(page, busyLabel) {
  await page.waitForFunction(
    (label) => !document.body.innerText.includes(label),
    busyLabel,
    { timeout: 60_000 },
  );
  await page.waitForTimeout(400);
}

const scenario = SCENARIOS[slug];
if (!slug || !out || !scenario) {
  console.error(
    `usage : node scripts/demo-shot.mjs <${Object.keys(SCENARIOS).join("|")}> <sortie.png> [--url=…] [--theme=dark|light]`,
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
  viewport: scenario.viewport ?? { width: 1600, height: 1000 },
  deviceScaleFactor: 2,
  colorScheme: theme === "light" ? "light" : "dark",
});

try {
  await page.goto(url, { waitUntil: "networkidle", timeout: 60_000 });
  await page.evaluate((mode) => {
    document.documentElement.classList.toggle("dark", mode === "dark");
    document.documentElement.classList.toggle("light", mode !== "dark");
  }, theme);
  await page.waitForTimeout(800);

  await page.click(`[aria-label^="${scenario.card} —"]`);
  await page.getByRole("button", { name: scenario.launch }).click();
  await scenario.play(page);

  // Cadrage 16/9 centré sur le panneau de démo : c'est le format des
  // cartes, et rogner soi-même vaut mieux que laisser le CSS trancher.
  // Le canevas quand il y en a un — il porte tout le sujet et laisse
  // moins de vide autour que le panneau, plus large que lui.
  const canvas = await page.locator("[role=dialog] canvas").first().boundingBox()
    .catch(() => null);
  const panel = await page
    .locator("[role=dialog] .rounded-lg.border")
    .first()
    .boundingBox();
  const target = canvas ?? panel;
  // Certaines démos sont plus larges que hautes (deux grilles côte à côte) :
  // le 16/9 se prend alors sur la largeur, sans quoi le cadrage couperait
  // la moitié du sujet.
  const viewportWidth = page.viewportSize().width;
  const height =
    scenario.frame === "width"
      ? (Math.min(viewportWidth, target.width) * 9) / 16
      : target.height;
  const width = Math.min(viewportWidth, (height * 16) / 9);
  // La hauteur manquante est prise au-dessus du panneau, sans jamais
  // déborder de la fiche : au-delà, c'est la page qui apparaîtrait.
  const dialog = await page.locator("[role=dialog]").first().boundingBox();
  const y =
    scenario.frame === "width"
      ? Math.max(dialog.y, target.y + target.height - height)
      : target.y;
  // Plus large que le cadre voulu (un terminal) : on garde son bord gauche,
  // c'est là qu'est le texte. Plus étroit (un canevas carré) : on centre et
  // le vide se répartit des deux côtés.
  const x =
    target.width >= width && scenario.align !== "center"
      ? target.x
      : Math.max(0, Math.min(viewportWidth - width, target.x + target.width / 2 - width / 2));
  const clip = { x, y, width, height };

  await page.screenshot({ path: out, clip });
  console.log(`capturé : ${slug} -> ${out}`);
} finally {
  await browser.close();
}
