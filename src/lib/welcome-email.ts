import { sendBrevoEmail, brevoIsConfigured } from "@/lib/brevo";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://msi-quote-studio.vercel.app";

/**
 * Send a one-shot welcome email to a newly registered user. Best-effort:
 * if Brevo isn't configured we silently skip — registration must NOT fail
 * because email delivery failed.
 */
export async function sendWelcomeEmail(input: {
  toEmail: string;
  toName?: string | null;
}): Promise<void> {
  if (!brevoIsConfigured()) {
    console.log("[welcome-email] Brevo not configured; skipping welcome email");
    return;
  }

  const greetName = input.toName?.trim() || input.toEmail.split("@")[0] || "there";
  const subject = "Welcome to MSI Quote Studio";

  const htmlContent = `<!DOCTYPE html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#0F172A;font-size:14px;line-height:1.6;">
    <p style="margin:0 0 12px 0;">Hi ${escapeHtml(greetName)},</p>
    <p style="margin:0 0 12px 0;">Your MSI Quote Studio workspace is live. The catalog is pre-seeded with the standard product list, so you can build your first AI-scored quote in under 90 seconds.</p>
    <p style="margin:0 0 12px 0;"><a href="${APP_URL}/quotes/new" style="display:inline-block;background:#D97706;color:#FFFFFF;padding:10px 18px;border-radius:6px;text-decoration:none;font-weight:600;">Create your first quote</a></p>
    <p style="margin:24px 0 12px 0;">A few places to start:</p>
    <ul style="margin:0 0 12px 18px;padding:0;">
      <li><a href="${APP_URL}/quotes/new" style="color:#D97706;">New quote</a> — try the Autofill demo button to see a coherent multi-line quote in one click</li>
      <li><a href="${APP_URL}/customers" style="color:#D97706;">Customers</a> — save contacts and they show up on every future quote</li>
      <li><a href="${APP_URL}/reports" style="color:#D97706;">Reports</a> — pipeline value, win rate, AI complexity trend</li>
      <li><a href="${APP_URL}/settings" style="color:#D97706;">Settings</a> — see which integrations are live</li>
    </ul>
    <p style="margin:24px 0 12px 0;">If you signed up via the demo account, anything you create there auto-deletes after 48 hours. Workspaces created with your own email keep their data forever.</p>
    <p style="margin:0;">— Samuel @ MSI Quote Studio</p>
    <hr style="border:none;border-top:1px solid #E2E8F0;margin:24px 0;">
    <p style="margin:0;font-size:11px;color:#64748B;">This is a portfolio case study. <a href="https://samuel-muriuki.vercel.app/" style="color:#64748B;">Samuel Muriuki</a> — inspired by Marking Systems Inc.</p>
  </body></html>`;

  const textContent = [
    `Hi ${greetName},`,
    "",
    "Your MSI Quote Studio workspace is live. The catalog is pre-seeded with the standard product list, so you can build your first AI-scored quote in under 90 seconds.",
    "",
    `Create your first quote: ${APP_URL}/quotes/new`,
    "",
    "A few places to start:",
    `  • New quote — ${APP_URL}/quotes/new`,
    `  • Customers — ${APP_URL}/customers`,
    `  • Reports — ${APP_URL}/reports`,
    `  • Settings — ${APP_URL}/settings`,
    "",
    "If you signed up via the demo account, anything you create there auto-deletes after 48 hours. Workspaces created with your own email keep their data forever.",
    "",
    "— Samuel @ MSI Quote Studio",
    "",
    "--",
    "This is a portfolio case study by Samuel Muriuki, inspired by Marking Systems Inc.",
  ].join("\n");

  const result = await sendBrevoEmail({
    to: { email: input.toEmail, name: input.toName ?? undefined },
    subject,
    htmlContent,
    textContent,
  });

  if (!result.ok) {
    console.error("[welcome-email] failed:", result.error);
  } else {
    console.log("[welcome-email] sent to", input.toEmail, "messageId:", result.messageId);
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
