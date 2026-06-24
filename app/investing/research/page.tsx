"use client"

import React, { useEffect, useRef, useState, useCallback } from "react"
import Link from "next/link"
import { Container } from "@/components/ds/container"
import { MaterialIcon } from "@/components/ds/material-icon"

// ── Color palette for Chart.js ────────────────────────────────────────────────
const C = {
  pos: "#3f6b3f", posLight: "rgba(63,107,63,0.15)",
  neg: "#ba1a1a", negLight: "rgba(186,26,26,0.12)",
  warn: "#b45309",
  prim: "#00061a", primLight: "rgba(0,6,26,0.1)",
  muted: "#45464e",
  bord: "#c5c6cf",
  surf: "#faf9f4",
  blue: "#1565c0",
  purp: "#6a1b9a",
  org: "#e65100",
}

// ── Utility functions ─────────────────────────────────────────────────────────
const fmtPct = (v: number) => (v >= 0 ? "+" : "") + v.toFixed(2) + "%"

// ── Price data generator ──────────────────────────────────────────────────────
const genPriceData = (range: string) => {
  const cfg: Record<string, { pts: number; base: number; amp: number; trend: number }> = {
    "1D":  { pts: 78,  base: 187, amp: 1.2,  trend: 0.03 },
    "5D":  { pts: 35,  base: 184, amp: 2.5,  trend: 0.2  },
    "1M":  { pts: 22,  base: 178, amp: 5,    trend: 0.5  },
    "3M":  { pts: 65,  base: 168, amp: 8,    trend: 0.17 },
    "6M":  { pts: 130, base: 155, amp: 10,   trend: 0.27 },
    "1Y":  { pts: 252, base: 142, amp: 12,   trend: 0.19 },
    "2Y":  { pts: 504, base: 130, amp: 15,   trend: 0.12 },
    "5Y":  { pts: 250, base: 80,  amp: 20,   trend: 0.44 },
    "MAX": { pts: 150, base: 40,  amp: 15,   trend: 0.99 },
  }
  const c = cfg[range] ?? cfg["6M"]
  let v = c.base
  return Array.from({ length: c.pts }, (_, i) => {
    v += c.trend + c.amp * 0.05 * Math.sin(i * 0.3) + (Math.random() - 0.5) * c.amp * 0.08
    return Math.max(0.5, v)
  })
}

const calcMA = (data: number[], period: number): (number | null)[] =>
  data.map((_, i) => i < period - 1 ? null : data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period)

// ── Small UI components ───────────────────────────────────────────────────────
const card = "bg-surface-container-lowest border border-outline-variant/30 rounded-xl"
const posBadge = "bg-green-50 text-green-700 border border-green-200 rounded-full text-xs px-2 py-0.5"
const negBadge = "bg-red-50 text-red-700 border border-red-200 rounded-full text-xs px-2 py-0.5"
const neutBadge = "bg-surface-container text-on-surface-variant border border-outline-variant/30 rounded-full text-xs px-2 py-0.5"
const blueBadge = "bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs px-2 py-0.5"
const warnBadge = "bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs px-2 py-0.5"

const SignalPill = ({ s }: { s: string }) => {
  if (s === "Buy") return <span className={posBadge}>Buy</span>
  if (s === "Sell") return <span className={negBadge}>Sell</span>
  return <span className={neutBadge}>Neutral</span>
}

const SVGSparkline = ({ data, w = 60, h = 20 }: { data: number[]; w?: number; h?: number }) => {
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - ((v - min) / range) * (h - 4) - 2
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(" ")
  const color = data[data.length - 1] >= data[0] ? C.pos : C.neg
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

// ── Section 1: Command Bar ────────────────────────────────────────────────────
const CommandBar = ({ range, setRange, chartType, setChartType }: {
  range: string; setRange: (r: string) => void
  chartType: string; setChartType: (t: string) => void
}) => {
  const [compare, setCompare] = useState(false)
  const ranges = ["1D","5D","1M","3M","6M","1Y","2Y","5Y","MAX"]
  return (
    <div className={`${card} p-5 space-y-4`}>
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[220px] flex items-center gap-2 border border-outline-variant/30 rounded-lg px-3 py-2 bg-surface-container-low">
          <span className="font-mono text-xs text-on-surface-variant bg-surface-container border border-outline-variant/30 rounded px-1.5 py-0.5">&gt;_</span>
          <input className="flex-1 bg-transparent font-mono text-sm text-primary outline-none placeholder:text-on-surface-variant/50" placeholder="Enter ticker or company name — e.g. AAPL, Tesla, NVDA" />
        </div>
        <button onClick={() => setCompare(c => !c)} className="px-3 py-2 border border-outline-variant/30 rounded-lg text-sm text-on-surface-variant hover:border-primary/40 hover:text-primary transition-colors whitespace-nowrap">
          + Compare
        </button>
        {compare && (
          <div className="flex items-center gap-2 border border-outline-variant/30 rounded-lg px-3 py-2 bg-surface-container-low min-w-[180px]">
            <span className="font-mono text-xs text-on-surface-variant">vs</span>
            <input className="flex-1 bg-transparent font-mono text-sm text-primary outline-none placeholder:text-on-surface-variant/50" placeholder="MSFT, GOOGL..." />
          </div>
        )}
        <div className="flex gap-0.5 flex-wrap">
          {ranges.map(r => (
            <button key={r} onClick={() => setRange(r)} className={`px-2.5 py-1.5 rounded text-xs font-medium transition-all ${range === r ? "bg-primary text-white" : "text-on-surface-variant hover:bg-surface-container-low hover:text-primary"}`}>{r}</button>
          ))}
        </div>
        <div className="flex gap-0.5 border border-outline-variant/30 rounded-lg overflow-hidden">
          {["Line","Area","Bar"].map(t => (
            <button key={t} onClick={() => setChartType(t)} className={`px-3 py-1.5 text-xs font-medium transition-all ${chartType === t ? "bg-primary text-white" : "text-on-surface-variant hover:bg-surface-container-low"}`}>{t}</button>
          ))}
        </div>
        <button className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors whitespace-nowrap">
          Analyze →
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-outline-variant/20">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-mono font-bold text-2xl text-primary">AAPL</span>
          <span className="text-on-surface-variant text-sm">Apple Inc.</span>
          <span className={neutBadge}>NASDAQ: AAPL</span>
          <span className={neutBadge}>Technology</span>
          <span className={neutBadge}>Consumer Electronics</span>
        </div>
        <div className="flex items-center gap-3 ml-auto flex-wrap">
          <div>
            <span className="font-mono font-bold text-3xl text-primary">$189.84</span>
            <span className="ml-2 text-success font-medium text-sm">+$2.31 (+1.23%)</span>
            <span className="ml-3 text-xs text-on-surface-variant">After Hours: $188.92 (-0.48%)</span>
          </div>
          <div className="flex gap-2">
            {["★ Watchlist","⚑ Set Alert","Portfolio +"].map(a => (
              <button key={a} className="px-3 py-1.5 rounded-lg border border-outline-variant/30 text-xs text-on-surface-variant hover:border-primary/40 hover:text-primary transition-colors whitespace-nowrap">{a}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Section 2: Price Chart ────────────────────────────────────────────────────
const PriceChart = ({ range, setRange, chartType }: { range: string; setRange: (r: string) => void; chartType: string }) => {
  const mainRef = useRef<HTMLCanvasElement>(null)
  const volRef = useRef<HTMLCanvasElement>(null)
  const rsiRef = useRef<HTMLCanvasElement>(null)
  const mainInst = useRef<any>(null)
  const volInst = useRef<any>(null)
  const rsiInst = useRef<any>(null)
  const [showIndicators, setShowIndicators] = useState(false)
  const [showRSI, setShowRSI] = useState(false)
  const ranges = ["1D","5D","1M","3M","6M","1Y","2Y","5Y","MAX"]

  const buildCharts = useCallback(async (r: string, type: string, withRSI: boolean) => {
    const m = await import("chart.js")
    m.Chart.register(...m.registerables)

    const prices = genPriceData(r)
    const labels = prices.map((_, i) => i % Math.max(1, Math.floor(prices.length / 8)) === 0 ? String(i) : "")
    const ma50 = calcMA(prices, Math.min(50, Math.floor(prices.length / 2)))
    const ma200 = calcMA(prices, Math.min(200, Math.floor(prices.length * 0.9)))

    mainInst.current?.destroy()
    if (mainRef.current) {
      const ctx = mainRef.current.getContext("2d")!
      const grad = ctx.createLinearGradient(0, 0, 0, 340)
      grad.addColorStop(0, C.primLight)
      grad.addColorStop(1, "rgba(0,6,26,0)")
      mainInst.current = new m.Chart(ctx, {
        type: "line",
        data: {
          labels,
          datasets: [
            { label: "Close", data: prices, borderColor: C.prim, borderWidth: 2, pointRadius: 0, tension: 0.1, fill: type === "Area", backgroundColor: grad },
            { label: "50 MA", data: ma50, borderColor: C.blue, borderWidth: 1.2, borderDash: [4, 3], pointRadius: 0, tension: 0.3, fill: false },
            { label: "200 MA", data: ma200, borderColor: C.org, borderWidth: 1.2, borderDash: [4, 3], pointRadius: 0, tension: 0.3, fill: false },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { mode: "index", intersect: false, backgroundColor: C.prim, titleColor: "#b8c6ee", bodyColor: "#fff" },
          },
          scales: {
            x: { grid: { color: "rgba(197,198,207,0.2)" }, ticks: { color: C.muted, font: { size: 10 }, maxTicksLimit: 8 } },
            y: { position: "right", grid: { color: "rgba(197,198,207,0.2)" }, ticks: { color: C.muted, font: { size: 10 } } },
          },
        },
      })
    }

    volInst.current?.destroy()
    if (volRef.current) {
      const ctx2 = volRef.current.getContext("2d")!
      const volData = prices.map((v, i) => i === 0 ? 50 : Math.abs(v - prices[i - 1]) * 4 + 20)
      const volColors = prices.map((v, i) => i === 0 ? C.pos + "aa" : v >= prices[i - 1] ? C.pos + "aa" : C.neg + "aa")
      volInst.current = new m.Chart(ctx2, {
        type: "bar",
        data: { labels, datasets: [{ data: volData, backgroundColor: volColors, borderWidth: 0 }] },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { enabled: false } },
          scales: { x: { display: false }, y: { display: false } },
        },
      })
    }

    if (withRSI) {
      rsiInst.current?.destroy()
      if (rsiRef.current) {
        const ctx3 = rsiRef.current.getContext("2d")!
        const rsiData = prices.map((_, i) => {
          const base = 50 + 15 * Math.sin(i * 0.15) + (Math.random() - 0.5) * 5
          return Math.max(20, Math.min(80, base))
        })
        rsiInst.current = new m.Chart(ctx3, {
          type: "line",
          data: {
            labels,
            datasets: [
              { data: rsiData, borderColor: C.purp, borderWidth: 1.5, pointRadius: 0, tension: 0.3, fill: false },
              { data: Array(prices.length).fill(70), borderColor: C.neg, borderWidth: 1, borderDash: [3, 3], pointRadius: 0, fill: false },
              { data: Array(prices.length).fill(30), borderColor: C.pos, borderWidth: 1, borderDash: [3, 3], pointRadius: 0, fill: false },
            ],
          },
          options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { enabled: false } },
            scales: { x: { display: false }, y: { min: 0, max: 100, position: "right", ticks: { color: C.muted, font: { size: 9 } } } },
          },
        })
      }
    } else {
      rsiInst.current?.destroy()
      rsiInst.current = null
    }
  }, [])

  useEffect(() => {
    buildCharts(range, chartType, showRSI)
    return () => {
      mainInst.current?.destroy()
      volInst.current?.destroy()
      rsiInst.current?.destroy()
      mainInst.current = null
      volInst.current = null
      rsiInst.current = null
    }
  }, [range, chartType, showRSI, buildCharts])

  return (
    <div className={`${card} p-5`}>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex gap-0.5 flex-wrap">
          {ranges.map(r => (
            <button key={r} onClick={() => setRange(r)} className={`px-2.5 py-1.5 rounded text-xs font-medium transition-all ${range === r ? "bg-primary text-white" : "text-on-surface-variant hover:bg-surface-container-low hover:text-primary"}`}>{r}</button>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {["Trendline","Fibonacci","Measure"].map(t => (
            <button key={t} className="px-2.5 py-1.5 rounded border border-outline-variant/30 text-xs text-on-surface-variant hover:border-primary/40 transition-colors">{t}</button>
          ))}
          <button onClick={() => setShowIndicators(s => !s)} className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${showIndicators ? "bg-primary text-white border-primary" : "border-outline-variant/30 text-on-surface-variant hover:border-primary/40"}`}>
            Indicators {showIndicators ? "▲" : "▼"}
          </button>
        </div>
      </div>
      {showIndicators && (
        <div className="mb-4 p-3 rounded-lg bg-surface-container-low border border-outline-variant/20 flex gap-4 flex-wrap">
          {["RSI","MACD","Bollinger Bands","Volume","EMA"].map(label => (
            <label key={label} className="flex items-center gap-2 text-xs text-on-surface-variant cursor-pointer">
              <input type="checkbox" checked={label === "RSI" ? showRSI : label === "Volume"} onChange={label === "RSI" ? (e) => setShowRSI(e.target.checked) : undefined} className="rounded" />
              {label}
            </label>
          ))}
        </div>
      )}
      <div className="relative" style={{ height: 340 }}><canvas ref={mainRef} /></div>
      <div className="relative mt-1" style={{ height: 60 }}><canvas ref={volRef} /></div>
      {showRSI && <div className="relative mt-1" style={{ height: 60 }}><canvas ref={rsiRef} /></div>}
      <div className="flex gap-5 mt-3 pt-3 border-t border-outline-variant/20 flex-wrap">
        {[
          { label: "Close", color: C.prim, style: "solid" as const, val: "$189.84" },
          { label: "50 MA", color: C.blue, style: "dashed" as const, val: "$181.20" },
          { label: "200 MA", color: C.org, style: "dashed" as const, val: "$163.45" },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-2 text-xs">
            <svg width={24} height={8}><line x1={0} y1={4} x2={24} y2={4} stroke={item.color} strokeWidth={item.style === "dashed" ? 1.5 : 2} strokeDasharray={item.style === "dashed" ? "4 3" : undefined} /></svg>
            <span className="text-on-surface-variant">{item.label}</span>
            <span className="font-mono font-medium text-primary">{item.val}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Section 3: Key Statistics ─────────────────────────────────────────────────
const KeyStats = () => {
  const cardTitle = "font-ui-button text-[10px] uppercase tracking-widest text-on-surface-variant border-b border-outline-variant/20 pb-2 mb-3"
  const Row = ({ label, value, positive, negative }: { label: string; value: string; positive?: boolean; negative?: boolean }) => (
    <div className="flex items-center justify-between py-1.5 even:bg-surface-container-low/30 px-2 rounded">
      <span className="text-xs text-on-surface-variant">{label}</span>
      <span className={`text-sm font-mono font-medium ${positive ? "text-success" : negative ? "text-error" : "text-primary"}`}>{value}</span>
    </div>
  )
  return (
    <div className="grid grid-cols-4 gap-4">
      <div className={`${card} p-4`}>
        <div className={cardTitle}>Valuation</div>
        <Row label="Market Cap" value="$2.93T" />
        <Row label="P/E (TTM)" value="31.4x" />
        <Row label="Forward P/E" value="28.7x" />
        <Row label="PEG Ratio" value="2.84" />
        <Row label="Price/Sales" value="7.9x" />
        <Row label="Price/Book" value="47.8x" />
        <Row label="EV/EBITDA" value="24.4x" />
        <Row label="EV/Revenue" value="7.4x" />
      </div>
      <div className={`${card} p-4`}>
        <div className={cardTitle}>Financials</div>
        <Row label="Revenue (TTM)" value="$383.3B" />
        <Row label="Net Income" value="$97.0B" />
        <Row label="EPS (TTM)" value="$6.11" />
        <Row label="EPS (Forward)" value="$6.61" />
        <Row label="Profit Margin" value="25.3%" positive />
        <Row label="Op Margin" value="29.8%" positive />
        <Row label="ROE" value="171.9%" positive />
        <Row label="ROA" value="22.6%" positive />
      </div>
      <div className={`${card} p-4`}>
        <div className={cardTitle}>Trading Info</div>
        <Row label="52W High" value="$198.23" />
        <Row label="52W Low" value="$143.90" />
        <div className="py-1.5 px-2">
          <div className="flex justify-between text-xs text-on-surface-variant mb-1"><span>52W Position</span><span className="text-primary font-mono">84%</span></div>
          <div className="h-2 bg-surface-container rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-red-400" style={{ width: "84%" }} />
          </div>
        </div>
        <Row label="Avg Vol (30D)" value="57.8M" />
        <Row label="Beta (5Y)" value="1.24" />
        <Row label="Short Float" value="0.72%" />
        <Row label="Shares Out" value="15.44B" />
        <Row label="Float" value="15.32B" />
      </div>
      <div className={`${card} p-4`}>
        <div className={cardTitle}>Dividends & Growth</div>
        <Row label="Div/Share" value="$1.00" />
        <Row label="Div Yield" value="0.53%" />
        <Row label="Payout Ratio" value="15.5%" />
        <Row label="5Y Div Growth" value="+5.8%" positive />
        <Row label="Rev Growth (YoY)" value="+7.8%" positive />
        <Row label="EPS Growth (YoY)" value="+12.4%" positive />
        <Row label="Next Earnings" value="Jul 25, 2025" />
        <Row label="Analyst Count" value="42" />
      </div>
    </div>
  )
}

// ── Section 4: Analyst Ratings ────────────────────────────────────────────────
const AnalystRatings = () => {
  const donutRef = useRef<HTMLCanvasElement>(null)
  const distRef = useRef<HTMLCanvasElement>(null)
  const donutInst = useRef<any>(null)
  const distInst = useRef<any>(null)

  useEffect(() => {
    let dead = false
    const init = async () => {
      const m = await import("chart.js")
      m.Chart.register(...m.registerables)
      if (dead) return
      if (donutRef.current) {
        donutInst.current?.destroy()
        donutInst.current = new m.Chart(donutRef.current.getContext("2d")!, {
          type: "doughnut",
          data: { labels: ["Buy","Hold","Sell"], datasets: [{ data: [26, 12, 4], backgroundColor: [C.pos, C.warn, C.neg], borderWidth: 0 }] },
          options: { responsive: true, maintainAspectRatio: true, cutout: "72%", plugins: { legend: { display: false }, tooltip: { backgroundColor: C.prim, bodyColor: "#fff" } } },
        })
      }
      if (distRef.current) {
        distInst.current?.destroy()
        distInst.current = new m.Chart(distRef.current.getContext("2d")!, {
          type: "bar",
          data: {
            labels: ["$165-175","$175-185","$185-195","$195-205","$205-215","$215-225","$225-235","$235-245","$245-255"],
            datasets: [{ data: [2,3,5,8,10,7,4,2,1], backgroundColor: C.prim + "66", borderWidth: 0 }],
          },
          options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { backgroundColor: C.prim, bodyColor: "#fff" } },
            scales: { x: { ticks: { color: C.muted, font: { size: 9 }, maxRotation: 45 } }, y: { ticks: { color: C.muted, font: { size: 9 } } } },
          },
        })
      }
    }
    init()
    return () => { dead = true; donutInst.current?.destroy(); distInst.current?.destroy() }
  }, [])

  const ratings = [
    { date:"Jun 12 2025", firm:"Goldman Sachs",  analyst:"M. Wilson",  action:"Reiterate", oldPT:"$195", newPT:"$220", rating:"Buy"        },
    { date:"Jun 8 2025",  firm:"Morgan Stanley", analyst:"K. Huberty", action:"Upgrade",   oldPT:"$180", newPT:"$215", rating:"Overweight"  },
    { date:"May 30 2025", firm:"JPMorgan",        analyst:"S. Mossman", action:"Reiterate", oldPT:"$210", newPT:"$225", rating:"Overweight"  },
    { date:"May 22 2025", firm:"Barclays",        analyst:"T. O'Brien", action:"Downgrade", oldPT:"$230", newPT:"$200", rating:"Equal Weight" },
    { date:"May 15 2025", firm:"UBS",             analyst:"D. Vogt",    action:"Initiate",  oldPT:"—",    newPT:"$210", rating:"Buy"         },
    { date:"May 9 2025",  firm:"Citi",            analyst:"A. Bhutani", action:"Reiterate", oldPT:"$205", newPT:"$215", rating:"Buy"         },
    { date:"Apr 28 2025", firm:"Wedbush",         analyst:"D. Ives",    action:"Upgrade",   oldPT:"$175", newPT:"$230", rating:"Outperform"  },
    { date:"Apr 15 2025", firm:"BofA Securities", analyst:"W. Power",   action:"Reiterate", oldPT:"$200", newPT:"$220", rating:"Buy"         },
  ]
  const actionBadge = (a: string) => {
    if (a === "Upgrade") return <span className={posBadge}>{a}</span>
    if (a === "Downgrade") return <span className={negBadge}>{a}</span>
    if (a === "Initiate") return <span className={blueBadge}>{a}</span>
    return <span className={neutBadge}>{a}</span>
  }

  return (
    <div className={`${card} p-5`}>
      <h2 className="font-headline-md text-[18px] text-primary mb-4">Analyst Ratings & Price Targets</h2>
      <div className="grid gap-6 mb-5" style={{ gridTemplateColumns: "55fr 45fr" }}>
        <div>
          <p className="font-ui-button text-[10px] uppercase tracking-widest text-on-surface-variant mb-3">Consensus Rating</p>
          <div className="flex items-center gap-6">
            <div className="relative w-[140px] h-[140px] flex-shrink-0">
              <canvas ref={donutRef} />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="font-mono font-bold text-sm text-success">Strong Buy</span>
              </div>
            </div>
            <div className="flex gap-4">
              {[["Buy","62%",C.pos],["Hold","29%",C.warn],["Sell","10%",C.neg]].map(([l,v,c]) => (
                <div key={l as string} className="text-center">
                  <div className="font-mono font-bold text-lg" style={{ color: c as string }}>{v as string}</div>
                  <div className="text-xs text-on-surface-variant">{l as string}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div>
          <p className="font-ui-button text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">12-Month Price Target</p>
          <div className="flex items-baseline gap-3 mb-3">
            <span className="font-mono font-bold text-2xl text-success">$215.40</span>
            <span className={posBadge}>+13.5% upside</span>
          </div>
          <div className="relative mb-3">
            <div className="h-2 bg-surface-container rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ background: "linear-gradient(to right, #ba1a1a, #b45309, #3f6b3f)" }} />
            </div>
            <div className="flex justify-between text-[10px] text-on-surface-variant mt-1">
              <span>Low $165</span>
              <span className="text-primary font-bold">Current $189.84</span>
              <span className="text-success">Target $215.40</span>
              <span>High $275</span>
            </div>
          </div>
          <div className="relative" style={{ height: 80 }}><canvas ref={distRef} /></div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-outline-variant/20">
              {["Date","Firm","Analyst","Action","Old Target","New Target","Rating"].map(h => (
                <th key={h} className="px-3 py-2 text-left text-[11px] font-ui-button uppercase tracking-widest text-on-surface-variant whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ratings.map((r, i) => (
              <tr key={i} className={i % 2 ? "bg-surface-container-low/40" : ""}>
                <td className="px-3 py-2.5 text-xs text-on-surface-variant whitespace-nowrap">{r.date}</td>
                <td className="px-3 py-2.5 text-xs text-on-surface font-medium whitespace-nowrap">{r.firm}</td>
                <td className="px-3 py-2.5 text-xs text-on-surface-variant whitespace-nowrap">{r.analyst}</td>
                <td className="px-3 py-2.5 whitespace-nowrap">{actionBadge(r.action)}</td>
                <td className="px-3 py-2.5 text-xs font-mono text-on-surface-variant">{r.oldPT}</td>
                <td className="px-3 py-2.5 text-xs font-mono font-semibold text-primary">{r.newPT}</td>
                <td className="px-3 py-2.5 text-xs text-on-surface">{r.rating}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Section 5: Financial Statements ──────────────────────────────────────────
const FinancialStatements = () => {
  const [tab, setTab] = useState<"income"|"balance"|"cashflow"|"ratios">("income")

  const incomeData = [
    { label: "Revenue ($B)",       vals: [274.5, 365.8, 394.3, 383.3, 385.6] },
    { label: "Gross Profit ($B)",  vals: [104.9, 152.8, 170.8, 169.1, 172.3] },
    { label: "Op Income ($B)",     vals: [66.3,  108.9, 119.4, 114.3, 117.8] },
    { label: "Net Income ($B)",    vals: [57.4,  94.7,  99.8,  97.0,  98.2]  },
    { label: "EPS ($)",            vals: [3.28,  5.61,  6.11,  6.13,  6.42]  },
    { label: "EBITDA ($B)",        vals: [77.4,  120.2, 130.9, 125.8, 129.4] },
    { label: "R&D ($B)",           vals: [18.8,  21.9,  26.3,  29.9,  31.4]  },
    { label: "SG&A ($B)",          vals: [19.9,  21.9,  25.1,  24.9,  26.1]  },
  ]
  const balanceData = [
    { label: "Total Assets ($B)",       vals: [323.9, 351.0, 352.8, 352.6, 337.4] },
    { label: "Total Liab. ($B)",        vals: [258.5, 287.9, 302.1, 290.4, 277.3] },
    { label: "Total Equity ($B)",       vals: [65.3,  63.1,  50.7,  62.1,  60.1]  },
    { label: "Cash ($B)",               vals: [90.9,  62.6,  48.3,  61.6,  55.2]  },
    { label: "ST Debt ($B)",            vals: [13.8,  10.0,  11.1,  11.5,  10.1]  },
    { label: "LT Debt ($B)",            vals: [98.7,  109.1, 98.9,  95.3,  91.8]  },
    { label: "Goodwill ($B)",           vals: [0.0,   0.0,   0.0,   0.0,   0.0]   },
    { label: "Ret. Earnings ($B)",      vals: [-70.4, -62.0, -3.1, -214.0, -299.5] },
  ]
  const cashflowData = [
    { label: "Op. CF ($B)",        vals: [80.7,  104.0, 122.2, 110.5, 107.9] },
    { label: "Investing CF ($B)",  vals: [-4.3, -14.5, -22.4,   3.7,  -5.2]  },
    { label: "Financing CF ($B)",  vals: [-86.8,-93.4,-110.7,-108.5,-101.4]  },
    { label: "Free CF ($B)",       vals: [73.4,  92.9, 111.4,  99.6,  96.7]  },
    { label: "CapEx ($B)",         vals: [-7.3, -11.1, -10.7, -10.9, -11.2]  },
    { label: "Dividends ($B)",     vals: [-14.1,-14.5, -14.8, -15.1, -15.2]  },
    { label: "Buybacks ($B)",      vals: [-72.4,-85.5, -89.4, -77.6, -81.5]  },
  ]

  const activeData = tab === "income" ? incomeData : tab === "balance" ? balanceData : cashflowData

  const ratioCards = [
    { title:"Profitability",  items:[["Gross Margin","44.7%",true],["Op Margin","29.8%",true],["Net Margin","25.3%",true],["ROE","171.9%",true],["ROA","22.6%",true]] },
    { title:"Liquidity",      items:[["Current Ratio","0.99x",false],["Quick Ratio","0.90x",false],["Cash Ratio","0.54x",false],["Working Capital","-$0.3B",false]] },
    { title:"Leverage",       items:[["Debt/Equity","1.52x",false],["Net Debt/EBITDA","0.60x",false],["Int. Coverage","25.8x",true],["Debt/Assets","0.39x",false]] },
    { title:"Efficiency",     items:[["Asset Turnover","1.13x",true],["Inv. Turnover","30.2x",true],["Rec. Turnover","16.4x",true],["Days Sales","22.3",false]] },
    { title:"Valuation",      items:[["P/E","31.4x",null],["P/S","7.9x",null],["P/B","47.8x",null],["EV/EBITDA","24.4x",null]] },
    { title:"Growth",         items:[["Rev Growth","+0.6%",true],["EPS Growth","+4.7%",true],["FCF Growth","-3.0%",false],["EBITDA Growth","+2.9%",true]] },
    { title:"Dividend",       items:[["Yield","0.53%",null],["Payout","15.5%",null],["Growth 5Y","5.8%",true],["Consistency","12 yrs",true]] },
    { title:"Quality",        items:[["Altman Z","4.87",true],["Piotroski F","7/9",true],["FCF/Rev","25.1%",true],["Accruals","-2.1%",true]] },
  ]

  return (
    <div className={`${card} p-5`}>
      <div className="flex gap-1 border-b border-outline-variant/20 mb-5 flex-wrap">
        {[["income","Income Statement"],["balance","Balance Sheet"],["cashflow","Cash Flow"],["ratios","Ratios"]].map(([t, label]) => (
          <button key={t} onClick={() => setTab(t as typeof tab)} className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${tab === t ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-primary"}`}>{label}</button>
        ))}
        <div className="ml-auto flex items-center gap-2 pb-1">
          {["↓ CSV","↓ Excel","↓ PDF"].map(e => (
            <button key={e} className="px-2.5 py-1 rounded border border-outline-variant/30 text-xs text-on-surface-variant hover:border-primary/40 transition-colors">{e}</button>
          ))}
          <label className="flex items-center gap-1.5 text-xs text-on-surface-variant cursor-pointer">
            <input type="checkbox" className="rounded" /> Quarterly
          </label>
        </div>
      </div>
      {tab === "ratios" ? (
        <div className="grid grid-cols-4 gap-4">
          {ratioCards.map(rc => (
            <div key={rc.title} className="border border-outline-variant/20 rounded-lg p-3">
              <div className="font-ui-button text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">{rc.title}</div>
              {rc.items.map(([l, v, pos]) => (
                <div key={l as string} className="flex justify-between py-1 border-b border-outline-variant/10 last:border-0">
                  <span className="text-xs text-on-surface-variant">{l as string}</span>
                  <span className={`text-xs font-mono font-medium ${pos === true ? "text-success" : pos === false ? "text-error" : "text-primary"}`}>{v as string}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/20">
                {["Metric","FY2020","FY2021","FY2022","FY2023","FY2024(TTM)","YoY%","Trend"].map(c => (
                  <th key={c} className="px-3 py-2 text-left text-[11px] font-ui-button uppercase tracking-widest text-on-surface-variant whitespace-nowrap">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activeData.map((row, i) => {
                const yoy = ((row.vals[4] - row.vals[3]) / Math.abs(row.vals[3])) * 100
                return (
                  <tr key={i} className={i % 2 ? "bg-surface-container-low/40" : ""}>
                    <td className="px-3 py-2.5 text-xs text-on-surface whitespace-nowrap">{row.label}</td>
                    {row.vals.map((v, j) => <td key={j} className="px-3 py-2.5 text-xs font-mono text-on-surface">{v.toFixed(1)}</td>)}
                    <td className={`px-3 py-2.5 text-xs font-mono font-semibold ${yoy >= 0 ? "text-success" : "text-error"}`}>{yoy >= 0 ? "+" : ""}{yoy.toFixed(1)}%</td>
                    <td className="px-3 py-2.5"><SVGSparkline data={row.vals} /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Section 6: Technical Analysis ─────────────────────────────────────────────
const TechnicalAnalysis = () => {
  const oscillators = [
    { name: "RSI (14)",      val: "58.2",   sig: "Buy"     },
    { name: "Stochastic %K", val: "72.4",   sig: "Buy"     },
    { name: "CCI (20)",      val: "+124.5", sig: "Buy"     },
    { name: "MACD",          val: "+2.14",  sig: "Buy"     },
    { name: "Williams %R",   val: "-31.8",  sig: "Neutral" },
    { name: "Ultimate Osc.", val: "48.3",   sig: "Sell"    },
  ]
  const movingAvgs = [
    { name: "MA5",   val: "187.23", sig: "Buy"  },
    { name: "MA10",  val: "185.44", sig: "Buy"  },
    { name: "MA20",  val: "183.12", sig: "Buy"  },
    { name: "MA50",  val: "181.20", sig: "Buy"  },
    { name: "MA100", val: "172.84", sig: "Buy"  },
    { name: "MA200", val: "163.45", sig: "Buy"  },
    { name: "EMA20", val: "184.33", sig: "Buy"  },
    { name: "EMA50", val: "179.98", sig: "Sell" },
  ]

  const arcSegments = [
    { from: [30,120],     to: [47.2,67.1],   color: "#ba1a1a" },
    { from: [47.2,67.1],  to: [92.2,34.3],   color: "#ef9a9a" },
    { from: [92.2,34.3],  to: [147.8,34.3],  color: "#c5c6cf" },
    { from: [147.8,34.3], to: [192.8,67.1],  color: "#a5d6a7" },
    { from: [192.8,67.1], to: [210,120],      color: "#3f6b3f" },
  ]

  const priceToX = (p: number) => ((p - 170) / (210 - 170)) * 760 + 20
  const snrPrices =  [175.20, 182.50, 189.84, 195.40, 202.80]
  const snrLabels =  ["Str. Support $175.20", "Support $182.50", "Current $189.84", "Resistance $195.40", "Str. Resistance $202.80"]
  const snrColors =  [C.pos, C.pos + "99", C.prim, C.neg + "99", C.neg]

  return (
    <div className={`${card} p-5`}>
      <h2 className="font-headline-md text-[18px] text-primary mb-4">Technical Analysis Panel</h2>
      <div className="grid grid-cols-3 gap-5 mb-5">
        <div>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-1">
            <span className="font-ui-button text-[10px] uppercase tracking-widest text-on-surface-variant">Oscillators</span>
            <span className="text-xs"><span className="text-success font-semibold">4 BUY</span> · <span className="text-on-surface-variant">1 NEUTRAL</span> · <span className="text-error font-semibold">1 SELL</span></span>
          </div>
          <table className="w-full border-collapse">
            <thead><tr className="border-b border-outline-variant/20">
              <th className="pb-1.5 text-left text-[10px] font-ui-button uppercase tracking-widest text-on-surface-variant">Indicator</th>
              <th className="pb-1.5 text-right text-[10px] font-ui-button uppercase tracking-widest text-on-surface-variant">Value</th>
              <th className="pb-1.5 text-right text-[10px] font-ui-button uppercase tracking-widest text-on-surface-variant">Signal</th>
            </tr></thead>
            <tbody>
              {oscillators.map((o, i) => (
                <tr key={i} className={i % 2 ? "bg-surface-container-low/30" : ""}>
                  <td className="py-1.5 text-xs text-on-surface pr-2">{o.name}</td>
                  <td className="py-1.5 text-xs font-mono text-on-surface text-right pr-2">{o.val}</td>
                  <td className="py-1.5 text-right"><SignalPill s={o.sig} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-1">
            <span className="font-ui-button text-[10px] uppercase tracking-widest text-on-surface-variant">Moving Averages</span>
            <span className="text-xs"><span className="text-success font-semibold">6 BUY</span> · <span className="text-error font-semibold">2 SELL</span></span>
          </div>
          <table className="w-full border-collapse">
            <thead><tr className="border-b border-outline-variant/20">
              <th className="pb-1.5 text-left text-[10px] font-ui-button uppercase tracking-widest text-on-surface-variant">Indicator</th>
              <th className="pb-1.5 text-right text-[10px] font-ui-button uppercase tracking-widest text-on-surface-variant">Value</th>
              <th className="pb-1.5 text-right text-[10px] font-ui-button uppercase tracking-widest text-on-surface-variant">Signal</th>
            </tr></thead>
            <tbody>
              {movingAvgs.map((o, i) => (
                <tr key={i} className={i % 2 ? "bg-surface-container-low/30" : ""}>
                  <td className="py-1.5 text-xs text-on-surface pr-2">{o.name}</td>
                  <td className="py-1.5 text-xs font-mono text-on-surface text-right pr-2">{o.val}</td>
                  <td className="py-1.5 text-right"><SignalPill s={o.sig} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col items-center">
          <span className="font-ui-button text-[10px] uppercase tracking-widest text-on-surface-variant mb-3">Overall Signal</span>
          <svg viewBox="0 0 240 145" width="100%" style={{ maxWidth: 220 }}>
            {arcSegments.map((arc, i) => (
              <path key={i}
                d={`M ${arc.from[0]},${arc.from[1]} A 90,90,0,0,1,${arc.to[0]},${arc.to[1]}`}
                fill="none" stroke={arc.color} strokeWidth="18" strokeLinecap="butt"
              />
            ))}
            <line x1="120" y1="120" x2="156.2" y2="48.7" stroke={C.prim} strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="120" cy="120" r="6" fill={C.prim} />
            <text x="120" y="138" textAnchor="middle" fontSize="18" fontWeight="700" fill={C.pos} fontFamily="monospace">BUY</text>
          </svg>
          <div className="text-xs text-on-surface-variant mt-1 text-center">
            <span className="text-error font-semibold">Sell: 3</span> · <span>Neutral: 2</span> · <span className="text-success font-semibold">Buy: 9</span>
          </div>
        </div>
      </div>
      <div className="border-t border-outline-variant/20 pt-4">
        <p className="font-ui-button text-[10px] uppercase tracking-widest text-on-surface-variant mb-3">Support & Resistance Levels</p>
        <svg viewBox="0 0 800 70" width="100%" style={{ display: "block" }}>
          <line x1="20" y1="35" x2="780" y2="35" stroke={C.bord} strokeWidth="1" />
          {snrPrices.map((price, i) => {
            const x = priceToX(price)
            const isDashed = i === 2
            return (
              <g key={i}>
                <line x1={x} y1="12" x2={x} y2="58" stroke={snrColors[i]} strokeWidth={isDashed ? 2 : 1.5} strokeDasharray={isDashed ? "4 3" : undefined} />
                <text x={x} y={i % 2 === 0 ? 9 : 68} textAnchor="middle" fontSize="8" fill={snrColors[i]} fontFamily="monospace">{snrLabels[i]}</text>
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}

// ── Section 7: Earnings History ───────────────────────────────────────────────
const EarningsHistory = () => {
  const epsChartRef = useRef<HTMLCanvasElement>(null)
  const epsInst = useRef<any>(null)
  const quarters = ["Q1'23","Q2'23","Q3'23","Q4'23","Q1'24","Q2'24","Q3'24","Q4'24"]
  const est =    [1.43, 1.19, 1.39, 2.11, 1.50, 1.34, 1.60, 2.35]
  const actual = [1.52, 1.26, 1.46, 2.18, 1.53, 1.40, 1.64, 2.40]
  const reactions = ["+2.2%","-0.8%","+2.4%","+3.1%","-0.5%","+4.5%","+0.7%","+1.8%"]

  useEffect(() => {
    let dead = false
    const init = async () => {
      const m = await import("chart.js")
      m.Chart.register(...m.registerables)
      if (dead || !epsChartRef.current) return
      epsInst.current?.destroy()
      epsInst.current = new m.Chart(epsChartRef.current.getContext("2d")!, {
        type: "bar",
        data: {
          labels: quarters,
          datasets: [
            { label: "EPS Estimate", data: est, borderWidth: 2, borderColor: C.muted, backgroundColor: "transparent" },
            { label: "EPS Actual",   data: actual, backgroundColor: actual.map((a, i) => a >= est[i] ? C.pos : C.neg), borderWidth: 0 },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { backgroundColor: C.prim, bodyColor: "#fff" } },
          scales: { x: { ticks: { color: C.muted, font: { size: 10 } } }, y: { ticks: { color: C.muted, font: { size: 10 } } } },
        },
      })
    }
    init()
    return () => { dead = true; epsInst.current?.destroy() }
  }, [])

  return (
    <div className={`${card} p-5`}>
      <h2 className="font-headline-md text-[18px] text-primary mb-4">Earnings & Revenue History</h2>
      <div className="grid gap-5 mb-5" style={{ gridTemplateColumns: "60fr 40fr" }}>
        <div>
          <p className="font-ui-button text-[10px] uppercase tracking-widest text-on-surface-variant mb-3">EPS: Estimate vs Actual</p>
          <div style={{ height: 220 }}><canvas ref={epsChartRef} /></div>
        </div>
        <div>
          <p className="font-ui-button text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">Earnings History</p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead><tr className="border-b border-outline-variant/20">
                {["Qtr","Est","Act","Surp","Reaction"].map(h => <th key={h} className="px-2 py-1.5 text-left text-[10px] font-ui-button uppercase tracking-widest text-on-surface-variant whitespace-nowrap">{h}</th>)}
              </tr></thead>
              <tbody>
                {quarters.map((q, i) => {
                  const surp = ((actual[i] - est[i]) / est[i] * 100).toFixed(1)
                  return (
                    <tr key={i} className={i % 2 ? "bg-surface-container-low/40" : ""}>
                      <td className="px-2 py-2 font-mono font-bold text-primary">{q}</td>
                      <td className="px-2 py-2 font-mono text-on-surface-variant">${est[i].toFixed(2)}</td>
                      <td className="px-2 py-2 font-mono text-on-surface">${actual[i].toFixed(2)}</td>
                      <td className={`px-2 py-2 font-mono font-semibold ${+surp >= 0 ? "text-success" : "text-error"}`}>{+surp >= 0 ? "+" : ""}{surp}%</td>
                      <td className={`px-2 py-2 font-mono font-semibold ${reactions[i].startsWith("+") ? "text-success" : "text-error"}`}>{reactions[i]}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div className="border-l-4 border-[#b45309] bg-amber-50 p-4 rounded-r-lg">
        <div className="font-medium text-sm text-on-surface mb-1">Next Earnings: <strong>Jul 25, 2025</strong> (After Market Close)</div>
        <div className="text-sm text-on-surface-variant">Est. EPS: <strong className="text-on-surface">$1.34</strong> · Est. Revenue: <strong className="text-on-surface">$89.2B</strong></div>
        <div className="text-xs text-on-surface-variant mt-1">In 32 days · Options implied move: <strong className="text-[#b45309]">±4.2%</strong></div>
      </div>
    </div>
  )
}

// ── Section 8: Ownership ──────────────────────────────────────────────────────
const Ownership = () => {
  const ownDonutRef = useRef<HTMLCanvasElement>(null)
  const ownInst = useRef<any>(null)

  useEffect(() => {
    let dead = false
    const init = async () => {
      const m = await import("chart.js")
      m.Chart.register(...m.registerables)
      if (dead || !ownDonutRef.current) return
      ownInst.current?.destroy()
      ownInst.current = new m.Chart(ownDonutRef.current.getContext("2d")!, {
        type: "doughnut",
        data: { labels: ["Institutional","Insider","Retail/Other"], datasets: [{ data: [61, 0.07, 38.93], backgroundColor: [C.blue, C.purp, C.bord], borderWidth: 0 }] },
        options: { responsive: true, maintainAspectRatio: true, cutout: "68%", plugins: { legend: { display: false }, tooltip: { backgroundColor: C.prim, bodyColor: "#fff" } } },
      })
    }
    init()
    return () => { dead = true; ownInst.current?.destroy() }
  }, [])

  const institutions = [
    { name:"Vanguard Group",   shares:"1.28B",  pct:"8.29%", chg:"+2.4M", pos:true,  val:"$242.9B" },
    { name:"BlackRock Inc",    shares:"1.04B",  pct:"6.74%", chg:"+1.1M", pos:true,  val:"$197.4B" },
    { name:"State Street",     shares:"598.4M", pct:"3.87%", chg:"-3.2M", pos:false, val:"$113.6B" },
    { name:"Fidelity Mgmt",    shares:"352.1M", pct:"2.28%", chg:"+5.4M", pos:true,  val:"$66.8B"  },
    { name:"Geode Capital",    shares:"302.8M", pct:"1.96%", chg:"+0.9M", pos:true,  val:"$57.5B"  },
    { name:"T. Rowe Price",    shares:"221.4M", pct:"1.43%", chg:"-1.8M", pos:false, val:"$42.0B"  },
    { name:"Morgan Stanley",   shares:"201.8M", pct:"1.31%", chg:"+4.2M", pos:true,  val:"$38.3B"  },
    { name:"Norges Bank",      shares:"188.7M", pct:"1.22%", chg:"-0.6M", pos:false, val:"$35.8B"  },
    { name:"Northern Trust",   shares:"177.9M", pct:"1.15%", chg:"+1.3M", pos:true,  val:"$33.8B"  },
    { name:"BofA Securities",  shares:"143.2M", pct:"0.93%", chg:"-2.1M", pos:false, val:"$27.2B"  },
  ]
  const insiders = [
    { date:"Jun 5",  name:"T. Cook",    role:"CEO", type:"Sell",       shares:"50,000",  value:"$9.49M"  },
    { date:"May 28", name:"L. Maestri", role:"CFO", type:"Option Ex.", shares:"120,000", value:"$17.77M" },
    { date:"May 15", name:"K. Adams",   role:"VP",  type:"Sell",       shares:"25,000",  value:"$4.56M"  },
    { date:"Apr 30", name:"J. Joz",     role:"VP",  type:"Option Ex.", shares:"80,000",  value:"$11.56M" },
    { date:"Apr 12", name:"T. Cook",    role:"CEO", type:"Sell",       shares:"75,000",  value:"$13.14M" },
    { date:"Mar 25", name:"D. Levi",    role:"Dir", type:"Buy",        shares:"10,000",  value:"$1.68M"  },
    { date:"Mar 10", name:"K. Adams",   role:"VP",  type:"Sell",       shares:"15,000",  value:"$2.54M"  },
    { date:"Feb 28", name:"L. Maestri", role:"CFO", type:"Option Ex.", shares:"95,000",  value:"$14.52M" },
  ]
  const insiderBadge = (t: string) => {
    if (t === "Buy") return <span className={posBadge}>{t}</span>
    if (t === "Sell") return <span className={negBadge}>{t}</span>
    return <span className={blueBadge}>{t}</span>
  }

  return (
    <div className={`${card} p-5`}>
      <h2 className="font-headline-md text-[18px] text-primary mb-4">Ownership & Institutional Holdings</h2>
      <div className="grid grid-cols-3 gap-5">
        <div>
          <p className="font-ui-button text-[10px] uppercase tracking-widest text-on-surface-variant mb-3">Ownership Breakdown</p>
          <div className="w-[160px] h-[160px] mx-auto mb-4"><canvas ref={ownDonutRef} /></div>
          <div className="flex flex-wrap gap-2 justify-center">
            {["Institutional Holders: 5,842","% Institutional: 61.04%","% Insider: 0.07%"].map(p => (
              <span key={p} className={neutBadge + " px-3 py-1 text-[10px]"}>{p}</span>
            ))}
          </div>
        </div>
        <div>
          <p className="font-ui-button text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">Top Institutional Holders</p>
          <table className="w-full border-collapse">
            <thead><tr className="border-b border-outline-variant/20">
              {["Institution","Shares","% Port","Change","Value"].map(h => <th key={h} className="px-2 py-1.5 text-left text-[10px] font-ui-button uppercase tracking-widest text-on-surface-variant whitespace-nowrap">{h}</th>)}
            </tr></thead>
            <tbody>
              {institutions.map((inst, i) => (
                <tr key={i} className={i % 2 ? "bg-surface-container-low/40" : ""}>
                  <td className="px-2 py-2 text-xs text-on-surface whitespace-nowrap">{inst.name}</td>
                  <td className="px-2 py-2 text-xs font-mono text-on-surface">{inst.shares}</td>
                  <td className="px-2 py-2 text-xs text-on-surface-variant">{inst.pct}</td>
                  <td className={`px-2 py-2 text-xs font-mono ${inst.pos ? "text-success" : "text-error"}`}>{inst.pos ? "▲" : "▼"} {inst.chg}</td>
                  <td className="px-2 py-2 text-xs font-mono text-on-surface">{inst.val}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <p className="font-ui-button text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">Recent Insider Transactions</p>
          <table className="w-full border-collapse">
            <thead><tr className="border-b border-outline-variant/20">
              {["Date","Insider","Role","Type","Shares","Value"].map(h => <th key={h} className="px-2 py-1.5 text-left text-[10px] font-ui-button uppercase tracking-widest text-on-surface-variant whitespace-nowrap">{h}</th>)}
            </tr></thead>
            <tbody>
              {insiders.map((ins, i) => (
                <tr key={i} className={i % 2 ? "bg-surface-container-low/40" : ""}>
                  <td className="px-2 py-2 text-xs text-on-surface-variant whitespace-nowrap">{ins.date}</td>
                  <td className="px-2 py-2 text-xs text-on-surface font-medium whitespace-nowrap">{ins.name}</td>
                  <td className="px-2 py-2 text-xs text-on-surface-variant">{ins.role}</td>
                  <td className="px-2 py-2 whitespace-nowrap">{insiderBadge(ins.type)}</td>
                  <td className="px-2 py-2 text-xs font-mono text-on-surface">{ins.shares}</td>
                  <td className="px-2 py-2 text-xs font-mono font-semibold text-on-surface">{ins.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ── Section 9: News & Sentiment ────────────────────────────────────────────────
const NewsSentiment = () => {
  const [tab, setTab] = useState<"news"|"sec"|"transcripts"|"social">("news")
  const [expandedAI, setExpandedAI] = useState<number | null>(null)
  const socialRef = useRef<HTMLCanvasElement>(null)
  const buzzRef = useRef<HTMLCanvasElement>(null)
  const socialInst = useRef<any>(null)
  const buzzInst = useRef<any>(null)

  const articles = [
    { src:"Reuters",   time:"2h ago",  hl:"Fed signals potential rate cuts amid cooling inflation data",             sent:"Bullish", rel:"High",   ai:"Federal Reserve officials signaled openness to rate cuts. Markets rallied on the news." },
    { src:"Bloomberg", time:"4h ago",  hl:"NVIDIA reports record Q3 earnings, data center revenue surges 206%",     sent:"Bullish", rel:"High",   ai:"NVIDIA beat expectations on strong AI chip demand. Guidance raised for Q4 significantly." },
    { src:"WSJ",       time:"6h ago",  hl:"Tesla delivery numbers disappoint analysts for third consecutive quarter", sent:"Bearish", rel:"Medium", ai:"Tesla missed delivery estimates amid pricing pressure. Management cited macro headwinds." },
    { src:"CNBC",      time:"8h ago",  hl:"Apple Vision Pro sees strong enterprise adoption in Q4 pipeline",        sent:"Bullish", rel:"High",   ai:"Enterprise orders accelerating for Vision Pro. Healthcare and aerospace leading adoption." },
    { src:"FT",        time:"10h ago", hl:"JPMorgan upgrades Amazon to Overweight, raises price target to $230",    sent:"Bullish", rel:"Medium", ai:"AWS margin expansion and ad growth cited. Retail profitability improving quarter over quarter." },
    { src:"Barron's",  time:"14h ago", hl:"Market volatility expected to rise ahead of Fed meeting next week",      sent:"Neutral", rel:"Low",    ai:"Options pricing implies elevated volatility. Historically markets trend sideways pre-FOMC." },
    { src:"Bloomberg", time:"1d ago",  hl:"Apple iPhone 16 pre-orders exceed expectations in China",                sent:"Bullish", rel:"High",   ai:"China pre-orders surpassing iPhone 15 cycle. Strong upgrade demand across urban markets." },
    { src:"Reuters",   time:"1d ago",  hl:"Microsoft Azure growth accelerates, beating cloud revenue estimates",    sent:"Bullish", rel:"Medium", ai:"Azure grew 29% year-over-year. AI services contributing meaningfully to cloud growth." },
  ]
  const srcColor = (s: string) =>
    s === "Reuters" ? "bg-orange-50 text-orange-700 border-orange-200" :
    s === "Bloomberg" ? "bg-blue-50 text-blue-700 border-blue-200" :
    s === "WSJ" ? "bg-gray-100 text-gray-700 border-gray-200" :
    s === "CNBC" ? "bg-red-50 text-red-700 border-red-200" :
    "bg-surface-container text-on-surface-variant border-outline-variant/30"

  const secFilings = [
    { type:"10-K",    date:"Feb 2 2025",  desc:"Annual Report for FY2024" },
    { type:"10-Q",    date:"Nov 1 2024",  desc:"Quarterly Report Q4 2024" },
    { type:"10-Q",    date:"Aug 2 2024",  desc:"Quarterly Report Q3 2024" },
    { type:"10-Q",    date:"May 3 2024",  desc:"Quarterly Report Q2 2024" },
    { type:"8-K",     date:"Jan 30 2025", desc:"Earnings Release Q1 2025" },
    { type:"8-K",     date:"Nov 1 2024",  desc:"Earnings Release Q4 2024" },
    { type:"8-K",     date:"Aug 2 2024",  desc:"Earnings Release Q3 2024" },
    { type:"DEF 14A", date:"Mar 12 2025", desc:"Proxy Statement" },
  ]
  const transcripts = [
    { q:"Q4 2024", date:"Feb 1 2025",  quote:"Our record revenue of $124.3 billion reflects the strength of our ecosystem... iPhone 16 has driven exceptional upgrade cycles across all markets." },
    { q:"Q3 2024", date:"Oct 31 2024", quote:"Services revenue reached an all-time high of $24.2 billion... We now have over 1 billion paid subscriptions across our platform." },
    { q:"Q2 2024", date:"Aug 1 2024",  quote:"We returned nearly $32 billion to shareholders... Our balance sheet remains strong with $153.6 billion in cash and marketable securities." },
    { q:"Q1 2024", date:"May 2 2024",  quote:"The vision for spatial computing is becoming reality with Vision Pro... Enterprise adoption is exceeding our initial projections significantly." },
  ]
  const posts = [
    { user:"u/techbull2024",    ups:"847", time:"3h ago", text:"AAPL's services segment is undervalued by the market. At $24B quarterly revenue with high margins, it's worth more than most companies." },
    { user:"u/valueseeker",     ups:"423", time:"5h ago", text:"Bought more AAPL after the recent dip. Buffett is still holding billions of shares for a reason." },
    { user:"u/marketwatch_fan", ups:"289", time:"8h ago", text:"The iPhone 16 cycle could surprise to the upside. Early data from Asia suggests strong sell-through rates." },
  ]

  useEffect(() => {
    let dead = false
    const init = async () => {
      const m = await import("chart.js")
      m.Chart.register(...m.registerables)
      if (dead) return
      if (tab === "news" && buzzRef.current) {
        buzzInst.current?.destroy()
        buzzInst.current = new m.Chart(buzzRef.current.getContext("2d")!, {
          type: "bar",
          data: { labels: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"], datasets: [{ data: [82,95,78,110,142,138,156], backgroundColor: C.blue + "aa", borderWidth: 0 }] },
          options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { backgroundColor: C.prim, bodyColor: "#fff" } }, scales: { x: { ticks: { color: C.muted, font: { size: 9 } } }, y: { ticks: { color: C.muted, font: { size: 9 } } } } },
        })
      }
      if (tab === "social" && socialRef.current) {
        socialInst.current?.destroy()
        const sentData = [45,48,43,42,38,41,44,48,50,53,55,52,54,57,58,55,52,54,56,57,58,60,62,61,63,64,63,65,66,67]
        socialInst.current = new m.Chart(socialRef.current.getContext("2d")!, {
          type: "line",
          data: { labels: sentData.map((_, i) => `Day ${i+1}`), datasets: [{ data: sentData, borderColor: C.blue, borderWidth: 2, pointRadius: 0, fill: true, backgroundColor: "rgba(21,101,192,0.1)", tension: 0.4 }] },
          options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { backgroundColor: C.prim, bodyColor: "#fff" } }, scales: { x: { ticks: { color: C.muted, font: { size: 9 }, maxTicksLimit: 6 } }, y: { min: 30, max: 80, ticks: { color: C.muted, font: { size: 9 } } } } },
        })
      }
    }
    init()
    return () => {
      dead = true
      buzzInst.current?.destroy()
      socialInst.current?.destroy()
      buzzInst.current = null
      socialInst.current = null
    }
  }, [tab])

  return (
    <div className={`${card} p-5`}>
      <div className="flex gap-1 border-b border-outline-variant/20 mb-5 flex-wrap">
        {[["news","News"],["sec","SEC Filings"],["transcripts","Transcripts"],["social","Social Sentiment"]].map(([t, label]) => (
          <button key={t} onClick={() => setTab(t as typeof tab)} className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${tab === t ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-primary"}`}>{label}</button>
        ))}
      </div>

      {tab === "news" && (
        <div className="grid gap-5" style={{ gridTemplateColumns: "65fr 35fr" }}>
          <div className="space-y-3">
            {articles.map((a, i) => (
              <div key={i} className="border border-outline-variant/30 rounded-lg p-3.5 hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`text-[10px] font-ui-button uppercase tracking-widest px-1.5 py-0.5 rounded border ${srcColor(a.src)}`}>{a.src}</span>
                  <span className="text-xs text-on-surface-variant">{a.time}</span>
                  <span className="ml-auto">{a.rel === "High" ? <span className={blueBadge}>High</span> : a.rel === "Medium" ? <span className={neutBadge}>Medium</span> : <span className="bg-surface-container-low text-on-surface-variant/60 border border-outline-variant/20 rounded-full text-xs px-2 py-0.5">Low</span>}</span>
                </div>
                <div className="font-medium text-sm text-primary mb-1 hover:underline cursor-pointer leading-snug">{a.hl}</div>
                <div className="flex items-center gap-2 mt-2">
                  <span className={a.sent === "Bullish" ? posBadge : a.sent === "Bearish" ? negBadge : neutBadge}>{a.sent}</span>
                  <button onClick={() => setExpandedAI(expandedAI === i ? null : i)} className="text-xs text-on-surface-variant hover:text-primary transition-colors ml-auto">AI Summary {expandedAI === i ? "▲" : "▾"}</button>
                </div>
                {expandedAI === i && (
                  <div className="mt-2 text-xs italic text-on-surface-variant border-t border-outline-variant/20 pt-2">{a.ai}</div>
                )}
              </div>
            ))}
          </div>
          <div className="space-y-4">
            <div className="border border-outline-variant/20 rounded-lg p-4">
              <p className="font-ui-button text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">NLP Sentiment Score</p>
              <div className="h-3 bg-surface-container rounded-full overflow-hidden mb-1.5">
                <div className="h-full bg-success rounded-full" style={{ width: "67%" }} />
              </div>
              <p className="text-xs text-success font-medium">67/100 — Moderately Bullish</p>
            </div>
            <div className="border border-outline-variant/20 rounded-lg p-4">
              <p className="font-ui-button text-[10px] uppercase tracking-widest text-on-surface-variant mb-1">Social Media Buzz</p>
              <p className="text-xs text-on-surface mb-3">Volume: <strong>142K mentions</strong> · <span className="text-success">+34% vs avg</span></p>
              <div style={{ height: 80 }}><canvas ref={buzzRef} /></div>
            </div>
            <div className="border border-outline-variant/20 rounded-lg p-4">
              <p className="font-ui-button text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">Top Keywords</p>
              <div className="flex flex-wrap gap-1.5">
                {[["AI","text-base"],["iPhone16","text-sm"],["earnings","text-sm"],["Fed","text-xs"],["buyback","text-xs"]].map(([kw, sz]) => (
                  <span key={kw} className={`${neutBadge} ${sz}`}>{kw}</span>
                ))}
              </div>
            </div>
            <div className="border border-outline-variant/20 rounded-lg p-4">
              <p className="font-ui-button text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">Subreddit Mentions</p>
              {[["r/investing","2,847"],["r/stocks","1,923"],["r/wallstreetbets","7,441"]].map(([sub, cnt]) => (
                <div key={sub} className="flex justify-between py-1 text-xs">
                  <span className="text-blue-700 font-medium">{sub}</span>
                  <span className="text-success font-mono">{cnt} ▲</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "sec" && (
        <table className="w-full border-collapse">
          <thead><tr className="border-b border-outline-variant/20">
            {["Filing Type","Date","Description",""].map(h => <th key={h} className="px-3 py-2 text-left text-[11px] font-ui-button uppercase tracking-widest text-on-surface-variant">{h}</th>)}
          </tr></thead>
          <tbody>
            {secFilings.map((f, i) => (
              <tr key={i} className={i % 2 ? "bg-surface-container-low/40" : ""}>
                <td className="px-3 py-3"><span className={neutBadge + " font-mono"}>{f.type}</span></td>
                <td className="px-3 py-3 text-xs text-on-surface-variant whitespace-nowrap">{f.date}</td>
                <td className="px-3 py-3 text-sm text-on-surface">{f.desc}</td>
                <td className="px-3 py-3"><button className="text-xs text-blue-700 hover:underline whitespace-nowrap">View →</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {tab === "transcripts" && (
        <div className="grid grid-cols-2 gap-4">
          {transcripts.map((t, i) => (
            <div key={i} className="border border-outline-variant/30 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <span className="font-mono font-bold text-primary">{t.q}</span>
                <span className="text-xs text-on-surface-variant">{t.date}</span>
              </div>
              <p className="text-sm italic text-on-surface-variant mb-3 leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
              <button className="text-xs text-blue-700 hover:underline">Read Full Transcript →</button>
            </div>
          ))}
        </div>
      )}

      {tab === "social" && (
        <div className="space-y-5">
          <div className="border border-outline-variant/20 rounded-lg p-4">
            <p className="font-ui-button text-[10px] uppercase tracking-widest text-on-surface-variant mb-3">30-Day Social Sentiment Score</p>
            <div style={{ height: 120 }}><canvas ref={socialRef} /></div>
          </div>
          <div className="border border-outline-variant/20 rounded-lg p-4">
            <p className="font-ui-button text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">Bullish vs Bearish</p>
            <div className="h-4 rounded-full overflow-hidden flex">
              <div className="h-full bg-success" style={{ width: "58%" }} />
              <div className="h-full bg-error" style={{ width: "42%" }} />
            </div>
            <div className="flex justify-between text-xs mt-1"><span className="text-success font-semibold">Bullish 58%</span><span className="text-error font-semibold">Bearish 42%</span></div>
          </div>
          <div className="space-y-3">
            {posts.map((p, i) => (
              <div key={i} className="border border-outline-variant/30 rounded-lg p-3.5 bg-surface-container-low/20">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="font-mono text-xs font-bold text-blue-700">{p.user}</span>
                  <span className="text-xs text-on-surface-variant">· {p.ups} upvotes · {p.time}</span>
                </div>
                <p className="text-sm text-on-surface leading-relaxed">{p.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Section 10: Comparison Tool ───────────────────────────────────────────────
const ComparisonTool = () => {
  const compRef = useRef<HTMLCanvasElement>(null)
  const radarRef = useRef<HTMLCanvasElement>(null)
  const compInst = useRef<any>(null)
  const radarInst = useRef<any>(null)
  const [cmpRange, setCmpRange] = useState("1Y")
  const ranges = ["1M","3M","6M","1Y","3Y","5Y"]

  const buildComparison = useCallback(async (r: string) => {
    const m = await import("chart.js")
    m.Chart.register(...m.registerables)
    const pts = r === "1M" ? 22 : r === "3M" ? 65 : r === "6M" ? 130 : r === "1Y" ? 252 : r === "3Y" ? 756 : 1260
    const labels = Array.from({ length: pts }, (_, i) => i % Math.max(1, Math.floor(pts / 6)) === 0 ? `${i}` : "")
    const amp = r === "1M" ? 2 : r === "3M" ? 4 : r === "6M" ? 6 : r === "1Y" ? 8 : r === "3Y" ? 12 : 20
    const genNorm = (trend: number, freq: number, phase: number) => {
      let v = 100
      return Array.from({ length: pts }, (_, i) => {
        v += trend / pts + amp * Math.sin(i * freq + phase) * 0.3
        return Math.max(70, v)
      })
    }
    compInst.current?.destroy()
    if (compRef.current) {
      compInst.current = new m.Chart(compRef.current.getContext("2d")!, {
        type: "line",
        data: {
          labels,
          datasets: [
            { label: "AAPL",  data: genNorm(12, 0.25, 0),   borderColor: C.blue, borderWidth: 2, pointRadius: 0, tension: 0.3, fill: false },
            { label: "MSFT",  data: genNorm(18, 0.22, 0.4), borderColor: C.purp, borderWidth: 2, pointRadius: 0, tension: 0.3, fill: false },
            { label: "GOOGL", data: genNorm(8,  0.28, 0.8), borderColor: C.org,  borderWidth: 2, pointRadius: 0, tension: 0.3, fill: false },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { mode: "index", intersect: false, backgroundColor: C.prim, bodyColor: "#fff" } },
          scales: { x: { ticks: { color: C.muted, font: { size: 9 }, maxTicksLimit: 6 } }, y: { ticks: { color: C.muted, font: { size: 9 } } } },
        },
      })
    }
  }, [])

  useEffect(() => {
    let dead = false
    const init = async () => {
      await buildComparison(cmpRange)
      if (dead) return
      const m = await import("chart.js")
      m.Chart.register(...m.registerables)
      if (radarRef.current && !radarInst.current) {
        radarInst.current = new m.Chart(radarRef.current.getContext("2d")!, {
          type: "radar",
          data: {
            labels: ["Value","Growth","Profitability","Momentum","Dividends","Stability"],
            datasets: [
              { label:"AAPL",  data:[5,6,8,7,3,7], borderColor: C.blue, backgroundColor: C.blue+"26", borderWidth:2, pointBackgroundColor: C.blue },
              { label:"MSFT",  data:[4,8,9,8,4,9], borderColor: C.purp, backgroundColor: C.purp+"26", borderWidth:2, pointBackgroundColor: C.purp },
              { label:"GOOGL", data:[8,7,7,6,1,6], borderColor: C.org,  backgroundColor: C.org+"26",  borderWidth:2, pointBackgroundColor: C.org  },
            ],
          },
          options: {
            responsive: true, maintainAspectRatio: true,
            plugins: { legend: { display: false }, tooltip: { backgroundColor: C.prim, bodyColor: "#fff" } },
            scales: { r: { min: 0, max: 10, ticks: { color: C.muted, font: { size: 8 }, stepSize: 2 }, grid: { color: C.bord + "44" }, pointLabels: { color: C.muted, font: { size: 9 } } } },
          },
        })
      }
    }
    init()
    return () => {
      dead = true
      compInst.current?.destroy()
      radarInst.current?.destroy()
      compInst.current = null
      radarInst.current = null
    }
  }, [cmpRange, buildComparison])

  const stocks = [
    { key:"aapl" as const,  label:"AAPL",  color:C.blue, price:"$189.84", chg:"+1.23%", best:false },
    { key:"msft" as const,  label:"MSFT",  color:C.purp, price:"$417.32", chg:"+0.87%", best:false },
    { key:"googl" as const, label:"GOOGL", color:C.org,  price:"$175.22", chg:"+0.53%", best:true  },
  ]
  const metrics: Array<{ label: string; aapl: string; msft: string; googl: string; best: string }> = [
    { label:"Price",         aapl:"$189.84",   msft:"$417.32",  googl:"$175.22",  best:"" },
    { label:"Market Cap",    aapl:"$2.93T",    msft:"$3.10T",   googl:"$2.18T",   best:"googl" },
    { label:"P/E",           aapl:"31.4x",     msft:"36.8x",    googl:"24.7x",    best:"googl" },
    { label:"Forward P/E",   aapl:"28.7x",     msft:"32.1x",    googl:"21.3x",    best:"googl" },
    { label:"EPS",           aapl:"$6.11",     msft:"$11.88",   googl:"$7.13",    best:"msft"  },
    { label:"Revenue",       aapl:"$383.3B",   msft:"$254.2B",  googl:"$307.4B",  best:"aapl"  },
    { label:"Profit Margin", aapl:"25.3%",     msft:"35.2%",    googl:"26.7%",    best:"msft"  },
    { label:"Div Yield",     aapl:"0.53%",     msft:"0.72%",    googl:"0.00%",    best:"msft"  },
    { label:"52W Return",    aapl:"+24.3%",    msft:"+32.1%",   googl:"+46.8%",   best:"googl" },
    { label:"Beta",          aapl:"1.24",      msft:"0.92",     googl:"1.07",     best:"msft"  },
    { label:"Analyst",       aapl:"Strong Buy",msft:"Buy",      googl:"Buy",      best:"aapl"  },
  ]

  return (
    <div className={`${card} p-5`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-headline-md text-[18px] text-primary">Compare Stocks</h2>
        <button className="px-3 py-1.5 rounded-lg border border-outline-variant/30 text-sm text-on-surface-variant hover:border-primary/40 transition-colors">+ Add Stock</button>
      </div>
      <div className="flex gap-3 mb-4 flex-wrap">
        {stocks.map(s => (
          <div key={s.key} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-outline-variant/20 bg-surface-container-low">
            <span className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: s.color }}>{s.label[0]}</span>
            <span className="font-mono font-bold text-sm text-primary">{s.label}</span>
            <span className="font-mono text-xs text-on-surface-variant">{s.price}</span>
            <span className={`text-xs font-semibold ${s.chg.startsWith("+") ? "text-success" : "text-error"}`}>{s.chg}</span>
            {s.best && <span className={posBadge}>Best Overall</span>}
          </div>
        ))}
      </div>
      <div className="flex gap-0.5 mb-4 flex-wrap">
        {ranges.map(r => (
          <button key={r} onClick={() => setCmpRange(r)} className={`px-2.5 py-1.5 rounded text-xs font-medium transition-all ${cmpRange === r ? "bg-primary text-white" : "text-on-surface-variant hover:bg-surface-container-low hover:text-primary"}`}>{r}</button>
        ))}
      </div>
      <div className="grid gap-5 mb-5" style={{ gridTemplateColumns: "60fr 40fr" }}>
        <div style={{ height: 200 }}><canvas ref={compRef} /></div>
        <div style={{ height: 200 }}><canvas ref={radarRef} /></div>
      </div>
      <div className="flex gap-4 mb-3 text-xs text-on-surface-variant flex-wrap">
        {stocks.map(s => <span key={s.key} className="flex items-center gap-1.5"><span className="w-3 h-0.5 inline-block rounded" style={{ background: s.color }} />{s.label}</span>)}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-outline-variant/20">
              <th className="px-3 py-2 text-left text-[11px] font-ui-button uppercase tracking-widest text-on-surface-variant">Metric</th>
              {stocks.map(s => (
                <th key={s.key} className="px-3 py-2 text-left text-[11px] font-ui-button uppercase tracking-widest text-on-surface-variant">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: s.color }} />{s.label}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {metrics.map((m, i) => (
              <tr key={i} className={i % 2 ? "bg-surface-container-low/40" : ""}>
                <td className="px-3 py-2 text-xs text-on-surface-variant">{m.label}</td>
                {stocks.map(s => (
                  <td key={s.key} className={`px-3 py-2 text-xs font-mono text-on-surface ${m.best === s.key ? "bg-green-50 font-semibold" : ""}`}>
                    {m[s.key]}
                    {m.best === s.key && <span className="ml-1 text-success">★</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Section 11: Valuation Models ──────────────────────────────────────────────
const ValuationModels = () => {
  const [growth, setGrowth] = useState(8)
  const [termG, setTermG] = useState(3)
  const [wacc, setWacc] = useState(9)
  const [years, setYears] = useState(5)
  const [fcf, setFcf] = useState(110)
  const compsRef = useRef<HTMLCanvasElement>(null)
  const compsInst = useRef<any>(null)

  const calcDCF = useCallback(() => {
    let pv = 0
    const fcfB = fcf * 1e9
    for (let t = 1; t <= years; t++) {
      pv += fcfB * Math.pow(1 + growth / 100, t) / Math.pow(1 + wacc / 100, t)
    }
    const fcfFinal = fcfB * Math.pow(1 + growth / 100, years)
    const tv = fcfFinal * (1 + termG / 100) / Math.max(0.001, wacc / 100 - termG / 100)
    pv += tv / Math.pow(1 + wacc / 100, years)
    return pv / 15.44e9
  }, [growth, termG, wacc, years, fcf])

  const iv = calcDCF()
  const current = 189.84
  const mos = ((iv - current) / current) * 100

  useEffect(() => {
    let dead = false
    const init = async () => {
      const m = await import("chart.js")
      m.Chart.register(...m.registerables)
      if (dead || !compsRef.current) return
      compsInst.current?.destroy()
      compsInst.current = new m.Chart(compsRef.current.getContext("2d")!, {
        type: "bar",
        data: {
          labels: ["AAPL","MSFT","GOOGL","META","AMZN","Industry Avg"],
          datasets: [{ data: [24.4,28.1,18.2,14.8,22.3,22.1], backgroundColor: [C.prim, C.muted+"80", C.muted+"80", C.muted+"80", C.muted+"80", C.muted+"80"], borderWidth: 0 }],
        },
        options: {
          indexAxis: "y" as const,
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { backgroundColor: C.prim, bodyColor: "#fff" } },
          scales: { x: { ticks: { color: C.muted, font: { size: 9 } } }, y: { ticks: { color: C.muted, font: { size: 9 } } } },
        },
      })
    }
    init()
    return () => { dead = true; compsInst.current?.destroy() }
  }, [])

  const sliders = [
    { label: "Revenue Growth Rate", value: growth, setter: setGrowth, min: 0, max: 30, suffix: "%" },
    { label: "Terminal Growth Rate", value: termG, setter: setTermG, min: 0, max: 10, suffix: "%" },
    { label: "WACC", value: wacc, setter: setWacc, min: 5, max: 20, suffix: "%" },
    { label: "Projection Years", value: years, setter: setYears, min: 3, max: 10, suffix: "yr" },
    { label: "Current FCF ($B)", value: fcf, setter: setFcf, min: 50, max: 200, suffix: "B" },
  ]

  const grahamModels = [
    { model:"Graham Number",  fv:"$152.30", vs:"-19.8%", status:"Overvalued"  },
    { model:"Peter Lynch FV", fv:"$183.00", vs:"-3.6%",  status:"Fair Value"  },
    { model:"Earnings Power", fv:"$201.40", vs:"+6.1%",  status:"Undervalued" },
    { model:"Dividend DDM",   fv:"$141.20", vs:"-25.6%", status:"Overvalued"  },
    { model:"P/E Based FV",   fv:"$211.80", vs:"+11.6%", status:"Undervalued" },
  ]

  return (
    <div className={`${card} p-5`}>
      <h2 className="font-headline-md text-[18px] text-primary mb-4">Valuation Models</h2>
      <div className="grid grid-cols-3 gap-5">
        <div className="border border-outline-variant/20 rounded-xl p-4">
          <p className="font-ui-button text-[10px] uppercase tracking-widest text-on-surface-variant mb-3">DCF Calculator</p>
          <div className="text-center mb-4">
            <div className={`font-mono font-bold text-3xl ${iv > current ? "text-success" : "text-error"}`}>${iv.toFixed(2)}</div>
            <div className="text-xs text-on-surface-variant mt-0.5">Intrinsic Value per Share</div>
            <span className={`inline-block mt-2 ${mos >= 0 ? posBadge : negBadge}`}>
              {mos >= 0 ? "+" : ""}{mos.toFixed(1)}% Margin of Safety
            </span>
          </div>
          <div className="space-y-3 mb-4">
            {sliders.map(s => (
              <div key={s.label}>
                <div className="flex justify-between text-xs text-on-surface-variant mb-1">
                  <span>{s.label}</span>
                  <span className="font-mono font-medium text-primary">{s.value}{s.suffix}</span>
                </div>
                <input type="range" min={s.min} max={s.max} value={s.value}
                  onChange={e => s.setter(+e.target.value)}
                  className="w-full h-1 bg-surface-container rounded-full appearance-none cursor-pointer"
                  style={{ accentColor: C.prim }}
                />
              </div>
            ))}
          </div>
          <div className="border-t border-outline-variant/20 pt-3">
            <p className="font-ui-button text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">Projected FCF</p>
            <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${years}, 1fr)` }}>
              {Array.from({ length: years }, (_, t) => {
                const projFcf = fcf * Math.pow(1 + growth / 100, t + 1)
                return (
                  <div key={t} className="text-center">
                    <div className="text-[10px] text-on-surface-variant">Yr{t+1}</div>
                    <div className="text-xs font-mono text-primary">${projFcf.toFixed(0)}B</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
        <div className="border border-outline-variant/20 rounded-xl p-4">
          <p className="font-ui-button text-[10px] uppercase tracking-widest text-on-surface-variant mb-3">EV/EBITDA Peer Comparison</p>
          <div style={{ height: 180 }}><canvas ref={compsRef} /></div>
          <p className="text-xs text-on-surface-variant mt-3 leading-relaxed">
            AAPL trades at <strong className="text-primary">24.4x</strong> EV/EBITDA vs. peer average of <strong className="text-primary">22.1x</strong> — a <span className="text-error">10.4% premium</span>
          </p>
        </div>
        <div className="border border-outline-variant/20 rounded-xl p-4">
          <p className="font-ui-button text-[10px] uppercase tracking-widest text-on-surface-variant mb-3">Graham Number & Other Models</p>
          <table className="w-full border-collapse mb-4">
            <thead><tr className="border-b border-outline-variant/20">
              {["Model","Fair Value","vs Current","Status"].map(h => <th key={h} className="px-2 py-1.5 text-left text-[10px] font-ui-button uppercase tracking-widest text-on-surface-variant whitespace-nowrap">{h}</th>)}
            </tr></thead>
            <tbody>
              {grahamModels.map((g, i) => (
                <tr key={i} className={i % 2 ? "bg-surface-container-low/30" : ""}>
                  <td className="px-2 py-2 text-xs text-on-surface whitespace-nowrap">{g.model}</td>
                  <td className="px-2 py-2 text-xs font-mono text-on-surface">{g.fv}</td>
                  <td className={`px-2 py-2 text-xs font-mono font-semibold ${g.vs.startsWith("+") ? "text-success" : "text-error"}`}>{g.vs}</td>
                  <td className="px-2 py-2 whitespace-nowrap">
                    {g.status === "Undervalued" ? <span className={posBadge}>{g.status}</span>
                      : g.status === "Overvalued" ? <span className={negBadge}>{g.status}</span>
                      : <span className={warnBadge}>{g.status}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border border-outline-variant/20 rounded-lg p-3 bg-surface-container-low/50 text-xs text-on-surface-variant">
            <span>Weighted Avg Fair Value: </span><strong className="text-primary">$177.94</strong>
            <span className="mx-2">·</span>
            <span>Consensus: </span><span className={warnBadge + " ml-1"}>Fairly Valued</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Section 12: Risk & Quality Scorecard ─────────────────────────────────────
const RiskQuality = () => {
  const cxSvg = 140, cySvg = 130, maxR = 90
  const axes = [
    { label:"Value",     score:3, angle:-90 },
    { label:"Future",    score:5, angle:-18 },
    { label:"Past",      score:6, angle:54  },
    { label:"Health",    score:3, angle:126 },
    { label:"Dividends", score:2, angle:198 },
  ]
  const toXY = (angle: number, r: number) => ({
    x: cxSvg + r * Math.cos(angle * Math.PI / 180),
    y: cySvg - r * Math.sin(angle * Math.PI / 180),
  })
  const gridLevels = [1,2,3,4,5,6]
  const dataPoints = axes.map(a => toXY(a.angle, maxR * a.score / 6))
  const dataPolyPts = dataPoints.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")

  const risks = [
    { cat:"Financial Health", items:[
      { ok:true  as const, text:"Debt-to-equity below 2.0" },
      { ok:false as const, text:"Current ratio below 1.0 (0.99x)" },
      { ok:true  as const, text:"Interest coverage above 5x (25.8x)" },
    ]},
    { cat:"Valuation Risk", items:[
      { ok:null as null, text:"P/E above sector median (31.4x vs 26.1x)" },
      { ok:true  as const, text:"PEG ratio below 3.0 (2.84x)" },
      { ok:null  as null, text:"Price near 52-week high (95.3% of range)" },
    ]},
    { cat:"Business Risk", items:[
      { ok:null  as null, text:"Revenue concentration (iPhone >50% of sales)" },
      { ok:true  as const, text:"Geographic diversification" },
      { ok:true  as const, text:"Strong brand moat" },
    ]},
    { cat:"Market Risk", items:[
      { ok:null  as null, text:"Beta above 1.0 (1.24)" },
      { ok:true  as const, text:"Low short interest (<1%)" },
    ]},
  ]

  return (
    <div className={`${card} p-5`}>
      <h2 className="font-headline-md text-[18px] text-primary mb-4">Risk & Quality Scorecard</h2>
      <div className="grid gap-5" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div>
          <p className="font-ui-button text-[10px] uppercase tracking-widest text-on-surface-variant mb-3">Simply Wall St. Snowflake</p>
          <svg viewBox="0 0 280 260" width="100%" style={{ maxWidth: 280, display: "block", margin: "0 auto" }}>
            {gridLevels.map(lvl => {
              const pts = axes.map(a => {
                const p = toXY(a.angle, maxR * lvl / 6)
                return `${p.x.toFixed(1)},${p.y.toFixed(1)}`
              }).join(" ")
              return <polygon key={lvl} points={pts} fill="none" stroke={C.bord} strokeWidth="0.5" />
            })}
            {axes.map((a, i) => {
              const outer = toXY(a.angle, maxR)
              return <line key={i} x1={cxSvg} y1={cySvg} x2={outer.x.toFixed(1)} y2={outer.y.toFixed(1)} stroke={C.bord} strokeWidth="0.5" />
            })}
            <polygon points={dataPolyPts} fill={C.prim + "40"} stroke={C.prim} strokeWidth="1.5" />
            {dataPoints.map((p, i) => (
              <g key={i}>
                <circle cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r="10" fill={C.prim} />
                <text x={p.x.toFixed(1)} y={(p.y + 4).toFixed(1)} textAnchor="middle" fontSize="9" fill="white" fontWeight="bold">{axes[i].score}</text>
              </g>
            ))}
            {axes.map((a, i) => {
              const labelPt = toXY(a.angle, maxR + 22)
              return (
                <g key={i}>
                  <text x={labelPt.x.toFixed(1)} y={(labelPt.y - 4).toFixed(1)} textAnchor="middle" fontSize="10" fill={C.muted}>{a.label}</text>
                  <text x={labelPt.x.toFixed(1)} y={(labelPt.y + 8).toFixed(1)} textAnchor="middle" fontSize="9" fill={C.pos}>{a.score}/6</text>
                </g>
              )
            })}
          </svg>
        </div>
        <div>
          <p className="font-ui-button text-[10px] uppercase tracking-widest text-on-surface-variant mb-3">Risk Analysis</p>
          <div className="space-y-4">
            {risks.map(r => (
              <div key={r.cat}>
                <p className="font-ui-button text-[10px] uppercase tracking-widest text-on-surface-variant mb-1.5">{r.cat}</p>
                {r.items.map((item, i) => (
                  <div key={i} className={`flex items-start gap-2 py-1 text-sm ${item.ok === true ? "text-success" : item.ok === false ? "text-error" : "text-[#b45309]"}`}>
                    <span className="flex-shrink-0 font-bold">{item.ok === true ? "✓" : item.ok === false ? "✗" : "⚠"}</span>
                    <span className="text-xs leading-relaxed">{item.text}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div className="mt-4 border border-outline-variant/20 rounded-lg p-4 bg-surface-container-low">
            <div className="flex items-baseline gap-3 mb-1">
              <span className="font-ui-button text-[10px] uppercase tracking-widest text-on-surface-variant">Altman Z-Score</span>
              <span className="font-mono font-bold text-2xl text-success">4.87</span>
            </div>
            <p className="text-xs text-on-surface-variant">Safe Zone (&gt;2.99) — Low bankruptcy risk</p>
            <div className="flex items-baseline gap-3 mt-3">
              <span className="font-ui-button text-[10px] uppercase tracking-widest text-on-surface-variant">Piotroski F-Score</span>
              <span className="font-mono font-bold text-xl text-success">7 / 9</span>
              <span className="text-xs text-on-surface-variant">Strong</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Default export: ResearchPage ──────────────────────────────────────────────
export default function ResearchPage() {
  const [range, setRange] = useState("1Y")
  const [chartType, setChartType] = useState("Line")

  return (
    <>
      <style>{`
        .research-bar { scrollbar-width: none; }
        .research-bar::-webkit-scrollbar { display: none; }
      `}</style>
      <div className="bg-surface min-h-screen">
        <Container className="py-8 space-y-6">
          <Link href="/investing" className="inline-flex items-center gap-1.5 font-ui-button text-[11px] uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors">
            <MaterialIcon name="arrow_back" size={16} /> Back to Investing
          </Link>
          <div>
            <p className="font-ui-button text-[11px] uppercase tracking-widest text-on-surface-variant mb-1">Research</p>
            <h1 className="font-headline-md text-headline-md text-primary">Stock Research Tools</h1>
          </div>

          <CommandBar range={range} setRange={setRange} chartType={chartType} setChartType={setChartType} />
          <PriceChart range={range} setRange={setRange} chartType={chartType} />
          <KeyStats />
          <AnalystRatings />
          <FinancialStatements />
          <TechnicalAnalysis />
          <EarningsHistory />
          <Ownership />
          <NewsSentiment />
          <ComparisonTool />
          <ValuationModels />
          <RiskQuality />

          <div className="text-xs text-on-surface-variant text-right pb-4">
            Data shown is static demo data · Not financial advice · Prices delayed 15+ min
          </div>
        </Container>
      </div>
    </>
  )
}
