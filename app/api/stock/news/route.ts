/**
 * GET /api/stock/news?symbol=AAPL
 * Returns up to 12 recent company news articles from Finnhub /company-news.
 * Sentiment is inferred from headline keywords.
 */
import { NextRequest, NextResponse } from "next/server"
import { getCompanyNews } from "@/lib/markets/finnhub"

const BULLISH = ["surge", "beat", "record", "rally", "upgrade", "buy", "strong", "grow", "rise", "soar", "profit", "gain"]
const BEARISH  = ["fall", "drop", "miss", "decline", "downgrade", "sell", "weak", "cut", "loss", "slump", "warn", "plunge"]

function sentiment(headline: string): "Bullish" | "Bearish" | "Neutral" {
    const h = headline.toLowerCase()
    const b = BULLISH.filter(w => h.includes(w)).length
    const n = BEARISH.filter(w => h.includes(w)).length
    return b > n ? "Bullish" : n > b ? "Bearish" : "Neutral"
}

function timeAgo(unix: number): string {
    const diffMs = Date.now() - unix * 1000
    const h = Math.floor(diffMs / 3_600_000)
    if (h < 1)  return "Just now"
    if (h < 24) return `${h}h ago`
    const d = Math.floor(h / 24)
    if (d < 7)  return `${d}d ago`
    return new Date(unix * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function toDateStr(d: Date) {
    return d.toISOString().slice(0, 10)
}

export async function GET(req: NextRequest) {
    const symbol = req.nextUrl.searchParams.get("symbol")?.trim().toUpperCase()
    if (!symbol) {
        return NextResponse.json({ error: "symbol required" }, { status: 400 })
    }

    const to   = new Date()
    const from = new Date(to)
    from.setDate(from.getDate() - 30) // last 30 days

    try {
        const articles = await getCompanyNews(symbol, toDateStr(from), toDateStr(to))

        const data = articles
            .filter(a => a.headline && a.source)
            .slice(0, 12)
            .map(a => ({
                id:        a.id,
                headline:  a.headline,
                source:    a.source,
                summary:   a.summary,
                url:       a.url,
                image:     a.image,
                timeAgo:   timeAgo(a.datetime),
                sentiment: sentiment(a.headline),
            }))

        return NextResponse.json({ data }, {
            headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
        })
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error"
        return NextResponse.json({ error: message }, { status: 502 })
    }
}
