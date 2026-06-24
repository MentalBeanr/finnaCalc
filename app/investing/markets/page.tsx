"use client"

import React, { useEffect, useRef, useState, useCallback } from "react"
import Link from "next/link"
import { MaterialIcon } from "@/components/ds/material-icon"

// ── Data ──────────────────────────────────────────────────────────────────────

const MARKETS = [
    { name: "S&P 500", val: "5,847.23", chg: "+24.31", pct: "+0.42%", pos: true,  pts: [42,40,44,43,46,45,48,47,50,49,52,51] },
    { name: "NASDAQ",  val: "18,721.44", chg: "+89.52", pct: "+0.48%", pos: true,  pts: [38,40,39,42,44,43,46,45,48,50,49,52] },
    { name: "DOW",     val: "43,012.66", chg: "-47.83", pct: "-0.11%", pos: false, pts: [50,48,50,47,49,48,46,47,45,46,44,45] },
    { name: "Russell 2K", val: "2,197.88", chg: "+15.44", pct: "+0.71%", pos: true, pts: [36,38,37,40,39,41,43,42,44,46,45,47] },
    { name: "VIX",     val: "14.23", chg: "-0.87", pct: "-5.76%", pos: false, pts: [22,20,21,18,17,19,16,15,17,14,13,14] },
    { name: "10Y Yield", val: "4.312%", chg: "+0.021", pct: "+0.49%", pos: true, pts: [40,41,40,42,43,42,44,43,45,44,46,45] },
    { name: "EUR/USD", val: "1.0892", chg: "-0.0023", pct: "-0.21%", pos: false, pts: [48,47,49,46,48,45,47,44,46,43,45,44] },
    { name: "BTC/USD", val: "68,412", chg: "+1,247", pct: "+1.86%", pos: true,  pts: [30,34,32,36,35,38,37,40,39,42,41,44] },
]

const HOLDINGS = [
    { num:1,  ticker:"AAPL",    company:"Apple Inc.",              shares:45,   avgCost:141.22,  price:189.84, value:8542.80,   dayChg:1.23,  ret:34.42,  weight:3.0  },
    { num:2,  ticker:"MSFT",    company:"Microsoft Corp",          shares:30,   avgCost:285.14,  price:417.32, value:12519.60,  dayChg:0.87,  ret:46.37,  weight:4.4  },
    { num:3,  ticker:"NVDA",    company:"NVIDIA Corp",             shares:20,   avgCost:437.86,  price:875.40, value:17508.00,  dayChg:2.14,  ret:99.94,  weight:6.2  },
    { num:4,  ticker:"GOOGL",   company:"Alphabet Inc",            shares:25,   avgCost:128.44,  price:175.22, value:4380.50,   dayChg:0.53,  ret:36.42,  weight:1.5  },
    { num:5,  ticker:"AMZN",    company:"Amazon.com Inc",          shares:35,   avgCost:132.74,  price:192.44, value:6735.40,   dayChg:0.76,  ret:44.98,  weight:2.4  },
    { num:6,  ticker:"TSLA",    company:"Tesla Inc",               shares:40,   avgCost:243.82,  price:198.71, value:7948.40,   dayChg:-1.47, ret:-18.50, weight:2.8  },
    { num:7,  ticker:"VTI",     company:"Vanguard Total Stock ETF",shares:150,  avgCost:198.34,  price:232.17, value:34825.50,  dayChg:0.44,  ret:17.06,  weight:12.2 },
    { num:8,  ticker:"QQQ",     company:"Invesco QQQ Trust",       shares:80,   avgCost:342.55,  price:441.28, value:35302.40,  dayChg:0.61,  ret:28.83,  weight:12.4 },
    { num:9,  ticker:"BND",     company:"Vanguard Total Bond ETF", shares:200,  avgCost:72.84,   price:74.12,  value:14824.00,  dayChg:-0.12, ret:1.76,   weight:5.2  },
    { num:10, ticker:"BTC-USD", company:"Bitcoin USD",             shares:0.75, avgCost:42100.00,price:68412.00,value:51309.00, dayChg:1.86,  ret:62.50,  weight:18.0 },
    { num:11, ticker:"JPM",     company:"JPMorgan Chase & Co",     shares:60,   avgCost:148.23,  price:198.44, value:11906.40,  dayChg:0.34,  ret:33.87,  weight:4.2  },
    { num:12, ticker:"JNJ",     company:"Johnson & Johnson",       shares:80,   avgCost:152.84,  price:147.62, value:11809.60,  dayChg:-0.23, ret:-3.41,  weight:4.1  },
]

const SCREENER_DATA = [
    { ticker:"AAPL",  company:"Apple Inc.",        sector:"Tech",       price:189.84, mktCap:2.9e12, pe:32.1, div:0.53, w52:24.3  },
    { ticker:"MSFT",  company:"Microsoft Corp",    sector:"Tech",       price:417.32, mktCap:3.1e12, pe:36.8, div:0.72, w52:32.1  },
    { ticker:"NVDA",  company:"NVIDIA Corp",       sector:"Tech",       price:875.40, mktCap:2.2e12, pe:68.4, div:0.03, w52:189.2 },
    { ticker:"GOOGL", company:"Alphabet Inc",      sector:"Tech",       price:175.22, mktCap:2.2e12, pe:24.7, div:0.00, w52:46.8  },
    { ticker:"META",  company:"Meta Platforms",    sector:"Tech",       price:542.14, mktCap:1.4e12, pe:28.3, div:0.44, w52:73.2  },
    { ticker:"JPM",   company:"JPMorgan Chase",    sector:"Finance",    price:198.44, mktCap:574e9,  pe:11.4, div:2.32, w52:31.7  },
    { ticker:"JNJ",   company:"J&J",               sector:"Healthcare", price:147.62, mktCap:356e9,  pe:15.2, div:3.37, w52:-8.4  },
    { ticker:"XOM",   company:"Exxon Mobil",       sector:"Energy",     price:118.34, mktCap:472e9,  pe:14.1, div:3.28, w52:12.6  },
    { ticker:"WMT",   company:"Walmart Inc",       sector:"Consumer",   price:87.22,  mktCap:701e9,  pe:38.6, div:1.14, w52:68.3  },
    { ticker:"CAT",   company:"Caterpillar Inc",   sector:"Industrial", price:392.44, mktCap:188e9,  pe:16.8, div:1.42, w52:21.4  },
]

const GAINERS = [
    { tick:"SMCI", name:"Super Micro Computer",  price:854.20, chg:8.74,  pts:[20,22,24,23,26,28,30] },
    { tick:"PLTR", name:"Palantir Technologies", price:24.88,  chg:6.32,  pts:[18,19,21,20,22,24,25] },
    { tick:"MARA", name:"Marathon Digital",      price:18.42,  chg:5.91,  pts:[16,17,16,18,19,20,21] },
    { tick:"RIOT", name:"Riot Platforms",        price:11.74,  chg:5.23,  pts:[14,15,14,16,17,16,18] },
    { tick:"COIN", name:"Coinbase Global",       price:228.34, chg:4.87,  pts:[20,21,22,21,23,24,25] },
    { tick:"AMD",  name:"Advanced Micro Devices",price:168.92, chg:3.92,  pts:[18,19,20,21,20,22,23] },
]
const LOSERS = [
    { tick:"NVAX", name:"Novavax Inc",       price:8.32,  chg:-9.41, pts:[30,28,27,26,24,23,22] },
    { tick:"MRNA", name:"Moderna Inc",       price:94.42, chg:-7.82, pts:[28,26,25,24,22,21,20] },
    { tick:"RIVN", name:"Rivian Automotive", price:12.14, chg:-6.33, pts:[26,25,23,22,21,20,18] },
    { tick:"LCID", name:"Lucid Group",       price:2.94,  chg:-5.62, pts:[24,22,21,20,18,17,16] },
    { tick:"INTC", name:"Intel Corporation", price:28.74, chg:-4.14, pts:[22,20,19,18,17,16,15] },
    { tick:"WBA",  name:"Walgreens Boots",   price:14.88, chg:-3.72, pts:[20,19,18,17,16,15,14] },
]
const MOST_ACTIVE = [
    { tick:"SPY",  price:584.22, vol:142.3e6, chg:0.42  },
    { tick:"NVDA", price:875.40, vol:98.7e6,  chg:2.14  },
    { tick:"TSLA", price:198.71, vol:87.4e6,  chg:-1.47 },
    { tick:"AAPL", price:189.84, vol:64.2e6,  chg:1.23  },
    { tick:"AMD",  price:168.92, vol:58.1e6,  chg:3.92  },
    { tick:"QQQ",  price:441.28, vol:44.8e6,  chg:0.61  },
]
const ARTICLES = [
    { src:"Reuters",   time:"2h ago",  hl:"Fed signals potential rate cuts amid cooling inflation data",           sum:"Federal Reserve officials indicated openness to easing policy as CPI showed continued moderation.", sent:"bull", tickers:["$SPY","$TLT"]  },
    { src:"Bloomberg", time:"4h ago",  hl:"NVIDIA reports record Q3 earnings, data center revenue surges 206%",   sum:"Chipmaker beats expectations; guides Q4 revenue above $37B driven by Blackwell GPU demand.",        sent:"bull", tickers:["$NVDA","$AMD"] },
    { src:"WSJ",       time:"6h ago",  hl:"Tesla delivery numbers disappoint analysts for third consecutive quarter", sum:"EV maker delivered 443,956 vehicles in Q2, missing the 449,080 consensus estimate.",             sent:"bear", tickers:["$TSLA"]        },
    { src:"CNBC",      time:"8h ago",  hl:"Apple Vision Pro sees strong enterprise adoption in Q4 pipeline",      sum:"Corporate channel checks show accelerating Vision Pro orders across healthcare and aerospace.",       sent:"neut", tickers:["$AAPL"]        },
    { src:"FT",        time:"12h ago", hl:"JPMorgan upgrades Amazon to Overweight, raises price target to $230",  sum:"Analysts cite AWS margin expansion, advertising growth, and improving retail profitability.",         sent:"bull", tickers:["$AMZN"]       },
]
const FACTORS = [
    { name:"Momentum",          score:72, color:"#22c55e" },
    { name:"Volatility",        score:58, color:"#f59e0b" },
    { name:"Volume",            score:64, color:"#22c55e" },
    { name:"Put/Call Ratio",    score:71, color:"#22c55e" },
    { name:"Safe Haven Demand", score:48, color:"#f59e0b" },
    { name:"Junk Bond Demand",  score:82, color:"#22c55e" },
]
const WATCHLIST_ITEMS = [
    { tick:"AAPL",    co:"Apple Inc.",     price:189.84,  chg:1.23,  pos:true  },
    { tick:"TSLA",    co:"Tesla Inc.",     price:198.71,  chg:-1.47, pos:false },
    { tick:"NVDA",    co:"NVIDIA Corp",    price:875.40,  chg:2.14,  pos:true  },
    { tick:"MSFT",    co:"Microsoft Corp", price:417.32,  chg:0.87,  pos:true  },
    { tick:"AMZN",    co:"Amazon.com",     price:192.44,  chg:0.76,  pos:true  },
    { tick:"META",    co:"Meta Platforms", price:542.14,  chg:1.32,  pos:true  },
    { tick:"GOOGL",   co:"Alphabet Inc",   price:175.22,  chg:0.53,  pos:true  },
    { tick:"BTC-USD", co:"Bitcoin USD",    price:68412.00,chg:1.86,  pos:true  },
]
const DIV_ROWS = [
    { date:"Jun 25, 2026", ticker:"AAPL",    co:"Apple Inc.",             divShare:"$0.25", yield:"0.53%", pay:"Jul 15, 2026", amount:"$11.25",  thismon:true  },
    { date:"Jun 27, 2026", ticker:"JNJ",     co:"Johnson & Johnson",      divShare:"$1.24", yield:"3.37%", pay:"Jul 9, 2026",  amount:"$99.20",  thismon:true  },
    { date:"Jun 30, 2026", ticker:"JPM",     co:"JPMorgan Chase & Co",    divShare:"$1.15", yield:"2.32%", pay:"Jul 31, 2026", amount:"$69.00",  thismon:true  },
    { date:"Jul 8, 2026",  ticker:"VTI",     co:"Vanguard Total Stock ETF",divShare:"$0.96",yield:"1.50%", pay:"Jul 25, 2026", amount:"$144.00", thismon:false },
    { date:"Jul 12, 2026", ticker:"BND",     co:"Vanguard Total Bond ETF", divShare:"$0.215",yield:"3.39%",pay:"Jul 29, 2026", amount:"$43.00",  thismon:false },
    { date:"Jul 20, 2026", ticker:"MSFT",    co:"Microsoft Corp",          divShare:"$1.54", yield:"0.72%", pay:"Sep 12, 2026", amount:"$46.20", thismon:false },
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
    const color = pos ? "#22c55e" : "#ef4444"
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

// ── Chart range data generators ───────────────────────────────────────────────
const genCurve = (range: string) => {
    const configs: Record<string, { pts: number; base: number; amp: number; freq: number; trend: number }> = {
        "1D":  { pts:48, base:283000, amp:800,  freq:0.8,  trend:0.3 },
        "1W":  { pts:35, base:281000, amp:2000, freq:0.5,  trend:1.2 },
        "1M":  { pts:22, base:275000, amp:4000, freq:0.4,  trend:2.5 },
        "3M":  { pts:13, base:265000, amp:8000, freq:0.3,  trend:3   },
        "6M":  { pts:7,  base:248000, amp:12000,freq:0.25, trend:4   },
        "1Y":  { pts:13, base:222000, amp:10000,freq:0.2,  trend:5   },
        "ALL": { pts:25, base:180000, amp:15000,freq:0.15, trend:6   },
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

// ── Page component ────────────────────────────────────────────────────────────
export default function MarketsPage() {
    const portChartRef = useRef<HTMLCanvasElement>(null)
    const donutChartRef = useRef<HTMLCanvasElement>(null)
    const portChartInstance = useRef<import("chart.js").Chart | null>(null)
    const donutChartInstance = useRef<import("chart.js").Chart | null>(null)

    const [activeRange, setActiveRange] = useState("1Y")
    const [activeMoverTab, setActiveMoverTab] = useState<"gainers"|"losers"|"active">("gainers")
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

    // Chart.js init
    useEffect(() => {
        let destroyed = false
        const init = async () => {
            const { Chart, registerables } = await import("chart.js")
            Chart.register(...registerables)
            if (destroyed) return

            // Portfolio line chart
            if (portChartRef.current && !portChartInstance.current) {
                const ctx = portChartRef.current.getContext("2d")!
                const grad = ctx.createLinearGradient(0, 0, 0, 220)
                grad.addColorStop(0, "rgba(34,197,94,0.28)")
                grad.addColorStop(1, "rgba(34,197,94,0)")
                portChartInstance.current = new Chart(ctx, {
                    type: "line",
                    data: { labels: genLabels("1Y"), datasets: [{ data: genCurve("1Y"), fill: true, backgroundColor: grad, borderColor: "#22c55e", borderWidth: 2, pointRadius: 0, tension: 0.4 }] },
                    options: {
                        responsive: true, maintainAspectRatio: false,
                        plugins: { legend: { display: false }, tooltip: { mode: "index", intersect: false, backgroundColor: "#1e293b", borderColor: "rgba(255,255,255,.1)", borderWidth: 1, titleColor: "#94a3b8", bodyColor: "#f1f5f9", callbacks: { label: (i) => fmt(i.raw as number) } } },
                        scales: {
                            x: { grid: { color: "rgba(255,255,255,.04)" }, ticks: { color: "#64748b", font: { size: 10 }, maxTicksLimit: 8 } },
                            y: { display: false, grid: { display: false } },
                        },
                    },
                })
            }

            // Donut chart
            if (donutChartRef.current && !donutChartInstance.current) {
                const ctx = donutChartRef.current.getContext("2d")!
                donutChartInstance.current = new Chart(ctx, {
                    type: "doughnut",
                    data: {
                        labels: ["Stocks","ETFs","Bonds","Crypto","Cash"],
                        datasets: [{ data: [58,22,10,6,4], backgroundColor: ["#3b82f6","#8b5cf6","#06b6d4","#f59e0b","#22c55e"], borderWidth: 0, hoverOffset: 6 }],
                    },
                    options: { responsive: true, maintainAspectRatio: true, cutout: "72%", plugins: { legend: { display: false }, tooltip: { backgroundColor: "#1e293b", titleColor: "#94a3b8", bodyColor: "#f1f5f9" } } },
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

    // Update chart on range change
    const handleRangeChange = useCallback(async (range: string) => {
        setActiveRange(range)
        if (portChartInstance.current) {
            portChartInstance.current.data.labels = genLabels(range)
            portChartInstance.current.data.datasets[0].data = genCurve(range)
            portChartInstance.current.update("active")
        }
    }, [])

    // Sort holdings
    const sortedHoldings = React.useMemo(() => {
        if (!sortCol) return HOLDINGS
        return [...HOLDINGS].sort((a, b) => {
            const av = (a as Record<string, unknown>)[sortCol]
            const bv = (b as Record<string, unknown>)[sortCol]
            if (typeof av === "string" && typeof bv === "string") return av.localeCompare(bv) * sortDir
            return ((av as number) - (bv as number)) * sortDir
        })
    }, [sortCol, sortDir])

    const handleSort = (col: string) => {
        if (sortCol === col) setSortDir(d => d * -1)
        else { setSortCol(col); setSortDir(1) }
    }

    // Screener apply
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

    // Close dropdowns on outside click
    useEffect(() => {
        const handler = () => setOpenDrop(null)
        document.addEventListener("click", handler)
        return () => document.removeEventListener("click", handler)
    }, [])

    const thClass = (col: string) =>
        `px-3 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-white/5 whitespace-nowrap cursor-pointer hover:text-slate-300 transition-colors select-none ${sortCol === col ? (sortDir === 1 ? "after:content-['_↑'] after:text-blue-400" : "after:content-['_↓'] after:text-blue-400") : ""}`

    return (
        <>
        {/* Dashboard-scoped dark styles */}
        <style>{`
            .mkts-root { --mk-bg:#080d14; --mk-card:#111827; --mk-border:rgba(255,255,255,.07); --mk-accent:#3b82f6; --mk-al:#60a5fa; --mk-adim:rgba(59,130,246,.12); --mk-green:#22c55e; --mk-gdim:rgba(34,197,94,.12); --mk-red:#ef4444; --mk-rdim:rgba(239,68,68,.12); --mk-gold:#f59e0b; --mk-tp:#e2e8f0; --mk-tm:#64748b; --mk-td:#94a3b8; }
            .mkts-root { background:var(--mk-bg); color:var(--mk-tp); font-size:14px; line-height:1.5; }
            .mk-card { background:var(--mk-card); border:1px solid var(--mk-border); border-radius:12px; box-shadow:0 4px 24px rgba(0,0,0,.5); }
            .mk-bar::-webkit-scrollbar { display:none; }
            .mk-chip { display:flex;align-items:center;gap:10px;padding:8px 14px;border-radius:8px;background:var(--mk-card);border:1px solid var(--mk-border);cursor:pointer;transition:border-color .15s;white-space:nowrap; }
            .mk-chip:hover { border-color:rgba(59,130,246,.35); }
            .mk-tt { padding:5px 10px;border-radius:6px;font-size:12px;font-weight:500;color:var(--mk-tm);cursor:pointer;border:none;background:transparent;transition:all .15s; }
            .mk-tt:hover { color:var(--mk-tp);background:rgba(255,255,255,.06); }
            .mk-tt.on { color:var(--mk-al);background:var(--mk-adim); }
            .mk-bdg-pos { background:var(--mk-gdim);color:var(--mk-green); }
            .mk-bdg-neg { background:var(--mk-rdim);color:var(--mk-red); }
            .mk-mover:hover { background:rgba(255,255,255,.05); }
            .mk-tr:hover td { background:rgba(59,130,246,.05)!important; }
            .mk-tr:hover td:first-child { border-left:2px solid var(--mk-accent);padding-left:12px; }
            .mk-news:hover { border-color:rgba(59,130,246,.35);background:rgba(59,130,246,.03); }
            .mk-wl:hover { background:rgba(255,255,255,.03); }
            .mk-scr-body { max-height:0;overflow:hidden;transition:max-height .35s ease; }
            .mk-scr-body.open { max-height:300px; }
            .mk-select { padding:8px 10px;border-radius:8px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.07);color:#e2e8f0;font-size:13px;cursor:pointer;outline:none;appearance:none;padding-right:28px;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 8px center; }
            .mk-select:focus { border-color:#3b82f6; }
            .mk-select option { background:#1e293b; }
            .mk-range { width:100%;height:4px;appearance:none;background:rgba(255,255,255,.12);border-radius:4px;outline:none;cursor:pointer; }
            .mk-range::-webkit-slider-thumb { appearance:none;width:14px;height:14px;border-radius:50%;background:#3b82f6;cursor:pointer;border:2px solid #111827; }
            .mk-range::-moz-range-thumb { width:14px;height:14px;border-radius:50%;background:#3b82f6;cursor:pointer;border:2px solid #111827; }
            .status-pulse { width:8px;height:8px;border-radius:50%;background:#22c55e;box-shadow:0 0 0 0 rgba(34,197,94,.4);animation:mkpulse 2s infinite; }
            @keyframes mkpulse { 0%{box-shadow:0 0 0 0 rgba(34,197,94,.4)} 70%{box-shadow:0 0 0 8px rgba(34,197,94,0)} 100%{box-shadow:0 0 0 0 rgba(34,197,94,0)} }
        `}</style>

        <div className="mkts-root min-h-screen">

        {/* ── Market summary bar ── */}
        <div className="mk-bar border-b border-white/5 overflow-x-auto scrollbar-none" style={{background:"#0c1220"}}>
            <div className="flex px-6 py-2.5 gap-1.5 min-w-max max-w-[1440px] mx-auto">
                {MARKETS.map(m => (
                    <div key={m.name} className="mk-chip">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{m.name}</span>
                        <span className="text-[13px] font-semibold font-mono text-slate-200">{m.val}</span>
                        <span className={`text-[11px] font-medium flex items-center gap-0.5 ${m.pos ? "text-green-400" : "text-red-400"}`}>
                            {m.pos ? "▲" : "▼"} {m.chg} ({m.pct})
                        </span>
                        <Sparkline pts={m.pts} w={60} h={24} color={m.pos ? "#22c55e" : "#ef4444"} />
                    </div>
                ))}
            </div>
        </div>

        <div className="max-w-[1440px] mx-auto px-6 space-y-6 py-6">

        {/* ── Back link ── */}
        <Link href="/investing" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-200 text-sm transition-colors">
            <MaterialIcon name="arrow_back" size={16} /> Back to Investing
        </Link>

        {/* ── 3. Portfolio Overview ── */}
        <div className="grid gap-5" style={{gridTemplateColumns:"65fr 35fr"}}>
            {/* Portfolio card */}
            <div className="mk-card p-6">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Total Portfolio Value</div>
                <div className="text-[34px] font-bold font-mono text-slate-100 mb-1.5">$284,731.42</div>
                <div className="text-[13px] font-medium text-green-400 mb-5">▲ +$1,847.23 (+0.65%) today</div>
                <div className="flex gap-2.5 mb-5">
                    {[["Total Gain","+$62,418.90","green"],["Dividend Yield","1.84%",""],["Beta","1.12",""]].map(([label,val,c])=>(
                        <div key={label} className="flex-1 p-3 rounded-lg border border-white/5 bg-white/[.03]">
                            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{label}</div>
                            <div className={`text-[15px] font-semibold ${c==="green"?"text-green-400":"text-slate-100"}`}>{val}</div>
                        </div>
                    ))}
                </div>
                <div className="flex gap-0.5 mb-3">
                    {["1D","1W","1M","3M","6M","1Y","ALL"].map(r=>(
                        <button key={r} onClick={()=>handleRangeChange(r)} className={`mk-tt ${activeRange===r?"on":""}`}>{r}</button>
                    ))}
                </div>
                <div className="relative h-[220px]"><canvas ref={portChartRef} /></div>
            </div>
            {/* Donut */}
            <div className="mk-card p-6">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4">Asset Allocation</div>
                <div className="relative w-[180px] h-[180px] mx-auto mb-5">
                    <canvas ref={donutChartRef} />
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <div className="text-[24px] font-bold text-slate-100">58%</div>
                        <div className="text-[11px] text-slate-500">Stocks</div>
                    </div>
                </div>
                <div className="space-y-2">
                    {[["#3b82f6","Stocks","58%","$165,144"],["#8b5cf6","ETFs","22%","$62,641"],["#06b6d4","Bonds","10%","$28,473"],["#f59e0b","Crypto","6%","$17,084"],["#22c55e","Cash","4%","$11,389"]].map(([color,name,pct,val])=>(
                        <div key={name} className="flex items-center justify-between">
                            <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{background:color}}/><span className="text-[13px] text-slate-400">{name}</span></div>
                            <div className="flex items-center gap-2.5"><span className="text-[13px] font-semibold text-slate-200">{pct}</span><span className="text-[12px] text-slate-500 font-mono">{val}</span></div>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* ── 4. Holdings Table ── */}
        <div className="mk-card">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                <span className="text-[16px] font-semibold text-slate-100">My Holdings</span>
                <button className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg border border-blue-500 text-blue-400 text-[13px] font-medium hover:bg-blue-500/10 transition-colors">+ Add Position</button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <caption className="sr-only">Portfolio Holdings</caption>
                    <thead>
                        <tr>
                            {[["num","#"],["ticker","Ticker"],["company","Company"],["shares","Shares"],["avgCost","Avg Cost"],["price","Current Price"],["value","Market Value"],["dayChg","Day Change"],["ret","Total Return"],["weight","Weight"]].map(([col,label])=>(
                                <th key={col} scope="col" onClick={()=>handleSort(col)} className={thClass(col)}>{label}</th>
                            ))}
                            <th scope="col" className="px-3 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-white/5">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedHoldings.map((h, i) => (
                            <tr key={h.ticker} className={`mk-tr ${i%2?"bg-white/[.02]":""}`}>
                                <td className="px-3 py-3 text-slate-400 text-[13px]">{h.num}</td>
                                <td className="px-3 py-3"><span className="font-mono font-bold text-blue-400 text-[13px]">{h.ticker}</span></td>
                                <td className="px-3 py-3 text-slate-200 text-[13px] whitespace-nowrap">{h.company}</td>
                                <td className="px-3 py-3 text-slate-200 text-[13px]">{h.shares}</td>
                                <td className="px-3 py-3 text-slate-200 text-[13px] font-mono">{fmt(h.avgCost)}</td>
                                <td className="px-3 py-3 text-slate-200 text-[13px] font-mono">{fmt(h.price)}</td>
                                <td className="px-3 py-3 text-slate-200 text-[13px] font-mono">{fmt(h.value)}</td>
                                <td className="px-3 py-3"><span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${h.dayChg>=0?"mk-bdg-pos":"mk-bdg-neg"}`}>{fmtPct(h.dayChg)}</span></td>
                                <td className={`px-3 py-3 text-[13px] font-medium ${h.ret>=0?"text-green-400":"text-red-400"}`}>{fmtPct(h.ret)}</td>
                                <td className="px-3 py-3 text-slate-200 text-[13px]">{h.weight.toFixed(1)}%</td>
                                <td className="px-3 py-3">
                                    <div className="relative" onClick={e=>e.stopPropagation()}>
                                        <button onClick={()=>setOpenDrop(openDrop===h.num?null:h.num)} className="w-7 h-7 rounded-md border border-white/10 text-slate-400 hover:text-slate-200 hover:border-blue-500/40 flex items-center justify-center text-base transition-colors">···</button>
                                        {openDrop===h.num && (
                                            <div className="absolute right-0 top-full mt-1 bg-slate-800 border border-white/10 rounded-lg p-1 z-50 min-w-[130px] shadow-xl">
                                                {["Buy More","Sell","Set Alert"].map(a=><div key={a} className="px-3 py-1.5 text-[13px] text-slate-300 rounded hover:bg-white/5 cursor-pointer">{a}</div>)}
                                                <div className="px-3 py-1.5 text-[13px] text-red-400 rounded hover:bg-white/5 cursor-pointer">Remove</div>
                                            </div>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        <tr>
                            <td colSpan={6} className="px-3 py-3 font-bold text-slate-200 text-[13px] border-t border-white/10 bg-white/[.04]">Totals</td>
                            <td className="px-3 py-3 font-bold font-mono text-slate-100 text-[13px] border-t border-white/10 bg-white/[.04]">{fmt(HOLDINGS.reduce((s,h)=>s+h.value,0))}</td>
                            <td className="px-3 py-3 border-t border-white/10 bg-white/[.04]"/>
                            <td className="px-3 py-3 font-bold text-green-400 text-[13px] border-t border-white/10 bg-white/[.04]">+$62,418.90</td>
                            <td className="px-3 py-3 font-bold text-slate-200 text-[13px] border-t border-white/10 bg-white/[.04]">100%</td>
                            <td className="border-t border-white/10 bg-white/[.04]"/>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div className="flex items-center justify-between px-5 py-3 border-t border-white/5 text-[13px] text-slate-400">
                <span>Showing 1–12 of 12 positions</span>
                <div className="flex gap-2">
                    <button disabled className="px-3 py-1.5 rounded-md border border-white/10 text-slate-500 text-[13px] opacity-30 cursor-not-allowed">← Prev</button>
                    <button disabled className="px-3 py-1.5 rounded-md border border-white/10 text-slate-500 text-[13px] opacity-30 cursor-not-allowed">Next →</button>
                </div>
            </div>
        </div>

        {/* ── 5. Market Movers ── */}
        <div className="grid grid-cols-3 gap-5">
            {/* Gainers */}
            <div className="mk-card p-5">
                <div className="text-[14px] font-semibold text-slate-100 mb-3 flex items-center gap-2">
                    <span className="text-green-400">↗</span> Top Gainers
                </div>
                {GAINERS.map(m=>(
                    <div key={m.tick} className="mk-mover flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer transition-colors">
                        <Sparkline pts={m.pts} w={50} h={20} color="#22c55e" />
                        <div className="flex-1"><div className="font-mono font-bold text-[13px] text-slate-200">{m.tick}</div><div className="text-[11px] text-slate-500">{m.name}</div></div>
                        <span className="font-mono text-[13px] font-semibold text-slate-200">{fmt(m.price)}</span>
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold mk-bdg-pos">+{m.chg.toFixed(2)}%</span>
                    </div>
                ))}
            </div>
            {/* Losers */}
            <div className="mk-card p-5">
                <div className="text-[14px] font-semibold text-slate-100 mb-3 flex items-center gap-2">
                    <span className="text-red-400">↘</span> Top Losers
                </div>
                {LOSERS.map(m=>(
                    <div key={m.tick} className="mk-mover flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer transition-colors">
                        <Sparkline pts={m.pts} w={50} h={20} color="#ef4444" />
                        <div className="flex-1"><div className="font-mono font-bold text-[13px] text-slate-200">{m.tick}</div><div className="text-[11px] text-slate-500">{m.name}</div></div>
                        <span className="font-mono text-[13px] font-semibold text-slate-200">{fmt(m.price)}</span>
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold mk-bdg-neg">{m.chg.toFixed(2)}%</span>
                    </div>
                ))}
            </div>
            {/* Most Active */}
            <div className="mk-card p-5">
                <div className="text-[14px] font-semibold text-slate-100 mb-3 flex items-center gap-2">
                    <span className="text-blue-400">⚡</span> Most Active
                </div>
                {MOST_ACTIVE.map((m,i)=>(
                    <div key={m.tick} className="mk-mover flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer transition-colors">
                        <div className="flex-1">
                            <div className="flex items-center justify-between">
                                <span className="font-mono font-bold text-[13px] text-slate-200">{m.tick}</span>
                                <span className="text-[11px] text-slate-400">{fmtShort(m.vol)}</span>
                            </div>
                            <div className="h-1 bg-white/[.08] rounded-full mt-1.5 overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full" style={{width:`${(m.vol/142.3e6*100).toFixed(0)}%`}}/>
                            </div>
                        </div>
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ml-2 ${m.chg>=0?"mk-bdg-pos":"mk-bdg-neg"}`}>{fmtPct(m.chg)}</span>
                    </div>
                ))}
            </div>
        </div>

        {/* ── 6. Stock Screener ── */}
        <div className="mk-card">
            <div className="flex items-center justify-between px-5 py-4 cursor-pointer" onClick={()=>setScreenerOpen(o=>!o)}>
                <span className="text-[16px] font-semibold text-slate-100">Stock Screener</span>
                <span className={`text-slate-400 text-lg transition-transform duration-300 ${screenerOpen?"rotate-180":""}`}>▾</span>
            </div>
            <div className={`mk-scr-body ${screenerOpen?"open":""}`}>
                <div className="px-5 pb-4 flex flex-wrap gap-3 border-b border-white/5">
                    {(
                        [
                            ["Sector",sector,setSector,["All","Tech","Healthcare","Finance","Energy","Consumer","Industrial"]],
                            ["Market Cap",mktCap,setMktCap,["All","Mega (>$200B)","Large","Mid","Small","Micro"]],
                            ["52W Perf",w52Filter,setW52Filter,["All","Near High","Near Low","Breakout"]],
                        ] as const satisfies [string, string, React.Dispatch<React.SetStateAction<string>>, readonly string[]][]
                    ).map(([label,val,setter,opts])=>(
                        <div key={label} className="flex flex-col gap-1 min-w-[150px]">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</label>
                            <select className="mk-select" value={val} onChange={e=>setter(e.target.value)}>
                                {(opts as readonly string[]).map(o=><option key={o}>{o}</option>)}
                            </select>
                        </div>
                    ))}
                    <div className="flex flex-col gap-1 min-w-[150px]">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">P/E Max: {peMax}</label>
                        <input type="range" min={0} max={100} value={peMax} onChange={e=>setPeMax(+e.target.value)} className="mk-range mt-2" />
                    </div>
                    <div className="flex flex-col gap-1 min-w-[150px]">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Div Yield Min: {divMin.toFixed(1)}%</label>
                        <input type="range" min={0} max={10} step={0.1} value={divMin} onChange={e=>setDivMin(+e.target.value)} className="mk-range mt-2" />
                    </div>
                </div>
                <div className="flex items-center gap-3 px-5 py-3">
                    <button onClick={applyFilters} className="px-4 py-2 rounded-lg bg-blue-500 text-white text-[13px] font-semibold hover:opacity-85 transition-opacity">Apply Filters</button>
                    <button onClick={resetFilters} className="text-[13px] text-slate-400 underline hover:text-slate-200 transition-colors bg-transparent border-none cursor-pointer">Reset</button>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <caption className="sr-only">Stock Screener Results</caption>
                    <thead>
                        <tr>
                            {["Ticker","Company","Sector","Price","Mkt Cap","P/E","Div Yield","52W Change"].map(h=>(
                                <th key={h} scope="col" className="px-3 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-white/5 whitespace-nowrap">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {screenerRows.map((r,i)=>(
                            <tr key={r.ticker} className={i%2?"bg-white/[.02]":""}>
                                <td className="px-3 py-2.5 font-mono font-bold text-blue-400 text-[13px]">{r.ticker}</td>
                                <td className="px-3 py-2.5 text-slate-200 text-[13px] whitespace-nowrap">{r.company}</td>
                                <td className="px-3 py-2.5"><span className="px-2 py-0.5 rounded-full text-[11px] bg-blue-500/10 text-blue-400">{r.sector}</span></td>
                                <td className="px-3 py-2.5 font-mono text-slate-200 text-[13px]">{fmt(r.price)}</td>
                                <td className="px-3 py-2.5 font-mono text-slate-200 text-[13px]">{fmtShort(r.mktCap)}</td>
                                <td className="px-3 py-2.5 text-slate-200 text-[13px]">{r.pe.toFixed(1)}</td>
                                <td className="px-3 py-2.5 text-slate-200 text-[13px]">{r.div.toFixed(2)}%</td>
                                <td className={`px-3 py-2.5 text-[13px] font-medium ${r.w52>=0?"text-green-400":"text-red-400"}`}>{fmtPct(r.w52)}</td>
                            </tr>
                        ))}
                        {screenerRows.length===0 && <tr><td colSpan={8} className="px-3 py-8 text-center text-slate-500">No results match the current filters.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>

        {/* ── 7. News & Sentiment ── */}
        <div className="grid gap-5" style={{gridTemplateColumns:"60fr 40fr"}}>
            <div className="mk-card p-5">
                <div className="text-[16px] font-semibold text-slate-100 mb-4">Market News</div>
                {ARTICLES.map((a,i)=>(
                    <div key={i} className="mk-news p-3.5 rounded-lg border border-white/7 mb-2.5 cursor-pointer transition-colors">
                        <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/[.08] text-slate-300 uppercase tracking-wide">{a.src}</span>
                            <span className="text-[11px] text-slate-500">{a.time}</span>
                        </div>
                        <div className="text-[14px] font-semibold text-slate-100 mb-1 leading-snug">{a.hl}</div>
                        <div className="text-[12px] text-slate-400 mb-2">{a.sum}</div>
                        <div className="flex items-center justify-between">
                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${a.sent==="bull"?"bg-green-500/10 text-green-400":a.sent==="bear"?"bg-red-500/10 text-red-400":"bg-white/[.08] text-slate-400"}`}>{a.sent==="bull"?"Bullish":a.sent==="bear"?"Bearish":"Neutral"}</span>
                            <div className="flex gap-1">{a.tickers.map(t=><span key={t} className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">{t}</span>)}</div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="mk-card p-5">
                <div className="text-[14px] font-semibold text-slate-100 text-center mb-1">Fear &amp; Greed Index</div>
                <div className="text-[12px] text-slate-400 text-center mb-3">CNN Market Sentiment · Updated daily</div>
                <svg viewBox="0 0 240 130" width="100%" style={{maxWidth:240,display:"block",margin:"0 auto"}}>
                    <defs>
                        <linearGradient id="gGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#ef4444"/>
                            <stop offset="40%" stopColor="#eab308"/>
                            <stop offset="100%" stopColor="#22c55e"/>
                        </linearGradient>
                    </defs>
                    <path d="M 20 120 A 100 100 0 0 1 220 120" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="14" strokeLinecap="round"/>
                    <path d="M 20 120 A 100 100 0 0 1 220 120" fill="none" stroke="url(#gGrad)" strokeWidth="14" strokeLinecap="round"/>
                    <line x1="120" y1="120" x2="166" y2="41" stroke="#f1f5f9" strokeWidth="2.5" strokeLinecap="round"/>
                    <circle cx="120" cy="120" r="6" fill="#f1f5f9"/>
                    <text x="14" y="138" fontSize="9" fill="#ef4444" fontFamily="sans-serif">Fear</text>
                    <text x="195" y="138" fontSize="9" fill="#22c55e" fontFamily="sans-serif">Greed</text>
                    <text x="120" y="95" textAnchor="middle" fontSize="22" fontWeight="700" fill="#22c55e" fontFamily="sans-serif">67</text>
                    <text x="120" y="111" textAnchor="middle" fontSize="11" fill="#22c55e" fontFamily="sans-serif">Greed</text>
                </svg>
                <div className="mt-4 space-y-2">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Contributing Factors</div>
                    {FACTORS.map(f=>(
                        <div key={f.name} className="flex items-center gap-2">
                            <span className="text-[12px] text-slate-400 w-32 flex-shrink-0">{f.name}</span>
                            <div className="flex-1 h-1 bg-white/[.08] rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{width:`${f.score}%`,background:f.color}}/>
                            </div>
                            <span className="text-[12px] font-semibold text-slate-200 w-7 text-right">{f.score}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* ── 8. Watchlist ── */}
        <div className="mk-card">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                <span className="text-[16px] font-semibold text-slate-100">My Watchlist</span>
                <span className="text-[13px] text-blue-400 cursor-pointer">Edit</span>
            </div>
            <div className="grid gap-3 p-5" style={{gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))"}}>
                {WATCHLIST_ITEMS.map(w=>(
                    <div key={w.tick} className="mk-wl p-3.5 rounded-lg border border-white/7 cursor-pointer transition-colors" style={{borderLeft:`3px solid ${w.pos?"#22c55e":"#ef4444"}`}}>
                        <div className="font-mono text-[17px] font-bold text-blue-400 mb-0.5">{w.tick}</div>
                        <div className="text-[11px] text-slate-500 mb-2.5">{w.co}</div>
                        <div className="text-[18px] font-bold text-slate-100 mb-1">{fmt(w.price)}</div>
                        <div className={`text-[12px] font-medium mb-2 ${w.pos?"text-green-400":"text-red-400"}`}>{w.pos?"▲":"▼"} {fmtPct(w.chg)}</div>
                        <WatchlistSparkline ticker={w.tick} pos={w.pos} />
                    </div>
                ))}
            </div>
        </div>

        {/* ── 9. Dividend Calendar ── */}
        <div className="mk-card p-6">
            <div className="text-[16px] font-semibold text-slate-100 mb-1">
                Dividend Calendar <span className="text-[13px] font-normal text-slate-400 ml-2">Next 30 days</span>
            </div>
            <div className="overflow-x-auto mt-4">
                <table className="w-full border-collapse">
                    <caption className="sr-only">Upcoming Dividends</caption>
                    <thead>
                        <tr>
                            {["Ex-Div Date","Ticker","Company","Div/Share","Yield","Pay Date","Amount"].map(h=>(
                                <th key={h} scope="col" className="px-3 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-white/5 whitespace-nowrap">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {DIV_ROWS.map((r,i)=>(
                            <tr key={i} style={r.thismon?{borderLeft:"3px solid #f59e0b"}:{}}>
                                <td className="px-3 py-3 text-[13px] text-slate-200" style={r.thismon?{paddingLeft:"10px"}:{}}>{r.date}</td>
                                <td className="px-3 py-3 font-mono font-bold text-[13px] text-blue-400">{r.ticker}</td>
                                <td className="px-3 py-3 text-[13px] text-slate-200 whitespace-nowrap">{r.co}</td>
                                <td className="px-3 py-3 text-[13px] text-slate-200 font-mono">{r.divShare}</td>
                                <td className="px-3 py-3 text-[13px] text-slate-200">{r.yield}</td>
                                <td className="px-3 py-3 text-[13px] text-slate-400 whitespace-nowrap">{r.pay}</td>
                                <td className="px-3 py-3 text-[13px] font-semibold text-green-400">{r.amount}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="flex justify-end mt-4 pt-4 border-t border-white/5 text-[13px] text-slate-400">
                Projected income this month: <strong className="text-green-400 text-[16px] ml-2">$412.80</strong>
            </div>
        </div>

        </div>{/* /max-w wrapper */}
        </div>{/* /mkts-root */}
        </>
    )
}
