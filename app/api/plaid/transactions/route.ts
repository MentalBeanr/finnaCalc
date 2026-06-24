/**
 * GET /api/plaid/transactions?days=90
 * Returns Plaid investment transactions for the linked account.
 */
import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getInvestmentTransactions } from "@/lib/markets/plaid"

const COOKIE = "plaid_access_token"

function yyyymmdd(d: Date) { return d.toISOString().split("T")[0] }

export async function GET(req: NextRequest) {
    if (!process.env.PLAID_CLIENT_ID) {
        return NextResponse.json({ error: "Plaid not configured" }, { status: 503 })
    }
    const jar = await cookies()
    const access_token = jar.get(COOKIE)?.value
    if (!access_token) {
        return NextResponse.json({ connected: false, data: [] })
    }

    const days = Math.min(parseInt(req.nextUrl.searchParams.get("days") ?? "90"), 365)
    const end   = new Date()
    const start = new Date(); start.setDate(start.getDate() - days)

    try {
        const data = await getInvestmentTransactions(access_token, yyyymmdd(start), yyyymmdd(end))
        if (data.error_code) {
            return NextResponse.json({ error: data.error_message }, { status: 502 })
        }
        const secMap = new Map(data.securities.map(s => [s.security_id, s]))
        const txns = data.investment_transactions.map(tx => ({
            ...tx,
            ticker: tx.security_id ? (secMap.get(tx.security_id)?.ticker_symbol ?? null) : null,
            securityName: tx.security_id ? (secMap.get(tx.security_id)?.name ?? null) : null,
        }))
        return NextResponse.json({ connected: true, data: txns, total: data.total_investment_transactions }, {
            headers: { "Cache-Control": "no-store" },
        })
    } catch (err) {
        return NextResponse.json({ error: err instanceof Error ? err.message : "Plaid error" }, { status: 502 })
    }
}
