import { NextResponse } from "next/server";

export async function GET() {
    return NextResponse.json(
        { error: "Stock search is coming soon! Stay tuned." },
        { status: 503 }
    );
}
