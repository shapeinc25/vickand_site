import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "vite";

// Public address of the site, with a trailing slash. Used for canonical / Open Graph URLs and the sitemap.
// Set SITE_URL (and BASE_PATH for a GitHub Pages project site, e.g. "/vickand/") in the environment to override.
const SITE_URL = (process.env.SITE_URL || "https://vickand.com/").replace(/\/?$/, "/");
const BASE = process.env.BASE_PATH || "/";

// Every page of the site: [rollup entry name, html file, path in the sitemap (null = not listed)]
const PAGES = [
  ["apps", "index.html", ""],
  ["ux", "ux/index.html", "ux/"],
  ["terms", "terms/index.html", "terms/"],
  ["privacy", "privacy/index.html", "privacy/"],
  ["styleguide", "styleguide/index.html", null],
  ["notFound", "404.html", null],
];

const PARTIALS = resolve(__dirname, "src/partials");
const DEFAULTS = { robots: "index, follow" };
const INCLUDE = /<!--\s*@include\s+([\w.-]+)(\s+\{[\s\S]*?\})?\s*-->/g;

/* HTML partials: <!-- @include header.html {"toggleLabel": "…"} --> inserts src/partials/header.html,
   with {{name}} replaced by the given values, {{base}} (BASE_PATH) and {{siteUrl}}. */
function partials() {
  const globals = { base: BASE, siteUrl: SITE_URL };
  const fill = (html, vars, where) =>
    html.replace(/\{\{(\w+)\}\}/g, (_, name) => {
      if (!(name in vars)) throw new Error(`${where}: no value for {{${name}}}`);
      return vars[name];
    });
  return {
    name: "vickand-partials",
    transformIndexHtml: {
      order: "pre",
      handler(html, ctx) {
        const out = html.replace(INCLUDE, (_, file, json) => {
          const vars = { ...globals, ...DEFAULTS, ...(json ? JSON.parse(json) : {}) };
          return fill(readFileSync(resolve(PARTIALS, file), "utf8").trimEnd(), vars, file);
        });
        return fill(out, globals, ctx.filename);
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
        source: `User-agent: *\nDisallow: ${BASE}styleguide/\n\nSitemap: ${SITE_URL}sitemap.xml\n`,
      });
    },
  };
}

export default defineConfig({
  base: BASE,
  appType: "mpa", // unknown URLs get a 404 in dev / preview, as on the real host
  plugins: [partials(), seoFiles()],
  build: {
    assetsInlineLimit: 0, // keep every asset a separate, cacheable file
    rollupOptions: {
      input: Object.fromEntries(PAGES.map(([name, file]) => [name, resolve(__dirname, file)])),
    },
  },
});
