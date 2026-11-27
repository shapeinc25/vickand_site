import fs from "node:fs";
import path from "node:path";
import { load } from "cheerio";

export const languages = ["en", "ru", "uk"];
export const routeFor = (route, language) => `/${language === "en" ? "" : `${language}/`}${route ? `${route}/` : ""}`;
const html = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
const normalize = (value) => value.replace(/[‘’]/g, "'").replace(/\s+/g, " ").trim();

export function generatePages(root, { development = false } = {}) {
  const json = (filename) => JSON.parse(fs.readFileSync(path.join(root, filename), "utf8"));
  const site = json("src/data/site.json");
  const dictionaries = json("src/data/translations.json");
  const additions = json("src/data/interface-copy.json");
  const legal = json("src/data/legal.json");
  const pages = [
    { route: "", template: "index.html", kind: "apps" },
    { route: "ux", template: "ux/index.html", kind: "ux" },
    { route: "privacy", template: "document.html", kind: "privacy" },
    { route: "terms", template: "document.html", kind: "terms" },
    { route: "support", template: "support.html", kind: "support" },
    { route: "email-preferences", template: "email-preferences.html", kind: "email-preferences", noindex: true },
    { route: "404", template: "not-found.html", kind: "not-found", noindex: true },
  ];
  if (!site.publisher.name || !site.publisher.postalAddress || !site.publisher.email)
    throw new Error("Publisher details are required.");
  const origin = new URL(site.origin).origin;
  const outputRoot = path.join(root, development ? ".generated/dev" : ".generated/pages");
  fs.mkdirSync(outputRoot, { recursive: true });
  const inputs = [],
    sitemap = [],
    manifest = [];
  const substitute = (source, vars) =>
    source.replace(/\{\{(\w+)\}\}/g, (_, name) => {
      if (!(name in vars)) throw new Error(`Unknown template variable ${name}`);
      return vars[name];
    });
  const include = (source, vars, depth = 0) => {
    if (depth > 8) throw new Error("Partial nesting exceeds the allowed depth.");
    return source.replace(/<!--\s*@include\s+([\w./-]+)\s*-->/g, (_, filename) =>
      include(fs.readFileSync(path.join(root, "src/partials", filename), "utf8"), vars, depth + 1),
    );
  };
  for (const lang of languages)
    for (const page of pages) {
      const replacements = {
        publisherName: site.publisher.name,
        publisherAddress: site.publisher.postalAddress,
        supportEmail: site.publisher.email,
      };
      const expand = (value) => value.replace(/\{\{(\w+)\}\}/g, (_, name) => replacements[name] ?? "");
      const dictionary = Object.fromEntries(
        Object.entries({ ...dictionaries[lang], ...additions[lang] }).map(([key, value]) => [
          expand(key),
          expand(value),
        ]),
      );
      const t = (value) => dictionary[value] ?? dictionary[normalize(value)] ?? value;
      const localized = (key, fallback) => site.copy?.[lang]?.[key] || fallback;
      const canonical = origin + routeFor(page.route, lang);
      const title = localized(
        `${page.kind}Title`,
        page.kind === "apps"
          ? "Vickand — Apps, games & thoughtful design"
          : page.kind === "ux"
            ? "UX & design for apps and games — Vickand"
            : `${t({ privacy: "Website Privacy Policy", terms: "Website Terms of Use", support: "Support", "email-preferences": "Email preferences", "not-found": "Page not found" }[page.kind])} — Vickand`,
      );
      const description = localized(
        `${page.kind}Description`,
        page.kind === "apps"
          ? "Explore Shape Mania, DayDraft, Flying Ladders and Kinetwo. Independent apps, games and thoughtful product design from Vickand."
          : page.kind === "ux"
            ? "UX audits, clearer user flows, UI design and brand systems for apps and games. Free initial scoping, with a fixed scope and price agreed before paid work."
            : t("Find the information you need and contact Vickand."),
      );
      const vars = {
        lang,
        theme: page.kind === "ux" ? "dark" : "light",
        page: page.kind,
        title: html(title),
        description: html(description),
        canonical: html(canonical),
        origin,
        locale: { en: "en_US", ru: "ru_RU", uk: "uk_UA" }[lang],
        robots: page.noindex ? "noindex,follow" : "index,follow",
        homeUrl: routeFor("", lang),
        uxUrl: routeFor("ux", lang),
        alternateUrl: routeFor(page.kind === "ux" ? "" : "ux", lang),
        toggleLabel: html(t(page.kind === "ux" ? "Go to Apps & Games" : "Go to UX & Design")),
        publisherName: html(site.publisher.name),
        publisherAddress: html(site.publisher.postalAddress),
        supportEmail: html(site.publisher.email),
        image: `${origin}/og-image${lang === "ru" ? "-ru" : lang === "uk" ? "-ua" : ""}.jpg`,
        alternates:
          languages
            .map((l) => `<link rel="alternate" hreflang="${l}" href="${origin}${routeFor(page.route, l)}">`)
            .join("\n") + `\n<link rel="alternate" hreflang="x-default" href="${origin}${routeFor(page.route, "en")}">`,
        schema: JSON.stringify({
          "@context": "https://schema.org",
          "@type":
            page.kind === "apps"
              ? "CollectionPage"
              : page.kind === "ux"
                ? "WebPage"
                : page.kind === "support"
                  ? "ContactPage"
                  : "WebPage",
          "@id": canonical + "#page",
          url: canonical,
          name: title,
          description,
          inLanguage: lang,
          isPartOf: { "@type": "WebSite", name: "Vickand", url: origin + "/" },
          ...(page.kind === "ux"
            ? {
                mainEntity: {
                  "@type": "Service",
                  name: "UX & design for apps and games",
                  provider: { "@type": "Person", name: site.publisher.name },
                  areaServed: "Online",
                },
              }
            : {}),
        }).replace(/</g, "\\u003c"),
        documentContent: "",
        documentTitle: "",
        documentIntro: "",
        documentToc: "",
      };
      if (page.kind === "privacy" || page.kind === "terms") {
        const document = legal.locales[lang][page.kind];
        const replacements = {
          publisherName: site.publisher.name,
          publisherAddress: site.publisher.postalAddress,
          supportEmail: site.publisher.email,
        };
        const text = (value) => substitute(value, replacements);
        vars.documentTitle = html(text(document.title));
        vars.documentIntro = html(localized("legalUpdated", `Last updated: 27 November 2026`));
        vars.documentToc = document.sections.map((s) => `<a href="#${html(s.id)}">${html(s.title)}</a>`).join("");
        vars.documentContent = document.sections
          .map(
            (s) =>
              `<section id="${html(s.id)}"><h2>${html(s.title)}</h2>${s.paragraphs.map((p) => `<p>${html(text(p))}</p>`).join("") + (s.links?.length ? `<ul>${s.links.map((link) => `<li><a href="${html(link.href)}" rel="noopener">${html(link.label)}</a></li>`).join("")}</ul>` : "")}</section>`,
          )
          .join("\n");
        vars.documentContent += `<section id="app-documents"><h2>${html(t("App privacy information"))}</h2><ul>${site.apps.map((a) => `<li><a href="${html(a.privacy)}">${html(a.name)}</a></li>`).join("")}</ul></section>`;
      }
      let source = fs.readFileSync(path.join(root, "src/pages", page.template), "utf8");
      source = substitute(include(source, vars), vars);
      const $ = load(source);
      // Translation is performed during the build, so crawlers and no-JS visitors see the real language.
      $("body")
        .find("*")
        .contents()
        .filter((_, n) => n.type === "text")
        .each((_, n) => {
          const parent = n.parent;
          if (!parent || ["script", "style", "code", "pre"].includes(parent.name) || $(parent).closest("svg").length)
            return;
          const original = n.data;
          if (!original.trim()) return;
          const translated = t(original);
          if (translated === original) return;
          const before = original.match(/^\s*/)[0],
            after = original.match(/\s*$/)[0];
          n.data = before + translated.trim() + after;
        });
      $("[placeholder],[aria-label],[alt],[title]").each((_, n) => {
        if ($(n).closest("svg").length) return;
        for (const attribute of ["placeholder", "aria-label", "alt", "title"])
          if ($(n).attr(attribute)) $(n).attr(attribute, t($(n).attr(attribute)));
      });
      // The form's machine values stay in English, independently of its visible label.
      $(".hdr-lang button").each((_, n) => {
        const l = $(n).attr("data-lang") === "ua" ? "uk" : $(n).attr("data-lang");
        $(n).replaceWith(
          `<a href="${routeFor(page.route, l)}" hreflang="${l}" lang="${l}" data-language="${l}"${l === lang ? ' aria-current="page"' : ""}>${l === "uk" ? "UK" : l.toUpperCase()}</a>`,
        );
      });
      $(".legal-languages").html(
        languages
          .map(
            (l) =>
              `<a href="${routeFor(page.route, l)}" hreflang="${l}" lang="${l}" data-language="${l}"${l === lang ? ' aria-current="page"' : ""}>${l.toUpperCase()}</a>`,
          )
          .join(""),
      );
      $("[data-go]").each((_, n) => {
        const target = {
          apps: routeFor("", lang),
          ux: routeFor("ux", lang),
          req: routeFor("ux", lang) + "#ux-req",
          support: routeFor("support", lang),
        }[$(n).attr("data-go")];
        if (target) $(n).attr("href", target);
        if ($(n).attr("data-go") === "support") $(n).attr("data-support-dialog", "");
      });
      $("a[href]").each((_, n) => {
        if ($(n).is("[data-language]")) return;
        let href = $(n).attr("href");
        const aliases = {
          "#apps": routeFor("", lang),
          "#ux": routeFor("ux", lang),
          "#terms": routeFor("terms", lang),
          "#privacy": routeFor("privacy", lang),
          "#find": routeFor("", lang) + "#find",
        };
        if (aliases[href]) href = aliases[href];
        else if (href === "#" && $(n).hasClass("btn")) href = routeFor("ux", lang) + "#ux-req";
        else if (/^\/(privacy|terms|support|email-preferences)\/$/.test(href))
          href = routeFor(href.split("/")[1], lang);
        $(n).attr("href", href);
        if (/^https?:/.test(href) && !href.startsWith(origin)) $(n).attr("rel", "noopener");
      });
      $("img[data-logo]").each((_, n) => $(n).attr("src", `@/assets/logos/mark-${$(n).attr("data-logo")}.webp`));
      const imageLocale = lang === "uk" ? "uk" : lang;
      $("img.l-en,img.l-ru,img.l-uk").each((_, n) => {
        const classes = $(n).attr("class").split(/\s+/);
        if (!classes.includes("l-" + imageLocale)) $(n).remove();
      });
      $("[data-shots]").each((_, n) => {
        const key = $(n).attr("data-shots"),
          set = json("src/data/screenshots.json")[key];
        const pictures = set?.[lang === "uk" ? "ua" : lang] || set?.en || [];
        $(n)
          .find(".mock-bg")
          .each((i, bg) => {
            if (pictures[i]) $(bg).attr("data-banner", pictures[i]);
          });
      });
      const shots = json("src/data/screenshots.json");
      const currentShots = (key) => shots[key]?.[lang === "uk" ? "ua" : lang] || shots[key]?.en || [];
      const hero = [
        ["kinetwo", currentShots("kinetwo")[0], "Kinetwo"],
        ["flying-ladders", currentShots("flying")[0], "Flying Ladders"],
        ["daydraft", "assets/img/shots/daydraft-1.webp", "DayDraft"],
        ["kinetwo", currentShots("kinetwo")[1], "Kinetwo"],
        ["flying-ladders", currentShots("flying")[1], "Flying Ladders"],
        ["shapemania", "assets/img/shots/shapemania-2.webp", "Shape Mania"],
      ];
      $(".hero-track[data-carousel] > a.mock").each((i, n) => {
        const [id, image, name] = hero[i % hero.length];
        $(n)
          .attr("href", "#" + id)
          .attr("aria-label", name);
        $(n).find(".mock-bg").attr("data-banner", image);
      });
      $(".ux-about-cards .mock-bg").each((i, n) => $(n).attr("data-banner", hero[i][1]));
      $("#daydraft .mock-bg").each((i, n) => $(n).attr("data-banner", `assets/img/shots/daydraft-${i + 1}.webp`));
      $("[data-banner]").each((_, n) => {
        let value = $(n)
          .attr("data-banner")
          .replace(/^assets\//, "");
        const eager =
          ($(n).closest(".hero-track").length > 0 && $(n).closest(".mock").index() < 2) ||
          $(n).closest(".product-mock").is(":first-child");
        const style = ($(n).attr("style") || "").replace(/--banner\s*:[^;]+;?/g, "");
        $(n).attr("style", style).attr("data-banner", value);
        if (!$(n).find(".screen-image").length)
          $(n).append(
            `<img class="screen-image" src="@/assets/${value}" width="624" height="1362" alt="" ${eager ? 'loading="eager"' : 'loading="lazy"'} decoding="async">`,
          );
      });
      $(".screen-image").each((_, n) => {
        const image = $(n),
          src = image.attr("src");
        if (src?.includes("/img/shots/"))
          image
            .attr("srcset", `${src.replace("/shots/", "/shots/responsive/")} 360w, ${src} 624w`)
            .attr("sizes", "(max-width:760px) 240px, 280px");
      });
      $(".hero-track .mock-default").attr("fetchpriority", "high");
      $(".product-more").each((_, n) => {
        const link = $(n),
          name = link.closest(".product").find("h3").text().split(".")[0];
        link
          .contents()
          .filter((_, node) => node.type === "text")
          .first()
          .replaceWith(html(t("Explore")) + " " + html(name) + " ");
      });
      $(".cta-btn-wrap a")
        .contents()
        .filter((_, node) => node.type === "text")
        .first()
        .replaceWith(html(t("UX & Design")) + " ");
      $(".soon-front").attr("aria-label", t("Three mini games. Play while you wait"));
      $("img").each((_, n) => {
        const image = $(n);
        let src = image.attr("src");
        if (src?.startsWith("assets/")) image.attr("src", "@/" + src);
        if (image.closest("svg").length) return;
        if (!image.attr("decoding")) image.attr("decoding", "async");
        if (!image.closest(".site-header,.hero").length && !image.attr("loading")) image.attr("loading", "lazy");
      });
      $(".ux-cmp-dots button").each((i, n) =>
        $(n)
          .attr("tabindex", i ? " -1" : "0")
          .attr("aria-controls", `showcase-${i}`),
      );
      $(".reading-page h1").each((_, n) => {
        const title = $(n);
        const original = title.text();
        const hyphenated = original.replace(/конфиденциальности|конфіденційності/gi, (word) =>
          word.startsWith("конфиден") ? "конфиденциаль\u00adности" : "конфіденцій\u00adності",
        );
        if (original !== hyphenated) title.text(hyphenated);
      });
      $(".ux-cmp-slide").each((i, n) => $(n).attr("id", `showcase-${i}`).attr("role", "tabpanel"));
      $("form").attr("method", "post").attr("action", "/api/forms").addClass("js-form");
      $("form").after(
        `<noscript><p>${html(t("To contact us, email"))} <a href="mailto:${html(site.publisher.email)}">${html(site.publisher.email)}</a>.</p></noscript>`,
      );
      $(".view").removeAttr("hidden");
      const output = path.join(outputRoot, ...routeFor(page.route, lang).split("/").filter(Boolean), "index.html");
      fs.mkdirSync(path.dirname(output), { recursive: true });
      // Vite owns asset hashing; dynamic image changes use the same generated URL registry.
      let markup = $.html();
      const relative = path.relative(path.dirname(output), path.join(root, "src")).split(path.sep).join("/");
      markup = markup.replaceAll(
        "@/",
        (development ? "/@fs" + path.join(root, "src").split(path.sep).join("/") : relative) + "/",
      );
      fs.writeFileSync(output, markup);
      inputs.push(output);
      manifest.push({
        path: routeFor(page.route, lang),
        kind: page.kind,
        lang,
        title,
        canonical,
        noindex: !!page.noindex,
      });
      if (!page.noindex) sitemap.push({ page, lang, url: canonical });
    }
  fs.mkdirSync(path.join(root, ".generated"), { recursive: true });
  fs.writeFileSync(path.join(root, ".generated/manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${sitemap.map(({ page, url }) => `<url><loc>${html(url)}</loc>${languages.map((l) => `<xhtml:link rel="alternate" hreflang="${l}" href="${origin}${routeFor(page.route, l)}"/>`).join("")}</url>`).join("\n")}\n</urlset>\n`;
  return {
    inputs,
    manifest,
    sitemapXml,
    robots: `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /styleguide/\nSitemap: ${origin}/sitemap.xml\n`,
  };
}
