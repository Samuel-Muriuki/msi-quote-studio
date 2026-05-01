/**
 * Minimal Brevo (Sendinblue) transactional email client.
 *
 * Brevo's free tier ships 300 emails/day with no card and no domain
 * verification — you only need to verify a single sender email address
 * (https://app.brevo.com/senders). We hit the v3/smtp/email endpoint
 * directly with fetch so we don't need their full SDK.
 *
 * Env vars (all required for sends):
 *   BREVO_API_KEY        — from https://app.brevo.com/settings/keys/api
 *   BREVO_SENDER_EMAIL   — must be verified in Brevo
 *   BREVO_SENDER_NAME    — display name shown to recipients
 */

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

export type BrevoAttachment = {
  /** File name shown to recipient (extension matters). */
  name: string;
  /** Base64-encoded file contents — no `data:` prefix. */
  content: string;
};

export type BrevoSendInput = {
  to: { email: string; name?: string };
  subject: string;
  htmlContent: string;
  textContent?: string;
  replyTo?: { email: string; name?: string };
  attachments?: BrevoAttachment[];
};

export type BrevoSendResult =
  | { ok: true; messageId: string }
  | { ok: false; error: string };

function getEnv(name: string): string | null {
  const v = process.env[name];
  return v && v.trim() ? v : null;
}

export function brevoIsConfigured(): boolean {
  return Boolean(getEnv("BREVO_API_KEY") && getEnv("BREVO_SENDER_EMAIL"));
}

export async function sendBrevoEmail(input: BrevoSendInput): Promise<BrevoSendResult> {
  const apiKey = getEnv("BREVO_API_KEY");
  const senderEmail = getEnv("BREVO_SENDER_EMAIL");
  const senderName = getEnv("BREVO_SENDER_NAME") ?? "MSI Quote Studio";

  if (!apiKey || !senderEmail) {
    return {
      ok: false,
      error:
        "Email is not configured. Set BREVO_API_KEY and BREVO_SENDER_EMAIL (and verify the sender in Brevo) to enable sending.",
    };
  }

  const body = {
    sender: { email: senderEmail, name: senderName },
    to: [input.to],
    subject: input.subject,
    htmlContent: input.htmlContent,
    ...(input.textContent ? { textContent: input.textContent } : {}),
    ...(input.replyTo ? { replyTo: input.replyTo } : {}),
    ...(input.attachments && input.attachments.length > 0
      ? { attachment: input.attachments }
      : {}),
  };

  let response: Response;
  try {
    response = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    return { ok: false, error: `Network error contacting Brevo: ${(err as Error).message}` };
  }

  if (!response.ok) {
    const text = await response.text();
    return {
      ok: false,
      error: `Brevo rejected the email (HTTP ${response.status}): ${text || response.statusText}`,
    };
  }

  const json = (await response.json()) as { messageId?: string };
  return { ok: true, messageId: json.messageId ?? "(no id returned)" };
}
