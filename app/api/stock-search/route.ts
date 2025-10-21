import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const keywords = searchParams.get("keywords")

    if (!keywords) {
        return NextResponse.json({ error: "Search keywords are required" }, { status: 400 })
    }

    const apiKey = process.env.FINNHUB_API_KEY
    if (!apiKey) {
        return NextResponse.json({ error: "API key is not configured." }, { status: 500 })
    }

    const url = `https://finnhub.io/api/v1/search?q=${keywords}&token=${apiKey}`

    try {
        const response = await fetch(url)
        const data = await response.json()

        if (!response.ok) {
            throw new Error(data.error || "Failed to fetch search results from Finnhub.")
        }

        if (!data.result || data.result.length === 0) {
            return NextResponse.json(
                { error: `No matching symbols found for "${keywords}".` },
                { status: 404 }
            )
        }

        // Reformat the data to match the component's expectation
        const formattedResults = data.result.map((item: any) => ({
            "1. symbol": item.symbol,
            "2. name": item.description,
            "4. region": item.type // Finnhub provides 'type' which is a good substitute for region
        }));

        return NextResponse.json(formattedResults)
    } catch (error: any) {
        console.error("Finnhub Search API fetch error:", error)
        return NextResponse.json(
            { error: "Failed to fetch search results from Finnhub." },
            { status: 500 }
        )
    }
}