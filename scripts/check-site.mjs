import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { load } from "cheerio";

const root = process.cwd(),
  dist = path.join(root, "dist");
const site = JSON.parse(fs.readFileSync("src/data/site.json", "utf8"));
const pages = JSON.parse(fs.readFileSync(".generated/manifest.json", "utf8"));
const errors = [],
  warnings = [];
let references = 0;
const outputFile = (url) =>
  path.join(dist, url.pathname.endsWith("/") ? url.pathname.slice(1) + "index.html" : url.pathname.slice(1));
const docs = new Map();
for (const page of pages) {
  const file = outputFile(new URL(page.canonical));
  if (!fs.existsSync(file)) {
    errors.push(`Missing page ${page.path}`);
    continue;
  }
  const source = fs.readFileSync(file, "utf8"),
    $ = load(source);
  docs.set(page.path, $);
  const assert = (condition, message) => {
    if (!condition) errors.push(`${page.path}: ${message}`);
  };
  assert($("html").attr("lang") === page.lang, "incorrect document language");
  assert($("h1").length === 1, "exactly one visible document heading is required");
  assert($("title").text() === page.title, "incorrect page title");
  assert($('meta[name="description"]').attr("content")?.length > 30, "missing useful description");
  assert($('link[rel="canonical"]').attr("href") === page.canonical, "incorrect canonical URL");
  assert($('link[rel="alternate"][hreflang]').length === 4, "missing locale alternates");
  assert(
    $('meta[name="robots"]')
      .attr("content")
      .includes(page.noindex ? "noindex" : "index"),
    "incorrect search rule",
  );
  assert(
    !/\{\{\w+\}\}|Content to be added|1,240|href="undefined"/.test(source),
    "unresolved placeholder or demonstration subscriber claim",
  );
  const ids = new Set();
  $("[id]").each((_, element) => {
    const id = $(element).attr("id");
    assert(!ids.has(id), `duplicate id ${id}`);
    ids.add(id);
  });
  $('script[type="application/ld+json"]').each((_, element) => {
    try {
      JSON.parse($(element).text());
    } catch {
      assert(false, "invalid structured data");
    }
  });
  $("a[href],link[href],script[src],img[src]").each((_, element) => {
    const value = $(element).attr("href") || $(element).attr("src");
    if (!value || /^(mailto:|tel:|data:)/.test(value)) return;
    let target;
    try {
      target = new URL(value, page.canonical);
    } catch {
      assert(false, `invalid URL ${value}`);
      return;
    }
    if (target.origin !== new URL(site.origin).origin) return;
    references++;
    const targetFile = outputFile(target);
    assert(fs.existsSync(targetFile), `broken internal file ${value}`);
    if (target.hash && fs.existsSync(targetFile) && targetFile.endsWith(".html")) {
      const targetDoc = load(fs.readFileSync(targetFile, "utf8"));
      assert(
        targetDoc("[id]")
          .toArray()
          .some((n) => targetDoc(n).attr("id") === decodeURIComponent(target.hash.slice(1))),
        `missing anchor ${value}`,
      );
    }
  });
  $("img[srcset]").each((_, element) => {
    for (const candidate of $(element).attr("srcset").split(",")) {
      const value = candidate.trim().split(/\s+/)[0];
      const target = new URL(value, page.canonical);
      if (target.origin === new URL(site.origin).origin) {
        references++;
        assert(fs.existsSync(outputFile(target)), `missing responsive image ${value}`);
      }
    }
  });
  $("a[data-language]").each((_, element) => {
    const language = $(element).attr("data-language");
    const sibling = pages.find((other) => other.lang === language && other.kind === page.kind);
    assert(
      $(element).attr("href") === sibling?.path,
      "locale navigation must preserve the selected page and requested language",
    );
  });
  $("form").each((_, element) => {
    assert($(element).attr("method") === "post", "form must not leak personal data in query strings");
    assert($(element).find('[name="email"]').length === 1, "form must contain a named reply address");
    assert($(element).find('[name="website"]').length === 1, "form needs its spam honeypot");
  });
  if (page.kind === "apps") {
    assert($('#subscribe-form [name="launchConsent"]').length === 1, "missing explicit release-news choice");
    assert(!$('#subscribe-form [name="launchConsent"]').attr("checked"), "release-news consent must start unchecked");
  }
  if (page.lang !== "en") {
    const leftover = [];
    $("main,footer")
      .find("*")
      .contents()
      .filter((_, n) => n.type === "text")
      .each((_, n) => {
        const text = n.data.replace(/\s+/g, " ").trim();
        if (
          text.length > 40 &&
          /[A-Za-z]{3}/.test(text) &&
          !/[А-Яа-яІіЇїЄєҐґ]/.test(text) &&
          !text.includes("support@") &&
          !text.includes("Varnenchik")
        )
          leftover.push(text);
      });
    if (leftover.length) warnings.push({ page: page.path, untranslatedCandidates: [...new Set(leftover)] });
  }
}
const files = fs.readdirSync(path.join(dist, "assets")).filter((name) => name.endsWith(".js") || name.endsWith(".css"));
const bundleBytes = files.map((name) => ({
  name,
  bytes: fs.statSync(path.join(dist, "assets", name)).size,
  gzip: zlib.gzipSync(fs.readFileSync(path.join(dist, "assets", name))).length,
}));
const result = { pages: pages.length, internalReferences: references, errors, warnings, bundles: bundleBytes };
fs.mkdirSync("Reports", { recursive: true });
fs.writeFileSync("Reports/site-check.json", JSON.stringify(result, null, 2) + "\n");
console.log(JSON.stringify(result, null, 2));
if (errors.length) process.exitCode = 1;
