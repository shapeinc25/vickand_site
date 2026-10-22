import { createHash } from "node:crypto";
import { Resend } from "resend";

const EMAIL = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
const HELP = new Set([
  "UX Audit & Usability",
  "User Flows & Onboarding",
  "UI Design",
  "Game UX",
  "Design System",
  "Branding & Brand Guidelines",
  "Marketing Materials",
  "Not sure yet",
]);
const json = (body, status = 200) =>
  Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
  });
const escape = (value) =>
  value.replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[char],
  );

export function createFormsHandler({ env = process.env, client = (key) => new Resend(key), logger = console } = {}) {
  return async function handle(request) {
    if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);
    const origin = request.headers.get("origin");
    const allowed = new Set([new URL(request.url).origin, new URL(env.SITE_URL || "https://vickand.com/").origin]);
    if (origin && !allowed.has(origin)) return json({ error: "This form must be sent from our website." }, 403);
    if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
      return json({ error: "Send the form as JSON." }, 415);
    }
    if (Number(request.headers.get("content-length")) > 16384) return json({ error: "Your message is too long." }, 413);
    let body;
    try {
      const raw = await request.text();
      if (Buffer.byteLength(raw) > 16384) return json({ error: "Your message is too long." }, 413);
      body = JSON.parse(raw);
    } catch {
      return json({ error: "The form could not be read. Please try again." }, 400);
    }
    if (!body || typeof body !== "object" || Array.isArray(body)) return json({ error: "Invalid form." }, 400);
    if (typeof body.website === "string" && body.website.trim()) return json({ ok: true });
    const field = (key, max) =>
      typeof body[key] === "string" && body[key].trim().length <= max ? body[key].trim() : "";
    const kind = field("kind", 20);
    const email = field("email", 254);
    if (!EMAIL.test(email)) return json({ error: "Enter a valid email address." }, 400);
    const requestId = request.headers.get("idempotency-key") || "";
    if (!/^[a-zA-Z0-9_-]{16,100}$/.test(requestId))
      return json({ error: "Please refresh the page and try again." }, 400);
    let variables, templateId;
    if (kind === "contact") {
      const name = field("name", 120),
        help = field("help", 80);
      const link = field("link", 1000),
        message = field("message", 1800);
      if (!name || /[\r\n]/.test(name) || !HELP.has(help))
        return json({ error: "Enter your name and choose what you need help with." }, 400);
      if ((body.link && !link) || (body.message && !message))
        return json({ error: "Please shorten your link or message." }, 400);
      if (link) {
        try {
          if (!["http:", "https:"].includes(new URL(link).protocol)) throw new Error();
        } catch {
          return json({ error: "Use a complete http:// or https:// product link." }, 400);
        }
      }
      variables = {
        NAME: name,
        EMAIL: email,
        HELP: help,
        LINK: link || "Not provided",
        MESSAGE: message || "Not provided",
      };
      templateId = env.RESEND_CONTACT_TEMPLATE_ID;
    } else if (kind === "waitlist") {
      variables = { EMAIL: email };
      templateId = env.RESEND_WAITLIST_TEMPLATE_ID;
    } else return json({ error: "Unknown form." }, 400);
    variables = Object.fromEntries(Object.entries(variables).map(([key, value]) => [key, escape(value)]));
    if (Object.values(variables).some((value) => value.length > 2000))
      return json({ error: "Please shorten your message." }, 400);
    if (!env.RESEND_API_KEY || !env.RESEND_FROM_EMAIL || !EMAIL.test(env.CONTACT_TO_EMAIL || "") || !templateId) {
      logger.error("Website email configuration is incomplete", { kind });
      return json(
        { error: "Email is temporarily unavailable. Please email support@vickand.com or try again later." },
        503,
      );
    }
    const fingerprint = createHash("sha256").update(JSON.stringify({ kind, email, variables })).digest("hex");
    try {
      const { data, error } = await client(env.RESEND_API_KEY).emails.send(
        {
          from: env.RESEND_FROM_EMAIL,
          to: [env.CONTACT_TO_EMAIL],
          replyTo: email,
          template: { id: templateId, variables },
          tags: [{ name: "source", value: `website-${kind}` }],
        },
        { idempotencyKey: `website/${kind}/${requestId}/${fingerprint}` },
      );
      if (error || !data?.id) {
        logger.error("Website email was not accepted", { kind, error: error?.name || "missing_email_id" });
        return json({ error: "Your message was not sent. Please try again shortly." }, 503);
      }
      logger.info("Website email accepted", { kind, emailId: data.id });
      return json({ ok: true });
    } catch {
      logger.error("Website email service could not be reached", { kind });
      return json({ error: "Your message was not sent. Please try again shortly." }, 503);
    }
  };
}
