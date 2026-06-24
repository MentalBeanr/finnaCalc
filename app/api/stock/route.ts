/**
 * GET /api/stock?symbol=AAPL
 * Returns real-time quote + company profile for a single symbol.
 */
import { NextRequest, NextResponse } from "next/server"
import { getQuote, getProfile } from "@/lib/markets/finnhub"

export async function GET(req: NextRequest) {
    const symbol = req.nextUrl.searchParams.get("symbol")?.trim().toUpperCase()
    if (!symbol) {
        return NextResponse.json({ error: "symbol param required" }, { status: 400 })
    }

    try {
        const [quote, profile] = await Promise.all([
            getQuote(symbol),
            getProfile(symbol).catch(() => null),
        ])

        const data = {
            symbol,
            name: profile?.name ?? symbol,
            logo: profile?.logo ?? null,
            industry: profile?.finnhubIndustry ?? null,
            weburl: profile?.weburl ?? null,
            marketCap: profile?.marketCapitalization
                ? profile.marketCapitalization * 1_000_000
                : null,
            price:     quote.c,
            change:    quote.d,
            changePct: quote.dp,
            open:      quote.o,
            high:      quote.h,
            low:       quote.l,
            prevClose: quote.pc,
        }

        return NextResponse.json({ data }, {
            headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
        })
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error"
        return NextResponse.json({ error: message }, { status: 502 })
    }
}
