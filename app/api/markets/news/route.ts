/**
 * GET /api/markets/news?ticker=AAPL (ticker optional)
 *
 * Returns the 5 most recent market news articles from Polygon.
 * Sentiment is derived from Polygon's insight data when available,
 * otherwise inferred from title keywords.
 */
import { NextRequest, NextResponse } from "next/server"
import { getNews } from "@/lib/markets/polygon"
import type { MarketsApiResponse, NewsArticle } from "@/lib/markets/types"

function inferSentiment(
    insights: Array<{ ticker: string; sentiment: string }> | undefined,
    title: string,
): "bull" | "bear" | "neut" {
    if (insights && insights.length > 0) {
        const counts = { positive: 0, negative: 0, neutral: 0 }
        for (const i of insights) {
            if (i.sentiment === "positive") counts.positive++
            else if (i.sentiment === "negative") counts.negative++
            else counts.neutral++
        }
        if (counts.positive > counts.negative) return "bull"
        if (counts.negative > counts.positive) return "bear"
        return "neut"
    }

    // Keyword fallback
    const lower = title.toLowerCase()
    const bullWords = ["beat","surge","soar","rally","record","upgrade","gain","rise","top","strong"]
    const bearWords = ["miss","fall","drop","disappoint","cut","downgrade","warn","loss","decline","weak"]
    const bullScore = bullWords.filter(w => lower.includes(w)).length
    const bearScore = bearWords.filter(w => lower.includes(w)).length
    if (bullScore > bearScore) return "bull"
    if (bearScore > bullScore) return "bear"
    return "neut"
}

function timeAgo(isoString: string): string {
    const diff = Date.now() - new Date(isoString).getTime()
    const h = Math.floor(diff / 3_600_000)
    if (h < 1) return `${Math.floor(diff / 60_000)}m ago`
    if (h < 24) return `${h}h ago`
    return `${Math.floor(h / 24)}d ago`
}

export async function GET(req: NextRequest) {
    const ticker = req.nextUrl.searchParams.get("ticker") ?? undefined

    try {
        const raw = await getNews(ticker, 5)

        const articles: NewsArticle[] = (raw.results ?? []).map(a => ({
            id: a.id,
            source: a.publisher?.name ?? "Unknown",
            title: a.title,
            summary: a.description ?? "",
            publishedAt: timeAgo(a.published_utc),
            url: a.article_url,
            tickers: (a.tickers ?? []).slice(0, 3).map(t => `$${t}`),
            sentiment: inferSentiment(a.insights, a.title),
            imageUrl: a.image_url,
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
