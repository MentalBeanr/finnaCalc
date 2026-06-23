/**
 * Transactional email via Resend.
 *
 * Requires RESEND_API_KEY in env. When the key is absent (local dev without
 * the secret) sends are skipped and a warning is logged — the filing flow is
 * never blocked by email failures.
 */
import { Resend } from "resend"
import { rejectMessage } from "@/lib/filing-shared"

const FROM = process.env.RESEND_FROM_EMAIL ?? "FinnaCalc <noreply@finnacalc.com>"
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "")

let _client: Resend | null = null
function getClient(): Resend | null {
    if (!process.env.RESEND_API_KEY) return null
    if (!_client) _client = new Resend(process.env.RESEND_API_KEY)
    return _client
}

async function send(to: string, subject: string, html: string): Promise<void> {
    const client = getClient()
    if (!client) {
        console.warn(`[email] RESEND_API_KEY not set — skipping: "${subject}" → ${to}`)
        return
    }
    const { error } = await client.emails.send({ from: FROM, to: [to], subject, html })
    if (error) console.error("[email] Send failed:", error)
}

// ── Public send functions ────────────────────────────────────────────────────

export async function sendReturnSubmittedEmail(
    to: string,
    taxYear: number,
    returnId: string,
): Promise<void> {
    const url = `${APP_URL}/file/${returnId}`
    await send(
        to,
        `Your ${taxYear} federal return has been submitted`,
        base(`
          <h1 style="margin:0 0 8px;font-size:22px;color:#111827">Your ${taxYear} return has been submitted</h1>
          <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6">
            We've transmitted your federal return to the IRS. Processing typically takes 24–48 hours.
            You'll receive another email when the IRS sends back an acknowledgment.
          </p>
          <p style="margin:0;font-size:15px;color:#374151;line-height:1.6">
            You can check your filing status anytime from your return dashboard.
          </p>
          ${btn(url, "View return status")}
        `),
    )
}

export async function sendReturnAcceptedEmail(
    to: string,
    taxYear: number,
    returnId: string,
    ackCode?: string,
): Promise<void> {
    const url = `${APP_URL}/file/${returnId}`
    await send(
        to,
        `Your ${taxYear} federal return was accepted by the IRS`,
        base(`
          <h1 style="margin:0 0 8px;font-size:22px;color:#166534">&#10003; Your ${taxYear} return was accepted</h1>
          <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6">
            The IRS accepted your ${taxYear} federal return.${ackCode ? ` Your acknowledgment code is <strong>${ackCode}</strong>.` : ""}
            Keep this email for your records.
          </p>
          <p style="margin:0;font-size:15px;color:#374151;line-height:1.6">
            If you're expecting a refund, the IRS typically issues it within 21 days for e-filed returns.
          </p>
          ${btn(url, "View accepted return")}
        `),
    )
}

export async function sendReturnRejectedEmail(
    to: string,
    taxYear: number,
    returnId: string,
    rejectCodes: { code: string; desc: string }[],
): Promise<void> {
    const url = `${APP_URL}/file/${returnId}`
    const items = rejectCodes
        .map(
            (c) =>
                `<li style="margin-bottom:8px;color:#374151"><strong>${c.code}</strong>: ${rejectMessage(c.code)}</li>`,
        )
        .join("")

    await send(
        to,
        `Action required: your ${taxYear} federal return was rejected`,
        base(`
          <h1 style="margin:0 0 8px;font-size:22px;color:#991b1b">Action required: return rejected</h1>
          <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6">
            The IRS rejected your ${taxYear} federal return. Please correct the issues below and resubmit.
          </p>
          ${items ? `<ul style="margin:0 0 16px;padding-left:20px">${items}</ul>` : ""}
          <p style="margin:0;font-size:15px;color:#374151;line-height:1.6">
            Return to your dashboard to fix the errors and file again.
          </p>
          ${btn(url, "Fix and resubmit")}
        `),
    )
}

// ── HTML helpers ─────────────────────────────────────────────────────────────

function base(body: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:system-ui,-apple-system,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb">
        <tr><td style="background:#1a1a2e;padding:24px 32px">
          <p style="margin:0;font-size:20px;font-weight:700;color:#fff;letter-spacing:-0.02em">FinnaCalc</p>
        </td></tr>
        <tr><td style="padding:32px">
          ${body}
          <hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb">
          <p style="margin:0;font-size:12px;color:#9ca3af">This is an automated message from FinnaCalc. Do not reply to this email.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function btn(url: string, text: string): string {
    return `<p style="margin:24px 0 0"><a href="${url}" style="display:inline-block;background:#1a1a2e;color:#fff;text-decoration:none;padding:12px 24px;border-radius:6px;font-size:14px;font-weight:600">${text}</a></p>`
}
