/**
 * GET /api/markets/movers?type=gainers|losers|active
 *
 * Returns top 6 gainers, losers, or most-active stocks for the day.
 * Logos resolved via Clearbit using the ticker → domain map.
 */
import { NextRequest, NextResponse } from "next/server"
import { getMovers, getSnapshots } from "@/lib/markets/polygon"
import type { MarketsApiResponse, MoverStock } from "@/lib/markets/types"

// Common tickers for "most active" — Polygon free tier doesn't have a
// dedicated most-active endpoint, so we snapshot a curated liquid set.
const ACTIVE_TICKERS = ["SPY","NVDA","TSLA","AAPL","AMD","QQQ","AMZN","META","MSFT","SOXL"]

const CLEARBIT_DOMAINS: Record<string, string> = {
    AAPL:"apple.com", MSFT:"microsoft.com", NVDA:"nvidia.com", GOOGL:"google.com",
    AMZN:"amazon.com", TSLA:"tesla.com", META:"meta.com", AMD:"amd.com",
    JPM:"jpmorganchase.com", JNJ:"jnj.com", SPY:"ssga.com", QQQ:"invesco.com",
    SOXL:"direxion.com", COIN:"coinbase.com", PLTR:"palantir.com",
}

function logo(ticker: string) {
    const d = CLEARBIT_DOMAINS[ticker]
    return d ? `https://logo.clearbit.com/${d}` : undefined
}

export async function GET(req: NextRequest) {
    const type = (req.nextUrl.searchParams.get("type") ?? "gainers") as "gainers" | "losers" | "active"

    try {
        let stocks: MoverStock[]

        if (type === "active") {
            const snap = await getSnapshots(ACTIVE_TICKERS)
            const sorted = [...(snap.tickers ?? [])].sort((a, b) => (b.day?.v ?? 0) - (a.day?.v ?? 0))
            stocks = sorted.slice(0, 6).map(t => ({
                ticker: t.ticker,
                companyName: t.ticker,
                price: t.day?.c ?? t.lastTrade?.p ?? 0,
                changePct: t.todaysChangePerc ?? 0,
                volume: t.day?.v ?? 0,
                logoUrl: logo(t.ticker),
            }))
        } else {
            const snap = await getMovers(type)
            stocks = (snap.tickers ?? []).slice(0, 6).map(t => ({
                ticker: t.ticker,
                companyName: t.ticker,
                price: t.day?.c ?? t.lastTrade?.p ?? 0,
                changePct: t.todaysChangePerc ?? 0,
                volume: t.day?.v ?? 0,
                logoUrl: logo(t.ticker),
            }))
        }

        const body: MarketsApiResponse<MoverStock[]> = { data: stocks, cachedAt: Date.now() }
        return NextResponse.json(body, {
            headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
        })
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error"
        return NextResponse.json({ error: message }, { status: 502 })
    }
}
