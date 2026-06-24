/**
 * GET /api/markets/quotes?symbols=AAPL,MSFT,...
 *
 * Returns normalised price snapshots for the requested tickers.
 * Logos resolved from Finnhub company profile (cached 30 s via Next fetch).
 */
import { NextRequest, NextResponse } from "next/server"
import { getQuote, getProfile } from "@/lib/markets/finnhub"
import type { MarketsApiResponse, QuoteData } from "@/lib/markets/types"

export async function GET(req: NextRequest) {
    const symbols = req.nextUrl.searchParams.get("symbols")
    if (!symbols) {
        return NextResponse.json({ error: "symbols param required" }, { status: 400 })
    }

    const tickers = symbols.split(",").map(s => s.trim().toUpperCase()).filter(Boolean)

    try {
        // Fetch quotes + profiles in parallel (profile gives us the logo URL)
        const results = await Promise.all(
            tickers.map(async (ticker) => {
                const [q, profile] = await Promise.all([
                    getQuote(ticker),
                    getProfile(ticker).catch(() => null),
                ])
                return { ticker, q, profile }
            })
        )

        const quotes: QuoteData[] = results.map(({ ticker, q, profile }) => ({
            ticker,
            price:       q.c,
            change:      q.d,
            changePct:   q.dp,
            volume:      0,
            prevClose:   q.pc,
            open:        q.o,
            high:        q.h,
            low:         q.l,
            logoUrl:     profile?.logo || undefined,
            companyName: profile?.name || undefined,
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
