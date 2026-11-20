import type { Mail } from "./types";

export class ResendError extends Error {
  constructor(public readonly code: string, public readonly transient: boolean) { super(code); }
}

export async function sendWithResend(mail: Mail, idempotencyKey: string, apiKey: string, from: string, fetcher: typeof fetch = fetch): Promise<void> {
  let response: Response;
  try {
    response = await fetcher("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "Idempotency-Key": idempotencyKey }, body: JSON.stringify({ from, to: [mail.to], subject: mail.subject, html: mail.html, text: mail.text }), signal: AbortSignal.timeout(15_000) });
  } catch {
    throw new ResendError("network_timeout_or_unreachable", true);
  }
  if (response.ok) return;
  let code = `http_${response.status}`;
  try { const body = await response.json() as { name?: unknown; error?: { name?: unknown } }; const name = body.name ?? body.error?.name; if (typeof name === "string" && /^[a-z0-9_]{1,80}$/.test(name)) code = name; } catch { /* provider returned no JSON */ }
  throw new ResendError(code, code === "concurrent_idempotent_requests" ||
    response.status === 408 || response.status === 429 || response.status >= 500);
}
