/**
 * GET /api/markets/quotes?symbols=AAPL,MSFT,...
 *
 * Returns normalised price snapshots for the requested tickers.
 * Logos are resolved from Polygon branding; falls back to Clearbit domain.
 */
import { NextRequest, NextResponse } from "next/server"
import { getSnapshots, getTickerDetail } from "@/lib/markets/polygon"
import type { MarketsApiResponse, QuoteData } from "@/lib/markets/types"

// Map tickers → website domain for Clearbit logo fallback
const DOMAIN_MAP: Record<string, string> = {
    AAPL: "apple.com",
    MSFT: "microsoft.com",
    NVDA: "nvidia.com",
    GOOGL: "google.com",
    AMZN: "amazon.com",
    TSLA: "tesla.com",
    VTI: "vanguard.com",
    QQQ: "invesco.com",
    BND: "vanguard.com",
    JPM: "jpmorganchase.com",
    JNJ: "jnj.com",
    META: "meta.com",
    AMD: "amd.com",
}

function clearbitLogo(ticker: string): string | undefined {
    const domain = DOMAIN_MAP[ticker]
    return domain ? `https://logo.clearbit.com/${domain}` : undefined
}

export async function GET(req: NextRequest) {
    const symbols = req.nextUrl.searchParams.get("symbols")
    if (!symbols) {
        return NextResponse.json({ error: "symbols param required" }, { status: 400 })
    }

    const tickers = symbols.split(",").map(s => s.trim().toUpperCase()).filter(Boolean)

    try {
        const snap = await getSnapshots(tickers)

        // Optionally enrich first ticker with logo (avoid rate-limit on free tier)
        const quotes: QuoteData[] = (snap.tickers ?? []).map(t => ({
            ticker: t.ticker,
            price: t.day?.c ?? t.lastTrade?.p ?? 0,
            change: t.todaysChange ?? 0,
            changePct: t.todaysChangePerc ?? 0,
            volume: t.day?.v ?? 0,
            prevClose: t.prevDay?.c ?? 0,
            open: t.day?.o ?? 0,
            high: t.day?.h ?? 0,
            low: t.day?.l ?? 0,
            logoUrl: clearbitLogo(t.ticker),
        }))

        const body: MarketsApiResponse<QuoteData[]> = { data: quotes, cachedAt: Date.now() }
        return NextResponse.json(body, {
            headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
        })
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error"
        return NextResponse.json({ error: message }, { status: 502 })
    }
}
