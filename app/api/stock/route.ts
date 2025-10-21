import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const symbol = searchParams.get("symbol")

    if (!symbol) {
        return NextResponse.json({ error: "Symbol is required" }, { status: 400 })
    }

    const apiKey = process.env.FINNHUB_API_KEY
    if (!apiKey) {
        return NextResponse.json({ error: "API key is not configured on the server." }, { status: 500 })
    }

    // Finnhub endpoints
    const quoteUrl = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`
    const profileUrl = `https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${apiKey}`

    // For the chart, we get daily candles for the past year
    const to = Math.floor(Date.now() / 1000);
    const from = to - (365 * 24 * 60 * 60); // 365 days ago
    const timeSeriesUrl = `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=D&from=${from}&to=${to}&token=${apiKey}`

    try {
        const [quoteResponse, profileResponse, timeSeriesResponse] = await Promise.all([
            fetch(quoteUrl),
            fetch(profileUrl),
            fetch(timeSeriesUrl),
        ]);

        const quoteData = await quoteResponse.json()
        const profileData = await profileResponse.json()
        const timeSeriesData = await timeSeriesResponse.json()

        if (quoteResponse.status === 429 || profileResponse.status === 429 || timeSeriesResponse.status === 429) {
            return NextResponse.json(
                { error: "API limit may have been reached. Please try again later." },
                { status: 429 }
            )
        }

        if (!quoteData || typeof quoteData.c === 'undefined') {
            return NextResponse.json(
                { error: `Could not find a valid stock quote for the symbol: ${symbol}` },
                { status: 404 }
            )
        }

        if (!profileData || !profileData.name) {
            return NextResponse.json(
                { error: `Could not find company overview data for the symbol: ${symbol}` },
                { status: 404 }
            )
        }

        if (timeSeriesData.s !== 'ok') {
            return NextResponse.json(
                { error: `Could not find historical data for the symbol: ${symbol}` },
                { status: 404 }
            )
        }

        // Reformat data to match the structure your component expects from Alpha Vantage
        const combinedData = {
            quote: {
                "01. symbol": symbol,
                "05. price": quoteData.c, // current price
                "09. change": quoteData.d, // change
                "10. change percent": `${quoteData.dp}%`, // percent change
            },
            overview: {
                Name: profileData.name,
                Description: "Description not available from this API.", // Finnhub basic plan doesn't include description
                MarketCapitalization: profileData.marketCapitalization * 1000000, // It's in millions
                PERatio: "N/A", // Not in basic quote/profile
            },
            // Reformat time series data
            timeSeries: timeSeriesData.t.reduce((acc: any, timestamp: number, index: number) => {
                const date = new Date(timestamp * 1000).toISOString().split('T')[0];
                acc[date] = {
                    "1. open": timeSeriesData.o[index],
                    "2. high": timeSeriesData.h[index],
                    "3. low": timeSeriesData.l[index],
                    "4. close": timeSeriesData.c[index],
                    "5. volume": timeSeriesData.v[index]
                };
                return acc;
            }, {})
        };

        return NextResponse.json(combinedData);
    } catch (error) {
        console.error("Finnhub API fetch error:", error)
        return NextResponse.json(
            { error: "An unexpected error occurred while fetching from Finnhub." },
            { status: 500 }
        )
    }
}