/**
 * GET /api/markets/movers
 *
 * Returns gainers, losers, and most-active in one call to minimise
 * round-trips and avoid hitting Finnhub's 60 req/min free limit.
 *
 * Strategy: fetch quotes for a curated liquid pool, sort by changePct
 * for gainers/losers, sort by |changePct| for active.
 */
import { NextResponse } from "next/server"
import { getQuote, getProfile } from "@/lib/markets/finnhub"
import type { MarketsApiResponse, MoverStock } from "@/lib/markets/types"

// Curated pool of liquid, well-known tickers
const POOL = [
    "AAPL","MSFT","NVDA","GOOGL","AMZN","TSLA","META","AMD",
    "JPM","JNJ","COIN","PLTR","MARA","SMCI","NVAX","MRNA","RIVN","INTC",
]

export async function GET() {
    try {
        const results = await Promise.all(
            POOL.map(async (ticker) => {
                const [q, profile] = await Promise.all([
                    getQuote(ticker),
                    getProfile(ticker).catch(() => null),
                ])
                return {
                    ticker,
                    companyName: profile?.name ?? ticker,
                    price:       q.c,
                    changePct:   q.dp,
                    volume:      0,
                    logoUrl:     profile?.logo || undefined,
                } satisfies MoverStock
            })
        )

        const valid = results.filter(r => r.price > 0)
        const sorted = [...valid].sort((a, b) => b.changePct - a.changePct)

        const gainers = sorted.slice(0, 6)
        const losers  = [...sorted].reverse().slice(0, 6)
        const active  = [...valid].sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct)).slice(0, 6)

        const body: MarketsApiResponse<{ gainers: MoverStock[]; losers: MoverStock[]; active: MoverStock[] }> = {
            data: { gainers, losers, active },
            cachedAt: Date.now(),
        }
        return NextResponse.json(body, {
            headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300" },
        })
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error"
        return NextResponse.json({ error: message }, { status: 502 })
    }
}
