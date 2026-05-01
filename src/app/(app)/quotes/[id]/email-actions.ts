"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { buildQuotePdfBuffer } from "@/lib/quote-pdf-render";
import { sendBrevoEmail } from "@/lib/brevo";

export type EmailQuoteInput = {
  quoteId: string;
  /** Override recipient. Falls back to the quote's customer email. */
  recipientEmail?: string | null;
  /** Optional custom message inserted into the body. */
  customMessage?: string | null;
};

export type EmailQuoteResult =
  | { ok: true; sentTo: string; messageId: string }
  | { ok: false; error: string };

export async function emailQuoteToCustomerAction(
  input: EmailQuoteInput,
): Promise<EmailQuoteResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { ok: false, error: "You must be signed in to send a quote." };
  }

  const supabase = createServerSupabaseClient();
  const { data: quote, error: fetchError } = await supabase
    .from("quotes")
    .select("id, customer_name, customer_email, status, estimator_id")
    .eq("id", input.quoteId)
    .single();

  if (fetchError || !quote) {
    return { ok: false, error: "Quote not found." };
  }
  if (quote.estimator_id !== session.user.id) {
    return { ok: false, error: "You don't own this quote." };
  }

  const recipient = (input.recipientEmail ?? quote.customer_email ?? "").trim();
  if (!recipient) {
    return {
      ok: false,
      error:
        "No recipient email — either set one on the customer or supply one in the dialog.",
    };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
    return { ok: false, error: "Recipient email looks invalid." };
  }

  const pdfResult = await buildQuotePdfBuffer(input.quoteId, session.user.email ?? undefined);
  if (!pdfResult.ok) {
    return { ok: false, error: pdfResult.error };
  }

  const senderName = session.user.name || session.user.email?.split("@")[0] || "Estimator";
  const customerName = quote.customer_name || "there";
  const trimmedMessage = input.customMessage?.trim();

  const introParagraph = trimmedMessage
    ? trimmedMessage
        .split(/\n{2,}/)
        .map((p) => `<p style="margin:0 0 12px 0;">${escapeHtml(p)}</p>`)
        .join("")
    : `<p style="margin:0 0 12px 0;">Please find attached our quote <strong>${pdfResult.quoteNumber}</strong> for your review. The PDF has the full breakdown — let me know if you need any changes.</p>`;

  const htmlContent = `<!DOCTYPE html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#0F172A;font-size:14px;line-height:1.6;">
    <p style="margin:0 0 12px 0;">Hi ${escapeHtml(customerName)},</p>
    ${introParagraph}
    <p style="margin:0 0 12px 0;">Thanks,<br>${escapeHtml(senderName)}</p>
    <hr style="border:none;border-top:1px solid #E2E8F0;margin:24px 0;">
    <p style="margin:0;font-size:11px;color:#64748B;">Quote ${pdfResult.quoteNumber} · Sent via MSI Quote Studio</p>
  </body></html>`;

  const textContent = [
    `Hi ${customerName},`,
    "",
    trimmedMessage ??
      `Please find attached our quote ${pdfResult.quoteNumber} for your review. The PDF has the full breakdown — let me know if you need any changes.`,
    "",
    `Thanks,`,
    senderName,
    "",
    `--`,
    `Quote ${pdfResult.quoteNumber} · Sent via MSI Quote Studio`,
  ].join("\n");

  const sendResult = await sendBrevoEmail({
    to: { email: recipient, name: customerName },
    subject: `Quote ${pdfResult.quoteNumber} from ${senderName}`,
    htmlContent,
    textContent,
    replyTo: session.user.email
      ? { email: session.user.email, name: senderName }
      : undefined,
    attachments: [
      {
        name: `${pdfResult.quoteNumber}.pdf`,
        content: pdfResult.buffer.toString("base64"),
      },
    ],
  });

  if (!sendResult.ok) {
    return { ok: false, error: sendResult.error };
  }

  if (quote.status === "draft") {
    const { error: updateError } = await supabase
      .from("quotes")
      .update({ status: "sent" })
      .eq("id", quote.id);
    if (updateError) {
      return {
        ok: false,
        error: `Email sent (id ${sendResult.messageId}) but failed to update status: ${updateError.message}`,
      };
    }
  }

  revalidatePath(`/quotes/${quote.id}`);
  revalidatePath("/quotes");
  revalidatePath("/dashboard");

  return { ok: true, sentTo: recipient, messageId: sendResult.messageId };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
