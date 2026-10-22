// Keep the same request ID after an uncertain response, so retries cannot send duplicate emails.
export function createFormSender(kind) {
  let previous = "",
    requestId = "";
  return async function send(fields) {
    const body = JSON.stringify({ ...fields, kind });
    if (body !== previous) {
      previous = body;
      requestId = crypto.randomUUID();
    }
    const response = await fetch("/api/forms", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Idempotency-Key": requestId },
      body,
      signal: AbortSignal.timeout(20000),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || result.ok !== true)
      throw new Error(result.error || "Your message was not sent. Please try again.");
    previous = "";
  };
}
