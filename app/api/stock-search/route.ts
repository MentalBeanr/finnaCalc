import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const keywords = searchParams.get("keywords")

    if (!keywords) {
        return NextResponse.json({ error: "Search keywords are required" }, { status: 400 })
    }

    const apiKey = process.env.ALPHA_VANTAGE_API_KEY
    if (!apiKey) {
        return NextResponse.json({ error: "API key is not configured." }, { status: 500 })
    }

    const url = `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${keywords}&apikey=${apiKey}`

    try {
        const response = await fetch(url)
        const data = await response.json()

        if (data.Note || data.Information) {
            return NextResponse.json(
                { error: "API limit may have been reached. Please try again later." },
                { status: 429 }
            )
        }

        if (!data.bestMatches || data.bestMatches.length === 0) {
            return NextResponse.json(
                { error: `No matching symbols found for "${keywords}".` },
                { status: 404 }
            )
        }

        return NextResponse.json(data.bestMatches)
    } catch (error) {
        console.error("Alpha Vantage Search API fetch error:", error)
        return NextResponse.json(
            { error: "Failed to fetch search results from Alpha Vantage." },
            { status: 500 }
        )
    }
}