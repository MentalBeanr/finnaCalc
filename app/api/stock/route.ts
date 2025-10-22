import { NextRequest, NextResponse } from "next/server";
import { format } from 'date-fns';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const symbol = searchParams.get("symbol");

    if (!symbol) {
        return NextResponse.json({ error: "Symbol is required" }, { status: 400 });
    }

    const apiKey = process.env.POLYGON_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: "API key is not configured on the server." }, { status: 500 });
    }

    // --- Polygon.io Endpoints (Free Tier Compatible) ---
    const quoteUrl = `https://api.polygon.io/v2/aggs/ticker/${symbol}/prev?apiKey=${apiKey}`;
    const profileUrl = `https://api.polygon.io/v3/reference/tickers/${symbol}?apiKey=${apiKey}`;
    const to = format(new Date(), 'yyyy-MM-dd');
    const from = format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
    const timeSeriesUrl = `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/1/day/${from}/${to}?apiKey=${apiKey}`;

    try {
        const [quoteResponse, profileResponse, timeSeriesResponse] = await Promise.all([
            fetch(quoteUrl),
            fetch(profileUrl),
            fetch(timeSeriesUrl),
        ]);

        const quoteData = await quoteResponse.json();
        const profileData = await profileResponse.json();
        const timeSeriesData = await timeSeriesResponse.json();

        // --- CORRECTED ERROR CHECKS ---
        // Allow "OK" or "DELAYED" status for free tier accounts
        if (!["OK", "DELAYED"].includes(quoteData.status) || !quoteData.results || quoteData.resultsCount === 0) {
            return NextResponse.json({ error: `Could not find a valid stock quote for the symbol: ${symbol}` }, { status: 404 });
        }
        if (profileData.status !== "OK" || !profileData.results) {
            return NextResponse.json({ error: `Could not find company overview data for the symbol: ${symbol}` }, { status: 404 });
        }
        if (!["OK", "DELAYED"].includes(timeSeriesData.status) || !timeSeriesData.results) {
            return NextResponse.json({ error: `Could not find historical data for the symbol: ${symbol}` }, { status: 404 });
        }

        const prevDay = quoteData.results[0];

        // Reformat data to match the structure your component expects
        const combinedData = {
            quote: {
                "01. symbol": symbol,
                "05. price": prevDay.c, // Previous day's close price
                "09. change": (prevDay.c - prevDay.o).toFixed(2), // Calculate change from open to close
                "10. change percent": `${(((prevDay.c - prevDay.o) / prevDay.o) * 100).toFixed(2)}%`,
            },
            overview: {
                Name: profileData.results.name,
                Description: profileData.results.description || "No description available.",
                MarketCapitalization: profileData.results.market_cap,
                PERatio: "N/A",
            },
            timeSeries: timeSeriesData.results.reduce((acc: any, bar: any) => {
                const date = format(new Date(bar.t), 'yyyy-MM-dd');
                acc[date] = {
                    "1. open": bar.o,
                    "2. high": bar.h,
                    "3. low": bar.l,
                    "4. close": bar.c,
                    "5. volume": bar.v,
                };
                return acc;
            }, {}),
        };

        return NextResponse.json(combinedData);

    } catch (error) {
        console.error("Polygon.io API fetch error:", error);
        return NextResponse.json(
            { error: "An unexpected error occurred while fetching from Polygon.io." },
            { status: 500 }
        );
    }
}