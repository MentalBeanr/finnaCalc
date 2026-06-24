/**
 * GET /api/markets/candles?symbol=AAPL&range=1Y
 * Returns OHLCV candle data from Finnhub for the requested range.
 * Used by the PriceChart to display real price history.
 */
import { NextRequest, NextResponse } from "next/server"
import { getCandles } from "@/lib/markets/finnhub"

const RANGE: Record<string, { days: number; resolution: string; cache: number }> = {
    "1D":  { days: 1,    resolution: "60", cache: 60   },
    "5D":  { days: 5,    resolution: "60", cache: 120  },
    "1M":  { days: 30,   resolution: "D",  cache: 3600 },
    "3M":  { days: 90,   resolution: "D",  cache: 3600 },
    "6M":  { days: 180,  resolution: "D",  cache: 3600 },
    "1Y":  { days: 365,  resolution: "D",  cache: 3600 },
    "2Y":  { days: 730,  resolution: "W",  cache: 7200 },
    "5Y":  { days: 1825, resolution: "W",  cache: 7200 },
    "MAX": { days: 7300, resolution: "M",  cache: 7200 },
}

export async function GET(req: NextRequest) {
    const symbol = req.nextUrl.searchParams.get("symbol")?.trim().toUpperCase()
    const range  = req.nextUrl.searchParams.get("range") ?? "1Y"

    if (!symbol) {
        return NextResponse.json({ error: "symbol required" }, { status: 400 })
    }

    const cfg = RANGE[range] ?? RANGE["1Y"]
    const to   = Math.floor(Date.now() / 1000)
    const from = to - cfg.days * 86_400

    try {
        const candles = await getCandles(symbol, from, to, cfg.resolution)

        if (candles.s !== "ok" || !candles.c?.length) {
            return NextResponse.json({ data: null })
        }

        return NextResponse.json({
            data: {
                closes:     candles.c,
                highs:      candles.h,
                lows:       candles.l,
                opens:      candles.o,
                volumes:    candles.v,
                timestamps: candles.t,
            },
        }, {
            headers: {
                "Cache-Control": `public, s-maxage=${cfg.cache}, stale-while-revalidate=${cfg.cache * 2}`,
            },
        })
    } catch {
        return NextResponse.json({ data: null })
    }
}
