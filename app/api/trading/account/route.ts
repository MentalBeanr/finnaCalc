/**
 * GET  /api/trading/account  — Alpaca account + open positions
 */
import { NextResponse } from "next/server"
import { getAccount, getPositions } from "@/lib/markets/alpaca"

export async function GET() {
    const key = process.env.ALPACA_API_KEY
    if (!key) {
        return NextResponse.json({ error: "ALPACA_API_KEY not configured" }, { status: 503 })
    }
    try {
        const [account, positions] = await Promise.all([getAccount(), getPositions()])
        return NextResponse.json({ data: { account, positions } }, {
            headers: { "Cache-Control": "no-store" },
        })
    } catch (err) {
        return NextResponse.json({ error: err instanceof Error ? err.message : "Alpaca error" }, { status: 502 })
    }
}
