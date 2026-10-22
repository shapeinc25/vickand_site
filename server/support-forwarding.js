import { Resend } from "resend";

const escapeHtml = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char],
  );
const json = (body, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export function createSupportForwardingHandler({
  env = process.env,
  client = (key) => new Resend(key),
  logger = console,
} = {}) {
  return async function handle(request) {
    if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);
    if (
      !env.RESEND_RECEIVING_API_KEY ||
      !env.RESEND_RECEIVING_WEBHOOK_SECRET ||
      !env.CONTACT_TO_EMAIL ||
      !env.RESEND_FROM_EMAIL
    ) {
      return json({ error: "Support forwarding is not configured." }, 503);
    }
    if (Number(request.headers.get("content-length")) > 65536) return json({ error: "Payload too large." }, 413);
    const payload = await request.text();
    if (Buffer.byteLength(payload) > 65536) return json({ error: "Payload too large." }, 413);
    const resend = client(env.RESEND_RECEIVING_API_KEY);
    let event;
    try {
      event = resend.webhooks.verify({
        payload,
        headers: {
          id: request.headers.get("svix-id") || "",
          timestamp: request.headers.get("svix-timestamp") || "",
          signature: request.headers.get("svix-signature") || "",
        },
        webhookSecret: env.RESEND_RECEIVING_WEBHOOK_SECRET,
      });
    } catch {
      return json({ error: "Invalid webhook signature." }, 400);
    }
    if (event.type !== "email.received") return json({ ignored: true });
    const recipients = event.data?.to;
    if (
      !Array.isArray(recipients) ||
      !recipients.some(
        (address) => typeof address === "string" && /^(?:[^<>]*<)?support@vickand\.com>?$/i.test(address.trim()),
      )
    ) {
      return json({ ignored: true });
    }
    const emailId = event.data.email_id;
    if (typeof emailId !== "string" || !/^[a-f0-9-]{36}$/i.test(emailId))
      return json({ error: "Invalid email identifier." }, 400);
    try {
      const received = await resend.emails.receiving.get(emailId, { html_format: "cid" });
      if (received.error || !received.data) throw new Error("Incoming message unavailable");
      const email = received.data;
      const attachments = [];
      for (const attachment of email.attachments || []) {
        const result = await resend.emails.receiving.attachments.get({ emailId, id: attachment.id });
        if (result.error || !result.data?.download_url) throw new Error("Attachment unavailable");
        attachments.push({
          filename: result.data.filename || "attachment",
          path: result.data.download_url,
          contentType: result.data.content_type,
          ...(result.data.content_id ? { contentId: result.data.content_id.replace(/^<|>$/g, "") } : {}),
        });
      }
      const sender = email.from || "Unknown sender";
      const replyTo = (email.reply_to?.length ? email.reply_to : [sender]).filter(
        (address) => typeof address === "string" && !/[\r\n]/.test(address) && address.includes("@"),
      );
      const textHeader = `Support message from: ${sender}\nTo: support@vickand.com\n\n`;
      const { data, error } = await resend.emails.send(
        {
          from: env.RESEND_FROM_EMAIL,
          to: [env.CONTACT_TO_EMAIL],
          ...(replyTo.length ? { replyTo } : {}),
          subject: `Support: ${email.subject || "(no subject)"}`,
          text: textHeader + (email.text || "This message contains HTML content."),
          ...(email.html ? { html: `<p>Support message from: ${escapeHtml(sender)}</p><hr>${email.html}` } : {}),
          ...(attachments.length ? { attachments } : {}),
          tags: [{ name: "source", value: "support-forward" }],
        },
        { idempotencyKey: `support-forward/${emailId}` },
      );
      if (error || !data?.id) {
        logger.error("Support forwarding failed", { emailId, error: error?.name || "missing_email_id" });
        return json({ error: "Forwarding temporarily failed." }, 503);
      }
      logger.info("Support forwarded", { receivedEmailId: emailId, sentEmailId: data.id });
      return json({ ok: true });
    } catch {
      logger.error("Support forwarding service unavailable", { emailId });
      return json({ error: "Forwarding temporarily failed." }, 503);
    }
  };
}
