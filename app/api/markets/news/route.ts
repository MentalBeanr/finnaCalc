/**
 * GET /api/markets/news
 *
 * Fetches real-time market news from multiple RSS feeds in parallel:
 *   - Reuters Business News
 *   - CNBC Markets
 *   - MarketWatch Top Stories
 *
 * Falls back to Finnhub if all RSS sources fail.
 * Cache: 60 s (down from 120 s), articles sorted newest-first.
 */
import { NextResponse } from "next/server"
import { getNews } from "@/lib/markets/finnhub"
import type { NewsArticle } from "@/lib/markets/types"

// ── RSS sources ───────────────────────────────────────────────────────────────

const RSS_SOURCES = [
    { url: "https://feeds.reuters.com/reuters/businessNews",                                                                   name: "Reuters"     },
    { url: "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=15839135",                              name: "CNBC"        },
    { url: "https://feeds.marketwatch.com/marketwatch/topstories/",                                                            name: "MarketWatch" },
    { url: "https://feeds.content.dowjones.io/public/rss/mw_realtimeheadlines",                                               name: "MarketWatch" },
]

// ── Minimal RSS parser (no dependencies) ─────────────────────────────────────

interface RawItem { title: string; link: string; description: string; pubDate: string; source: string }

function extractTag(xml: string, tag: string): string {
    const re = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i")
    const m = xml.match(re)
    if (!m) return ""
    return m[1]
        .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")   // unwrap CDATA
        .replace(/<[^>]+>/g, " ")                         // strip HTML tags
        .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ")
        .replace(/\s+/g, " ").trim()
}

function extractLink(item: string): string {
    // <link>url</link>  or  CDATA-wrapped  or  href attribute  or  <guid>
    const m1 = item.match(/<link>\s*([^<\s]+)\s*<\/link>/i)
    if (m1) return m1[1]
    const m2 = item.match(/<link><!\[CDATA\[([^\]]+)\]\]><\/link>/i)
    if (m2) return m2[1]
    const m3 = item.match(/<link[^>]+href="([^"]+)"/i)
    if (m3) return m3[1]
    const m4 = item.match(/<guid[^>]*>\s*(https?:\/\/[^<\s]+)\s*<\/guid>/i)
    if (m4) return m4[1]
    return ""
}

function parseRSS(xml: string, sourceName: string): RawItem[] {
    const items = xml.match(/<item[\s\S]*?<\/item>/gi) ?? []
    return items
        .slice(0, 12)
        .map(item => ({
            title:       extractTag(item, "title"),
            link:        extractLink(item),
            description: extractTag(item, "description"),
            pubDate:     extractTag(item, "pubDate"),
            source:      sourceName,
        }))
        .filter(i => i.title && i.link)
}

async function fetchRSS(source: { url: string; name: string }): Promise<RawItem[]> {
    try {
        const res = await fetch(source.url, {
            headers: { "User-Agent": "finnaCalc/1.0 (market news aggregator)" },
            signal:  AbortSignal.timeout(5_000),
            cache:   "no-store",
        })
        if (!res.ok) return []
        return parseRSS(await res.text(), source.name)
    } catch {
        return []
    }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function parsePubDate(str: string): number {
    if (!str) return Date.now()
    const d = new Date(str)
    return isNaN(d.getTime()) ? Date.now() : d.getTime()
}

function timeAgo(ms: number): string {
    const diff = Date.now() - ms
    const m = Math.floor(diff / 60_000)
    if (m < 1)  return "just now"
    if (m < 60) return `${m}m ago`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h ago`
    return `${Math.floor(h / 24)}d ago`
}

function inferSentiment(headline: string): "bull" | "bear" | "neut" {
    const lower = headline.toLowerCase()
    const bull = ["beat","surge","soar","rally","record","upgrade","gain","rise","top","strong","profit","exceed","jump","climb","boost","recover","high"]
    const bear = ["miss","fall","drop","disappoint","cut","downgrade","warn","loss","decline","weak","layoff","recall","slump","slide","plunge","crash","low","fear","risk"]
    const b = bull.filter(w => lower.includes(w)).length
    const r = bear.filter(w => lower.includes(w)).length
    if (b > r) return "bull"
    if (r > b) return "bear"
    return "neut"
}

function extractTickers(text: string): string[] {
    // Explicit $TICKER notation used by many financial sites
    const explicit = [...text.matchAll(/\$([A-Z]{1,5})\b/g)].map(m => `$${m[1]}`)
    return [...new Set(explicit)].slice(0, 3)
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET() {
    const results = await Promise.all(RSS_SOURCES.map(fetchRSS))
    const flat = results.flat()

    // Fallback: all RSS sources failed — use Finnhub
    if (flat.length === 0) {
        try {
            const raw = await getNews(10)
            const articles: NewsArticle[] = raw.map(a => ({
                id:          String(a.id),
                source:      a.source,
                title:       a.headline,
                summary:     a.summary,
                publishedAt: timeAgo(a.datetime * 1000),
                url:         a.url,
                tickers:     a.related ? a.related.split(",").filter(Boolean).slice(0, 3).map(t => `$${t.trim()}`) : [],
                sentiment:   inferSentiment(a.headline),
            }))
            return NextResponse.json({ data: articles, cachedAt: Date.now() }, {
                headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
            })
        } catch { /* fall through to empty */ }
    }

    // Deduplicate by URL, sort newest-first, cap at 12
    const seen = new Set<string>()
    const articles: NewsArticle[] = flat
        .filter(i => { if (seen.has(i.link)) return false; seen.add(i.link); return true })
        .sort((a, b) => parsePubDate(b.pubDate) - parsePubDate(a.pubDate))
        .slice(0, 12)
        .map((item, idx) => ({
            id:          String(idx),
            source:      item.source,
            title:       item.title,
            summary:     item.description ? item.description.slice(0, 240) : item.title,
            publishedAt: timeAgo(parsePubDate(item.pubDate)),
            url:         item.link,
            tickers:     extractTickers(item.title + " " + item.description),
            sentiment:   inferSentiment(item.title),
        }))

    return NextResponse.json({ data: articles, cachedAt: Date.now() }, {
        headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
    })
}
