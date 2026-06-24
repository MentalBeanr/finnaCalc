/**
 * GET /api/stock/metrics?symbol=AAPL
 * Returns normalised key metrics from Finnhub /stock/metric.
 * Covers 52W range, beta, P/E, EPS, margins, ROE, ROA, dividend yield, etc.
 */
import { NextRequest, NextResponse } from "next/server"
import { getMetrics } from "@/lib/markets/finnhub"

export async function GET(req: NextRequest) {
    const symbol = req.nextUrl.searchParams.get("symbol")?.trim().toUpperCase()
    if (!symbol) {
        return NextResponse.json({ error: "symbol required" }, { status: 400 })
    }

    try {
        const raw = await getMetrics(symbol)
        const m = raw.metric ?? {}

        const data = {
            w52High:          m["52WeekHigh"]                    ?? null,
            w52Low:           m["52WeekLow"]                     ?? null,
            beta:             m["beta"]                           ?? null,
            peTTM:            m["peTTM"]                          ?? null,
            forwardPE:        m["peNormalizedAnnual"]             ?? null,
            epsAnnual:        m["epsBasicExclExtraItemsAnnual"]   ?? m["epsAnnual"] ?? null,
            dividendYield:    m["dividendYieldIndicatedAnnual"]   ?? null,
            priceToSales:     m["psTTM"]                          ?? m["psAnnual"] ?? null,
            priceToBook:      m["pb"]                             ?? null,
            grossMargin:      m["grossMarginTTM"]                 ?? m["grossMarginAnnual"] ?? null,
            netMargin:        m["netProfitMarginTTM"]             ?? m["netProfitMarginAnnual"] ?? null,
            operatingMargin:  m["operatingMarginTTM"]             ?? m["operatingMarginAnnual"] ?? null,
            roe:              m["roeTTM"]                          ?? m["roeAnnual"] ?? null,
            roa:              m["roaTTM"]                          ?? m["roaAnnual"] ?? null,
            currentRatio:     m["currentRatioAnnual"]             ?? null,
            quickRatio:       m["quickRatioAnnual"]               ?? null,
            debtToEquity:     m["totalDebt/totalEquityAnnual"]    ?? m["totalDebtToEquityAnnual"] ?? null,
            avgVolume10D:     m["10DayAverageTradingVolume"]       ?? null,
            revenueGrowthTTM: m["revenueGrowthTTMYoy"]            ?? null,
            epsGrowthTTM:     m["epsGrowthTTMYoy"]                ?? null,
        }

        return NextResponse.json({ data }, {
            headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200" },
        })
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error"
        return NextResponse.json({ error: message }, { status: 502 })
    }
}
