import { readFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { defineConfig } from "vite";

// Public address of the site, with a trailing slash. Used for canonical / Open Graph URLs and the sitemap.
// Set SITE_URL (and BASE_PATH for a GitHub Pages project site, e.g. "/vickand/") in the environment to override.
const SITE_URL = (process.env.SITE_URL || "https://vickand.com/").replace(/\/?$/, "/");
const BASE = process.env.BASE_PATH || "/";

// Every page of the site: [rollup entry name, html file, path in the sitemap (null = not listed)]
const PAGES = [
  ["apps", "index.html", ""],
  ["ux", "ux/index.html", "ux/"],
  // Terms and Privacy are placeholders for now: noindex and out of the sitemap. When the real text is in,
  // give them their sitemap path back ("terms/", "privacy/") and drop "robots" from their head include.
  ["terms", "terms/index.html", null],
  ["privacy", "privacy/index.html", null],
  ["styleguide", "styleguide/index.html", null],
  ["notFound", "404.html", null],
];

const ROOT = resolve(__dirname, "src/pages"); // the HTML pages; URLs mirror this folder
const PARTIALS = resolve(__dirname, "src/partials");
const DEFAULTS = { robots: "index, follow" };
const INCLUDE = /<!--\s*@include\s+([\w./-]+)(\s+\{[\s\S]*?\})?\s*-->/g;

/* HTML partials: <!-- @include header.html {"toggleLabel": "…"} --> inserts src/partials/header.html,
   with {{name}} replaced by the given values (or the partial's own <!-- @defaults {…} -->), {{base}} (BASE_PATH)
   and {{siteUrl}}. Partials can include partials.
   src="@/…", href="@/…" and srcset="@/… 1x, @/… 2x" point into src/ from any page (rewritten to a path Vite can serve and bundle). */
function partials() {
  const globals = { base: BASE, siteUrl: SITE_URL };
  const fill = (html, vars, where) =>
    html.replace(/\{\{(\w+)\}\}/g, (_, name) => {
      if (!(name in vars)) throw new Error(`${where}: no value for {{${name}}}`);
      return vars[name];
    });
  const include = (html, where, depth = 0) =>
    html.replace(INCLUDE, (_, file, json) => {
      if (depth > 5) throw new Error(`${where}: partials nested too deep`);
      let part = readFileSync(resolve(PARTIALS, file), "utf8").trimEnd();
      let own = {}; // a partial may start with <!-- @defaults {"name": "value"} -->
      part = part.replace(/^<!--\s*@defaults\s+(\{[\s\S]*?\})\s*-->\s*/, (m, d) => ((own = JSON.parse(d)), ""));
      const vars = { ...globals, ...DEFAULTS, ...own, ...(json ? JSON.parse(json) : {}) };
      part = fill(part, vars, file);
      return include(part, file, depth + 1);
    });
  return {
    name: "vickand-partials",
    transformIndexHtml: {
      order: "pre",
      handler(html, ctx) {
        const out = include(html, ctx.filename);
        const srcDir = resolve(__dirname, "src");
        const src = ctx.server // dev server serves files outside the root under /@fs/
          ? `/@fs${srcDir}`
          : relative(dirname(ctx.filename), srcDir).split("\\").join("/");
        return fill(out, globals, ctx.filename).replace(
          /\b(src|href|srcset)="([^"]*)"/g,
          (m, attr, value) => `${attr}="${value.replace(/(^|,\s*)@\//g, `$1${src}/`)}"`,
        );
      },
    },
    handleHotUpdate({ file, server }) {
      if (file.startsWith(PARTIALS)) server.ws.send({ type: "full-reload" });
    },
  };
}

// sitemap.xml and robots.txt, generated at build time from PAGES and SITE_URL
function seoFiles() {
  return {
    name: "vickand-seo-files",
    apply: "build",
    generateBundle() {
      const today = new Date().toISOString().slice(0, 10);
      const urls = PAGES.filter(([, , path]) => path !== null)
        .map(([, , path]) => `  <url><loc>${SITE_URL}${path}</loc><lastmod>${today}</lastmod></url>`)
        .join("\n");
      this.emitFile({
        type: "asset",
        fileName: "sitemap.xml",
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
      });
      this.emitFile({
        type: "asset",
        fileName: "robots.txt",
        source: `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}sitemap.xml\n`, // pages to keep out of search use <meta name="robots" content="noindex">
      });
    },
  };
}

export default defineConfig({
  root: ROOT,
  base: BASE,
  publicDir: resolve(__dirname, "public"),
  envDir: __dirname,
  appType: "mpa", // unknown URLs get a 404 in dev / preview, as on the real host
  resolve: {
    alias: { "@": resolve(__dirname, "src") }, // "@/assets/…", "@/scripts/…" from any page or module
  },
  plugins: [partials(), seoFiles()],
  build: {
    outDir: resolve(__dirname, "dist"),
    emptyOutDir: true,
    assetsInlineLimit: 0, // keep every asset a separate, cacheable file
    rollupOptions: {
      input: Object.fromEntries(PAGES.map(([name, file]) => [name, resolve(ROOT, file)])),
    },
  },
});
