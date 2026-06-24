"use client"

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { Container } from "@/components/ds/container"
import { MaterialIcon } from "@/components/ds/material-icon"
import type { QuoteData, IndexQuote, MoverStock, NewsArticle } from "@/lib/markets/types"
import { useMarketStream } from "@/lib/hooks/useMarketStream"

// ── Data ──────────────────────────────────────────────────────────────────────

const MARKETS = [
    { name: "S&P 500",    val: "5,847.23",  chg: "+24.31",  pct: "+0.42%", pos: true,  pts: [42,40,44,43,46,45,48,47,50,49,52,51] },
    { name: "NASDAQ",     val: "18,721.44", chg: "+89.52",  pct: "+0.48%", pos: true,  pts: [38,40,39,42,44,43,46,45,48,50,49,52] },
    { name: "DOW",        val: "43,012.66", chg: "-47.83",  pct: "-0.11%", pos: false, pts: [50,48,50,47,49,48,46,47,45,46,44,45] },
    { name: "Russell 2K", val: "2,197.88",  chg: "+15.44",  pct: "+0.71%", pos: true,  pts: [36,38,37,40,39,41,43,42,44,46,45,47] },
    { name: "VIX",        val: "14.23",     chg: "-0.87",   pct: "-5.76%", pos: false, pts: [22,20,21,18,17,19,16,15,17,14,13,14] },
    { name: "10Y Yield",  val: "4.312%",    chg: "+0.021",  pct: "+0.49%", pos: true,  pts: [40,41,40,42,43,42,44,43,45,44,46,45] },
    { name: "EUR/USD",    val: "1.0892",    chg: "-0.0023", pct: "-0.21%", pos: false, pts: [48,47,49,46,48,45,47,44,46,43,45,44] },
    { name: "BTC/USD",    val: "68,412",    chg: "+1,247",  pct: "+1.86%", pos: true,  pts: [30,34,32,36,35,38,37,40,39,42,41,44] },
]

const HOLDINGS = [
    { num:1,  ticker:"AAPL",    company:"Apple Inc.",               shares:45,   avgCost:141.22,   price:189.84,  value:8542.80,   dayChg:1.23,  ret:34.42,  weight:3.0  },
    { num:2,  ticker:"MSFT",    company:"Microsoft Corp",           shares:30,   avgCost:285.14,   price:417.32,  value:12519.60,  dayChg:0.87,  ret:46.37,  weight:4.4  },
    { num:3,  ticker:"NVDA",    company:"NVIDIA Corp",              shares:20,   avgCost:437.86,   price:875.40,  value:17508.00,  dayChg:2.14,  ret:99.94,  weight:6.2  },
    { num:4,  ticker:"GOOGL",   company:"Alphabet Inc",             shares:25,   avgCost:128.44,   price:175.22,  value:4380.50,   dayChg:0.53,  ret:36.42,  weight:1.5  },
    { num:5,  ticker:"AMZN",    company:"Amazon.com Inc",           shares:35,   avgCost:132.74,   price:192.44,  value:6735.40,   dayChg:0.76,  ret:44.98,  weight:2.4  },
    { num:6,  ticker:"TSLA",    company:"Tesla Inc",                shares:40,   avgCost:243.82,   price:198.71,  value:7948.40,   dayChg:-1.47, ret:-18.50, weight:2.8  },
    { num:7,  ticker:"VTI",     company:"Vanguard Total Stock ETF", shares:150,  avgCost:198.34,   price:232.17,  value:34825.50,  dayChg:0.44,  ret:17.06,  weight:12.2 },
    { num:8,  ticker:"QQQ",     company:"Invesco QQQ Trust",        shares:80,   avgCost:342.55,   price:441.28,  value:35302.40,  dayChg:0.61,  ret:28.83,  weight:12.4 },
    { num:9,  ticker:"BND",     company:"Vanguard Total Bond ETF",  shares:200,  avgCost:72.84,    price:74.12,   value:14824.00,  dayChg:-0.12, ret:1.76,   weight:5.2  },
    { num:10, ticker:"BTC-USD", company:"Bitcoin USD",              shares:0.75, avgCost:42100.00, price:68412.00,value:51309.00,  dayChg:1.86,  ret:62.50,  weight:18.0 },
    { num:11, ticker:"JPM",     company:"JPMorgan Chase & Co",      shares:60,   avgCost:148.23,   price:198.44,  value:11906.40,  dayChg:0.34,  ret:33.87,  weight:4.2  },
    { num:12, ticker:"JNJ",     company:"Johnson & Johnson",        shares:80,   avgCost:152.84,   price:147.62,  value:11809.60,  dayChg:-0.23, ret:-3.41,  weight:4.1  },
]

const SCREENER_DATA = [
    { ticker:"AAPL",  company:"Apple Inc.",      sector:"Tech",       price:189.84, mktCap:2.9e12, pe:32.1, div:0.53, w52:24.3  },
    { ticker:"MSFT",  company:"Microsoft Corp",  sector:"Tech",       price:417.32, mktCap:3.1e12, pe:36.8, div:0.72, w52:32.1  },
    { ticker:"NVDA",  company:"NVIDIA Corp",     sector:"Tech",       price:875.40, mktCap:2.2e12, pe:68.4, div:0.03, w52:189.2 },
    { ticker:"GOOGL", company:"Alphabet Inc",    sector:"Tech",       price:175.22, mktCap:2.2e12, pe:24.7, div:0.00, w52:46.8  },
    { ticker:"META",  company:"Meta Platforms",  sector:"Tech",       price:542.14, mktCap:1.4e12, pe:28.3, div:0.44, w52:73.2  },
    { ticker:"JPM",   company:"JPMorgan Chase",  sector:"Finance",    price:198.44, mktCap:574e9,  pe:11.4, div:2.32, w52:31.7  },
    { ticker:"JNJ",   company:"J&J",             sector:"Healthcare", price:147.62, mktCap:356e9,  pe:15.2, div:3.37, w52:-8.4  },
    { ticker:"XOM",   company:"Exxon Mobil",     sector:"Energy",     price:118.34, mktCap:472e9,  pe:14.1, div:3.28, w52:12.6  },
    { ticker:"WMT",   company:"Walmart Inc",     sector:"Consumer",   price:87.22,  mktCap:701e9,  pe:38.6, div:1.14, w52:68.3  },
    { ticker:"CAT",   company:"Caterpillar Inc", sector:"Industrial", price:392.44, mktCap:188e9,  pe:16.8, div:1.42, w52:21.4  },
]

const GAINERS = [
    { tick:"SMCI", name:"Super Micro Computer",   price:854.20, chg:8.74,  pts:[20,22,24,23,26,28,30] },
    { tick:"PLTR", name:"Palantir Technologies",  price:24.88,  chg:6.32,  pts:[18,19,21,20,22,24,25] },
    { tick:"MARA", name:"Marathon Digital",       price:18.42,  chg:5.91,  pts:[16,17,16,18,19,20,21] },
    { tick:"RIOT", name:"Riot Platforms",         price:11.74,  chg:5.23,  pts:[14,15,14,16,17,16,18] },
    { tick:"COIN", name:"Coinbase Global",        price:228.34, chg:4.87,  pts:[20,21,22,21,23,24,25] },
    { tick:"AMD",  name:"Advanced Micro Devices", price:168.92, chg:3.92,  pts:[18,19,20,21,20,22,23] },
]
const LOSERS = [
    { tick:"NVAX", name:"Novavax Inc",        price:8.32,  chg:-9.41, pts:[30,28,27,26,24,23,22] },
    { tick:"MRNA", name:"Moderna Inc",        price:94.42, chg:-7.82, pts:[28,26,25,24,22,21,20] },
    { tick:"RIVN", name:"Rivian Automotive",  price:12.14, chg:-6.33, pts:[26,25,23,22,21,20,18] },
    { tick:"LCID", name:"Lucid Group",        price:2.94,  chg:-5.62, pts:[24,22,21,20,18,17,16] },
    { tick:"INTC", name:"Intel Corporation",  price:28.74, chg:-4.14, pts:[22,20,19,18,17,16,15] },
    { tick:"WBA",  name:"Walgreens Boots",    price:14.88, chg:-3.72, pts:[20,19,18,17,16,15,14] },
]
const MOST_ACTIVE = [
    { tick:"SPY",  price:584.22,  vol:142.3e6, chg:0.42  },
    { tick:"NVDA", price:875.40,  vol:98.7e6,  chg:2.14  },
    { tick:"TSLA", price:198.71,  vol:87.4e6,  chg:-1.47 },
    { tick:"AAPL", price:189.84,  vol:64.2e6,  chg:1.23  },
    { tick:"AMD",  price:168.92,  vol:58.1e6,  chg:3.92  },
    { tick:"QQQ",  price:441.28,  vol:44.8e6,  chg:0.61  },
]
const ARTICLES = [
    { src:"Reuters",   time:"2h ago",  hl:"Fed signals potential rate cuts amid cooling inflation data",            sum:"Federal Reserve officials indicated openness to easing policy as CPI showed continued moderation.", sent:"bull", tickers:["$SPY","$TLT"]  },
    { src:"Bloomberg", time:"4h ago",  hl:"NVIDIA reports record Q3 earnings, data center revenue surges 206%",    sum:"Chipmaker beats expectations; guides Q4 revenue above $37B driven by Blackwell GPU demand.",        sent:"bull", tickers:["$NVDA","$AMD"] },
    { src:"WSJ",       time:"6h ago",  hl:"Tesla delivery numbers disappoint analysts for third consecutive quarter",sum:"EV maker delivered 443,956 vehicles in Q2, missing the 449,080 consensus estimate.",             sent:"bear", tickers:["$TSLA"]        },
    { src:"CNBC",      time:"8h ago",  hl:"Apple Vision Pro sees strong enterprise adoption in Q4 pipeline",       sum:"Corporate channel checks show accelerating Vision Pro orders across healthcare and aerospace.",       sent:"neut", tickers:["$AAPL"]        },
    { src:"FT",        time:"12h ago", hl:"JPMorgan upgrades Amazon to Overweight, raises price target to $230",   sum:"Analysts cite AWS margin expansion, advertising growth, and improving retail profitability.",         sent:"bull", tickers:["$AMZN"]       },
]
const FACTORS = [
    { name:"Momentum",          score:72, color:"#3f6b3f" },
    { name:"Volatility",        score:58, color:"#b45309" },
    { name:"Volume",            score:64, color:"#3f6b3f" },
    { name:"Put/Call Ratio",    score:71, color:"#3f6b3f" },
    { name:"Safe Haven Demand", score:48, color:"#b45309" },
    { name:"Junk Bond Demand",  score:82, color:"#3f6b3f" },
]
const WATCHLIST_ITEMS = [
    { tick:"AAPL",    co:"Apple Inc.",     price:189.84,   chg:1.23,  pos:true  },
    { tick:"TSLA",    co:"Tesla Inc.",     price:198.71,   chg:-1.47, pos:false },
    { tick:"NVDA",    co:"NVIDIA Corp",    price:875.40,   chg:2.14,  pos:true  },
    { tick:"MSFT",    co:"Microsoft Corp", price:417.32,   chg:0.87,  pos:true  },
    { tick:"AMZN",    co:"Amazon.com",     price:192.44,   chg:0.76,  pos:true  },
    { tick:"META",    co:"Meta Platforms", price:542.14,   chg:1.32,  pos:true  },
    { tick:"GOOGL",   co:"Alphabet Inc",   price:175.22,   chg:0.53,  pos:true  },
    { tick:"BTC-USD", co:"Bitcoin USD",    price:68412.00, chg:1.86,  pos:true  },
]
const DIV_ROWS = [
    { date:"Jun 25, 2026", ticker:"AAPL", co:"Apple Inc.",              divShare:"$0.25",  yield:"0.53%", pay:"Jul 15, 2026", amount:"$11.25",  thismon:true  },
    { date:"Jun 27, 2026", ticker:"JNJ",  co:"Johnson & Johnson",       divShare:"$1.24",  yield:"3.37%", pay:"Jul 9, 2026",  amount:"$99.20",  thismon:true  },
    { date:"Jun 30, 2026", ticker:"JPM",  co:"JPMorgan Chase & Co",     divShare:"$1.15",  yield:"2.32%", pay:"Jul 31, 2026", amount:"$69.00",  thismon:true  },
    { date:"Jul 8, 2026",  ticker:"VTI",  co:"Vanguard Total Stock ETF",divShare:"$0.96",  yield:"1.50%", pay:"Jul 25, 2026", amount:"$144.00", thismon:false },
    { date:"Jul 12, 2026", ticker:"BND",  co:"Vanguard Total Bond ETF", divShare:"$0.215", yield:"3.39%", pay:"Jul 29, 2026", amount:"$43.00",  thismon:false },
    { date:"Jul 20, 2026", ticker:"MSFT", co:"Microsoft Corp",          divShare:"$1.54",  yield:"0.72%", pay:"Sep 12, 2026", amount:"$46.20",  thismon:false },
]

// ── Utilities ─────────────────────────────────────────────────────────────────
const fmt = (v: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(v)
const fmtPct = (v: number) => (v >= 0 ? "+" : "") + v.toFixed(2) + "%"
const fmtShort = (v: number) => {
    if (v >= 1e12) return (v / 1e12).toFixed(1) + "T"
    if (v >= 1e9)  return (v / 1e9).toFixed(1) + "B"
    if (v >= 1e6)  return (v / 1e6).toFixed(1) + "M"
    return v.toFixed(0)
}
const seededRng = (seed: string) => {
    let s = seed.split("").reduce((a, c) => a + c.charCodeAt(0), 0)
    return () => { s = (s * 9301 + 49297) % 233280; return s / 233280 }
}

// ── Tiny inline sparkline ─────────────────────────────────────────────────────
const Sparkline = ({ pts, w, h, color }: { pts: number[]; w: number; h: number; color: string }) => {
    const min = Math.min(...pts), max = Math.max(...pts), range = max - min || 1
    const coords = pts.map((v, i) => {
        const x = (i / (pts.length - 1)) * w
        const y = h - ((v - min) / range) * (h - 4) - 2
        return `${x.toFixed(1)},${y.toFixed(1)}`
    }).join(" ")
    return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
            <polyline points={coords} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
    )
}

const WatchlistSparkline = ({ ticker, pos }: { ticker: string; pos: boolean }) => {
    const rng = seededRng(ticker)
    let val = 50
    const pts = Array.from({ length: 14 }, () => {
        val += (rng() - 0.5) * 8 + (pos ? 0.5 : -0.5)
        return Math.max(10, Math.min(90, val))
    })
    const min = Math.min(...pts), max = Math.max(...pts), range = max - min || 1
    const color = pos ? "#3f6b3f" : "#ba1a1a"
    const coords = pts.map((v, i) => {
        const x = (i / (pts.length - 1)) * 100
        const y = 40 - ((v - min) / range) * 36 - 2
        return `${x.toFixed(1)},${y.toFixed(1)}`
    }).join(" ")
    return (
        <svg width="100%" height="40" viewBox="0 0 100 40" preserveAspectRatio="none">
            <polyline points={coords} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
    )
}

// ── Company logo — tries Finnhub URL, then Parqet CDN, then initials ─────────
const CompanyLogo = ({ ticker, logoUrl, size = 24 }: { ticker: string; logoUrl?: string; size?: number }) => {
    const [srcIdx, setSrcIdx] = useState(0)
    useEffect(() => { setSrcIdx(0) }, [ticker, logoUrl])

    // Source priority: API-provided URL → Parqet symbol CDN → initials fallback
    const sources = [
        ...(logoUrl ? [logoUrl] : []),
        `https://assets.parqet.com/logos/symbol/${encodeURIComponent(ticker)}?format=png`,
    ]
    const src = srcIdx < sources.length ? sources[srcIdx] : null

    if (src) {
        return (
            <Image
                src={src}
                alt={ticker}
                width={size}
                height={size}
                className="rounded object-contain flex-shrink-0 bg-white"
                onError={() => setSrcIdx(i => i + 1)}
                unoptimized
            />
        )
    }
    return (
        <span
            className="rounded bg-primary/10 text-primary font-bold flex items-center justify-center flex-shrink-0 text-[10px]"
            style={{ width: size, height: size }}
        >
            {ticker.replace(/[^A-Z]/gi, "").slice(0, 2).toUpperCase()}
        </span>
    )
}

// ── Chart helpers ─────────────────────────────────────────────────────────────
const genCurve = (range: string) => {
    const configs: Record<string, { pts: number; base: number; amp: number; freq: number; trend: number }> = {
        "1D":  { pts:48, base:283000, amp:800,   freq:0.8,  trend:0.3 },
        "1W":  { pts:35, base:281000, amp:2000,  freq:0.5,  trend:1.2 },
        "1M":  { pts:22, base:275000, amp:4000,  freq:0.4,  trend:2.5 },
        "3M":  { pts:13, base:265000, amp:8000,  freq:0.3,  trend:3   },
        "6M":  { pts:7,  base:248000, amp:12000, freq:0.25, trend:4   },
        "1Y":  { pts:13, base:222000, amp:10000, freq:0.2,  trend:5   },
        "ALL": { pts:25, base:180000, amp:15000, freq:0.15, trend:6   },
    }
    const c = configs[range]
    return Array.from({ length: c.pts }, (_, i) =>
        c.base + c.trend * i * 1000 + c.amp * Math.sin(c.freq * i) + c.amp * 0.3 * Math.sin(c.freq * 2.3 * i + 1)
    )
}
const genLabels = (range: string) => {
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
    const now = new Date()
    if (range === "1D") return Array.from({length:48},(_,i)=>`${String(Math.floor(i/2)).padStart(2,"0")}:${i%2?"30":"00"}`)
    if (range === "1W") return Array.from({length:35},(_,i)=>{ const d=new Date(now); d.setDate(d.getDate()-34+i); return `${d.getDate()} ${months[d.getMonth()]}` })
    if (range === "1M") return Array.from({length:22},(_,i)=>{ const d=new Date(now); d.setDate(d.getDate()-21+i); return `${d.getDate()} ${months[d.getMonth()]}` })
    if (range === "3M") return ["Mar","","","Apr","","","May","","","Jun","","",""]
    if (range === "6M") return ["Jan","Feb","Mar","Apr","May","Jun","Jul"]
    if (range === "1Y") return ["Jul","Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar","Apr","May","Jun","Jul"]
    return Array.from({length:25},(_,i)=>{ const y=2022+Math.floor(i/8); return i%8===0?String(y):"" })
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function MarketsPage() {
    const portChartRef = useRef<HTMLCanvasElement>(null)
    const donutChartRef = useRef<HTMLCanvasElement>(null)
    const portChartInstance = useRef<import("chart.js").Chart | null>(null)
    const donutChartInstance = useRef<import("chart.js").Chart | null>(null)

    // ── Live data state (null = still loading, falls back to static) ────────────
    const [liveIndices, setLiveIndices] = useState<IndexQuote[] | null>(null)
    const [liveQuotes, setLiveQuotes] = useState<Map<string, QuoteData>>(new Map())
    const [liveGainers, setLiveGainers] = useState<MoverStock[] | null>(null)
    const [liveLosers, setLiveLosers] = useState<MoverStock[] | null>(null)
    const [liveActive, setLiveActive] = useState<MoverStock[] | null>(null)
    const [liveNews, setLiveNews] = useState<NewsArticle[] | null>(null)
    const [fearGreed, setFearGreed] = useState<{
        score: number; label: string; color: string; vix: number | null
        factors: { name: string; score: number; color: string }[]
    } | null>(null)

    // ── Plaid Investments portfolio ───────────────────────────────────────────
    interface PlaidH { account_id: string; security_id: string; quantity: number; institution_price: number|null; institution_value: number|null; cost_basis: number|null; ticker: string|null; name: string; type: string|null; close_price: number|null }
    interface PlaidAcc { account_id: string; name: string; balances: { current: number|null } }

    const [plaidConfigured, setPlaidConfigured] = useState(false)
    const [plaidConnected,  setPlaidConnected]  = useState(false)
    const [plaidHoldings,   setPlaidHoldings]   = useState<PlaidH[]>([])
    const [plaidAccounts,   setPlaidAccounts]   = useState<PlaidAcc[]>([])
    const [plaidLinkBusy,   setPlaidLinkBusy]   = useState(false)
    const plaidTickersRef = useRef<string[]>([])

    // ── WebSocket live price overlay ─────────────────────────────────────────
    const wsSymbols = useMemo(() =>
        [...new Set([...HOLDINGS.map(h => h.ticker), ...WATCHLIST_ITEMS.map(w => w.tick)])]
            .filter(t => t !== "BTC-USD"),
        []
    )
    const wsTickRef = useRef<Map<string, number>>(new Map())
    useMarketStream(wsSymbols, (ticker, price) => { wsTickRef.current.set(ticker, price) })

    // Merge WebSocket ticks into liveQuotes at 1-second cadence (avoids per-trade re-renders)
    useEffect(() => {
        const t = setInterval(() => {
            if (!wsTickRef.current.size) return
            setLiveQuotes(prev => {
                const next = new Map(prev)
                for (const [ticker, price] of wsTickRef.current) {
                    const ex = next.get(ticker)
                    if (ex) next.set(ticker, { ...ex, price })
                }
                return next
            })
        }, 1000)
        return () => clearInterval(t)
    }, [])

    // ── Live data fetchers ────────────────────────────────────────────────────
    const fetchIndices = useCallback(async () => {
        try {
            const res = await fetch("/api/markets/indices")
            if (!res.ok) return
            const json = await res.json()
            if (json.data) setLiveIndices(json.data)
        } catch { /* stay on static fallback */ }
    }, [])

    const fetchQuotes = useCallback(async () => {
        // Include holdings, watchlist, screener, and Plaid tickers
        const allTickers = new Set([
            ...HOLDINGS.map(h => h.ticker),
            ...WATCHLIST_ITEMS.map(w => w.tick),
            ...SCREENER_DATA.map(s => s.ticker),
            ...plaidTickersRef.current,
        ])
        allTickers.delete("BTC-USD") // Finnhub doesn't serve crypto quotes
        const symbols = Array.from(allTickers).join(",")
        try {
            const res = await fetch(`/api/markets/quotes?symbols=${symbols}`)
            if (!res.ok) return
            const json = await res.json()
            if (json.data) {
                const map = new Map<string, QuoteData>()
                for (const q of json.data as QuoteData[]) map.set(q.ticker, q)
                setLiveQuotes(map)
                // Patch screener rows with live prices
                setScreenerRows(prev => prev.map(r => {
                    const live = map.get(r.ticker)
                    return live ? { ...r, price: live.price } : r
                }))
            }
        } catch { /* stay on static fallback */ }
    }, [])

    const fetchMovers = useCallback(async () => {
        try {
            const res = await fetch("/api/markets/movers")
            if (!res.ok) return
            const json = await res.json()
            if (json.data?.gainers) setLiveGainers(json.data.gainers)
            if (json.data?.losers)  setLiveLosers(json.data.losers)
            if (json.data?.active)  setLiveActive(json.data.active)
        } catch { /* stay on static fallback */ }
    }, [])

    const fetchNews = useCallback(async () => {
        try {
            const res = await fetch("/api/markets/news")
            if (!res.ok) return
            const json = await res.json()
            if (json.data) setLiveNews(json.data)
        } catch { /* stay on static fallback */ }
    }, [])

    const fetchFearGreed = useCallback(async () => {
        try {
            const res = await fetch("/api/markets/fear-greed")
            if (!res.ok) return
            const json = await res.json()
            if (json.data) setFearGreed(json.data)
        } catch { /* stay on static fallback */ }
    }, [])

    const fetchPlaidHoldings = useCallback(async () => {
        try {
            const res = await fetch("/api/plaid/holdings")
            const json = await res.json()
            setPlaidConfigured(json.configured !== false)
            if (json.connected && json.data) {
                setPlaidConnected(true)
                setPlaidHoldings(json.data.holdings)
                setPlaidAccounts(json.data.accounts)
                plaidTickersRef.current = json.data.holdings
                    .filter((h: PlaidH) => h.ticker)
                    .map((h: PlaidH) => h.ticker as string)
            } else {
                setPlaidConnected(false)
                setPlaidHoldings([])
                plaidTickersRef.current = []
            }
        } catch { /* stay on demo */ }
    }, [])

    const openPlaidLink = useCallback(async () => {
        setPlaidLinkBusy(true)
        try {
            const res = await fetch("/api/plaid/link-token")
            const { link_token, error } = await res.json()
            if (error || !link_token) return
            const PlaidLib = (window as typeof window & { Plaid?: { create: (cfg: object) => { open: () => void } } }).Plaid
            if (!PlaidLib) { alert("Plaid Link not ready — please refresh and try again."); return }
            PlaidLib.create({
                token: link_token,
                onSuccess: async (public_token: string) => {
                    const r = await fetch("/api/plaid/exchange", {
                        method: "POST", headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ public_token }),
                    })
                    if ((await r.json()).ok) { await fetchPlaidHoldings(); await fetchQuotes() }
                },
                onExit: () => {},
            }).open()
        } finally { setPlaidLinkBusy(false) }
    }, [fetchPlaidHoldings, fetchQuotes])

    const disconnectPlaid = useCallback(async () => {
        await fetch("/api/plaid/exchange", { method: "DELETE" })
        setPlaidConnected(false); setPlaidHoldings([]); setPlaidAccounts([])
        plaidTickersRef.current = []
    }, [])

    // Initial fetch + 30s polling for quotes/indices; 2min for news; 15min for fear-greed
    useEffect(() => {
        fetchIndices(); fetchQuotes(); fetchMovers(); fetchNews(); fetchFearGreed(); fetchPlaidHoldings()
        const fast = setInterval(() => { fetchIndices(); fetchQuotes() }, 30_000)
        const slow = setInterval(() => { fetchMovers(); fetchNews() }, 120_000)
        const fgi  = setInterval(fetchFearGreed, 900_000)
        // Load Plaid Link CDN script
        if (!document.getElementById("plaid-link-v2")) {
            const s = document.createElement("script"); s.id = "plaid-link-v2"
            s.src = "https://cdn.plaid.com/link/v2/stable/link-initialize.js"; s.async = true
            document.head.appendChild(s)
        }
        return () => { clearInterval(fast); clearInterval(slow); clearInterval(fgi) }
    }, [fetchIndices, fetchQuotes, fetchMovers, fetchNews, fetchFearGreed, fetchPlaidHoldings])

    const [activeRange, setActiveRange] = useState("1Y")
    const [openDrop, setOpenDrop] = useState<number | null>(null)
    const [sortCol, setSortCol] = useState<string | null>(null)
    const [sortDir, setSortDir] = useState(1)
    const [screenerRows, setScreenerRows] = useState(SCREENER_DATA)
    const [screenerOpen, setScreenerOpen] = useState(true)
    const [sector, setSector] = useState("All")
    const [mktCap, setMktCap] = useState("All")
    const [peMax, setPeMax] = useState(100)
    const [divMin, setDivMin] = useState(0)
    const [w52Filter, setW52Filter] = useState("All")

    useEffect(() => {
        let destroyed = false
        const init = async () => {
            const { Chart, registerables } = await import("chart.js")
            Chart.register(...registerables)
            if (destroyed) return

            if (portChartRef.current && !portChartInstance.current) {
                const ctx = portChartRef.current.getContext("2d")!
                const grad = ctx.createLinearGradient(0, 0, 0, 220)
                grad.addColorStop(0, "rgba(0,6,26,0.1)")
                grad.addColorStop(1, "rgba(0,6,26,0)")
                portChartInstance.current = new Chart(ctx, {
                    type: "line",
                    data: { labels: genLabels("1Y"), datasets: [{ data: genCurve("1Y"), fill: true, backgroundColor: grad, borderColor: "#00061a", borderWidth: 2, pointRadius: 0, tension: 0.4 }] },
                    options: {
                        responsive: true, maintainAspectRatio: false,
                        plugins: { legend: { display: false }, tooltip: { mode: "index", intersect: false, backgroundColor: "#00061a", borderColor: "rgba(0,6,26,0.2)", borderWidth: 1, titleColor: "#b8c6ee", bodyColor: "#ffffff", callbacks: { label: (i) => fmt(i.raw as number) } } },
                        scales: {
                            x: { grid: { color: "rgba(197,198,207,0.3)" }, ticks: { color: "#75777f", font: { size: 10 }, maxTicksLimit: 8 } },
                            y: { display: false },
                        },
                    },
                })
            }

            if (donutChartRef.current && !donutChartInstance.current) {
                const ctx = donutChartRef.current.getContext("2d")!
                donutChartInstance.current = new Chart(ctx, {
                    type: "doughnut",
                    data: {
                        labels: ["Stocks","ETFs","Bonds","Crypto","Cash"],
                        datasets: [{ data: [58,22,10,6,4], backgroundColor: ["#00061a","#505e80","#b8c6ee","#75777f","#3f6b3f"], borderWidth: 0, hoverOffset: 6 }],
                    },
                    options: { responsive: true, maintainAspectRatio: true, cutout: "72%", plugins: { legend: { display: false }, tooltip: { backgroundColor: "#00061a", titleColor: "#b8c6ee", bodyColor: "#ffffff" } } },
                })
            }
        }
        init()
        return () => {
            destroyed = true
            portChartInstance.current?.destroy()
            donutChartInstance.current?.destroy()
            portChartInstance.current = null
            donutChartInstance.current = null
        }
    }, [])

    const handleRangeChange = useCallback((range: string) => {
        setActiveRange(range)
        if (portChartInstance.current) {
            portChartInstance.current.data.labels = genLabels(range)
            portChartInstance.current.data.datasets[0].data = genCurve(range)
            portChartInstance.current.update("active")
        }
    }, [])

    // Build a unified holding shape from Plaid (if connected) or demo HOLDINGS
    const activeHoldings = React.useMemo(() => {
        if (!plaidConnected || !plaidHoldings.length) return HOLDINGS
        const rows = plaidHoldings
            .filter(h => h.ticker)
            .map((h, i) => {
                const live      = liveQuotes.get(h.ticker!)
                const livePrice = live?.price ?? h.institution_price ?? h.close_price ?? 0
                const totalCost = h.cost_basis ?? livePrice * h.quantity
                const avgCost   = h.quantity > 0 ? totalCost / h.quantity : livePrice
                const value     = h.quantity * livePrice
                const ret       = avgCost > 0 ? ((livePrice - avgCost) / avgCost) * 100 : 0
                const dayChg    = live?.changePct ?? 0
                return { num: i + 1, ticker: h.ticker!, company: h.name, shares: h.quantity, avgCost, price: livePrice, value, dayChg, ret, weight: 0 }
            })
        const total = rows.reduce((s, r) => s + r.value, 0)
        return rows.map(r => ({ ...r, weight: total > 0 ? r.value / total * 100 : 0 }))
    }, [plaidConnected, plaidHoldings, liveQuotes])

    const portfolioValue = React.useMemo(() => {
        if (plaidConnected && activeHoldings !== HOLDINGS) {
            return activeHoldings.reduce((s, h) => s + h.value, 0)
        }
        return 284_731.42
    }, [plaidConnected, activeHoldings])

    const portfolioTotalGain = React.useMemo(() => {
        if (plaidConnected && plaidHoldings.length > 0) {
            const costBasis = plaidHoldings.reduce((s, h) => s + (h.cost_basis ?? 0), 0)
            const abs = portfolioValue - costBasis
            const pct = costBasis > 0 ? abs / costBasis * 100 : 0
            return { abs, pct }
        }
        return { abs: 62_418.90, pct: 28.08 }
    }, [plaidConnected, plaidHoldings, portfolioValue])

    const sortedHoldings = React.useMemo(() => {
        if (!sortCol) return activeHoldings
        return [...activeHoldings].sort((a, b) => {
            const av = (a as Record<string, unknown>)[sortCol]
            const bv = (b as Record<string, unknown>)[sortCol]
            if (typeof av === "string" && typeof bv === "string") return av.localeCompare(bv) * sortDir
            return ((av as number) - (bv as number)) * sortDir
        })
    }, [sortCol, sortDir, activeHoldings])

    const allMovers = React.useMemo<{ ticker: string; companyName: string; price: number; changePct: number; logoUrl?: string }[]>(() => {
        const g = liveGainers ?? GAINERS.map(m => ({ ticker: m.tick, companyName: m.name, price: m.price, changePct: m.chg, logoUrl: undefined }))
        const l = liveLosers  ?? LOSERS.map(m  => ({ ticker: m.tick, companyName: m.name, price: m.price, changePct: m.chg, logoUrl: undefined }))
        const a = liveActive  ?? MOST_ACTIVE.map(m => ({ ticker: m.tick, companyName: m.tick, price: m.price, changePct: m.chg, logoUrl: undefined }))
        return [...g, ...l, ...a]
    }, [liveGainers, liveLosers, liveActive])

    const handleSort = (col: string) => {
        if (sortCol === col) setSortDir(d => d * -1)
        else { setSortCol(col); setSortDir(1) }
    }

    const applyFilters = () => {
        setScreenerRows(SCREENER_DATA.filter(r => {
            if (sector !== "All" && r.sector !== sector) return false
            if (mktCap === "Mega (>$200B)" && r.mktCap < 200e9) return false
            if (mktCap === "Large" && (r.mktCap < 10e9 || r.mktCap >= 200e9)) return false
            if (mktCap === "Mid" && (r.mktCap < 2e9 || r.mktCap >= 10e9)) return false
            if (r.pe > peMax) return false
            if (r.div < divMin) return false
            if (w52Filter === "Near High" && r.w52 < 15) return false
            if (w52Filter === "Near Low" && r.w52 > -10) return false
            if (w52Filter === "Breakout" && r.w52 < 30) return false
            return true
        }))
    }
    const resetFilters = () => {
        setSector("All"); setMktCap("All"); setPeMax(100); setDivMin(0); setW52Filter("All")
        setScreenerRows(SCREENER_DATA)
    }

    useEffect(() => {
        const handler = () => setOpenDrop(null)
        document.addEventListener("click", handler)
        return () => document.removeEventListener("click", handler)
    }, [])

    const thCls = (col: string) =>
        `px-3 py-2.5 text-left font-ui-button text-[11px] uppercase tracking-widest text-on-surface-variant border-b border-outline-variant/20 whitespace-nowrap cursor-pointer hover:text-primary transition-colors select-none${sortCol === col ? (sortDir === 1 ? " after:content-['_↑'] after:text-primary" : " after:content-['_↓'] after:text-primary") : ""}`

    const posText = "text-green-700"
    const negText = "text-red-700"
    const card = "bg-surface-container-lowest border border-outline-variant/30 rounded-lg"

    return (
        <>
        {/* Minimal scoped styles: scrollbar, transition, range/select chrome */}
        <style>{`
            .mkts-scr-body { max-height:0; overflow:hidden; transition:max-height .35s ease; }
            .mkts-scr-body.open { max-height:300px; }
            .mkts-bar { scrollbar-width:none; }
            .mkts-bar::-webkit-scrollbar { display:none; }
            .mkts-select { appearance:none; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2375777f' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 8px center; padding-right:28px; }
            .mkts-range { width:100%; height:4px; appearance:none; background:#c5c6cf; border-radius:4px; outline:none; cursor:pointer; }
            .mkts-range::-webkit-slider-thumb { appearance:none; width:14px; height:14px; border-radius:50%; background:#00061a; cursor:pointer; }
            .mkts-range::-moz-range-thumb { width:14px; height:14px; border-radius:50%; background:#00061a; cursor:pointer; border:none; }
            .mkts-pulse { animation:mkts-pulse 2s infinite; }
            @keyframes mkts-pulse { 0%{box-shadow:0 0 0 0 rgba(63,107,63,.5)} 70%{box-shadow:0 0 0 8px rgba(63,107,63,0)} 100%{box-shadow:0 0 0 0 rgba(63,107,63,0)} }
            .mkts-marquee { display:flex; width:max-content; animation:mkts-scroll 30s linear infinite; }
            .mkts-marquee:hover { animation-play-state:paused; }
            @keyframes mkts-scroll { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        `}</style>

        <div className="bg-surface min-h-screen">

        {/* Market summary bar — continuous marquee */}
        <div className="bg-surface-container-low border-b border-outline-variant/20 overflow-hidden relative">
            <div className="mkts-marquee py-2.5 gap-2 px-2">
                {[...MARKETS, ...MARKETS].map((m, i) => {
                    const live = liveIndices?.[i % MARKETS.length]
                    const pos = live ? live.changePct >= 0 : m.pos
                    const val = live ? (live.price > 1000 ? live.price.toLocaleString("en-US", {maximumFractionDigits:0}) : live.price.toFixed(2)) : m.val
                    const chgAbs = live ? (live.change >= 0 ? "+" : "") + live.change.toFixed(2) : m.chg
                    const chgPct = live ? (live.changePct >= 0 ? "+" : "") + live.changePct.toFixed(2) + "%" : m.pct
                    const pts = live?.pts?.length ? live.pts : m.pts
                    return (
                        <div key={i} className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-surface-container-lowest border border-outline-variant/30 cursor-pointer hover:border-primary/30 transition-colors flex-shrink-0 whitespace-nowrap">
                            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">{m.name}</span>
                            <span className="text-[13px] font-semibold font-mono text-on-surface">{val}</span>
                            <span className={`text-[11px] font-medium ${pos ? posText : negText}`}>{pos ? "▲" : "▼"} {chgAbs} ({chgPct})</span>
                            <Sparkline pts={pts} w={52} h={20} color={pos ? "#3f6b3f" : "#ba1a1a"} />
                        </div>
                    )
                })}
            </div>
        </div>

        <Container className="py-8 space-y-6">

            {/* Back link */}
            <Link href="/investing" className="inline-flex items-center gap-1.5 font-ui-button text-ui-button uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors">
                <MaterialIcon name="arrow_back" size={16} /> Back to Investing
            </Link>

            {/* Section heading */}
            <div>
                <p className="font-ui-button text-[11px] uppercase tracking-widest text-on-surface-variant mb-1">Markets</p>
                <h1 className="font-headline-md text-headline-md text-primary">Markets Dashboard</h1>
            </div>

            {/* ── Portfolio Overview ── */}
            <div className="grid gap-5" style={{gridTemplateColumns:"65fr 35fr"}}>
                <div className={`${card} p-6`}>
                    <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                            <p className="font-ui-button text-[11px] uppercase tracking-widest text-on-surface-variant">Total Portfolio Value</p>
                            {plaidConnected ? (
                                <span className="text-[10px] px-2 py-0.5 rounded-full border border-green-600/40 bg-green-50 text-green-700 font-ui-button uppercase tracking-wider">Live portfolio · Plaid</span>
                            ) : (
                                <span className="text-[10px] px-2 py-0.5 rounded-full border border-outline-variant/40 bg-surface-container-low text-on-surface-variant font-ui-button uppercase tracking-wider">Demo portfolio · Live prices</span>
                            )}
                        </div>
                        {plaidConfigured && (
                            plaidConnected ? (
                                <button onClick={disconnectPlaid} className="text-[11px] px-3 py-1 rounded border border-outline-variant/40 text-on-surface-variant hover:border-red-600/40 hover:text-red-700 transition-colors font-ui-button uppercase tracking-wider">Disconnect</button>
                            ) : (
                                <button onClick={openPlaidLink} disabled={plaidLinkBusy} className="text-[11px] px-3 py-1 rounded border border-primary text-primary hover:bg-primary hover:text-white transition-colors font-ui-button uppercase tracking-wider disabled:opacity-50">{plaidLinkBusy ? "Loading…" : "Connect Brokerage"}</button>
                            )
                        )}
                    </div>
                    <div className="font-headline-md text-[34px] text-primary font-mono mb-1">
                        ${portfolioValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className={`font-body-md text-sm font-medium mb-5 ${posText}`}>▲ +$1,847.23 (+0.65%) today</div>
                    <div className="flex gap-2.5 mb-5">
                        <div className="flex-1 p-3 rounded-lg border border-outline-variant/30 bg-surface-container-low">
                            <div className="font-ui-button text-[10px] uppercase tracking-widest text-on-surface-variant mb-1">Total Gain</div>
                            <div className={`text-[15px] font-semibold font-mono ${portfolioTotalGain.abs >= 0 ? posText : negText}`}>
                                {portfolioTotalGain.abs >= 0 ? "+" : "-"}${Math.abs(portfolioTotalGain.abs).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({Math.abs(portfolioTotalGain.pct).toFixed(2)}%)
                            </div>
                        </div>
                        <div className="flex-1 p-3 rounded-lg border border-outline-variant/30 bg-surface-container-low">
                            <div className="font-ui-button text-[10px] uppercase tracking-widest text-on-surface-variant mb-1">Dividend Yield</div>
                            <div className="text-[15px] font-semibold font-mono text-primary">1.84%</div>
                        </div>
                        <div className="flex-1 p-3 rounded-lg border border-outline-variant/30 bg-surface-container-low">
                            <div className="font-ui-button text-[10px] uppercase tracking-widest text-on-surface-variant mb-1">Beta</div>
                            <div className="text-[15px] font-semibold font-mono text-primary">1.12</div>
                        </div>
                    </div>
                    <div className="flex gap-1 mb-3">
                        {["1D","1W","1M","3M","6M","1Y","ALL"].map(r => (
                            <button key={r} onClick={() => handleRangeChange(r)} className={`px-2.5 py-1 rounded text-[12px] font-medium transition-all ${activeRange===r ? "bg-primary text-white" : "text-on-surface-variant hover:bg-surface-container-low hover:text-primary"}`}>{r}</button>
                        ))}
                    </div>
                    <div className="relative h-[220px]"><canvas ref={portChartRef} /></div>
                </div>

                <div className={`${card} p-6`}>
                    <p className="font-ui-button text-[11px] uppercase tracking-widest text-on-surface-variant mb-4">Asset Allocation</p>
                    <div className="relative w-[180px] h-[180px] mx-auto mb-5">
                        <canvas ref={donutChartRef} />
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <div className="text-[24px] font-bold text-primary">58%</div>
                            <div className="font-ui-button text-[11px] uppercase tracking-wider text-on-surface-variant">Stocks</div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        {[["#00061a","Stocks","58%","$165,144"],["#505e80","ETFs","22%","$62,641"],["#b8c6ee","Bonds","10%","$28,473"],["#75777f","Crypto","6%","$17,084"],["#3f6b3f","Cash","4%","$11,389"]].map(([color,name,pct,val])=>(
                            <div key={name} className="flex items-center justify-between">
                                <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{background:color}}/><span className="text-sm text-on-surface-variant">{name}</span></div>
                                <div className="flex items-center gap-2.5"><span className="text-sm font-semibold text-primary">{pct}</span><span className="text-xs text-on-surface-variant font-mono">{val}</span></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Holdings Table ── */}
            <div className={card}>
                <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/20">
                    <div>
                        <h2 className="font-headline-md text-[18px] text-primary">My Holdings</h2>
                        {plaidConnected && plaidAccounts.length > 0 && (
                            <p className="text-[11px] text-on-surface-variant mt-0.5">{plaidAccounts.map(a => a.name).join(" · ")}</p>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {!plaidConfigured && (
                            <span className="text-[11px] text-on-surface-variant font-ui-button uppercase tracking-wider">Demo data — add PLAID_CLIENT_ID to connect a brokerage</span>
                        )}
                        {plaidConfigured && !plaidConnected && (
                            <button onClick={openPlaidLink} disabled={plaidLinkBusy} className="flex items-center gap-1.5 px-4 py-1.5 rounded border border-primary text-primary text-sm font-medium hover:bg-primary hover:text-white transition-colors disabled:opacity-50">
                                {plaidLinkBusy ? "Loading…" : "Connect Brokerage"}
                            </button>
                        )}
                        {plaidConnected && (
                            <button className="flex items-center gap-1.5 px-4 py-1.5 rounded border border-outline-variant/40 text-on-surface-variant text-sm font-medium hover:bg-surface-container-low transition-colors">Refresh</button>
                        )}
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <caption className="sr-only">Portfolio Holdings</caption>
                        <thead>
                            <tr>
                                {[["num","#"],["ticker","Ticker"],["company","Company"],["shares","Shares"],["avgCost","Avg Cost"],["price","Current Price"],["value","Market Value"],["dayChg","Day Change"],["ret","Total Return"],["weight","Weight"]].map(([col,label])=>(
                                    <th key={col} scope="col" onClick={() => handleSort(col)} className={thCls(col)}>{label}</th>
                                ))}
                                <th scope="col" className="px-3 py-2.5 text-left font-ui-button text-[11px] uppercase tracking-widest text-on-surface-variant border-b border-outline-variant/20">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedHoldings.map((h, i) => (
                                <tr key={h.ticker} className={`group/row ${i%2?"bg-surface-container-low/40":""} hover:bg-primary/5 transition-colors`}>
                                    <td className="px-3 py-3 text-sm text-on-surface-variant">{h.num}</td>
                                    <td className="px-3 py-3">
                                        <div className="flex items-center gap-2">
                                            <CompanyLogo ticker={h.ticker} logoUrl={liveQuotes.get(h.ticker)?.logoUrl} size={20} />
                                            <span className="font-mono font-bold text-sm text-primary">{h.ticker}</span>
                                        </div>
                                    </td>
                                    <td className="px-3 py-3 text-sm text-on-surface whitespace-nowrap">{h.company}</td>
                                    <td className="px-3 py-3 text-sm text-on-surface">{h.shares}</td>
                                    <td className="px-3 py-3 text-sm text-on-surface font-mono">{fmt(h.avgCost)}</td>
                                    <td className="px-3 py-3 text-sm text-on-surface font-mono">{fmt(liveQuotes.get(h.ticker)?.price ?? h.price)}</td>
                                    <td className="px-3 py-3 text-sm text-on-surface font-mono font-semibold">{fmt((liveQuotes.get(h.ticker)?.price ?? h.price) * h.shares)}</td>
                                    <td className="px-3 py-3">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${(liveQuotes.get(h.ticker)?.changePct ?? h.dayChg)>=0 ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>{fmtPct(liveQuotes.get(h.ticker)?.changePct ?? h.dayChg)}</span>
                                    </td>
                                    <td className={`px-3 py-3 text-sm font-medium ${h.ret>=0 ? posText : negText}`}>{fmtPct(h.ret)}</td>
                                    <td className="px-3 py-3 text-sm text-on-surface">{h.weight.toFixed(1)}%</td>
                                    <td className="px-3 py-3">
                                        <div className="relative" onClick={e => e.stopPropagation()}>
                                            <button onClick={() => setOpenDrop(openDrop===h.num?null:h.num)} className="px-2 py-1 rounded border border-outline-variant/30 text-on-surface-variant hover:border-primary/40 hover:text-primary text-sm transition-colors">···</button>
                                            {openDrop===h.num && (
                                                <div className="absolute right-0 top-full mt-1 bg-surface-container-lowest border border-outline-variant/30 rounded-lg p-1 z-50 min-w-[130px] shadow-lg">
                                                    {["Buy More","Sell","Set Alert"].map(a=><div key={a} className="px-3 py-1.5 text-sm text-on-surface rounded hover:bg-surface-container-low cursor-pointer">{a}</div>)}
                                                    <div className="px-3 py-1.5 text-sm text-red-700 rounded hover:bg-red-50 cursor-pointer">Remove</div>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            <tr className="border-t border-outline-variant/30 bg-surface-container-low">
                                <td colSpan={6} className="px-3 py-3 font-semibold text-sm text-primary">Totals</td>
                                <td className="px-3 py-3 font-semibold text-sm text-primary font-mono">{fmt(HOLDINGS.reduce((s,h)=>s+h.value,0))}</td>
                                <td className="px-3 py-3"/>
                                <td className={`px-3 py-3 font-semibold text-sm ${posText}`}>+$62,418.90</td>
                                <td className="px-3 py-3 font-semibold text-sm text-primary">100%</td>
                                <td className="px-3 py-3"/>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div className="flex items-center justify-between px-5 py-3 border-t border-outline-variant/20 text-sm text-on-surface-variant">
                    <span>Showing 1–12 of 12 positions</span>
                    <div className="flex gap-2">
                        <button disabled className="px-3 py-1.5 rounded border border-outline-variant/20 text-sm text-on-surface-variant/40 cursor-not-allowed">← Prev</button>
                        <button disabled className="px-3 py-1.5 rounded border border-outline-variant/20 text-sm text-on-surface-variant/40 cursor-not-allowed">Next →</button>
                    </div>
                </div>
            </div>

            {/* ── Market Movers ── */}
            <div className="grid grid-cols-3 gap-5">
                {([
                    ["Top Gainers","↗",posText,liveGainers,GAINERS,"pos"],
                    ["Top Losers","↘",negText,liveLosers,LOSERS,"neg"]
                ] as const).map(([title, icon, cls, liveItems, staticItems, type]) => {
                    const items = liveItems ?? staticItems.map(m => ({ ticker:m.tick, companyName:m.name, price:m.price, changePct:m.chg, volume:0, logoUrl:undefined, pts:m.pts }))
                    return (
                    <div key={title} className={`${card} p-5`}>
                        <h3 className="font-headline-md text-[16px] text-primary mb-3 flex items-center gap-2">
                            <span className={cls}>{icon}</span> {title}
                        </h3>
                        {items.map((m: MoverStock & { pts?: number[] }) => (
                            <div key={m.ticker} className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer hover:bg-surface-container-low transition-colors">
                                <CompanyLogo ticker={m.ticker} logoUrl={m.logoUrl} size={24} />
                                <div className="flex-1 min-w-0">
                                    <div className="font-mono font-bold text-sm text-primary truncate">{m.ticker}</div>
                                    <div className="text-xs text-on-surface-variant truncate">{m.companyName}</div>
                                </div>
                                <span className="font-mono text-sm text-on-surface">{fmt(m.price)}</span>
                                <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full border ${type==="pos" ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}>{type==="pos"?"+":""}{m.changePct.toFixed(2)}%</span>
                            </div>
                        ))}
                    </div>
                    )
                })}
                <div className={`${card} p-5`}>
                    <h3 className="font-headline-md text-[16px] text-primary mb-3 flex items-center gap-2">
                        <span className="text-primary/60">⚡</span> Most Active
                    </h3>
                    {(liveActive ?? MOST_ACTIVE.map(m => ({ ticker:m.tick, companyName:m.tick, price:m.price, changePct:m.chg, volume:m.vol, logoUrl:undefined }))).map(m => {
                        const maxVol = (liveActive ?? MOST_ACTIVE.map(x=>({volume:x.vol}))).reduce((mx,x)=>Math.max(mx,x.volume),1)
                        return (
                        <div key={m.ticker} className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer hover:bg-surface-container-low transition-colors">
                            <CompanyLogo ticker={m.ticker} logoUrl={m.logoUrl} size={24} />
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="font-mono font-bold text-sm text-primary">{m.ticker}</span>
                                    <span className="text-xs text-on-surface-variant">{fmtShort(m.volume)}</span>
                                </div>
                                <div className="h-1 bg-outline-variant/30 rounded-full overflow-hidden">
                                    <div className="h-full bg-primary/70 rounded-full" style={{width:`${Math.min(100,(m.volume/maxVol*100)).toFixed(0)}%`}}/>
                                </div>
                            </div>
                            <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full border ml-2 ${m.changePct>=0 ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}>{fmtPct(m.changePct)}</span>
                        </div>
                        )
                    })}
                </div>
            </div>

            {/* ── Stock Screener ── */}
            <div className={card}>
                <div className="flex items-center justify-between px-5 py-4 cursor-pointer" onClick={() => setScreenerOpen(o => !o)}>
                    <h2 className="font-headline-md text-[18px] text-primary">Stock Screener</h2>
                    <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full border border-outline-variant/40 bg-surface-container-low text-on-surface-variant font-ui-button uppercase tracking-wider">Live prices · Demo P/E &amp; fundamentals</span>
                    <span className={`text-on-surface-variant text-lg transition-transform duration-300 ${screenerOpen ? "rotate-180" : ""}`}>▾</span>
                </div>
                <div className={`mkts-scr-body ${screenerOpen ? "open" : ""}`}>
                    <div className="px-5 pb-4 flex flex-wrap gap-3 border-b border-outline-variant/20">
                        {(
                            [
                                ["Sector",    sector,    setSector,    ["All","Tech","Healthcare","Finance","Energy","Consumer","Industrial"]],
                                ["Market Cap",mktCap,    setMktCap,    ["All","Mega (>$200B)","Large","Mid","Small","Micro"]],
                                ["52W Perf",  w52Filter, setW52Filter, ["All","Near High","Near Low","Breakout"]],
                            ] as const satisfies [string, string, React.Dispatch<React.SetStateAction<string>>, readonly string[]][]
                        ).map(([label, val, setter, opts]) => (
                            <div key={label} className="flex flex-col gap-1 min-w-[150px]">
                                <label className="font-ui-button text-[10px] uppercase tracking-widest text-on-surface-variant">{label}</label>
                                <select
                                    className="mkts-select px-3 py-2 rounded-lg border border-outline-variant/30 bg-surface-container-low text-sm text-on-surface focus:outline-none focus:border-primary/40"
                                    value={val}
                                    onChange={e => setter(e.target.value)}
                                >
                                    {(opts as readonly string[]).map(o => <option key={o}>{o}</option>)}
                                </select>
                            </div>
                        ))}
                        <div className="flex flex-col gap-1 min-w-[160px]">
                            <label className="font-ui-button text-[10px] uppercase tracking-widest text-on-surface-variant">P/E Max: {peMax}</label>
                            <input type="range" min={0} max={100} value={peMax} onChange={e => setPeMax(+e.target.value)} className="mkts-range mt-2" />
                        </div>
                        <div className="flex flex-col gap-1 min-w-[160px]">
                            <label className="font-ui-button text-[10px] uppercase tracking-widest text-on-surface-variant">Div Yield Min: {divMin.toFixed(1)}%</label>
                            <input type="range" min={0} max={10} step={0.1} value={divMin} onChange={e => setDivMin(+e.target.value)} className="mkts-range mt-2" />
                        </div>
                    </div>
                    <div className="flex items-center gap-3 px-5 py-3">
                        <button onClick={applyFilters} className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors">Apply Filters</button>
                        <button onClick={resetFilters} className="text-sm text-on-surface-variant underline hover:text-primary transition-colors bg-transparent border-none cursor-pointer">Reset</button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <caption className="sr-only">Stock Screener Results</caption>
                        <thead>
                            <tr>
                                {["Ticker","Company","Sector","Price","Mkt Cap","P/E","Div Yield","52W Change"].map(h => (
                                    <th key={h} scope="col" className="px-3 py-2.5 text-left font-ui-button text-[11px] uppercase tracking-widest text-on-surface-variant border-b border-outline-variant/20 whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {screenerRows.map((r, i) => (
                                <tr key={r.ticker} className={i%2 ? "bg-surface-container-low/40" : ""}>
                                    <td className="px-3 py-2.5 font-mono font-bold text-sm text-primary">{r.ticker}</td>
                                    <td className="px-3 py-2.5 text-sm text-on-surface whitespace-nowrap">{r.company}</td>
                                    <td className="px-3 py-2.5"><span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-primary/10 text-primary border border-primary/20">{r.sector}</span></td>
                                    <td className="px-3 py-2.5 font-mono text-sm text-on-surface">{fmt(r.price)}</td>
                                    <td className="px-3 py-2.5 font-mono text-sm text-on-surface">{fmtShort(r.mktCap)}</td>
                                    <td className="px-3 py-2.5 text-sm text-on-surface">{r.pe.toFixed(1)}</td>
                                    <td className="px-3 py-2.5 text-sm text-on-surface">{r.div.toFixed(2)}%</td>
                                    <td className={`px-3 py-2.5 text-sm font-medium ${r.w52>=0 ? posText : negText}`}>{fmtPct(r.w52)}</td>
                                </tr>
                            ))}
                            {screenerRows.length===0 && <tr><td colSpan={8} className="px-3 py-8 text-center text-on-surface-variant text-sm">No results match the current filters.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── News & Sentiment ── */}
            <div className="grid gap-5" style={{gridTemplateColumns:"60fr 40fr"}}>
                <div className={`${card} p-5`}>
                    <h2 className="font-headline-md text-[18px] text-primary mb-4">Market News</h2>
                    {(liveNews ?? ARTICLES.map(a => ({ id:a.src+a.hl, source:a.src, title:a.hl, summary:a.sum, publishedAt:a.time, url:"#", tickers:a.tickers, sentiment:a.sent }))).map(a => (
                        <a key={a.id} href={a.url} target="_blank" rel="noopener noreferrer" className="block p-3.5 rounded-lg border border-outline-variant/30 mb-2.5 cursor-pointer hover:border-primary/30 hover:bg-surface-container-low transition-colors no-underline">
                            <div className="flex items-center gap-2 mb-1.5">
                                <span className="font-ui-button text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded bg-surface-container border border-outline-variant/30 text-on-surface-variant">{a.source}</span>
                                <span className="text-xs text-on-surface-variant">{a.publishedAt}</span>
                            </div>
                            <div className="font-body-md text-[14px] font-medium text-primary mb-1 leading-snug">{a.title}</div>
                            <div className="text-xs text-on-surface-variant mb-2 line-clamp-2">{a.summary}</div>
                            <div className="flex items-center justify-between">
                                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${a.sentiment==="bull" ? "bg-green-50 text-green-700 border-green-200" : a.sentiment==="bear" ? "bg-red-50 text-red-700 border-red-200" : "bg-surface-container border-outline-variant/30 text-on-surface-variant"}`}>{a.sentiment==="bull"?"Bullish":a.sentiment==="bear"?"Bearish":"Neutral"}</span>
                                <div className="flex gap-1">{a.tickers.map(t=><span key={t} className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">{t}</span>)}</div>
                            </div>
                        </a>
                    ))}
                </div>

                <div className={`${card} p-5`}>
                    <h3 className="font-headline-md text-[16px] text-primary text-center mb-1">Fear &amp; Greed Index</h3>
                    <p className="text-xs text-on-surface-variant text-center mb-3">
                        {fearGreed
                            ? `Composite${fearGreed.vix != null ? ` · VIX ${fearGreed.vix}` : ""} · Live`
                            : "Composite · Updated every 15 min"}
                    </p>
                    {(() => {
                        const s   = fearGreed?.score ?? 67
                        const rad = (1 - s / 100) * Math.PI
                        const nx  = (120 + 90 * Math.cos(rad)).toFixed(1)
                        const ny  = (120 - 90 * Math.sin(rad)).toFixed(1)
                        const col = fearGreed?.color ?? "#3f6b3f"
                        return (
                            <svg viewBox="0 0 240 130" width="100%" style={{maxWidth:240,display:"block",margin:"0 auto"}}>
                                <defs>
                                    <linearGradient id="gGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#ba1a1a"/>
                                        <stop offset="40%" stopColor="#b45309"/>
                                        <stop offset="100%" stopColor="#3f6b3f"/>
                                    </linearGradient>
                                </defs>
                                <path d="M 20 120 A 100 100 0 0 1 220 120" fill="none" stroke="#e3e3de" strokeWidth="14" strokeLinecap="round"/>
                                <path d="M 20 120 A 100 100 0 0 1 220 120" fill="none" stroke="url(#gGrad2)" strokeWidth="14" strokeLinecap="round"/>
                                <line x1="120" y1="120" x2={nx} y2={ny} stroke="#00061a" strokeWidth="2.5" strokeLinecap="round"/>
                                <circle cx="120" cy="120" r="6" fill="#00061a"/>
                                <text x="14" y="138" fontSize="9" fill="#ba1a1a" fontFamily="sans-serif">Fear</text>
                                <text x="195" y="138" fontSize="9" fill="#3f6b3f" fontFamily="sans-serif">Greed</text>
                                <text x="120" y="95" textAnchor="middle" fontSize="22" fontWeight="700" fill={col} fontFamily="sans-serif">{s}</text>
                                <text x="120" y="111" textAnchor="middle" fontSize="11" fill={col} fontFamily="sans-serif">{fearGreed?.label ?? "Greed"}</text>
                            </svg>
                        )
                    })()}
                    <div className="mt-4 space-y-2">
                        <p className="font-ui-button text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">Contributing Factors</p>
                        {(fearGreed?.factors ?? FACTORS).map(f => (
                            <div key={f.name} className="flex items-center gap-2">
                                <span className="text-xs text-on-surface-variant w-32 flex-shrink-0">{f.name}</span>
                                <div className="flex-1 h-1 bg-outline-variant/40 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full" style={{width:`${f.score}%`,background:f.color}}/>
                                </div>
                                <span className="text-xs font-semibold text-primary w-7 text-right">{f.score}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Watchlist ── */}
            <div className={card}>
                <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/20">
                    <h2 className="font-headline-md text-[18px] text-primary">My Watchlist</h2>
                    <span className="font-ui-button text-sm uppercase tracking-widest text-on-surface-variant hover:text-primary cursor-pointer transition-colors">Edit</span>
                </div>
                <div className="grid gap-3 p-5" style={{gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))"}}>
                    {WATCHLIST_ITEMS.map(w => {
                        const live = liveQuotes.get(w.tick)
                        const price = live?.price ?? w.price
                        const chg = live?.changePct ?? w.chg
                        const pos = live ? live.changePct >= 0 : w.pos
                        return (
                        <div key={w.tick} className="p-3.5 rounded-lg border border-outline-variant/30 bg-surface-container-lowest cursor-pointer hover:border-primary/30 hover:bg-surface-container-low transition-colors" style={{borderLeftWidth:3,borderLeftColor:pos?"#3f6b3f":"#ba1a1a"}}>
                            <div className="flex items-center gap-2 mb-0.5">
                                <CompanyLogo ticker={w.tick} logoUrl={live?.logoUrl} size={20} />
                                <div className="font-mono font-bold text-[15px] text-primary">{w.tick}</div>
                            </div>
                            <div className="text-xs text-on-surface-variant mb-2">{w.co}</div>
                            <div className="font-mono text-[17px] font-semibold text-primary mb-1">{fmt(price)}</div>
                            <div className={`text-xs font-medium mb-2 ${pos ? posText : negText}`}>{pos ? "▲" : "▼"} {fmtPct(chg)}</div>
                            <WatchlistSparkline ticker={w.tick} pos={pos} />
                        </div>
                        )
                    })}
                </div>
            </div>

            {/* ── Dividend Calendar ── */}
            <div className={`${card} p-6`}>
                <div className="flex items-baseline gap-3 mb-4">
                    <h2 className="font-headline-md text-[18px] text-primary">Dividend Calendar</h2>
                    <span className="text-sm text-on-surface-variant">Next 30 days</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <caption className="sr-only">Upcoming Dividends</caption>
                        <thead>
                            <tr>
                                {["Ex-Div Date","Ticker","Company","Div/Share","Yield","Pay Date","Amount"].map(h => (
                                    <th key={h} scope="col" className="px-3 py-2.5 text-left font-ui-button text-[11px] uppercase tracking-widest text-on-surface-variant border-b border-outline-variant/20 whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {DIV_ROWS.map((r, i) => (
                                <tr key={i} className={i%2 ? "bg-surface-container-low/40" : ""} style={r.thismon ? {borderLeft:"3px solid #b45309"} : {}}>
                                    <td className="px-3 py-3 text-sm text-on-surface" style={r.thismon?{paddingLeft:"10px"}:{}}>{r.date}</td>
                                    <td className="px-3 py-3 font-mono font-bold text-sm text-primary">{r.ticker}</td>
                                    <td className="px-3 py-3 text-sm text-on-surface whitespace-nowrap">{r.co}</td>
                                    <td className="px-3 py-3 text-sm text-on-surface font-mono">{r.divShare}</td>
                                    <td className="px-3 py-3 text-sm text-on-surface">{r.yield}</td>
                                    <td className="px-3 py-3 text-sm text-on-surface-variant whitespace-nowrap">{r.pay}</td>
                                    <td className={`px-3 py-3 text-sm font-semibold ${posText}`}>{r.amount}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="flex justify-end mt-4 pt-4 border-t border-outline-variant/20 text-sm text-on-surface-variant">
                    Projected income this month: <strong className={`ml-2 text-base ${posText}`}>$412.80</strong>
                </div>
            </div>

            {/* NYSE Status */}
            <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                <span className="mkts-pulse w-2 h-2 rounded-full bg-green-600 inline-block"/>
                <span>NYSE Open</span>
                <span className="text-on-surface-variant/60">· Closes in 2h 34m</span>
                <span className="ml-auto text-xs">Data delayed 15 min · Not financial advice</span>
            </div>

        </Container>
        </div>
        </>
    )
}
