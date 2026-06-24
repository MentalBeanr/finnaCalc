/**
 * Alpaca REST client — server-side only.
 * Set ALPACA_PAPER=true (default) for paper trading, false for live.
 * Required env: ALPACA_API_KEY, ALPACA_SECRET_KEY
 */

const BASE = process.env.ALPACA_PAPER !== "false"
    ? "https://paper-api.alpaca.markets"
    : "https://api.alpaca.markets"

function headers() {
    return {
        "APCA-API-KEY-ID":    process.env.ALPACA_API_KEY ?? "",
        "APCA-API-SECRET-KEY": process.env.ALPACA_SECRET_KEY ?? "",
        "Content-Type": "application/json",
    }
}

async function apGet<T>(path: string): Promise<T> {
    const res = await fetch(`${BASE}${path}`, { headers: headers(), cache: "no-store" })
    if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.message ?? `Alpaca ${path} → ${res.status}`)
    }
    return res.json()
}

async function apPost<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${BASE}${path}`, {
        method: "POST", headers: headers(), body: JSON.stringify(body), cache: "no-store",
    })
    if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message ?? `Alpaca POST ${path} → ${res.status}`)
    }
    return res.json()
}

async function apDel<T>(path: string): Promise<T | null> {
    const res = await fetch(`${BASE}${path}`, { method: "DELETE", headers: headers(), cache: "no-store" })
    if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message ?? `Alpaca DELETE ${path} → ${res.status}`)
    }
    if (res.status === 204) return null
    return res.json()
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AlpacaAccount {
    id:                    string
    account_number:        string
    status:                string
    equity:                string
    buying_power:          string
    portfolio_value:       string
    cash:                  string
    long_market_value:     string
    short_market_value:    string
    unrealized_pl:         string
    unrealized_plpc:       string
    daytrading_buying_power: string
    pattern_day_trader:    boolean
    currency:              string
}

export interface AlpacaPosition {
    asset_id:          string
    symbol:            string
    exchange:          string
    asset_class:       string
    qty:               string
    qty_available:     string
    side:              "long" | "short"
    avg_entry_price:   string
    market_value:      string
    cost_basis:        string
    unrealized_pl:     string
    unrealized_plpc:   string
    unrealized_intraday_pl:   string
    unrealized_intraday_plpc: string
    current_price:     string
    lastday_price:     string
    change_today:      string
}

export interface AlpacaOrder {
    id:               string
    client_order_id:  string
    symbol:           string
    asset_class:      string
    qty:              string
    filled_qty:       string
    type:             "market" | "limit" | "stop" | "stop_limit"
    side:             "buy" | "sell"
    status:           string
    time_in_force:    string
    limit_price:      string | null
    stop_price:       string | null
    filled_avg_price: string | null
    submitted_at:     string
    filled_at:        string | null
    canceled_at:      string | null
    expired_at:       string | null
}

export interface OrderRequest {
    symbol:         string
    qty:            string
    side:           "buy" | "sell"
    type:           "market" | "limit" | "stop" | "stop_limit"
    time_in_force:  "day" | "gtc" | "ioc" | "fok"
    limit_price?:   string
    stop_price?:    string
    extended_hours?: boolean
}

// ── API calls ─────────────────────────────────────────────────────────────────

export const getAccount   = ()                         => apGet<AlpacaAccount>("/v2/account")
export const getPositions = ()                         => apGet<AlpacaPosition[]>("/v2/positions")
export const getOrders    = (status = "all", limit = 25) =>
    apGet<AlpacaOrder[]>(`/v2/orders?status=${status}&limit=${limit}&direction=desc&nested=false`)

export const placeOrder    = (order: OrderRequest)    => apPost<AlpacaOrder>("/v2/orders", order)
export const cancelOrder   = (id: string)             => apDel<void>(`/v2/orders/${id}`)
export const closePosition = (symbol: string)         => apDel<AlpacaOrder>(`/v2/positions/${symbol}`)
