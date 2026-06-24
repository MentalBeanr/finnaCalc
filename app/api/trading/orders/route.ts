/**
 * GET  /api/trading/orders?status=all&limit=25  — order history
 * POST /api/trading/orders                       — place a new order
 * DELETE /api/trading/orders?id=<order_id>       — cancel an order
 */
import { NextRequest, NextResponse } from "next/server"
import { getOrders, placeOrder, cancelOrder } from "@/lib/markets/alpaca"
import type { OrderRequest } from "@/lib/markets/alpaca"

function notConfigured() {
    return NextResponse.json({ error: "ALPACA_API_KEY not configured" }, { status: 503 })
}

export async function GET(req: NextRequest) {
    if (!process.env.ALPACA_API_KEY) return notConfigured()
    const sp     = req.nextUrl.searchParams
    const status = sp.get("status") ?? "all"
    const limit  = Math.min(parseInt(sp.get("limit") ?? "25"), 100)
    try {
        const orders = await getOrders(status, limit)
        return NextResponse.json({ data: orders }, { headers: { "Cache-Control": "no-store" } })
    } catch (err) {
        return NextResponse.json({ error: err instanceof Error ? err.message : "Alpaca error" }, { status: 502 })
    }
}

export async function POST(req: NextRequest) {
    if (!process.env.ALPACA_API_KEY) return notConfigured()
    try {
        const body = await req.json() as OrderRequest
        if (!body.symbol || !body.qty || !body.side || !body.type) {
            return NextResponse.json({ error: "symbol, qty, side, and type are required" }, { status: 400 })
        }
        if (body.type !== "market" && !body.limit_price) {
            return NextResponse.json({ error: "limit_price required for non-market orders" }, { status: 400 })
        }
        body.time_in_force = body.time_in_force ?? "day"
        const order = await placeOrder(body)
        return NextResponse.json({ data: order }, { headers: { "Cache-Control": "no-store" } })
    } catch (err) {
        return NextResponse.json({ error: err instanceof Error ? err.message : "Alpaca error" }, { status: 502 })
    }
}

export async function DELETE(req: NextRequest) {
    if (!process.env.ALPACA_API_KEY) return notConfigured()
    const id = req.nextUrl.searchParams.get("id")
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
    try {
        await cancelOrder(id)
        return NextResponse.json({ ok: true })
    } catch (err) {
        return NextResponse.json({ error: err instanceof Error ? err.message : "Alpaca error" }, { status: 502 })
    }
}
