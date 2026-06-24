/**
 * GET /api/stock-search?q=<query>
 * Symbol autocomplete via Finnhub /search. Returns up to 8 US-listed results.
 */
import { NextRequest, NextResponse } from "next/server"

interface FinnhubSearchResult {
    description: string
    displaySymbol: string
    symbol: string
    type: string
}

interface FinnhubSearchResponse {
    count: number
    result: FinnhubSearchResult[]
}

export async function GET(req: NextRequest) {
    const q = req.nextUrl.searchParams.get("q")?.trim()
    if (!q || q.length < 1) {
        return NextResponse.json({ results: [] })
    }

    const key = process.env.FINNHUB_API_KEY
    if (!key) {
        return NextResponse.json({ error: "API key not configured" }, { status: 500 })
    }

    try {
        const url = new URL("https://finnhub.io/api/v1/search")
        url.searchParams.set("q", q)
        url.searchParams.set("exchange", "US")
        url.searchParams.set("token", key)

        const res = await fetch(url.toString(), { next: { revalidate: 60 } })
        if (!res.ok) {
            return NextResponse.json({ results: [] })
        }

        const data = (await res.json()) as FinnhubSearchResponse
        const results = (data.result ?? [])
            .filter(r => r.type === "Common Stock" || r.type === "ETP")
            .slice(0, 8)
            .map(r => ({
                symbol: r.displaySymbol,
                name: r.description,
                type: r.type === "ETP" ? "ETF" : "Stock",
            }))

        return NextResponse.json({ results }, {
            headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
        })
    } catch {
        return NextResponse.json({ results: [] })
    }
}
