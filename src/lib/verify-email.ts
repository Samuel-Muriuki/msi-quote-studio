import { sendBrevoEmail, brevoIsConfigured } from "@/lib/brevo";

/**
 * Send the email-address verification message to a freshly-registered
 * user. Better Auth provides the click-through URL — we wrap it in a
 * branded template and dispatch via Brevo.
 *
 * Best-effort: if Brevo isn't configured we log and return, so the
 * registration flow doesn't fail outright (the user will land in the
 * unverified state and can request a re-send via the sign-in screen
 * once Brevo is configured).
 */
export async function sendVerifyEmail(input: {
  toEmail: string;
  toName?: string | null;
  verifyUrl: string;
}): Promise<void> {
  if (!brevoIsConfigured()) {
    console.log("[verify-email] Brevo not configured; skipping verification email");
    return;
  }

  const greetName = input.toName?.trim() || input.toEmail.split("@")[0] || "there";
  const subject = "Verify your MSI Quote Studio email";

  const htmlContent = `<!DOCTYPE html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#0F172A;font-size:14px;line-height:1.6;">
    <p style="margin:0 0 12px 0;">Hi ${escapeHtml(greetName)},</p>
    <p style="margin:0 0 12px 0;">One last step — click the button below to verify <span style="font-family:ui-monospace,monospace;">${escapeHtml(input.toEmail)}</span> and finish creating your MSI Quote Studio workspace.</p>
    <p style="margin:24px 0;"><a href="${input.verifyUrl}" style="display:inline-block;background:#D97706;color:#FFFFFF;padding:12px 22px;border-radius:6px;text-decoration:none;font-weight:600;">Verify email</a></p>
    <p style="margin:0 0 12px 0;font-size:12px;color:#64748B;">If the button doesn&apos;t work, paste this link into your browser:<br><span style="word-break:break-all;font-family:ui-monospace,monospace;color:#0F172A;">${input.verifyUrl}</span></p>
    <p style="margin:24px 0 12px 0;">This link expires in 24 hours. If you didn&apos;t register, you can ignore this email.</p>
    <p style="margin:0;">— Samuel @ MSI Quote Studio</p>
    <hr style="border:none;border-top:1px solid #E2E8F0;margin:24px 0;">
    <p style="margin:0;font-size:11px;color:#64748B;">Portfolio case study by <a href="https://samuel-muriuki.vercel.app/" style="color:#64748B;">Samuel Muriuki</a> — inspired by Marking Systems Inc.</p>
  </body></html>`;

  const textContent = [
    `Hi ${greetName},`,
    "",
    `One last step — click the link below to verify ${input.toEmail} and finish creating your MSI Quote Studio workspace.`,
    "",
    `Verify email: ${input.verifyUrl}`,
    "",
    "This link expires in 24 hours. If you didn't register, you can ignore this email.",
    "",
    "— Samuel @ MSI Quote Studio",
    "",
    "--",
    "Portfolio case study by Samuel Muriuki, inspired by Marking Systems Inc.",
  ].join("\n");

  const result = await sendBrevoEmail({
    to: { email: input.toEmail, name: input.toName ?? undefined },
    subject,
    htmlContent,
    textContent,
  });

  if (!result.ok) {
    console.error("[verify-email] failed:", result.error);
  } else {
    console.log("[verify-email] sent to", input.toEmail, "messageId:", result.messageId);
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
