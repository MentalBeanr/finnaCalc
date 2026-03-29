import { NextResponse } from "next/server";

export async function POST() {
    return NextResponse.json(
        { error: "FinnaBot is coming soon! Stay tuned." },
        { status: 503 }
    );
}
