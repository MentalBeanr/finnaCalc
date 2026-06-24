/**
 * GET /api/top-movers
 * Proxies to /api/markets/movers (gainers, losers, active).
 * Kept for backwards compatibility with any existing callers.
 */
import { NextResponse } from "next/server"
import { getQuote, getProfile } from "@/lib/markets/finnhub"

const POOL = ["AAPL","MSFT","NVDA","TSLA","AMD","META","AMZN","GOOGL","PLTR","COIN",
              "SMCI","MARA","RIOT","NVAX","MRNA","RIVN","INTC","LCID","WBA","JPM"]

export async function GET() {
    try {
        const rows = await Promise.all(
            POOL.map(async (sym) => {
                const [q, p] = await Promise.all([getQuote(sym), getProfile(sym).catch(() => null)])
                return { ticker: sym, companyName: p?.name ?? sym, price: q.c, changePct: q.dp,
                         volume: 0, logoUrl: p?.logo ?? undefined }
            })
        )
        const sorted = [...rows].sort((a, b) => b.changePct - a.changePct)
        return NextResponse.json({
            data: { gainers: sorted.slice(0, 6), losers: sorted.slice(-6).reverse(), active: rows.slice(0, 6) },
        }, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } })
    } catch (err) {
        const msg = err instanceof Error ? err.message : "error"
        return NextResponse.json({ error: msg }, { status: 502 })
    }
}
