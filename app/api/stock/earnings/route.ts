/**
 * GET /api/stock/earnings?symbol=AAPL
 * Returns historical quarterly EPS (actual vs estimate) plus the next upcoming
 * earnings date from Finnhub.
 */
import { NextRequest, NextResponse } from "next/server"
import { getEarnings, getEarningsCalendar } from "@/lib/markets/finnhub"

function toDateStr(d: Date) {
    return d.toISOString().slice(0, 10)
}

export async function GET(req: NextRequest) {
    const symbol = req.nextUrl.searchParams.get("symbol")?.trim().toUpperCase()
    if (!symbol) {
        return NextResponse.json({ error: "symbol required" }, { status: 400 })
    }

    const now = new Date()
    const sixMonthsOut = new Date(now)
    sixMonthsOut.setMonth(sixMonthsOut.getMonth() + 6)

    try {
        const [history, calendar] = await Promise.all([
            getEarnings(symbol),
            getEarningsCalendar(symbol, toDateStr(now), toDateStr(sixMonthsOut))
                .catch(() => ({ earningsCalendar: [] })),
        ])

        // Normalise quarterly history — take up to 8 most recent quarters, oldest first
        const historyNorm = [...history]
            .sort((a, b) => a.period.localeCompare(b.period))
            .slice(-8)
            .map(e => ({
                quarter:  `Q${e.quarter}'${String(e.year).slice(2)}`,
                estimate: e.estimate,
                actual:   e.actual,
                year:     e.year,
                qNum:     e.quarter,
            }))

        // Next upcoming earnings event
        const upcoming = calendar.earningsCalendar?.[0] ?? null

        return NextResponse.json({
            data: {
                history: historyNorm,
                upcoming: upcoming ? {
                    date:             upcoming.date,
                    epsEstimate:      upcoming.epsEstimate,
                    revenueEstimate:  upcoming.revenueEstimate,
                    hour:             upcoming.hour,
                } : null,
            },
        }, {
            headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200" },
        })
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error"
        return NextResponse.json({ error: message }, { status: 502 })
    }
}
