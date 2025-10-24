import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const apiKey = process.env.FMP_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: "API key is not configured." }, { status: 500 });
    }

    const gainersUrl = `https://financialmodelingprep.com/api/v3/stock_market/gainers?apikey=${apiKey}`;
    const losersUrl = `https://financialmodelingprep.com/api/v3/stock_market/losers?apikey=${apiKey}`;

    try {
        const [gainersResponse, losersResponse] = await Promise.all([
            fetch(gainersUrl),
            fetch(losersUrl),
        ]);

        const gainersData = await gainersResponse.json();
        const losersData = await losersResponse.json();

        if (!gainersResponse.ok || !losersResponse.ok) {
            throw new Error("Failed to fetch top movers data from FMP.");
        }

        // Take the top 5 of each
        const topGainers = gainersData.slice(0, 5);
        const topLosers = losersData.slice(0, 5);

        return NextResponse.json({ topGainers, topLosers });

    } catch (error: any) {
        console.error("FMP Top Movers API fetch error:", error);
        return NextResponse.json(
            { error: "Failed to fetch top movers data." },
            { status: 500 }
        );
    }
}