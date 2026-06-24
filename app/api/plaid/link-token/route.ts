/**
 * GET /api/plaid/link-token
 * Creates a Plaid Link token to initialise the client-side Link flow.
 * Requires PLAID_CLIENT_ID + PLAID_SECRET.
 */
import { NextResponse } from "next/server"
import { createLinkToken } from "@/lib/markets/plaid"

export async function GET() {
    if (!process.env.PLAID_CLIENT_ID || !process.env.PLAID_SECRET) {
        return NextResponse.json({ error: "PLAID_CLIENT_ID / PLAID_SECRET not configured" }, { status: 503 })
    }
    try {
        const data = await createLinkToken()
        if (data.error_code) {
            return NextResponse.json({ error: data.error_message }, { status: 502 })
        }
        return NextResponse.json({ link_token: data.link_token, expiration: data.expiration })
    } catch (err) {
        return NextResponse.json({ error: err instanceof Error ? err.message : "Plaid error" }, { status: 502 })
    }
}
