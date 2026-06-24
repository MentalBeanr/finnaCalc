/**
 * Thin Finnhub REST client — server-side only.
 * Free tier: 60 API calls / minute. Never import in client components.
 */

const BASE = "https://finnhub.io/api/v1"

function apiKey() {
    const key = process.env.FINNHUB_API_KEY
    if (!key) throw new Error("FINNHUB_API_KEY is not set in environment variables")
    return key
}

async function get<T>(path: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`${BASE}${path}`)
    url.searchParams.set("token", apiKey())
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
    const res = await fetch(url.toString(), { next: { revalidate: 30 } })
    if (!res.ok) {
        const text = await res.text().catch(() => res.statusText)
        throw new Error(`Finnhub ${path} → ${res.status}: ${text}`)
    }
    return res.json() as Promise<T>
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface FinnhubQuote {
    c:  number   // current price
    d:  number   // change ($)
    dp: number   // change (%)
    h:  number   // day high
    l:  number   // day low
    o:  number   // open
    pc: number   // previous close
    t:  number   // timestamp
}

export interface FinnhubProfile {
    ticker:                string
    name:                  string
    logo:                  string   // logo URL
    weburl:                string
    finnhubIndustry:       string
    marketCapitalization:  number
    shareOutstanding:      number
}

export interface FinnhubNewsArticle {
    id:       number
    datetime: number   // unix timestamp
    headline: string
    summary:  string
    source:   string
    url:      string
    image:    string
    related:  string   // comma-separated tickers e.g. "AAPL,MSFT"
    category: string
}

export interface FinnhubCandles {
    s: string     // "ok" | "no_data"
    c: number[]   // closes
    h: number[]
    l: number[]
    o: number[]
    v: number[]
    t: number[]   // unix timestamps
}

// ── API calls ─────────────────────────────────────────────────────────────────

/** Real-time quote for a single symbol. */
export const getQuote = (symbol: string) =>
    get<FinnhubQuote>("/quote", { symbol })

/** Company profile including logo URL. */
export const getProfile = (symbol: string) =>
    get<FinnhubProfile>("/stock/profile2", { symbol })

/** Fetch OHLCV candles. resolution: "1","5","15","30","60","D","W","M" */
export const getCandles = (symbol: string, from: number, to: number, resolution = "D") =>
    get<FinnhubCandles>("/stock/candle", {
        symbol,
        resolution,
        from: String(from),
        to: String(to),
    })

/** General market news (up to count articles). */
export const getNews = (count = 5) =>
    get<FinnhubNewsArticle[]>("/news", { category: "general", minId: "0" })
        .then(articles => articles.slice(0, count))
