/**
 * GET /api/markets/indices
 *
 * Returns market bar data: S&P 500, NASDAQ, DOW, Russell 2K,
 * VIX proxy, 10Y yield proxy, EUR/USD, BTC/USD — each with a
 * sparkline of recent closes.
 *
 * Uses ETF proxies because Finnhub free tier doesn't serve index symbols.
 *   SPY  → S&P 500       QQQ  → NASDAQ-100
 *   DIA  → DOW           IWM  → Russell 2000
 *   VIXY → VIX proxy     TLT  → 10Y yield proxy
 *   FXE  → EUR/USD       BITO → BTC proxy
 */
import { NextResponse } from "next/server"
import { getQuote, getCandles } from "@/lib/markets/finnhub"
import type { MarketsApiResponse, IndexQuote } from "@/lib/markets/types"

const PROXIES = [
    { name: "S&P 500",    symbol: "SPY"  },
    { name: "NASDAQ",     symbol: "QQQ"  },
    { name: "DOW",        symbol: "DIA"  },
    { name: "Russell 2K", symbol: "IWM"  },
    { name: "VIX",        symbol: "VIXY" },
    { name: "10Y Yield",  symbol: "TLT"  },
    { name: "EUR/USD",    symbol: "FXE"  },
    { name: "BTC/USD",    symbol: "BITO" },
]

async function sparkline(symbol: string): Promise<number[]> {
    try {
        const to   = Math.floor(Date.now() / 1000)
        const from = to - 14 * 24 * 3600 // 14 calendar days ≈ 10 trading days
        const c    = await getCandles(symbol, from, to, "D")
        return c.s === "ok" ? c.c.slice(-12) : []
    } catch {
        return []
    }
}

export async function GET() {
    try {
        const results = await Promise.all(
            PROXIES.map(async (p) => {
                const [q, pts] = await Promise.all([getQuote(p.symbol), sparkline(p.symbol)])
                return { p, q, pts }
            })
        )

        const indices: IndexQuote[] = results.map(({ p, q, pts }) => ({
            name:      p.name,
            symbol:    p.symbol,
            price:     q.c,
            change:    q.d,
            changePct: q.dp,
            pts:       pts.length > 0 ? pts : [q.pc, q.c],
        }))

        const body: MarketsApiResponse<IndexQuote[]> = { data: indices, cachedAt: Date.now() }
        return NextResponse.json(body, {
            headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
        })
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error"
        return NextResponse.json({ error: message }, { status: 502 })
    }
}
