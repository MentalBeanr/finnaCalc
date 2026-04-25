import { NextResponse } from "next/server";

export const runtime = "edge";

const SYSTEM_PROMPT = `You are FinnaBot, a friendly and knowledgeable AI assistant for FinnaCalc, a financial calculators and personal finance planning website.

Help users with:
- Personal finance (budgeting, saving, emergency funds, debt payoff)
- Small business finance (break-even, startup costs, pricing, cash flow)
- Investing basics (stocks, bonds, ROI, risk)
- Taxes (general concepts, not specific legal/tax advice)
- Using FinnaCalc's calculators

Keep answers concise, practical, and actionable. When relevant, point users to a calculator on the site (e.g., "Try the Loan Calculator at /loan-calculator"). Always clarify that you are not a licensed financial or tax advisor and users should consult a professional for personalized advice.`;

type ChatMessage = { role: "user" | "assistant" | "system"; content: string };

export async function POST(req: Request) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        return NextResponse.json(
            { error: "OpenAI API key is not configured. Set OPENAI_API_KEY in your environment." },
            { status: 500 },
        );
    }

    let body: { messages?: ChatMessage[] };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const messages = Array.isArray(body.messages) ? body.messages : [];
    if (messages.length === 0) {
        return NextResponse.json({ error: "messages is required." }, { status: 400 });
    }

    const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model,
            messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
            temperature: 0.7,
        }),
    });

    if (!res.ok) {
        const detail = await res.text().catch(() => "");
        return NextResponse.json(
            { error: "OpenAI request failed.", detail },
            { status: res.status },
        );
    }

    const data = await res.json();
    const reply = data?.choices?.[0]?.message?.content ?? "";

    return NextResponse.json({ reply });
}
