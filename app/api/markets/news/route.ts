/**
 * GET /api/markets/news
 *
 * Returns 5 recent general market news articles from Finnhub.
 * Sentiment is inferred from headline keywords.
 */
import { NextResponse } from "next/server"
import { getNews } from "@/lib/markets/finnhub"
import type { MarketsApiResponse, NewsArticle } from "@/lib/markets/types"

function inferSentiment(headline: string): "bull" | "bear" | "neut" {
    const lower = headline.toLowerCase()
    const bull = ["beat","surge","soar","rally","record","upgrade","gain","rise","top","strong","profit","exceed"]
    const bear = ["miss","fall","drop","disappoint","cut","downgrade","warn","loss","decline","weak","layoff","recall"]
    const bs = bull.filter(w => lower.includes(w)).length
    const bs2 = bear.filter(w => lower.includes(w)).length
    if (bs > bs2) return "bull"
    if (bs2 > bs) return "bear"
    return "neut"
}

function timeAgo(unixSec: number): string {
    const diff = Date.now() - unixSec * 1000
    const h = Math.floor(diff / 3_600_000)
    if (h < 1) return `${Math.floor(diff / 60_000)}m ago`
    if (h < 24) return `${h}h ago`
    return `${Math.floor(h / 24)}d ago`
}

export async function GET() {
    try {
        const raw = await getNews(5)

        const articles: NewsArticle[] = raw.map(a => ({
            id:          String(a.id),
            source:      a.source,
            title:       a.headline,
            summary:     a.summary,
            publishedAt: timeAgo(a.datetime),
            url:         a.url,
            tickers:     a.related
                ? a.related.split(",").filter(Boolean).slice(0, 3).map(t => `$${t.trim()}`)
                : [],
            sentiment:   inferSentiment(a.headline),
            imageUrl:    a.image || undefined,
        }))

        const body: MarketsApiResponse<NewsArticle[]> = { data: articles, cachedAt: Date.now() }
        return NextResponse.json(body, {
            headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300" },
        })
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error"
        return NextResponse.json({ error: message }, { status: 502 })
    }
}
