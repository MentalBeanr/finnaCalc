import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: "API key is not configured." }, { status: 500 });
    }

    const moversUrl = `https://www.alphavantage.co/query?function=TOP_GAINERS_LOSERS&apikey=${apiKey}`;

    try {
        const response = await fetch(moversUrl);
        const data = await response.json();

        if (!response.ok || data["Note"] || data["Error Message"]) {
            throw new Error(data["Note"] || data["Error Message"] || "Failed to fetch top movers data from Alpha Vantage.");
        }

        // Reformat the data to match the component's expectation
        const topGainers = data.top_gainers.slice(0, 5).map((stock: any) => ({
            symbol: stock.ticker,
            name: 'Top Gainer', // Alpha Vantage doesn't provide the name in this endpoint
            change: parseFloat(stock.change_amount),
            price: parseFloat(stock.price),
            changesPercentage: parseFloat(stock.change_percentage.replace('%', '')),
        }));

        const topLosers = data.top_losers.slice(0, 5).map((stock: any) => ({
            symbol: stock.ticker,
            name: 'Top Loser', // Alpha Vantage doesn't provide the name in this endpoint
            change: parseFloat(stock.change_amount),
            price: parseFloat(stock.price),
            changesPercentage: parseFloat(stock.change_percentage.replace('%', '')),
        }));

        return NextResponse.json({ topGainers, topLosers });

    } catch (error: any) {
        console.error("Alpha Vantage Top Movers API fetch error:", error);
        return NextResponse.json(
            { error: "Failed to fetch top movers data." },
            { status: 500 }
        );
    }
}