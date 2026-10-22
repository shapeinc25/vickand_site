import test from "node:test";
import assert from "node:assert/strict";
import { createFormsHandler } from "../server/forms.js";

const valid = {
  kind: "contact",
  name: "Site test",
  email: "delivered@resend.dev",
  help: "Game UX",
  message: "Please review the onboarding.",
};
const config = {
  SITE_URL: "https://vickand.com/",
  RESEND_API_KEY: "test-not-a-real-key",
  RESEND_FROM_EMAIL: "Vickand <notifications@vickand.com>",
  CONTACT_TO_EMAIL: "delivered@resend.dev",
  RESEND_CONTACT_TEMPLATE_ID: "contact-template",
  RESEND_WAITLIST_TEMPLATE_ID: "waitlist-template",
};
function request(body = valid, headers = {}, method = "POST") {
  return new Request("https://vickand.com/api/forms", {
    method,
    headers: {
      "content-type": "application/json",
      origin: "https://vickand.com",
      "idempotency-key": "test-request-00000001",
      ...headers,
    },
    ...(method === "POST" ? { body: typeof body === "string" ? body : JSON.stringify(body) } : {}),
  });
}
function fixture(result = { data: { id: "email-1" }, error: null }, overrides = {}) {
  const calls = [],
    logger = { error() {}, info() {} };
  const handler = createFormsHandler({
    env: { ...config, ...overrides },
    logger,
    client: () => ({
      emails: {
        async send(...args) {
          calls.push(args);
          return result;
        },
      },
    }),
  });
  return { handler, calls };
}

test("accepts a contact form, fixes the recipient and escapes template content", async () => {
  const { handler, calls } = fixture();
  const response = await handler(request({ ...valid, name: "<script>alert(1)</script>", to: "bounced@resend.dev" }));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
  assert.deepEqual(calls[0][0].to, [config.CONTACT_TO_EMAIL]);
  assert.equal(calls[0][0].replyTo, valid.email);
  assert.equal(calls[0][0].template.variables.NAME, "&lt;script&gt;alert(1)&lt;/script&gt;");
  assert.equal(calls[0][0].template.variables.SENDER_EMAIL, valid.email);
  assert.equal(calls[0][0].template.variables.EMAIL, undefined);
  assert.equal(calls[0][0].html, undefined);
});
test("rejects malformed, oversized and cross-origin submissions without sending", async () => {
  const { handler, calls } = fixture();
  for (const [req, status] of [
    [request("{"), 400],
    [request({ ...valid, email: "bad" }), 400],
    [request(valid, { origin: "https://unrelated.example" }), 403],
    [request(valid, { "content-type": "text/plain" }), 415],
    [request({ ...valid, message: "x".repeat(17000) }), 413],
    [request({ ...valid, help: "unknown" }), 400],
    [request({ ...valid, link: "javascript:alert(1)" }), 400],
    [request(valid, { "idempotency-key": "" }), 400],
    [request(undefined, {}, "GET"), 405],
  ])
    assert.equal((await handler(req)).status, status);
  assert.equal(calls.length, 0);
});
test("a filled honeypot never sends email", async () => {
  const { handler, calls } = fixture();
  assert.equal((await handler(request({ ...valid, website: "spam" }))).status, 200);
  assert.equal(calls.length, 0);
});
test("missing configuration never produces a false success", async () => {
  const { handler, calls } = fixture(undefined, { RESEND_CONTACT_TEMPLATE_ID: "" });
  assert.equal((await handler(request())).status, 503);
  assert.equal(calls.length, 0);
});
test("Resend rejections and transport failures remain retryable failures", async () => {
  const { handler } = fixture({ data: null, error: { name: "rate_limit_exceeded" } });
  assert.equal((await handler(request())).status, 503);
  const offline = createFormsHandler({
    env: config,
    logger: { error() {} },
    client: () => ({
      emails: {
        send() {
          throw new Error("offline");
        },
      },
    }),
  });
  assert.equal((await offline(request())).status, 503);
});
test("retries keep an idempotency key; edited messages get a different one", async () => {
  const { handler, calls } = fixture();
  await handler(request());
  await handler(request());
  await handler(request({ ...valid, message: "An updated message" }));
  assert.equal(calls[0][1].idempotencyKey, calls[1][1].idempotencyKey);
  assert.notEqual(calls[1][1].idempotencyKey, calls[2][1].idempotencyKey);
});
test("waitlist notifications use their own published template and fixed recipient", async () => {
  const { handler, calls } = fixture();
  assert.equal((await handler(request({ kind: "waitlist", email: valid.email }))).status, 200);
  assert.equal(calls[0][0].template.id, config.RESEND_WAITLIST_TEMPLATE_ID);
  assert.deepEqual(calls[0][0].template.variables, { SENDER_EMAIL: valid.email });
});
