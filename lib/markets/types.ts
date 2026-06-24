/** Normalised types used by the markets page — independent of Polygon shape. */

export interface QuoteData {
    ticker: string
    price: number
    change: number        // absolute $ change
    changePct: number     // percent change
    volume: number
    prevClose: number
    open: number
    high: number
    low: number
    logoUrl?: string      // company logo (from Polygon branding or Clearbit)
    companyName?: string
}

export interface IndexQuote {
    name: string
    symbol: string        // e.g. "SPY" as proxy for S&P 500
    price: number
    change: number
    changePct: number
    pts: number[]         // last N closing prices for sparkline
}

export interface NewsArticle {
    id: string
    source: string
    title: string
    summary: string
    publishedAt: string   // ISO string
    url: string
    tickers: string[]
    sentiment: "bull" | "bear" | "neut"
    imageUrl?: string
}

export interface MoverStock {
    ticker: string
    companyName: string
    price: number
    changePct: number
    volume: number
    logoUrl?: string
}

export interface MarketsApiResponse<T> {
    data: T
    cachedAt: number      // epoch ms
    error?: string
}
