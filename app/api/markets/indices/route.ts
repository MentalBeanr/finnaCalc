/**
 * GET /api/markets/indices
 *
 * Returns market summary bar data: S&P 500, NASDAQ, DOW, Russell 2K,
 * VIX, 10Y yield proxy, EUR/USD, BTC/USD — each with a sparkline of
 * recent closes for the mini chart.
 *
 * Proxy approach: use ETF tickers as proxies for indices (Polygon free
 * tier does not serve index symbols like SPX directly).
 *   SPY  → S&P 500
 *   QQQ  → NASDAQ-100
 *   DIA  → DOW
 *   IWM  → Russell 2000
 *   VIXY → VIX proxy
 *   TLT  → 10Y yield proxy (inverse)
 *   FXE  → EUR/USD proxy
 *   BITO → BTC proxy
 */
import { NextResponse } from "next/server"
import { getSnapshots, getAggs } from "@/lib/markets/polygon"
import type { MarketsApiResponse, IndexQuote } from "@/lib/markets/types"

const PROXIES = [
    { name: "S&P 500",    symbol: "SPY",  display: "SPY"  },
    { name: "NASDAQ",     symbol: "QQQ",  display: "QQQ"  },
    { name: "DOW",        symbol: "DIA",  display: "DIA"  },
    { name: "Russell 2K", symbol: "IWM",  display: "IWM"  },
    { name: "VIX",        symbol: "VIXY", display: "VIXY" },
    { name: "10Y Yield",  symbol: "TLT",  display: "TLT"  },
    { name: "EUR/USD",    symbol: "FXE",  display: "FXE"  },
    { name: "BTC/USD",    symbol: "BITO", display: "BITO" },
]

// Fetch 10-day closing prices for sparklines
async function getSparkline(symbol: string): Promise<number[]> {
    try {
        const to = new Date()
        const from = new Date()
        from.setDate(from.getDate() - 14) // 14 calendar days → ~10 trading days
        const toStr = to.toISOString().slice(0, 10)
        const fromStr = from.toISOString().slice(0, 10)
        const aggs = await getAggs(symbol, fromStr, toStr, 1, "day")
        return (aggs.results ?? []).slice(-12).map(b => b.c)
    } catch {
        return []
    }
}

export async function GET() {
    try {
        const tickers = PROXIES.map(p => p.symbol)
        const [snap] = await Promise.all([getSnapshots(tickers)])

        const quoteMap = new Map(
            (snap.tickers ?? []).map(t => [t.ticker, t])
        )

        // Fetch sparklines in parallel (best-effort)
        const sparklines = await Promise.all(PROXIES.map(p => getSparkline(p.symbol)))

        const indices: IndexQuote[] = PROXIES.map((p, i) => {
            const t = quoteMap.get(p.symbol)
            return {
                name: p.name,
                symbol: p.display,
                price: t?.day?.c ?? t?.lastTrade?.p ?? 0,
                change: t?.todaysChange ?? 0,
                changePct: t?.todaysChangePerc ?? 0,
                pts: sparklines[i].length > 0 ? sparklines[i] : [0],
            }
        })

        const body: MarketsApiResponse<IndexQuote[]> = { data: indices, cachedAt: Date.now() }
        return NextResponse.json(body, {
            headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
        })
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error"
        return NextResponse.json({ error: message }, { status: 502 })
    }
}
