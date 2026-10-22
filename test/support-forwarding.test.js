import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { createSupportForwardingHandler } from "../server/support-forwarding.js";

const secretBytes = Buffer.from("test-only-webhook-secret-00000001");
const secret = `whsec_${secretBytes.toString("base64")}`;
const emailId = "a8201841-505f-4ab5-99ee-d60a7ead534d";
const event = { type: "email.received", created_at: new Date().toISOString(), data: { email_id: emailId, to: ["support@vickand.com"] } };
const env = {
  RESEND_RECEIVING_API_KEY: "test-only-not-a-key", RESEND_RECEIVING_WEBHOOK_SECRET: secret,
  CONTACT_TO_EMAIL: "delivered@resend.dev", RESEND_FROM_EMAIL: "Vickand <notifications@vickand.com>",
};
function req(value = event, valid = true) {
  const payload = JSON.stringify(value), timestamp = String(Math.floor(Date.now() / 1000)), id = "msg_test";
  const signature = createHmac("sha256", secretBytes).update(`${id}.${timestamp}.${payload}`).digest("base64");
  return new Request("https://vickand.com/api/resend-inbound", { method: "POST", body: payload, headers: {
    "svix-id": id, "svix-timestamp": timestamp, "svix-signature": valid ? `v1,${signature}` : "v1,invalid",
  } });
}
async function fixture(result = { data: { id: "sent-id" }, error: null }) {
  const { Resend } = await import("resend");
  const verification = new Resend("test-not-a-key").webhooks, calls = [];
  const handler = createSupportForwardingHandler({ env, logger: { error() {}, info() {} }, client: () => ({
    webhooks: verification, emails: { receiving: { async forward(...args) { calls.push(args); return result; } } },
  }) });
  return { handler, calls };
}
test("only signed support messages are forwarded to the fixed mailbox, with a stable retry key", async () => {
  const { handler, calls } = await fixture();
  assert.equal((await handler(req())).status, 200);
  assert.equal((await handler(req())).status, 200);
  assert.deepEqual(calls[0][0], { emailId, from: env.RESEND_FROM_EMAIL, to: [env.CONTACT_TO_EMAIL], passthrough: true });
  assert.deepEqual(calls[0][1], calls[1][1]);
});
test("invalid signatures, unrelated events and other addresses never forward", async () => {
  const { handler, calls } = await fixture();
  assert.equal((await handler(req(event, false))).status, 400);
  assert.equal((await handler(req({ ...event, type: "email.delivered" }))).status, 200);
  assert.equal((await handler(req({ ...event, data: { ...event.data, to: ["other@vickand.com"] } }))).status, 200);
  assert.equal((await handler(req({ ...event, data: { ...event.data, email_id: "invalid" } }))).status, 400);
  assert.equal(calls.length, 0);
});
test("missing secrets and oversized requests fail closed; forwarding errors remain retryable", async () => {
  const unconfigured = createSupportForwardingHandler({ env: {} });
  assert.equal((await unconfigured(req())).status, 503);
  const { handler } = await fixture({ data: null, error: { name: "rate_limit_exceeded" } });
  assert.equal((await handler(req())).status, 503);
  assert.equal((await handler(req({ ...event, padding: "x".repeat(70000) }))).status, 413);
});
