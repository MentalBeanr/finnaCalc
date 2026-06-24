/**
 * Thin Polygon.io REST client. All calls go server-side only — never import
 * this in a client component. The API key stays in the server environment.
 */

const BASE = "https://api.polygon.io"

function apiKey() {
    const key = process.env.POLYGON_API_KEY
    if (!key) throw new Error("POLYGON_API_KEY is not set in environment variables")
    return key
}

async function get<T>(path: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`${BASE}${path}`)
    url.searchParams.set("apiKey", apiKey())
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)

    const res = await fetch(url.toString(), {
        next: { revalidate: 30 }, // cache 30s
    })
    if (!res.ok) {
        const text = await res.text().catch(() => res.statusText)
        throw new Error(`Polygon ${path} → ${res.status}: ${text}`)
    }
    return res.json() as Promise<T>
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PolygonQuote {
    ticker: string
    todaysChangePerc: number
    todaysChange: number
    updated: number
    day: { o: number; h: number; l: number; c: number; v: number; vw: number }
    lastQuote: { P: number; S: number; p: number; s: number; t: number }
    lastTrade: { c: number[]; i: string; p: number; s: number; t: number; x: number }
    min: { av: number; c: number; h: number; l: number; o: number; v: number; vw: number }
    prevDay: { o: number; h: number; l: number; c: number; v: number; vw: number }
}

export interface PolygonSnapshotResponse {
    status: string
    tickers: PolygonQuote[]
}

export interface PolygonTickerDetail {
    ticker: string
    name: string
    branding?: {
        logo_url?: string
        icon_url?: string
    }
    homepage_url?: string
}

export interface PolygonTickerDetailResponse {
    status: string
    results: PolygonTickerDetail
}

export interface PolygonNewsArticle {
    id: string
    publisher: { name: string; homepage_url: string; logo_url: string; favicon_url: string }
    title: string
    author: string
    published_utc: string
    article_url: string
    tickers: string[]
    description: string
    image_url?: string
    insights?: Array<{ ticker: string; sentiment: "positive" | "negative" | "neutral"; sentiment_reasoning: string }>
}

export interface PolygonNewsResponse {
    status: string
    results: PolygonNewsArticle[]
    next_url?: string
}

export interface PolygonAggBar {
    o: number; h: number; l: number; c: number; v: number; vw: number; t: number; n: number
}

export interface PolygonAggsResponse {
    ticker: string
    status: string
    resultsCount: number
    results: PolygonAggBar[]
}

// ── API calls ─────────────────────────────────────────────────────────────────

/** Snapshot for a list of stock tickers (prices, day change, volume). */
export function getSnapshots(tickers: string[]) {
    return get<PolygonSnapshotResponse>(
        `/v2/snapshot/locale/us/markets/stocks/tickers`,
        { tickers: tickers.join(",") },
    )
}

/** Snapshot for crypto tickers (e.g. X:BTCUSD). */
export function getCryptoSnapshots(tickers: string[]) {
    return get<PolygonSnapshotResponse>(
        `/v2/snapshot/locale/global/markets/crypto/tickers`,
        { tickers: tickers.join(",") },
    )
}

/** Snapshot for forex tickers (e.g. C:EURUSD). */
export function getForexSnapshots(tickers: string[]) {
    return get<PolygonSnapshotResponse>(
        `/v2/snapshot/locale/global/markets/forex/tickers`,
        { tickers: tickers.join(",") },
    )
}

/** Aggregate bars (OHLCV) for a single ticker over a date range. */
export function getAggs(ticker: string, from: string, to: string, multiplier = 1, timespan = "day") {
    return get<PolygonAggsResponse>(
        `/v2/aggs/ticker/${ticker}/range/${multiplier}/${timespan}/${from}/${to}`,
        { adjusted: "true", sort: "asc", limit: "365" },
    )
}

/** Latest market news, optionally filtered by ticker. */
export function getNews(ticker?: string, limit = 5) {
    const params: Record<string, string> = { limit: String(limit), order: "desc", sort: "published_utc" }
    if (ticker) params["ticker"] = ticker
    return get<PolygonNewsResponse>(`/v2/reference/news`, params)
}

/** Company details including branding (logo URL). */
export function getTickerDetail(ticker: string) {
    return get<PolygonTickerDetailResponse>(`/v3/reference/tickers/${ticker}`)
}

/** Top gainers or losers for the current trading day. */
export function getMovers(direction: "gainers" | "losers") {
    return get<PolygonSnapshotResponse>(
        `/v2/snapshot/locale/us/markets/stocks/${direction}`,
    )
}
