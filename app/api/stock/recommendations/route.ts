/**
 * GET /api/stock/recommendations?symbol=AAPL
 * Returns the most recent analyst recommendation consensus from Finnhub.
 */
import { NextRequest, NextResponse } from "next/server"
import { getRecommendations } from "@/lib/markets/finnhub"

export async function GET(req: NextRequest) {
    const symbol = req.nextUrl.searchParams.get("symbol")?.trim().toUpperCase()
    if (!symbol) {
        return NextResponse.json({ error: "symbol required" }, { status: 400 })
    }

    try {
        const rows = await getRecommendations(symbol)
        const latest = rows[0] ?? null

        if (!latest) {
            return NextResponse.json({ data: null })
        }

        return NextResponse.json({
            data: {
                buy:       latest.buy,
                hold:      latest.hold,
                sell:      latest.sell,
                strongBuy: latest.strongBuy,
                strongSell: latest.strongSell,
                period:    latest.period,
                total:     latest.buy + latest.hold + latest.sell + latest.strongBuy + latest.strongSell,
            },
        }, {
            headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200" },
        })
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error"
        return NextResponse.json({ error: message }, { status: 502 })
    }
}
