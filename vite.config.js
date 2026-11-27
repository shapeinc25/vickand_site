import path from "node:path";
import fs from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";
import { generatePages } from "./scripts/generate-pages.mjs";
import { createFormsHandler } from "./server/forms.js";

const root = fileURLToPath(new URL(".", import.meta.url));
export default defineConfig(({ mode, command }) => {
  const generated = generatePages(root, { development: command === "serve" });
  const environment = { ...process.env, ...loadEnv(mode, root, "") };
  return {
    root: path.join(root, command === "serve" ? ".generated/dev" : ".generated/pages"),
    publicDir: path.join(root, "public"),
    envDir: root,
    appType: "mpa",
    resolve: { alias: { "@": path.join(root, "src") } },
    server: { host: "127.0.0.1", fs: { allow: [root] } },
    plugins: [
      {
        name: "vickand-static-pages",
        configureServer(server) {
          const watched = ["src/pages", "src/partials", "src/data"].map((p) => path.join(root, p));
          server.watcher.add(watched);
          server.watcher.on("change", (file) => {
            if (watched.some((p) => file.startsWith(p))) {
              generatePages(root, { development: true });
              server.ws.send({ type: "full-reload" });
            }
          });
          server.middlewares.use("/api/forms", async (req, res) => {
            try {
              const bytes = [];
              let size = 0;
              for await (const chunk of req) {
                size += chunk.length;
                if (size > 16384) {
                  res.statusCode = 413;
                  res.end();
                  return;
                }
                bytes.push(chunk);
              }
              const request = new Request(new URL("/api/forms", `http://${req.headers.host || "127.0.0.1"}`), {
                method: req.method,
                headers: req.headers,
                ...(!["GET", "HEAD"].includes(req.method) ? { body: Buffer.concat(bytes) } : {}),
              });
              const localEnvironment =
                environment.VICKAND_ENABLE_LOCAL_EMAIL === "true"
                  ? environment
                  : { ...environment, RESEND_API_KEY: "" };
              const response = await createFormsHandler({ env: localEnvironment })(request);
              res.writeHead(response.status, Object.fromEntries(response.headers));
              res.end(Buffer.from(await response.arrayBuffer()));
            } catch {
              res.statusCode = 503;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ error: "Email is unavailable. Please email support@vickand.com." }));
            }
          });
        },
        writeBundle() {
          const origins = new Map();
          const walk = (directory) => {
            for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
              const file = path.join(directory, entry.name);
              if (entry.isDirectory()) walk(file);
              else if (file.endsWith(".webp.json")) {
                const image = file.slice(0, -5);
                if (fs.existsSync(image))
                  origins.set(createHash("sha256").update(fs.readFileSync(image)).digest("hex"), fs.readFileSync(file));
              }
            }
          };
          walk(path.join(root, "src/assets"));
          const assets = path.join(root, "dist/assets");
          for (const file of fs.readdirSync(assets)) {
            if (!file.endsWith(".webp")) continue;
            const full = path.join(assets, file);
            const origin = origins.get(createHash("sha256").update(fs.readFileSync(full)).digest("hex"));
            if (origin) fs.writeFileSync(full + ".json", origin);
          }

          fs.copyFileSync(path.join(root, "dist/404/index.html"), path.join(root, "dist/404.html"));
        },
        generateBundle() {
          this.emitFile({ type: "asset", fileName: "robots.txt", source: generated.robots });
          this.emitFile({ type: "asset", fileName: "sitemap.xml", source: generated.sitemapXml });
        },
      },
    ],
    build: {
      outDir: path.join(root, "dist"),
      emptyOutDir: true,
      assetsInlineLimit: 0,
      rollupOptions: { input: generated.inputs },
    },
  };
});
