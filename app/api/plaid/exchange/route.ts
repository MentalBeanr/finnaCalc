/**
 * POST /api/plaid/exchange  { public_token: string }
 *   Exchanges the Plaid Link public_token for a persistent access_token
 *   and stores it in an httpOnly cookie. Returns { ok, item_id }.
 *
 * DELETE /api/plaid/exchange
 *   Clears the stored access_token (disconnect).
 */
import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { exchangePublicToken } from "@/lib/markets/plaid"

const COOKIE = "plaid_access_token"
const YEAR_S = 60 * 60 * 24 * 365

export async function POST(req: NextRequest) {
    if (!process.env.PLAID_CLIENT_ID) {
        return NextResponse.json({ error: "Plaid not configured" }, { status: 503 })
    }
    try {
        const body = await req.json() as { public_token?: string }
        if (!body.public_token) {
            return NextResponse.json({ error: "public_token required" }, { status: 400 })
        }
        const data = await exchangePublicToken(body.public_token)
        if (data.error_code) {
            return NextResponse.json({ error: data.error_message }, { status: 502 })
        }
        const jar = await cookies()
        jar.set(COOKIE, data.access_token, {
            httpOnly: true,
            secure:   process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge:   YEAR_S,
            path:     "/",
        })
        return NextResponse.json({ ok: true, item_id: data.item_id })
    } catch (err) {
        return NextResponse.json({ error: err instanceof Error ? err.message : "Plaid error" }, { status: 502 })
    }
}

export async function DELETE() {
    const jar = await cookies()
    jar.delete(COOKIE)
    return NextResponse.json({ ok: true })
}
