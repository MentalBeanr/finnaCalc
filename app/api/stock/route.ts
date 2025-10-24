import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const symbol = searchParams.get("symbol");

    if (!symbol) {
        return NextResponse.json({ error: "Symbol is required" }, { status: 400 });
    }

    const apiKey = process.env.FMP_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: "API key is not configured on the server." }, { status: 500 });
    }

    // --- FMP Endpoints ---
    const quoteUrl = `https://financialmodelingprep.com/api/v3/quote/${symbol}?apikey=${apiKey}`;
    const profileUrl = `https://financialmodelingprep.com/api/v3/profile/${symbol}?apikey=${apiKey}`;
    const timeSeriesUrl = `https://financialmodelingprep.com/api/v3/historical-price-full/${symbol}?timeseries=30&apikey=${apiKey}`;


    try {
        const [quoteResponse, profileResponse, timeSeriesResponse] = await Promise.all([
            fetch(quoteUrl),
            fetch(profileUrl),
            fetch(timeSeriesUrl),
        ]);

        const quoteData = await quoteResponse.json();
        const profileData = await profileResponse.json();
        const timeSeriesData = await timeSeriesResponse.json();

        // --- Error Checks ---
        if (!quoteData || quoteData.length === 0) {
            return NextResponse.json({ error: `Could not find a valid stock quote for the symbol: ${symbol}` }, { status: 404 });
        }
        if (!profileData || profileData.length === 0) {
            return NextResponse.json({ error: `Could not find company overview data for the symbol: ${symbol}` }, { status: 404 });
        }
        if (!timeSeriesData || !timeSeriesData.historical) {
            return NextResponse.json({ error: `Could not find historical data for the symbol: ${symbol}` }, { status: 404 });
        }

        const singleQuote = quoteData[0];
        const singleProfile = profileData[0];

        // Reformat data to match the structure your component expects
        const combinedData = {
            quote: {
                "01. symbol": singleQuote.symbol,
                "05. price": singleQuote.price,
                "09. change": singleQuote.change,
                "10. change percent": `${singleQuote.changesPercentage}%`,
            },
            overview: {
                Name: singleProfile.companyName,
                Description: singleProfile.description || "No description available.",
                MarketCapitalization: singleProfile.mktCap,
                PERatio: singleQuote.pe,
                Logo: singleProfile.image, // <-- ADDED THIS LINE
            },
            timeSeries: timeSeriesData.historical.reduce((acc: any, bar: any) => {
                acc[bar.date] = {
                    "1. open": bar.open,
                    "2. high": bar.high,
                    "3. low": bar.low,
                    "4. close": bar.close,
                    "5. volume": bar.volume,
                };
                return acc;
            }, {}),
        };

        return NextResponse.json(combinedData);

    } catch (error) {
        console.error("FMP API fetch error:", error);
        return NextResponse.json(
            { error: "An unexpected error occurred while fetching from FMP." },
            { status: 500 }
        );
    }
}