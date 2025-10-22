import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const keywords = searchParams.get("keywords");

    if (!keywords) {
        return NextResponse.json({ error: "Search keywords are required" }, { status: 400 });
    }

    const apiKey = process.env.POLYGON_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: "API key is not configured." }, { status: 500 });
    }

    const url = `https://api.polygon.io/v3/reference/tickers?search=${keywords}&active=true&limit=10&apiKey=${apiKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Failed to fetch search results from Polygon.io.");
        }

        if (!data.results || data.results.length === 0) {
            return NextResponse.json(
                { error: `No matching symbols found for "${keywords}".` },
                { status: 404 }
            );
        }

        // Reformat data to match the component's expectation
        const formattedResults = data.results.map((item: any) => ({
            "1. symbol": item.ticker,
            "2. name": item.name,
            "4. region": item.locale.toUpperCase(),
        }));

        return NextResponse.json(formattedResults);
    } catch (error: any) {
        console.error("Polygon.io Search API fetch error:", error);
        return NextResponse.json(
            { error: "Failed to fetch search results from Polygon.io." },
            { status: 500 }
        );
    }
}