/**
 * GET /api/plaid/holdings
 * Returns holdings joined with security details from the stored Plaid access token.
 *
 * Response shapes:
 *   { configured: false }                          — Plaid env vars missing
 *   { configured: true, connected: false }         — no token cookie (not linked)
 *   { configured: true, connected: true, data: … } — real holdings
 */
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getHoldings } from "@/lib/markets/plaid"
import type { PlaidHolding, PlaidSecurity } from "@/lib/markets/plaid"

const COOKIE = "plaid_access_token"

export async function GET() {
    if (!process.env.PLAID_CLIENT_ID || !process.env.PLAID_SECRET) {
        return NextResponse.json({ configured: false, connected: false })
    }

    const jar = await cookies()
    const access_token = jar.get(COOKIE)?.value
    if (!access_token) {
        return NextResponse.json({ configured: true, connected: false })
    }

    try {
        const data = await getHoldings(access_token)

        if (data.error_code) {
            // Token expired or revoked — clear cookie and signal reconnect needed
            if (["ITEM_LOGIN_REQUIRED","INVALID_ACCESS_TOKEN"].includes(data.error_code)) {
                jar.delete(COOKIE)
                return NextResponse.json({ configured: true, connected: false, reauth: true })
            }
            return NextResponse.json({ error: data.error_message }, { status: 502 })
        }

        // Join holdings → securities
        const secMap = new Map<string, PlaidSecurity>(data.securities.map(s => [s.security_id, s]))

        const INVESTABLE_TYPES = new Set(["equity", "etf", "mutual fund", "fixed income"])
        const holdings = data.holdings
            .map((h: PlaidHolding) => {
                const sec = secMap.get(h.security_id) ?? null
                return {
                    account_id:    h.account_id,
                    security_id:   h.security_id,
                    quantity:      h.quantity,
                    institution_price: h.institution_price,
                    institution_value: h.institution_value,
                    institution_price_as_of: h.institution_price_as_of,
                    cost_basis:    h.cost_basis,
                    iso_currency_code: h.iso_currency_code,
                    ticker:  sec?.ticker_symbol ?? null,
                    name:    sec?.name ?? "Unknown",
                    type:    sec?.type ?? null,
                    isin:    sec?.isin ?? null,
                    close_price: sec?.close_price ?? null,
                }
            })
            .filter(h => h.ticker && (INVESTABLE_TYPES.has(h.type ?? "") || h.type == null))

        return NextResponse.json({
            configured: true,
            connected:  true,
            data: {
                accounts: data.accounts,
                holdings,
            },
        }, { headers: { "Cache-Control": "no-store" } })
    } catch (err) {
        return NextResponse.json({ error: err instanceof Error ? err.message : "Plaid error" }, { status: 502 })
    }
}
