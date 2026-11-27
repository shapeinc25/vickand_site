// Local-only QA server: production HTML + real validation handler + an in-memory mail double.
// It never reads Resend credentials and cannot send email.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createFormsHandler } from "../server/forms.js";
const root = path.resolve(fileURLToPath(new URL("../dist/", import.meta.url)));
const port = Number(process.env.VICKAND_QA_PORT || 4179);
let scenario = "success";
const receipts = [];
const env = {
  SITE_URL: `http://127.0.0.1:${port}/`,
  RESEND_API_KEY: "qa-mock-only",
  RESEND_FROM_EMAIL: "QA <qa@example.invalid>",
  CONTACT_TO_EMAIL: "qa@example.invalid",
  RESEND_CONTACT_TEMPLATE_ID: "qa-contact",
  RESEND_WAITLIST_TEMPLATE_ID: "qa-waitlist",
};
const handler = createFormsHandler({
  env,
  logger: { info() {}, error() {} },
  client: () => ({
    emails: {
      async send(message, options) {
        receipts.push({
          kind: message.tags.find((tag) => tag.name === "source").value,
          idempotencyKey: options.idempotencyKey,
          scenario,
        });
        if (scenario === "offline") throw new Error("QA transport unavailable");
        if (scenario === "failure") return { data: null, error: { name: "qa-rejection" } };
        return { data: { id: `qa-${receipts.length}` }, error: null };
      },
    },
  }),
});
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".woff2": "font/woff2",
  ".json": "application/json",
  ".xml": "application/xml",
  ".txt": "text/plain",
};
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://127.0.0.1:${port}`);
    res.setHeader("X-Vickand-QA", "mock-mail-no-delivery");
    if (url.pathname === "/__qa/status") {
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ scenario, receipts }));
      return;
    }
    if (url.pathname === "/__qa/scenario" && req.method === "POST") {
      const chosen = url.searchParams.get("mode");
      if (!["success", "failure", "offline"].includes(chosen)) {
        res.writeHead(400);
        res.end();
        return;
      }
      scenario = chosen;
      res.end("QA scenario selected");
      return;
    }
    if (url.pathname === "/api/forms") {
      const chunks = [];
      let size = 0;
      for await (const chunk of req) {
        size += chunk.length;
        if (size > 16384) {
          res.writeHead(413);
          res.end();
          return;
        }
        chunks.push(chunk);
      }
      const response = await handler(
        new Request(url, {
          method: req.method,
          headers: req.headers,
          ...(!["GET", "HEAD"].includes(req.method) ? { body: Buffer.concat(chunks) } : {}),
        }),
      );
      res.writeHead(response.status, Object.fromEntries(response.headers));
      res.end(Buffer.from(await response.arrayBuffer()));
      return;
    }
    let filename = path.resolve(root, "." + decodeURIComponent(url.pathname));
    if (filename !== root && !filename.startsWith(root + path.sep)) {
      res.writeHead(403);
      res.end();
      return;
    }
    if (fs.existsSync(filename) && fs.statSync(filename).isDirectory()) filename = path.join(filename, "index.html");
    if (!fs.existsSync(filename)) {
      filename = path.join(root, "404.html");
      res.statusCode = 404;
    }
    res.setHeader("Content-Type", types[path.extname(filename)] || "application/octet-stream");
    fs.createReadStream(filename).pipe(res);
  } catch {
    res.writeHead(500);
    res.end("Local QA failed");
  }
});
server.listen(port, "127.0.0.1", () =>
  console.log(`Local QA http://127.0.0.1:${port}/ — mock mail only; no external delivery.`),
);
