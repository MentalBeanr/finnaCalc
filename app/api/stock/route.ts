import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const symbol = searchParams.get("symbol")

    if (!symbol) {
        return NextResponse.json({ error: "Symbol is required" }, { status: 400 })
    }

    const apiKey = process.env.ALPHA_VANTAGE_API_KEY
    if (!apiKey) {
        return NextResponse.json({ error: "API key is not configured on the server." }, { status: 500 })
    }

    const quoteUrl = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`
    const overviewUrl = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${apiKey}`
    const timeSeriesUrl = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${apiKey}`

    try {
        const [quoteResponse, overviewResponse, timeSeriesResponse] = await Promise.all([
            fetch(quoteUrl),
            fetch(overviewUrl),
            fetch(timeSeriesUrl),
        ])

        const quoteData = await quoteResponse.json()
        const overviewData = await overviewResponse.json()
        const timeSeriesData = await timeSeriesResponse.json()

        // Check for API limit messages from Alpha Vantage
        if (
            quoteData.Note ||
            quoteData.Information ||
            overviewData.Note ||
            overviewData.Information ||
            timeSeriesData.Note ||
            timeSeriesData.Information
        ) {
            return NextResponse.json(
                {
                    error:
                        "API limit may have been reached, or the API key is invalid. Please try again later.",
                },
                { status: 429 } // 429 Too Many Requests
            )
        }

        // Check if the global quote object is empty or doesn't exist
        if (!quoteData["Global Quote"] || Object.keys(quoteData["Global Quote"]).length === 0) {
            return NextResponse.json(
                { error: `Could not find a valid stock quote for the symbol: ${symbol}` },
                { status: 404 }
            )
        }

        // Check if the overview data is empty or lacks a critical field like 'Symbol'
        if (!overviewData || !overviewData.Symbol) {
            return NextResponse.json(
                { error: `Could not find company overview data for the symbol: ${symbol}` },
                { status: 404 }
            )
        }

        if (!timeSeriesData["Time Series (Daily)"]) {
            return NextResponse.json(
                { error: `Could not find historical data for the symbol: ${symbol}` },
                { status: 404 }
            )
        }

        const combinedData = {
            quote: quoteData["Global Quote"],
            overview: overviewData,
            timeSeries: timeSeriesData["Time Series (Daily)"],
        }

        return NextResponse.json(combinedData)
    } catch (error) {
        console.error("Alpha Vantage API fetch error:", error)
        return NextResponse.json(
            { error: "An unexpected error occurred while fetching from Alpha Vantage." },
            { status: 500 }
        )
    }
}