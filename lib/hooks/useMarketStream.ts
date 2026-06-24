"use client"

import { useEffect, useRef, useCallback } from "react"

/**
 * Real-time trade price stream via Finnhub WebSocket.
 *
 * Set NEXT_PUBLIC_FINNHUB_API_KEY in .env.local (same value as FINNHUB_API_KEY).
 * Free tier: up to 50 subscriptions. Reconnects automatically on drop.
 *
 * @param symbols  Ticker symbols to subscribe to (e.g. ["AAPL","MSFT"])
 * @param onTrade  Called for every trade: (ticker, price, volume)
 */
export function useMarketStream(
    symbols: string[],
    onTrade: (ticker: string, price: number, volume: number) => void
) {
    const wsRef   = useRef<WebSocket | null>(null)
    const symRef  = useRef<string[]>(symbols)
    const cbRef   = useRef(onTrade)
    const deadRef = useRef(false)

    useEffect(() => { cbRef.current = onTrade }, [onTrade])
    useEffect(() => { symRef.current = symbols }, [symbols])

    const subscribe = useCallback((ws: WebSocket, syms: string[]) => {
        for (const sym of syms) {
            ws.send(JSON.stringify({ type: "subscribe", symbol: sym }))
        }
    }, [])

    const connect = useCallback(() => {
        if (deadRef.current) return
        const key = process.env.NEXT_PUBLIC_FINNHUB_API_KEY
        if (!key) {
            console.warn("[MarketStream] NEXT_PUBLIC_FINNHUB_API_KEY not set — real-time feed disabled")
            return
        }

        const ws = new WebSocket(`wss://ws.finnhub.io?token=${key}`)
        wsRef.current = ws

        ws.onopen = () => subscribe(ws, symRef.current)

        ws.onmessage = (evt) => {
            try {
                const msg = JSON.parse(evt.data as string)
                if (msg.type === "trade" && Array.isArray(msg.data)) {
                    for (const t of msg.data) {
                        cbRef.current(t.s as string, t.p as number, t.v as number)
                    }
                }
            } catch { /* ignore malformed frames */ }
        }

        ws.onclose = (evt) => {
            if (!deadRef.current && !evt.wasClean) {
                setTimeout(connect, 3_000)
            }
        }

        ws.onerror = () => ws.close()
    }, [subscribe])

    // Subscribe to newly added symbols if the connection is already open
    useEffect(() => {
        const ws = wsRef.current
        if (ws?.readyState === WebSocket.OPEN) {
            subscribe(ws, symbols)
        }
    }, [symbols, subscribe])

    useEffect(() => {
        deadRef.current = false
        connect()
        return () => {
            deadRef.current = true
            wsRef.current?.close()
            wsRef.current = null
        }
    }, [connect])
}
