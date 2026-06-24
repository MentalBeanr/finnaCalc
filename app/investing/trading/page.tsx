"use client"

import { useState, useEffect, useCallback } from "react"
import type { AlpacaAccount, AlpacaPosition, AlpacaOrder } from "@/lib/markets/alpaca"

// ── Helpers ───────────────────────────────────────────────────────────────────

const $ = (v: string | null | undefined) => parseFloat(v ?? "0")
const fmtUSD  = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 })
const fmtPct  = (n: number) => `${n >= 0 ? "+" : ""}${(n * 100).toFixed(2)}%`
const fmtDate = (s: string | null) => s ? new Date(s).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"

const green   = "text-emerald-500"
const red     = "text-red-500"
const clrPnl  = (n: number) => n >= 0 ? green : red

const card = "rounded-2xl border border-outline-variant/20 bg-surface-container-lowest"

// ── Setup prompt ──────────────────────────────────────────────────────────────

function SetupPrompt() {
    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 text-center p-8">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary">
                    <path d="M3 3h18M3 9h18M3 15h18M3 21h18" strokeLinecap="round"/>
                </svg>
            </div>
            <div className="max-w-md">
                <h2 className="font-headline-md text-[22px] text-primary mb-2">Connect Alpaca to trade</h2>
                <p className="text-on-surface-variant text-sm leading-relaxed">
                    Add your Alpaca API credentials to <code className="bg-surface-container px-1.5 py-0.5 rounded text-xs">.env.local</code> to
                    enable paper and live trading. Paper trading is free and requires no real money.
                </p>
            </div>
            <div className="bg-surface-container rounded-xl p-5 text-left text-sm font-mono w-full max-w-md">
                <div className="text-on-surface-variant mb-1"># .env.local</div>
                <div className="text-primary">ALPACA_API_KEY<span className="text-on-surface-variant">=your_key_id</span></div>
                <div className="text-primary">ALPACA_SECRET_KEY<span className="text-on-surface-variant">=your_secret</span></div>
                <div className="text-primary">ALPACA_PAPER<span className="text-on-surface-variant">=true</span></div>
            </div>
            <a
                href="https://alpaca.markets/docs/trading/getting-started/"
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-primary font-medium hover:underline"
            >
                Get free Alpaca API keys →
            </a>
        </div>
    )
}

// ── Account Summary ───────────────────────────────────────────────────────────

function AccountBar({ account }: { account: AlpacaAccount }) {
    const equity  = $(account.equity)
    const buying  = $(account.buying_power)
    const unrlzd  = $(account.unrealized_pl)
    const unrlzPc = $(account.unrealized_plpc)
    const isPaper = process.env.ALPACA_PAPER !== "false"

    const stats = [
        { label: "Portfolio Value",   val: fmtUSD(equity) },
        { label: "Buying Power",      val: fmtUSD(buying) },
        { label: "Cash",              val: fmtUSD($(account.cash)) },
        { label: "Unrealized P&L",    val: fmtUSD(unrlzd), pnl: unrlzd },
        { label: "Unrealized %",      val: fmtPct(unrlzPc), pnl: unrlzPc },
        { label: "Long Market Value", val: fmtUSD($(account.long_market_value)) },
    ]

    return (
        <div className={`${card} p-5 mb-6`}>
            <div className="flex items-center gap-3 mb-4">
                <h2 className="font-headline-md text-[18px] text-primary">Account Overview</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full border border-outline-variant/40 bg-surface-container-low text-on-surface-variant font-ui-button uppercase tracking-wider">
                    {account.status} · {isPaper ? "Paper" : "Live"}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full border border-outline-variant/40 bg-surface-container-low text-on-surface-variant font-ui-button uppercase tracking-wider">
                    #{account.account_number}
                </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {stats.map(s => (
                    <div key={s.label} className="bg-surface-container/50 rounded-xl p-3">
                        <div className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-1 font-ui-button">{s.label}</div>
                        <div className={`text-sm font-mono font-semibold ${s.pnl != null ? clrPnl(s.pnl) : "text-on-surface"}`}>{s.val}</div>
                    </div>
                ))}
            </div>
        </div>
    )
}

// ── Order Form ────────────────────────────────────────────────────────────────

interface OrderFormProps { onSubmitted: () => void }

function OrderForm({ onSubmitted }: OrderFormProps) {
    const [sym,    setSym]    = useState("")
    const [qty,    setQty]    = useState("10")
    const [side,   setSide]   = useState<"buy" | "sell">("buy")
    const [type,   setType]   = useState<"market" | "limit">("market")
    const [price,  setPrice]  = useState("")
    const [tif,    setTif]    = useState<"day" | "gtc">("day")
    const [busy,   setBusy]   = useState(false)
    const [msg,    setMsg]    = useState<{ ok: boolean; text: string } | null>(null)

    async function submit(e: React.FormEvent) {
        e.preventDefault()
        if (!sym.trim() || !qty.trim()) return
        setBusy(true); setMsg(null)
        try {
            const body: Record<string, string> = {
                symbol: sym.trim().toUpperCase(), qty: qty.trim(),
                side, type, time_in_force: tif,
            }
            if (type === "limit") body.limit_price = price.trim()
            const res = await fetch("/api/trading/orders", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            })
            const json = await res.json()
            if (!res.ok) { setMsg({ ok: false, text: json.error ?? "Order failed" }) }
            else {
                setMsg({ ok: true, text: `${side.toUpperCase()} ${qty} ${sym.toUpperCase()} submitted` })
                onSubmitted()
            }
        } catch (err) {
            setMsg({ ok: false, text: err instanceof Error ? err.message : "Network error" })
        } finally { setBusy(false) }
    }

    return (
        <div className={`${card} p-5 h-fit`}>
            <h3 className="font-headline-md text-[16px] text-primary mb-4">Place Order</h3>
            <form onSubmit={submit} className="flex flex-col gap-3">
                <div>
                    <label className="text-[10px] uppercase tracking-widest text-on-surface-variant font-ui-button block mb-1">Symbol</label>
                    <input
                        value={sym} onChange={e => setSym(e.target.value.toUpperCase())}
                        placeholder="AAPL"
                        className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container text-sm font-mono text-on-surface focus:outline-none focus:border-primary/60 uppercase"
                    />
                </div>
                <div>
                    <label className="text-[10px] uppercase tracking-widest text-on-surface-variant font-ui-button block mb-1">Shares</label>
                    <input
                        type="number" min="1" step="1" value={qty} onChange={e => setQty(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container text-sm font-mono text-on-surface focus:outline-none focus:border-primary/60"
                    />
                </div>
                <div>
                    <label className="text-[10px] uppercase tracking-widest text-on-surface-variant font-ui-button block mb-1">Side</label>
                    <div className="flex gap-1">
                        {(["buy","sell"] as const).map(s => (
                            <button key={s} type="button" onClick={() => setSide(s)}
                                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    side === s
                                        ? s === "buy" ? "bg-emerald-500/20 text-emerald-500 border border-emerald-500/40"
                                                      : "bg-red-500/20 text-red-500 border border-red-500/40"
                                        : "border border-outline-variant/30 text-on-surface-variant hover:border-primary/30"
                                }`}>
                                {s === "buy" ? "Buy" : "Sell"}
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <label className="text-[10px] uppercase tracking-widest text-on-surface-variant font-ui-button block mb-1">Order Type</label>
                    <div className="flex gap-1">
                        {(["market","limit"] as const).map(t => (
                            <button key={t} type="button" onClick={() => setType(t)}
                                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                                    type === t ? "bg-primary/15 text-primary border border-primary/40"
                                              : "border border-outline-variant/30 text-on-surface-variant hover:border-primary/30"
                                }`}>
                                {t}
                            </button>
                        ))}
                    </div>
                </div>
                {type === "limit" && (
                    <div>
                        <label className="text-[10px] uppercase tracking-widest text-on-surface-variant font-ui-button block mb-1">Limit Price</label>
                        <input
                            type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)}
                            placeholder="0.00"
                            className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container text-sm font-mono text-on-surface focus:outline-none focus:border-primary/60"
                        />
                    </div>
                )}
                <div>
                    <label className="text-[10px] uppercase tracking-widest text-on-surface-variant font-ui-button block mb-1">Time in Force</label>
                    <div className="flex gap-1">
                        {(["day","gtc"] as const).map(t => (
                            <button key={t} type="button" onClick={() => setTif(t)}
                                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors uppercase ${
                                    tif === t ? "bg-primary/15 text-primary border border-primary/40"
                                             : "border border-outline-variant/30 text-on-surface-variant hover:border-primary/30"
                                }`}>
                                {t}
                            </button>
                        ))}
                    </div>
                </div>
                {msg && (
                    <div className={`rounded-lg px-3 py-2 text-sm ${msg.ok ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"}`}>
                        {msg.text}
                    </div>
                )}
                <button
                    type="submit" disabled={busy}
                    className={`w-full py-2.5 rounded-lg font-medium text-sm transition-colors ${
                        busy ? "bg-primary/40 text-primary/60 cursor-not-allowed"
                             : side === "buy" ? "bg-emerald-500 hover:bg-emerald-400 text-white"
                                             : "bg-red-500 hover:bg-red-400 text-white"
                    }`}>
                    {busy ? "Placing…" : `${side === "buy" ? "Buy" : "Sell"} ${sym || "—"}`}
                </button>
            </form>
        </div>
    )
}

// ── Positions Table ───────────────────────────────────────────────────────────

function PositionsTable({ positions, onClose }: { positions: AlpacaPosition[]; onClose: (sym: string) => void }) {
    if (!positions.length) {
        return (
            <div className={`${card} p-5 flex items-center justify-center h-36 text-on-surface-variant text-sm`}>
                No open positions
            </div>
        )
    }
    return (
        <div className={`${card} p-5`}>
            <h3 className="font-headline-md text-[16px] text-primary mb-4">Open Positions</h3>
            <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs">
                    <thead>
                        <tr className="border-b border-outline-variant/20">
                            {["Symbol","Qty","Avg Entry","Current","Mkt Value","P&L","P&L %","Today","Action"].map(h => (
                                <th key={h} className="px-2.5 py-2 text-left text-[10px] font-ui-button uppercase tracking-widest text-on-surface-variant whitespace-nowrap">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {positions.map((p, i) => {
                            const pl    = $(p.unrealized_pl)
                            const plPc  = $(p.unrealized_plpc)
                            const today = $(p.change_today)
                            return (
                                <tr key={p.asset_id} className={i % 2 ? "bg-surface-container-low/30" : ""}>
                                    <td className="px-2.5 py-2.5 font-mono font-semibold text-on-surface">{p.symbol}</td>
                                    <td className="px-2.5 py-2.5 font-mono text-on-surface">{p.qty}</td>
                                    <td className="px-2.5 py-2.5 font-mono text-on-surface">{fmtUSD($(p.avg_entry_price))}</td>
                                    <td className="px-2.5 py-2.5 font-mono text-on-surface">{fmtUSD($(p.current_price))}</td>
                                    <td className="px-2.5 py-2.5 font-mono text-on-surface">{fmtUSD($(p.market_value))}</td>
                                    <td className={`px-2.5 py-2.5 font-mono font-semibold ${clrPnl(pl)}`}>{fmtUSD(pl)}</td>
                                    <td className={`px-2.5 py-2.5 font-mono font-semibold ${clrPnl(plPc)}`}>{fmtPct(plPc)}</td>
                                    <td className={`px-2.5 py-2.5 font-mono ${clrPnl(today)}`}>{today >= 0 ? "+" : ""}{(today * 100).toFixed(2)}%</td>
                                    <td className="px-2.5 py-2.5">
                                        <button
                                            onClick={() => onClose(p.symbol)}
                                            className="px-2 py-1 rounded text-[10px] border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-colors"
                                        >
                                            Close
                                        </button>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

// ── Orders Table ──────────────────────────────────────────────────────────────

function ordersStatusColor(s: string) {
    if (s === "filled")            return "text-emerald-500"
    if (s === "canceled" || s === "expired" || s === "rejected") return "text-red-400"
    if (s === "partially_filled")  return "text-amber-500"
    return "text-on-surface-variant"
}

function OrdersTable({ orders, onCancel }: { orders: AlpacaOrder[]; onCancel: (id: string) => void }) {
    if (!orders.length) {
        return (
            <div className={`${card} p-5 flex items-center justify-center h-28 text-on-surface-variant text-sm`}>
                No recent orders
            </div>
        )
    }
    const pending = new Set(["new","accepted","pending_new","accepted_for_bidding","held"])
    return (
        <div className={`${card} p-5`}>
            <h3 className="font-headline-md text-[16px] text-primary mb-4">Recent Orders</h3>
            <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs">
                    <thead>
                        <tr className="border-b border-outline-variant/20">
                            {["Symbol","Side","Qty / Filled","Type","Limit","Fill Price","Status","Submitted","Action"].map(h => (
                                <th key={h} className="px-2.5 py-2 text-left text-[10px] font-ui-button uppercase tracking-widest text-on-surface-variant whitespace-nowrap">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map((o, i) => (
                            <tr key={o.id} className={i % 2 ? "bg-surface-container-low/30" : ""}>
                                <td className="px-2.5 py-2.5 font-mono font-semibold text-on-surface">{o.symbol}</td>
                                <td className={`px-2.5 py-2.5 font-semibold capitalize ${o.side === "buy" ? green : red}`}>{o.side}</td>
                                <td className="px-2.5 py-2.5 font-mono text-on-surface">{o.qty} / {o.filled_qty}</td>
                                <td className="px-2.5 py-2.5 text-on-surface capitalize">{o.type.replace(/_/g, " ")}</td>
                                <td className="px-2.5 py-2.5 font-mono text-on-surface">{o.limit_price ? fmtUSD($(o.limit_price)) : "—"}</td>
                                <td className="px-2.5 py-2.5 font-mono text-on-surface">{o.filled_avg_price ? fmtUSD($(o.filled_avg_price)) : "—"}</td>
                                <td className={`px-2.5 py-2.5 capitalize ${ordersStatusColor(o.status)}`}>{o.status.replace(/_/g, " ")}</td>
                                <td className="px-2.5 py-2.5 text-on-surface-variant">{fmtDate(o.submitted_at)}</td>
                                <td className="px-2.5 py-2.5">
                                    {pending.has(o.status) && (
                                        <button
                                            onClick={() => onCancel(o.id)}
                                            className="px-2 py-1 rounded text-[10px] border border-outline-variant/30 text-on-surface-variant hover:border-red-500/40 hover:text-red-500 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TradingPage() {
    const [account,   setAccount]   = useState<AlpacaAccount | null>(null)
    const [positions, setPositions] = useState<AlpacaPosition[]>([])
    const [orders,    setOrders]    = useState<AlpacaOrder[]>([])
    const [noKeys,    setNoKeys]    = useState(false)
    const [loading,   setLoading]   = useState(true)

    const refresh = useCallback(async () => {
        const [accRes, ordRes] = await Promise.allSettled([
            fetch("/api/trading/account"),
            fetch("/api/trading/orders?status=all&limit=25"),
        ])
        if (accRes.status === "fulfilled") {
            const j = await accRes.value.json()
            if (accRes.value.status === 503) { setNoKeys(true); return }
            if (j.data) { setAccount(j.data.account); setPositions(j.data.positions) }
        }
        if (ordRes.status === "fulfilled") {
            const j = await ordRes.value.json()
            if (j.data) setOrders(j.data)
        }
    }, [])

    useEffect(() => {
        setLoading(true)
        refresh().finally(() => setLoading(false))
    }, [refresh])

    async function handleClose(symbol: string) {
        if (!confirm(`Close entire ${symbol} position?`)) return
        await fetch(`/api/trading/orders`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ symbol, qty: "1", side: "sell", type: "market", time_in_force: "day" }),
        })
        refresh()
    }

    async function handleCancel(id: string) {
        await fetch(`/api/trading/orders?id=${id}`, { method: "DELETE" })
        refresh()
    }

    return (
        <div className="min-h-screen bg-surface py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-1">
                        <h1 className="font-headline-md text-[28px] text-primary">Trading</h1>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 border border-amber-500/30 font-ui-button uppercase tracking-wider">
                            Alpaca · Paper
                        </span>
                    </div>
                    <p className="text-on-surface-variant text-sm">
                        Paper trading — no real money. Switch to live by setting{" "}
                        <code className="bg-surface-container px-1.5 py-0.5 rounded text-xs">ALPACA_PAPER=false</code>.
                    </p>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-64 text-on-surface-variant">Loading account…</div>
                ) : noKeys ? (
                    <SetupPrompt />
                ) : (
                    <div className="flex flex-col gap-6">
                        {account && <AccountBar account={account} />}

                        <div className="grid gap-6" style={{ gridTemplateColumns: "minmax(0,1fr) 280px" }}>
                            <PositionsTable positions={positions} onClose={handleClose} />
                            <OrderForm onSubmitted={refresh} />
                        </div>

                        <OrdersTable orders={orders} onCancel={handleCancel} />

                        <p className="text-[11px] text-on-surface-variant/60 text-center">
                            Connected to Alpaca · Paper trading · Not financial advice
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
