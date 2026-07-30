/**
 * Flattens the Vite build into one self-contained HTML fragment: CSS and JS
 * inlined, woff2 faces embedded as data URIs, every other font format dropped.
 *
 * Used to host the app somewhere that allows no external requests at all.
 * Run after `npm run build:single`.
 */
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";

const DIST = "dist";
const OUT = process.argv[2] ?? "dist-single/rally.html";

/** Subsets we never need — English UI only. Dropping them saves ~90 kB. */
const UNUSED_SUBSETS = ["thai", "cyrillic", "greek", "vietnamese"];

const assetFile = (pattern) => {
  const hit = readdirSync(join(DIST, "assets")).find((f) => pattern.test(f));
  if (!hit) throw new Error(`no asset matching ${pattern}`);
  return join(DIST, "assets", hit);
};

let css = readFileSync(assetFile(/^index-.*\.css$/), "utf8");
const js = readFileSync(assetFile(/^index-.*\.js$/), "utf8");

// 1. Drop @font-face blocks for subsets this UI never renders.
const before = css.length;
css = css.replace(/@font-face\{[^}]*\}/g, (block) =>
  UNUSED_SUBSETS.some((s) => block.includes(`-${s}-`)) ? "" : block
);

// 2. Drop non-woff2 sources — every browser that can run this app reads woff2.
// (the .svg source carries a `#Phosphor` fragment, hence the optional suffix)
css = css.replace(
  /,?url\(\/assets\/[^)]*\.(woff|ttf|svg|eot)(#[^)]*)?\)format\("[^"]*"\)/g,
  ""
);

// 3. Inline the remaining woff2 files as data URIs.
const inlined = new Set();
css = css.replace(/url\(\/assets\/([^)]*\.woff2)\)/g, (_, name) => {
  inlined.add(name);
  const b64 = readFileSync(join(DIST, "assets", name)).toString("base64");
  return `url(data:font/woff2;base64,${b64})`;
});

if (/\/assets\//.test(css)) {
  throw new Error("CSS still references external assets: " + css.match(/\/assets\/[^)]*/g).slice(0, 5));
}

const html = `<title>Rally · Stock Combat System</title>
<style>
${css}
html, body { background: #05010d; }
#root { min-height: 100vh; }
</style>
<div id="root"></div>
<script type="module">
${js}
</script>
`;

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, html);

const kb = (n) => `${Math.round(n / 1024)} kB`;
console.log(`css ${kb(before)} -> ${kb(css.length)} (${inlined.size} faces inlined)`);
console.log(`wrote ${OUT} — ${kb(html.length)}`);
