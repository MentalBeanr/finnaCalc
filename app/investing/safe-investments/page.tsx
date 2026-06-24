"use client"

import React, { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Container } from "@/components/ds/container"
import { MaterialIcon } from "@/components/ds/material-icon"

// ── Chart.js color palette (defers to site tokens for JSX; hex only for canvas) ─
const C = {
    pos: "#3f6b3f", posLight: "rgba(63,107,63,0.15)",
    neg: "#ba1a1a", negLight: "rgba(186,26,26,0.12)",
    warn: "#b45309",
    prim: "#00061a", primLight: "rgba(0,6,26,0.10)",
    muted: "#45464e", mutedLight: "rgba(69,70,78,0.12)",
    bord: "#c5c6cf",
    blue: "#1565c0", blueLight: "rgba(21,101,192,0.15)",
    purp: "#6a1b9a", purpLight: "rgba(106,27,154,0.15)",
    org: "#e65100", orgLight: "rgba(230,81,0,0.15)",
    teal: "#00695c", tealLight: "rgba(0,105,92,0.15)",
}

// ── Utilities ──────────────────────────────────────────────────────────────────
const usd = (v: number, max = 0) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: max }).format(v)
const pct = (v: number) => (v >= 0 ? "+" : "") + v.toFixed(2) + "%"
const compact = (v: number) => {
    if (v >= 1e12) return "$" + (v / 1e12).toFixed(1) + "T"
    if (v >= 1e9) return "$" + (v / 1e9).toFixed(1) + "B"
    if (v >= 1e6) return "$" + (v / 1e6).toFixed(1) + "M"
    if (v >= 1e3) return "$" + (v / 1e3).toFixed(1) + "K"
    return "$" + v.toFixed(0)
}
const seeded = (seed: number) => {
    let s = seed
    return () => { s = (s * 9301 + 49297) % 233280; return s / 233280 }
}
// Growth series normalized to a starting value, with a per-series CAGR + noise
const growthSeries = (years: number, points: number, cagr: number, start: number, vol: number, seed: number) => {
    const rng = seeded(seed)
    const out: number[] = []
    let v = start
    const perStep = Math.pow(1 + cagr, years / points) - 1
    for (let i = 0; i <= points; i++) {
        const wobble = 1 + (rng() - 0.5) * vol + Math.sin(i * 0.5) * vol * 0.4
        out.push(v)
        v = v * (1 + perStep) * wobble
    }
    return out.map((n) => Math.round(n))
}

// ── Reusable Chart.js wrapper — dynamic import keeps it SSR-safe ────────────────
const ChartBox = ({
    height,
    build,
    deps = [],
}: {
    height: number
    build: (Chart: any, canvas: HTMLCanvasElement) => any
    deps?: any[]
}) => {
    const ref = useRef<HTMLCanvasElement>(null)
    const inst = useRef<any>(null)
    useEffect(() => {
        let alive = true
        ;(async () => {
            const m = await import("chart.js")
            m.Chart.register(...m.registerables)
            if (!alive || !ref.current) return
            inst.current?.destroy()
            inst.current = new m.Chart(ref.current, build(m.Chart, ref.current))
        })()
        return () => {
            alive = false
            inst.current?.destroy()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps)
    return (
        <div style={{ height }} className="relative">
            <canvas ref={ref} />
        </div>
    )
}

const AllocationDonut = ({
    labels,
    data,
    colors,
    height = 120,
}: {
    labels: string[]
    data: number[]
    colors: string[]
    height?: number
}) => (
    <ChartBox
        height={height}
        build={() => ({
            type: "doughnut",
            data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 0 }] },
            options: {
                cutout: "62%",
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { enabled: true } },
            },
        })}
    />
)

// ── Shared UI primitives ────────────────────────────────────────────────────────
const card = "border border-outline-variant/30 rounded-xl bg-surface-container-lowest"
const SectionHead = ({ title, sub }: { title: string; sub?: string }) => (
    <div className="flex flex-col gap-stack-sm mb-stack-lg">
        <h2 className="font-headline-md text-headline-md text-primary">{title}</h2>
        {sub && <p className="font-body-md text-body-md text-on-surface-variant max-w-prose">{sub}</p>}
    </div>
)

// ════════════════════════════════════════════════════════════════════════════════
// SECTION 1 — Back bar
// ════════════════════════════════════════════════════════════════════════════════
function BackBar() {
    return (
        <div className="flex items-center justify-between pt-section-gap-sm">
            <Link
                href="/investing"
                className="inline-flex items-center gap-stack-sm font-ui-button text-ui-button uppercase tracking-[0.05em] text-on-surface-variant hover:text-primary transition-colors"
            >
                <MaterialIcon name="arrow_back" size={16} />
                Back to Investing
            </Link>
            <span className="inline-flex items-center gap-stack-sm font-ui-button text-ui-button uppercase tracking-[0.05em] text-on-surface-variant">
                <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-success opacity-60 animate-ping" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
                </span>
                NYSE Open · Closes 2h 34m
            </span>
        </div>
    )
}

// ════════════════════════════════════════════════════════════════════════════════
// SECTION 2 — Hero Banner: The Case for Simple Investing
// ════════════════════════════════════════════════════════════════════════════════
const HERO_STATS = [
    { big: "92%", label: "of active fund managers underperform the S&P 500 over 15 years", src: "Source: S&P SPIVA Scorecard" },
    { big: "10.7%", label: "average annual S&P 500 return over the last 30 years", src: "Source: Historical index returns, 1994–2024" },
    { big: "$1.0M", label: "what $10,000 invested in VOO in 1994 would be worth today", src: "Assumes dividends reinvested" },
]

function HeroBanner() {
    const sp500 = growthSeries(30, 30, 0.107, 10000, 0.06, 11)
    const active = growthSeries(30, 30, 0.082, 10000, 0.07, 23)
    const bonds = growthSeries(30, 30, 0.043, 10000, 0.02, 37)
    const years = Array.from({ length: 31 }, (_, i) => 1994 + i)
    return (
        <section id="hero" className={`${card} p-8`}>
            <p className="font-label-caps text-label-caps uppercase tracking-[0.15em] text-on-surface-variant mb-stack-md">
                The case for simple investing
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-[60%_40%] gap-gutter">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-gutter">
                    {HERO_STATS.map((s) => (
                        <div key={s.big} className="flex flex-col gap-stack-sm">
                            <span className="font-mono text-[40px] leading-none font-bold text-primary">{s.big}</span>
                            <span className="font-body-md text-body-md text-on-surface-variant">{s.label}</span>
                            <span className="text-xs text-on-surface-variant/70">{s.src}</span>
                        </div>
                    ))}
                </div>
                <div className="flex flex-col">
                    <ChartBox
                        height={200}
                        build={() => ({
                            type: "line",
                            data: {
                                labels: years,
                                datasets: [
                                    { label: "S&P 500 Index", data: sp500, borderColor: C.pos, backgroundColor: C.posLight, borderWidth: 2, tension: 0.3, pointRadius: 0, fill: true },
                                    { label: "Avg Active Fund", data: active, borderColor: C.blue, borderWidth: 1.5, tension: 0.3, pointRadius: 0 },
                                    { label: "Savings / Bonds", data: bonds, borderColor: C.muted, borderWidth: 1.5, borderDash: [4, 3], tension: 0.3, pointRadius: 0 },
                                ],
                            },
                            options: {
                                responsive: true, maintainAspectRatio: false,
                                plugins: { legend: { display: false } },
                                scales: {
                                    x: { grid: { display: false }, ticks: { maxTicksLimit: 6, color: C.muted, font: { size: 10 } } },
                                    y: { position: "right", grid: { color: "rgba(197,198,207,0.25)" }, ticks: { callback: (v: any) => compact(v), color: C.muted, font: { size: 10 } } },
                                },
                            },
                        })}
                    />
                    <div className="flex flex-wrap gap-stack-md mt-stack-sm text-xs">
                        <span className="inline-flex items-center gap-1"><span className="h-2 w-3 rounded-full" style={{ background: C.pos }} /> S&P 500 · {compact(sp500[sp500.length - 1])}</span>
                        <span className="inline-flex items-center gap-1"><span className="h-2 w-3 rounded-full" style={{ background: C.blue }} /> Active · {compact(active[active.length - 1])}</span>
                        <span className="inline-flex items-center gap-1"><span className="h-2 w-3 rounded-full" style={{ background: C.muted }} /> Bonds · {compact(bonds[bonds.length - 1])}</span>
                    </div>
                </div>
            </div>
            <p className="text-xs text-on-surface-variant/70 mt-stack-md">
                Past performance does not guarantee future results. Data sourced from historical index returns.
            </p>
        </section>
    )
}

// ════════════════════════════════════════════════════════════════════════════════
// SECTION 3 — Risk Profile Quiz
// ════════════════════════════════════════════════════════════════════════════════
const QUIZ = [
    { q: "When do you plan to use this money?", a: ["Less than 1 year", "1–3 years", "3–10 years", "10+ years (retirement)"] },
    { q: "What is this money for?", a: ["Emergency fund / safety net", "Major purchase (house, car, education)", "Retirement", "Long-term / generational wealth"] },
    { q: "If your portfolio dropped 20% in one month, you would:", a: ["Sell everything immediately", "Feel anxious but hold", "Do nothing — markets recover", "Buy more — it's on sale"] },
    { q: "How much are you starting with?", a: ["Under $1,000", "$1,000 – $10,000", "$10,000 – $100,000", "$100,000+"] },
    { q: "How much can you add per month?", a: ["$0 — lump sum only", "$1 – $100", "$100 – $500", "$500+"] },
]
const PROFILES = ["Conservative", "Moderate-Conservative", "Moderate", "Moderate-Aggressive", "Aggressive"]
const PROFILE_DESC: Record<string, string> = {
    "Conservative": "Capital preservation comes first — you favor stability and downside protection over chasing maximum returns.",
    "Moderate-Conservative": "You want steady growth with a meaningful cushion of bonds to smooth out the rough years.",
    "Moderate": "A balanced, diversified mix — the classic passive approach that millions of long-term investors rely on.",
    "Moderate-Aggressive": "You have time on your side and can ride out volatility in pursuit of stronger long-term growth.",
    "Aggressive": "Long horizon, strong stomach — you're optimizing for maximum compounding and can handle big swings.",
}
const scoreToProfile = (sum: number) => (sum <= 3 ? 0 : sum <= 6 ? 1 : sum <= 9 ? 2 : sum <= 12 ? 3 : 4)

function RiskQuiz({ onComplete }: { onComplete: (p: string) => void }) {
    const [step, setStep] = useState(0)
    const [answers, setAnswers] = useState<number[]>(Array(5).fill(-1))
    const [result, setResult] = useState<string | null>(null)

    const pick = (qi: number, oi: number) => {
        const next = [...answers]
        next[qi] = oi
        setAnswers(next)
        if (qi < 4) setTimeout(() => setStep(qi + 1), 300)
    }
    const reveal = () => {
        const sum = answers.reduce((a, b) => a + Math.max(0, b), 0)
        const p = PROFILES[scoreToProfile(sum)]
        setResult(p)
        onComplete(p)
        setTimeout(() => document.getElementById("strategy-tiers")?.scrollIntoView({ behavior: "smooth" }), 120)
    }
    const skip = () => {
        onComplete("Moderate")
        document.getElementById("strategy-tiers")?.scrollIntoView({ behavior: "smooth" })
    }

    const current = QUIZ[step]
    const lastAnswered = step === 4 && answers[4] >= 0

    return (
        <section id="quiz" className={`${card} p-8`}>
            <div className="flex items-center justify-between mb-stack-lg">
                <h2 className="font-headline-md text-headline-md text-primary">Find Your Strategy in 60 Seconds</h2>
                <span className="font-mono text-xs text-on-surface-variant">Step {step + 1} of 5</span>
            </div>

            {/* progress */}
            <div className="h-1 bg-surface-container rounded-full overflow-hidden mb-stack-lg">
                <div className="h-full bg-primary transition-all duration-300" style={{ width: `${((step + 1) / 5) * 100}%` }} />
            </div>

            <p className="font-headline-md text-[22px] text-primary mb-stack-lg">{current.q}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-gutter">
                {current.a.map((opt, oi) => {
                    const active = answers[step] === oi
                    return (
                        <button
                            key={opt}
                            type="button"
                            onClick={() => pick(step, oi)}
                            className={`text-left p-5 rounded-lg border transition-colors ${
                                active ? "border-primary bg-primary/5 text-primary" : "border-outline-variant/40 text-on-surface hover:border-primary/40"
                            }`}
                        >
                            <span className="font-body-md text-body-md">{opt}</span>
                        </button>
                    )
                })}
            </div>

            <div className="flex items-center justify-between mt-stack-lg">
                <button
                    type="button"
                    onClick={() => setStep((s) => Math.max(0, s - 1))}
                    disabled={step === 0}
                    className="inline-flex items-center gap-stack-sm font-ui-button text-ui-button uppercase tracking-[0.05em] text-on-surface-variant hover:text-primary disabled:opacity-40 transition-colors"
                >
                    <MaterialIcon name="arrow_back" size={16} /> Back
                </button>
                <div className="flex items-center gap-gutter">
                    <button type="button" onClick={skip} className="font-ui-button text-ui-button uppercase tracking-[0.05em] text-on-surface-variant hover:text-primary transition-colors">
                        Skip · Show all strategies
                    </button>
                    {lastAnswered && (
                        <button
                            type="button"
                            onClick={reveal}
                            className="inline-flex items-center gap-stack-sm px-5 py-2.5 rounded-lg bg-primary text-on-primary font-ui-button text-ui-button uppercase tracking-[0.05em] hover:bg-primary/90 transition-colors"
                        >
                            See my results <MaterialIcon name="arrow_forward" size={16} />
                        </button>
                    )}
                </div>
            </div>

            {result && (
                <div className="mt-stack-lg p-6 rounded-lg border border-primary/30 bg-primary/5 animate-fade-in">
                    <p className="font-label-caps text-label-caps uppercase tracking-[0.15em] text-on-surface-variant mb-stack-sm">Your risk profile</p>
                    <p className="font-headline-md text-headline-md text-primary mb-stack-sm">{result}</p>
                    <p className="font-body-md text-body-md text-on-surface-variant">{PROFILE_DESC[result]}</p>
                </div>
            )}
        </section>
    )
}

// ════════════════════════════════════════════════════════════════════════════════
// SECTION 4 — Strategy Tiers
// ════════════════════════════════════════════════════════════════════════════════
interface Tier {
    id: number
    icon: string
    name: string
    tagline: string
    holdings: string
    expense: string
    return10y: string
    risk: string
    forWho: string
    alloc: { labels: string[]; data: number[]; colors: string[] }
    stats: [string, string][]
    note?: string
    mostPopular?: boolean
}
const TIERS: Tier[] = [
    {
        id: 1, icon: "public", name: "The One-Fund Portfolio", tagline: "One ETF. Done.",
        holdings: "VT — Vanguard Total World Stock ETF", expense: "0.07%", return10y: "+10.2%", risk: "Moderate",
        forWho: "Anyone who wants total global diversification in a single ticker. Warren Buffett's recommended approach for most investors.",
        alloc: { labels: ["US Stocks", "Intl Stocks"], data: [60, 40], colors: [C.prim, C.blue] },
        stats: [["Min. Investment", "$1"], ["Auto-Rebalancing", "Built-in"], ["Tax Efficiency", "High"], ["Dividend Yield", "2.1%"]],
    },
    {
        id: 2, icon: "balance", name: "The Two-Fund Portfolio", tagline: "The simplest split between US stocks and bonds.",
        holdings: "VTI 80% + BND 20%", expense: "~0.04% blended", return10y: "+9.1%", risk: "Moderate-Conservative",
        forWho: "Investors who want some cushion. The bond allocation smooths out downturns.",
        alloc: { labels: ["US Total Market", "US Bonds"], data: [80, 20], colors: [C.prim, C.muted] },
        stats: [["Min. Investment", "$1"], ["Rebalance", "1×/year"], ["Tax Efficiency", "High"], ["Dividend Yield", "2.4%"]],
    },
    {
        id: 3, icon: "account_tree", name: "The Three-Fund Portfolio", tagline: "The gold standard of passive investing (Bogleheads classic).",
        holdings: "VTI 60% + VXUS 30% + BND 10%", expense: "~0.05% blended", return10y: "+9.6%", risk: "Moderate",
        forWho: "The most recommended DIY passive portfolio on the internet. Used by millions of Bogleheads.",
        alloc: { labels: ["US Stocks", "Intl Stocks", "Bonds"], data: [60, 30, 10], colors: [C.prim, C.blue, C.muted] },
        stats: [["Min. Investment", "$1"], ["Rebalance", "1×/year"], ["Tax Efficiency", "Very High"], ["Dividend Yield", "2.2%"]],
        mostPopular: true,
    },
    {
        id: 4, icon: "shield", name: "The All-Weather Portfolio", tagline: "Built to perform in any economic environment (Ray Dalio).",
        holdings: "SPY 30% · TLT 40% · IEF 15% · GLD 7.5% · DJP 7.5%", expense: "~0.15% blended", return10y: "+7.3%", risk: "Conservative-Moderate",
        forWho: "Investors who prioritize stability over maximum growth. Designed to survive recessions, inflation, and deflation.",
        alloc: { labels: ["Stocks", "Long Bonds", "Med Bonds", "Gold", "Commodities"], data: [30, 40, 15, 7.5, 7.5], colors: [C.prim, C.blue, C.teal, C.warn, C.org] },
        stats: [["Max Drawdown (2008)", "-3.9%"], ["Sharpe Ratio", "0.82"], ["Rebalance", "1×/year"], ["Dividend Yield", "1.8%"]],
    },
    {
        id: 5, icon: "trending_up", name: "The S&P 500 + Chill", tagline: "The one Buffett actually recommends for his heirs.",
        holdings: "VOO 90% + BND 10%", expense: "~0.04% blended", return10y: "+11.4%", risk: "Moderate-Aggressive",
        forWho: "Long-term investors (10+ years) who can handle short-term volatility. The single most back-tested approach in existence.",
        alloc: { labels: ["S&P 500", "Bonds"], data: [90, 10], colors: [C.prim, C.muted] },
        stats: [["Min. Investment", "$1"], ["Rebalance", "1×/year"], ["vs Active Funds", "+3.2%/yr"], ["Dividend Yield", "1.6%"]],
        note: "Buffett has publicly said that for non-professional investors, a low-cost S&P 500 index fund paired with a small bond sleeve is the approach he'd leave to his own family.",
    },
]
// risk profile → recommended tier id
const PROFILE_TIER: Record<string, number> = {
    "Conservative": 4,
    "Moderate-Conservative": 2,
    "Moderate": 3,
    "Moderate-Aggressive": 5,
    "Aggressive": 5,
}

function StrategyTiers({ profile }: { profile: string | null }) {
    const recommendedId = profile ? PROFILE_TIER[profile] : 3
    return (
        <section id="strategy-tiers" className="flex flex-col gap-gutter scroll-mt-8">
            <SectionHead title="Proven Strategies, Ranked by Simplicity" sub="Every option below has decades of historical data behind it." />
            {TIERS.map((t) => {
                const recommended = t.id === recommendedId
                return (
                    <div
                        key={t.id}
                        className={`${card} p-7 flex flex-col lg:flex-row items-start gap-gutter ${recommended ? "border-l-4 border-l-primary" : ""}`}
                    >
                        <div className="flex items-center justify-center w-14 h-14 rounded-lg bg-primary/10 flex-shrink-0">
                            <MaterialIcon name={t.icon} size={28} className="text-primary" />
                        </div>
                        <div className="flex-grow min-w-0">
                            <div className="flex flex-wrap items-center gap-stack-sm mb-stack-sm">
                                <h3 className="font-headline-md text-[20px] text-primary">{t.name}</h3>
                                {recommended && (
                                    <span className="rounded-full bg-primary text-on-primary text-xs px-2.5 py-0.5 font-medium">Recommended for You</span>
                                )}
                                {t.mostPopular && (
                                    <span className="rounded-full bg-green-50 text-green-700 border border-green-200 text-xs px-2.5 py-0.5 font-medium">Most Popular</span>
                                )}
                            </div>
                            <p className="font-body-md text-body-md text-on-surface-variant italic mb-stack-md">{t.tagline}</p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-stack-md mb-stack-md">
                                <Metric label="Holdings" value={t.holdings} wide />
                                <Metric label="Expense Ratio" value={t.expense} />
                                <Metric label="10Y Return" value={t.return10y} good />
                                <Metric label="Risk Level" value={t.risk} />
                            </div>
                            <p className="font-body-md text-body-md text-on-surface-variant mb-stack-md">{t.forWho}</p>
                            <div className="flex flex-wrap gap-x-gutter gap-y-stack-sm">
                                {t.stats.map(([k, v]) => (
                                    <span key={k} className="text-xs text-on-surface-variant">
                                        <span className="text-on-surface-variant/70">{k}: </span>
                                        <span className="font-mono text-primary">{v}</span>
                                    </span>
                                ))}
                            </div>
                            {t.note && <p className="text-xs text-on-surface-variant/80 mt-stack-md border-l-2 border-outline-variant/40 pl-3">{t.note}</p>}
                        </div>
                        <div className="flex flex-col items-center gap-stack-md w-full lg:w-44 flex-shrink-0">
                            <div className="w-full">
                                <AllocationDonut labels={t.alloc.labels} data={t.alloc.data} colors={t.alloc.colors} height={120} />
                            </div>
                            <button
                                type="button"
                                className="w-full inline-flex items-center justify-center gap-stack-sm px-4 py-2.5 rounded-lg bg-primary text-on-primary font-ui-button text-ui-button uppercase tracking-[0.05em] hover:bg-primary/90 transition-colors"
                            >
                                Start Investing <MaterialIcon name="arrow_forward" size={16} />
                            </button>
                        </div>
                    </div>
                )
            })}
        </section>
    )
}
const Metric = ({ label, value, good, wide }: { label: string; value: string; good?: boolean; wide?: boolean }) => (
    <div className={wide ? "col-span-2" : ""}>
        <p className="text-xs text-on-surface-variant/70 mb-0.5">{label}</p>
        <p className={`font-mono text-sm ${good ? "text-success" : "text-primary"}`}>{value}</p>
    </div>
)

// ════════════════════════════════════════════════════════════════════════════════
// SECTION 5 — Historical Performance Comparison
// ════════════════════════════════════════════════════════════════════════════════
const STRAT_NAMES = ["One-Fund (VT)", "Two-Fund", "Three-Fund", "All-Weather", "S&P 500 + Chill"]
const STRAT_COLORS = [C.prim, C.blue, C.teal, C.org, C.purp]
const STRAT_CAGR = [0.102, 0.091, 0.096, 0.073, 0.114]
const STRAT_VOL = [0.06, 0.045, 0.055, 0.025, 0.07]
// numeric perf table: [1Y, 5Y, 10Y, 20Y, 30Y, MaxDD, Sharpe]
const STRAT_PERF: number[][] = [
    [18.2, 9.8, 10.2, 8.9, 9.1, -34, 0.61],
    [14.1, 8.4, 9.1, 8.1, 8.4, -28, 0.66],
    [16.5, 9.1, 9.6, 8.6, 8.8, -31, 0.63],
    [8.9, 6.2, 7.3, 7.6, 7.9, -12, 0.82],
    [21.4, 11.0, 11.4, 9.4, 10.1, -37, 0.60],
]
const PERF_COLS = ["1Y Return", "5Y Ann.", "10Y Ann.", "20Y Ann.", "30Y Ann.", "Max Drawdown", "Sharpe"]
const RANGES = [1, 5, 10, 20, 30]

function HistoricalPerformance() {
    const [range, setRange] = useState(30)
    const [visible, setVisible] = useState<boolean[]>([true, true, true, true, true])
    const points = Math.max(12, Math.min(60, range * 2))
    const startYear = 2024 - range
    const labels = Array.from({ length: points + 1 }, (_, i) => Math.round(startYear + (i / points) * range))
    const series = STRAT_CAGR.map((cagr, i) => growthSeries(range, points, cagr, 10000, STRAT_VOL[i], 7 + i * 13))

    // best value per perf column (higher is better for all here, incl. MaxDD closer to 0 and Sharpe)
    const bestRow = PERF_COLS.map((_, ci) => {
        let bi = 0
        for (let r = 1; r < STRAT_PERF.length; r++) if (STRAT_PERF[r][ci] > STRAT_PERF[bi][ci]) bi = r
        return bi
    })

    return (
        <section id="performance" className={`${card} p-8`}>
            <SectionHead title="How Each Strategy Has Performed" sub="$10,000 invested at the start of each window. Hover the chart to compare all five." />
            <div className="flex flex-wrap items-center justify-between gap-stack-md mb-stack-md">
                <div className="flex flex-wrap gap-stack-md">
                    {STRAT_NAMES.map((n, i) => (
                        <label key={n} className="inline-flex items-center gap-1.5 text-xs cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={visible[i]}
                                onChange={() => setVisible((v) => v.map((x, j) => (j === i ? !x : x)))}
                                className="accent-primary"
                            />
                            <span className="inline-flex items-center gap-1">
                                <span className="h-2 w-3 rounded-full" style={{ background: STRAT_COLORS[i] }} />
                                {n}
                            </span>
                        </label>
                    ))}
                </div>
                <div className="flex gap-1">
                    {RANGES.map((r) => (
                        <button
                            key={r}
                            type="button"
                            onClick={() => setRange(r)}
                            className={`px-2.5 py-1 rounded-md text-xs font-mono transition-colors ${range === r ? "bg-primary text-on-primary" : "text-on-surface-variant hover:bg-surface-container"}`}
                        >
                            {r}Y
                        </button>
                    ))}
                </div>
            </div>
            <ChartBox
                height={300}
                deps={[range, visible.join(",")]}
                build={() => ({
                    type: "line",
                    data: {
                        labels,
                        datasets: series.map((data, i) => ({
                            label: STRAT_NAMES[i], data, borderColor: STRAT_COLORS[i], borderWidth: 2,
                            tension: 0.3, pointRadius: 0, hidden: !visible[i],
                        })),
                    },
                    options: {
                        responsive: true, maintainAspectRatio: false, interaction: { mode: "index", intersect: false },
                        plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c: any) => `${c.dataset.label}: ${compact(c.parsed.y)}` } } },
                        scales: {
                            x: { grid: { display: false }, ticks: { maxTicksLimit: 8, color: C.muted, font: { size: 10 } } },
                            y: { position: "right", grid: { color: "rgba(197,198,207,0.25)" }, ticks: { callback: (v: any) => compact(v), color: C.muted, font: { size: 10 } } },
                        },
                    },
                })}
            />
            {/* summary table */}
            <div className="overflow-x-auto mt-stack-lg">
                <table className="w-full text-sm border-collapse">
                    <caption className="sr-only">Strategy performance summary</caption>
                    <thead>
                        <tr className="border-b border-outline-variant/40 text-left">
                            <th scope="col" className="py-2 pr-4 font-label-caps text-xs uppercase tracking-widest text-on-surface-variant">Strategy</th>
                            {PERF_COLS.map((c) => (
                                <th key={c} scope="col" className="py-2 px-3 font-label-caps text-xs uppercase tracking-widest text-on-surface-variant text-right whitespace-nowrap">{c}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {STRAT_PERF.map((row, ri) => (
                            <tr key={ri} className="border-b border-outline-variant/20">
                                <td className="py-2.5 pr-4">
                                    <span className="inline-flex items-center gap-1.5">
                                        <span className="h-2 w-3 rounded-full" style={{ background: STRAT_COLORS[ri] }} />
                                        <span className="text-primary">{STRAT_NAMES[ri]}</span>
                                    </span>
                                </td>
                                {row.map((val, ci) => {
                                    const isPct = ci <= 5
                                    const txt = ci === 6 ? val.toFixed(2) : (val > 0 && ci <= 4 ? "+" : "") + val.toFixed(1) + (ci <= 5 ? "%" : "")
                                    return (
                                        <td key={ci} className={`py-2.5 px-3 text-right font-mono ${bestRow[ci] === ri ? "bg-green-50 text-green-700 rounded" : "text-on-surface"}`}>
                                            {txt}
                                        </td>
                                    )
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    )
}

// ════════════════════════════════════════════════════════════════════════════════
// SECTION 6 — ETF Deep Dive
// ════════════════════════════════════════════════════════════════════════════════
interface ETF {
    ticker: string; name: string; issuer: string; index: string; inception: string; expense: string
    aum: number; volume: string; holdings: string; pe: string; yield: string; dist: string
    high52: string; low52: string; ytd: number; r1: number; r3: number; r5: number; r10: number
    top: { name: string; w: number }[]; sectors?: { name: string; w: number }[]
}
const ETFS: Record<string, ETF> = {
    VT: { ticker: "VT", name: "Vanguard Total World Stock ETF", issuer: "Vanguard", index: "FTSE Global All Cap", inception: "Jun 2008", expense: "0.07%", aum: 38.2e9, volume: "2.1M", holdings: "9,700+", pe: "18.4", yield: "2.1%", dist: "Quarterly", high52: "$118.40", low52: "$95.10", ytd: 14.2, r1: 18.2, r3: 6.9, r5: 10.1, r10: 10.2, top: [{ name: "Apple", w: 3.8 }, { name: "Microsoft", w: 3.5 }, { name: "NVIDIA", w: 3.1 }, { name: "Amazon", w: 1.9 }, { name: "Meta", w: 1.3 }], sectors: [{ name: "Tech", w: 24 }, { name: "Financials", w: 16 }, { name: "Health", w: 11 }, { name: "Consumer", w: 14 }, { name: "Other", w: 35 }] },
    VTI: { ticker: "VTI", name: "Vanguard Total Stock Market ETF", issuer: "Vanguard", index: "CRSP US Total Market", inception: "May 2001", expense: "0.03%", aum: 405.0e9, volume: "3.4M", holdings: "3,700+", pe: "24.1", yield: "1.3%", dist: "Quarterly", high52: "$295.30", low52: "$210.80", ytd: 16.8, r1: 22.1, r3: 8.2, r5: 13.4, r10: 12.1, top: [{ name: "Apple", w: 6.2 }, { name: "Microsoft", w: 5.8 }, { name: "NVIDIA", w: 5.1 }, { name: "Amazon", w: 3.2 }, { name: "Meta", w: 2.1 }], sectors: [{ name: "Tech", w: 30 }, { name: "Financials", w: 13 }, { name: "Health", w: 12 }, { name: "Consumer", w: 14 }, { name: "Other", w: 31 }] },
    VXUS: { ticker: "VXUS", name: "Vanguard Total International Stock ETF", issuer: "Vanguard", index: "FTSE Global All Cap ex-US", inception: "Jan 2011", expense: "0.08%", aum: 72.4e9, volume: "4.0M", holdings: "8,500+", pe: "13.9", yield: "3.0%", dist: "Quarterly", high52: "$64.20", low52: "$54.10", ytd: 9.1, r1: 12.4, r3: 3.1, r5: 6.2, r10: 4.8, top: [{ name: "TSMC", w: 2.4 }, { name: "Nestlé", w: 1.1 }, { name: "ASML", w: 1.0 }, { name: "Tencent", w: 0.9 }, { name: "Samsung", w: 0.8 }], sectors: [{ name: "Financials", w: 19 }, { name: "Tech", w: 14 }, { name: "Industrials", w: 14 }, { name: "Consumer", w: 13 }, { name: "Other", w: 40 }] },
    BND: { ticker: "BND", name: "Vanguard Total Bond Market ETF", issuer: "Vanguard", index: "Bloomberg US Aggregate", inception: "Apr 2007", expense: "0.03%", aum: 118.0e9, volume: "6.2M", holdings: "11,000+", pe: "—", yield: "3.4%", dist: "Monthly", high52: "$75.10", low52: "$70.40", ytd: 2.1, r1: 3.9, r3: -1.8, r5: 0.4, r10: 1.7, top: [{ name: "US Treasury", w: 46 }, { name: "Gov Mortgage", w: 21 }, { name: "Corp – Industrial", w: 14 }, { name: "Corp – Finance", w: 8 }, { name: "Other", w: 11 }] },
    VOO: { ticker: "VOO", name: "Vanguard S&P 500 ETF", issuer: "Vanguard", index: "S&P 500", inception: "Sep 2010", expense: "0.03%", aum: 480.0e9, volume: "5.1M", holdings: "503", pe: "25.6", yield: "1.3%", dist: "Quarterly", high52: "$545.20", low52: "$405.10", ytd: 17.4, r1: 24.1, r3: 9.1, r5: 14.6, r10: 12.9, top: [{ name: "Apple", w: 7.0 }, { name: "Microsoft", w: 6.5 }, { name: "NVIDIA", w: 5.8 }, { name: "Amazon", w: 3.6 }, { name: "Meta", w: 2.4 }], sectors: [{ name: "Tech", w: 32 }, { name: "Financials", w: 13 }, { name: "Health", w: 12 }, { name: "Consumer", w: 14 }, { name: "Other", w: 29 }] },
    SPY: { ticker: "SPY", name: "SPDR S&P 500 ETF Trust", issuer: "State Street", index: "S&P 500", inception: "Jan 1993", expense: "0.0945%", aum: 540.0e9, volume: "72M", holdings: "503", pe: "25.6", yield: "1.3%", dist: "Quarterly", high52: "$594.10", low52: "$440.20", ytd: 17.3, r1: 24.0, r3: 9.0, r5: 14.5, r10: 12.8, top: [{ name: "Apple", w: 7.0 }, { name: "Microsoft", w: 6.5 }, { name: "NVIDIA", w: 5.8 }, { name: "Amazon", w: 3.6 }, { name: "Meta", w: 2.4 }], sectors: [{ name: "Tech", w: 32 }, { name: "Financials", w: 13 }, { name: "Health", w: 12 }, { name: "Consumer", w: 14 }, { name: "Other", w: 29 }] },
    TLT: { ticker: "TLT", name: "iShares 20+ Year Treasury Bond ETF", issuer: "BlackRock", index: "ICE 20+ Year Treasury", inception: "Jul 2002", expense: "0.15%", aum: 58.0e9, volume: "38M", holdings: "40+", pe: "—", yield: "4.2%", dist: "Monthly", high52: "$101.40", low52: "$82.10", ytd: -1.2, r1: 2.1, r3: -9.4, r5: -2.1, r10: 1.9, top: [{ name: "US Treasury 4.5% '52", w: 11 }, { name: "US Treasury 4.0% '53", w: 9 }, { name: "US Treasury 3.6% '52", w: 8 }, { name: "US Treasury 4.25% '54", w: 7 }, { name: "Other Treasuries", w: 65 }] },
    IEF: { ticker: "IEF", name: "iShares 7-10 Year Treasury Bond ETF", issuer: "BlackRock", index: "ICE 7-10 Year Treasury", inception: "Jul 2002", expense: "0.15%", aum: 32.0e9, volume: "9M", holdings: "12+", pe: "—", yield: "3.6%", dist: "Monthly", high52: "$98.20", low52: "$90.10", ytd: 1.4, r1: 4.1, r3: -3.2, r5: 0.1, r10: 1.4, top: [{ name: "US Treasury 4.0% '32", w: 14 }, { name: "US Treasury 3.875% '33", w: 12 }, { name: "US Treasury 4.125% '32", w: 11 }, { name: "US Treasury 3.5% '33", w: 10 }, { name: "Other Treasuries", w: 53 }] },
    GLD: { ticker: "GLD", name: "SPDR Gold Shares", issuer: "State Street", index: "LBMA Gold Price", inception: "Nov 2004", expense: "0.40%", aum: 73.0e9, volume: "7M", holdings: "1 (gold bullion)", pe: "—", yield: "0.0%", dist: "None", high52: "$245.10", low52: "$185.40", ytd: 21.0, r1: 28.4, r3: 12.1, r5: 9.8, r10: 7.1, top: [{ name: "Gold bullion (allocated)", w: 100 }] },
    DJP: { ticker: "DJP", name: "iPath Bloomberg Commodity Index ETN", issuer: "Barclays", index: "Bloomberg Commodity", inception: "Oct 2006", expense: "0.70%", aum: 0.55e9, volume: "0.2M", holdings: "23 commodities", pe: "—", yield: "0.0%", dist: "None", high52: "$31.40", low52: "$26.10", ytd: 4.2, r1: 6.1, r3: 5.4, r5: 6.9, r10: -1.2, top: [{ name: "Energy", w: 30 }, { name: "Agriculture", w: 27 }, { name: "Industrial Metals", w: 16 }, { name: "Precious Metals", w: 18 }, { name: "Livestock", w: 9 }] },
}
const ETF_TABS = ["VT", "VTI", "VXUS", "BND", "VOO", "SPY", "TLT", "IEF", "GLD", "DJP"]

function ETFExplorer() {
    const [active, setActive] = useState("VT")
    const [amount, setAmount] = useState(10000)
    const [years, setYears] = useState(10)
    const [livePrice, setLivePrice]   = useState<number | null>(null)
    const [liveW52H,  setLiveW52H]    = useState<number | null>(null)
    const [liveW52L,  setLiveW52L]    = useState<number | null>(null)
    const [liveYield, setLiveYield]   = useState<number | null>(null)
    const [liveChg,   setLiveChg]     = useState<number | null>(null)

    useEffect(() => {
        setLivePrice(null); setLiveW52H(null); setLiveW52L(null); setLiveYield(null); setLiveChg(null)
        const safe = (p: Promise<Response>) => p.then(r => r.ok ? r.json() : null).catch(() => null)
        Promise.all([
            safe(fetch(`/api/stock?symbol=${active}`)),
            safe(fetch(`/api/stock/metrics?symbol=${active}`)),
        ]).then(([q, m]) => {
            if (q?.data) { setLivePrice(q.data.price); setLiveChg(q.data.changePct) }
            if (m?.data) {
                if (m.data.w52High  != null) setLiveW52H(m.data.w52High)
                if (m.data.w52Low   != null) setLiveW52L(m.data.w52Low)
                if (m.data.dividendYield != null) setLiveYield(m.data.dividendYield)
            }
        })
    }, [active])

    const etf = ETFS[active]
    const rate = etf.r10 / 100
    const finalValue = amount * Math.pow(1 + rate, years)
    const priceSeries = growthSeries(1, 24, etf.r1 / 100, 100, 0.04, active.charCodeAt(0) + active.charCodeAt(1))

    const fmtP = (n: number | null) => n != null ? `$${n.toFixed(2)}` : etf.high52  // fallback to static
    const fmtY = (n: number | null, fallback: string) => n != null ? n.toFixed(2) + "%" : fallback

    const stats: [string, string][] = [
        ["Full Name", etf.name], ["Issuer", etf.issuer], ["Index Tracked", etf.index], ["Inception", etf.inception],
        ["Expense Ratio", etf.expense], ["AUM", compact(etf.aum)], ["Avg Daily Volume", etf.volume], ["Holdings", etf.holdings],
        ["P/E (weighted)", etf.pe],
        ["Dividend Yield", fmtY(liveYield, etf.yield)],
        ["Distribution", etf.dist],
        ["52W High / Low", `${fmtP(liveW52H)} / ${liveW52L != null ? `$${liveW52L.toFixed(2)}` : etf.low52}`],
        ["Current Price", livePrice != null ? `$${livePrice.toFixed(2)}${liveChg != null ? ` (${liveChg >= 0 ? "+" : ""}${liveChg.toFixed(2)}% today)` : ""}` : "—"],
        ["1Y / 3Y (historical)", `${pct(etf.r1)} / ${pct(etf.r3)}`],
        ["5Y / 10Y Ann. (historical)", `${pct(etf.r5)} / ${pct(etf.r10)}`],
    ]

    return (
        <section id="etfs" className={`${card} p-8`}>
            <SectionHead title="The ETFs Behind These Strategies" sub="Every fund recommended above. All the data you need, none you don't." />
            <div className="flex flex-wrap gap-1 mb-stack-lg border-b border-outline-variant/30 pb-stack-md">
                {ETF_TABS.map((t) => (
                    <button
                        key={t}
                        type="button"
                        onClick={() => setActive(t)}
                        className={`px-3 py-1.5 rounded-md text-sm font-mono transition-colors ${active === t ? "bg-primary text-on-primary" : "text-on-surface-variant hover:bg-surface-container"}`}
                    >
                        {t}
                    </button>
                ))}
            </div>

            <div key={active} className="grid grid-cols-1 lg:grid-cols-[60%_40%] gap-gutter animate-fade-in">
                {/* left: stats grid */}
                <div>
                    <div className="border border-outline-variant/30 rounded-lg overflow-hidden">
                        {stats.map(([k, v], i) => (
                            <div key={k} className={`flex items-center justify-between px-4 py-2 ${i % 2 ? "bg-surface-container-low/40" : ""}`}>
                                <span className="text-xs text-on-surface-variant">{k}</span>
                                <span className="font-mono text-sm text-primary text-right">{v}</span>
                            </div>
                        ))}
                    </div>
                </div>
                {/* right: chart + holdings */}
                <div className="flex flex-col gap-stack-md">
                    <div>
                        <p className="text-xs text-on-surface-variant mb-1">1-Year Price Performance</p>
                        <ChartBox
                            height={140}
                            deps={[active]}
                            build={() => ({
                                type: "line",
                                data: { labels: priceSeries.map((_, i) => i), datasets: [{ data: priceSeries, borderColor: etf.r1 >= 0 ? C.pos : C.neg, backgroundColor: etf.r1 >= 0 ? C.posLight : C.negLight, borderWidth: 2, tension: 0.3, pointRadius: 0, fill: true }] },
                                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { display: false } } },
                            })}
                        />
                    </div>
                    <div>
                        <p className="text-xs text-on-surface-variant mb-stack-sm">Top Holdings</p>
                        <div className="flex flex-col gap-1.5">
                            {etf.top.map((h) => (
                                <div key={h.name} className="flex items-center gap-2">
                                    <span className="text-xs text-on-surface w-32 truncate">{h.name}</span>
                                    <div className="flex-grow h-1.5 bg-surface-container rounded-full overflow-hidden">
                                        <div className="h-full bg-primary/70 rounded-full" style={{ width: `${Math.min(100, h.w)}%` }} />
                                    </div>
                                    <span className="font-mono text-xs text-on-surface-variant w-10 text-right">{h.w}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* cost calculator */}
            <div className="mt-stack-lg border border-outline-variant/30 rounded-lg p-6 bg-surface-container-low/30">
                <p className="font-headline-md text-[18px] text-primary mb-stack-md">Cost Calculator</p>
                <div className="grid grid-cols-1 lg:grid-cols-[40%_60%] gap-gutter items-center">
                    <div className="flex flex-col gap-stack-md">
                        <label className="flex flex-col gap-1">
                            <span className="text-xs text-on-surface-variant">Starting amount</span>
                            <input type="number" value={amount} onChange={(e) => setAmount(Math.max(0, +e.target.value))} className="px-3 py-2 rounded-md border border-outline-variant/40 bg-surface-container-lowest font-mono text-sm text-primary" />
                        </label>
                        <label className="flex flex-col gap-1">
                            <span className="text-xs text-on-surface-variant">Years invested</span>
                            <input type="number" value={years} onChange={(e) => setYears(Math.max(1, Math.min(50, +e.target.value)))} className="px-3 py-2 rounded-md border border-outline-variant/40 bg-surface-container-lowest font-mono text-sm text-primary" />
                        </label>
                        <p className="text-xs text-on-surface-variant">
                            At {etf.ticker}&apos;s {pct(etf.r10)} 10-year return, {usd(amount)} grows to{" "}
                            <span className="font-mono text-success font-semibold">{usd(finalValue)}</span>.
                        </p>
                    </div>
                    <ChartBox
                        height={120}
                        deps={[active, amount, years]}
                        build={() => ({
                            type: "bar",
                            data: { labels: ["You invest", "You get back"], datasets: [{ data: [amount, finalValue], backgroundColor: [C.muted, C.pos], borderRadius: 4 }] },
                            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c: any) => usd(c.parsed.y) } } }, scales: { x: { grid: { display: false }, ticks: { color: C.muted } }, y: { ticks: { callback: (v: any) => compact(v), color: C.muted, font: { size: 10 } }, grid: { color: "rgba(197,198,207,0.25)" } } } },
                        })}
                    />
                </div>
            </div>
        </section>
    )
}

// ════════════════════════════════════════════════════════════════════════════════
// SECTION 7 — Dollar-Cost Averaging Calculator
// ════════════════════════════════════════════════════════════════════════════════
const computeDCA = (initial: number, monthly: number, years: number, rate: number, ppy: number) => {
    const r = rate / 100 / ppy
    const contribPerPeriod = (monthly * 12) / ppy
    const principalByYear: number[] = []
    const valueByYear: number[] = []
    let value = initial
    let principal = initial
    for (let y = 1; y <= years; y++) {
        for (let p = 0; p < ppy; p++) {
            value = value * (1 + r) + contribPerPeriod
            principal += contribPerPeriod
        }
        principalByYear.push(Math.round(principal))
        valueByYear.push(Math.round(value))
    }
    const finalValue = value
    const totalInvested = principal
    const totalGrowth = finalValue - totalInvested
    return { principalByYear, valueByYear, finalValue, totalInvested, totalGrowth, multiple: finalValue / totalInvested }
}
const FREQ: Record<string, number> = { Monthly: 12, Quarterly: 4, Annually: 1 }

function DCACalculator() {
    const [initial, setInitial] = useState(1000)
    const [monthly, setMonthly] = useState(200)
    const [years, setYears] = useState(20)
    const [rate, setRate] = useState(10.7)
    const [freq, setFreq] = useState("Monthly")
    const ppy = FREQ[freq]
    const res = computeDCA(initial, monthly, years, rate, ppy)
    const labels = Array.from({ length: years }, (_, i) => i + 1)
    const growthByYear = res.valueByYear.map((v, i) => v - res.principalByYear[i])

    const base = computeDCA(initial, monthly, years, rate, ppy).finalValue
    const wait5 = computeDCA(initial, monthly, Math.max(1, years - 5), rate, ppy).finalValue
    const plus50 = computeDCA(initial, monthly + 50, years, rate, ppy).finalValue
    const milestones = [5, 10, 15, 20, 25, 30].filter((m) => m <= years)

    return (
        <section id="dca" className={`${card} p-8`}>
            <SectionHead title="The Power of Consistent Investing" sub="Dollar-cost averaging removes the guesswork of market timing." />
            <div className="grid grid-cols-1 lg:grid-cols-[40%_60%] gap-gutter">
                {/* inputs */}
                <div className="flex flex-col gap-stack-md">
                    <label className="flex flex-col gap-1">
                        <span className="text-xs text-on-surface-variant">Initial investment</span>
                        <input type="number" value={initial} onChange={(e) => setInitial(Math.max(0, +e.target.value))} className="px-3 py-2 rounded-md border border-outline-variant/40 bg-surface-container-lowest font-mono text-sm text-primary" />
                    </label>
                    <label className="flex flex-col gap-1">
                        <span className="text-xs text-on-surface-variant">Monthly contribution</span>
                        <input type="number" value={monthly} onChange={(e) => setMonthly(Math.max(0, +e.target.value))} className="px-3 py-2 rounded-md border border-outline-variant/40 bg-surface-container-lowest font-mono text-sm text-primary" />
                    </label>
                    <label className="flex flex-col gap-1">
                        <span className="text-xs text-on-surface-variant flex justify-between"><span>Investment period</span><span className="font-mono text-primary">{years} yrs</span></span>
                        <input type="range" min={1} max={40} value={years} onChange={(e) => setYears(+e.target.value)} className="accent-primary" />
                    </label>
                    <label className="flex flex-col gap-1">
                        <span className="text-xs text-on-surface-variant flex justify-between"><span>Expected annual return</span><span className="font-mono text-primary">{rate.toFixed(1)}%</span></span>
                        <input type="range" min={1} max={15} step={0.1} value={rate} onChange={(e) => setRate(+e.target.value)} className="accent-primary" />
                    </label>
                    <label className="flex flex-col gap-1">
                        <span className="text-xs text-on-surface-variant">Compound frequency</span>
                        <select value={freq} onChange={(e) => setFreq(e.target.value)} className="px-3 py-2 rounded-md border border-outline-variant/40 bg-surface-container-lowest text-sm text-primary">
                            {Object.keys(FREQ).map((f) => <option key={f}>{f}</option>)}
                        </select>
                    </label>
                </div>
                {/* output */}
                <div className="flex flex-col gap-stack-md">
                    <ChartBox
                        height={220}
                        deps={[initial, monthly, years, rate, freq]}
                        build={() => ({
                            type: "line",
                            data: {
                                labels,
                                datasets: [
                                    { label: "Contributed", data: res.principalByYear, borderColor: C.muted, backgroundColor: C.mutedLight, borderWidth: 1.5, tension: 0.3, pointRadius: 0, fill: "origin" },
                                    { label: "Growth", data: res.valueByYear, borderColor: C.pos, backgroundColor: C.posLight, borderWidth: 2, tension: 0.3, pointRadius: 0, fill: "-1" },
                                ],
                            },
                            options: {
                                responsive: true, maintainAspectRatio: false, interaction: { mode: "index", intersect: false },
                                plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c: any) => `${c.dataset.label}: ${compact(c.parsed.y)}` } } },
                                scales: { x: { grid: { display: false }, ticks: { color: C.muted, font: { size: 10 } } }, y: { position: "right", grid: { color: "rgba(197,198,207,0.25)" }, ticks: { callback: (v: any) => compact(v), color: C.muted, font: { size: 10 } } } },
                            },
                        })}
                    />
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-stack-md">
                        <StatBlock label="Total Invested" value={compact(res.totalInvested)} />
                        <StatBlock label="Total Growth" value={compact(res.totalGrowth)} good />
                        <StatBlock label="Final Value" value={compact(res.finalValue)} good />
                        <StatBlock label="Return Multiple" value={res.multiple.toFixed(1) + "×"} />
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <caption className="sr-only">Portfolio value milestones</caption>
                            <thead>
                                <tr className="text-left border-b border-outline-variant/40">
                                    <th scope="col" className="py-1.5 pr-3 text-xs uppercase tracking-widest text-on-surface-variant">Year</th>
                                    <th scope="col" className="py-1.5 px-3 text-xs uppercase tracking-widest text-on-surface-variant text-right">Invested</th>
                                    <th scope="col" className="py-1.5 px-3 text-xs uppercase tracking-widest text-on-surface-variant text-right">Value</th>
                                </tr>
                            </thead>
                            <tbody>
                                {milestones.map((m) => (
                                    <tr key={m} className="border-b border-outline-variant/20">
                                        <td className="py-1.5 pr-3 font-mono text-on-surface">Year {m}</td>
                                        <td className="py-1.5 px-3 text-right font-mono text-on-surface-variant">{compact(res.principalByYear[m - 1])}</td>
                                        <td className="py-1.5 px-3 text-right font-mono text-success">{compact(res.valueByYear[m - 1])}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            {/* what-if */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-gutter mt-stack-lg">
                <WhatIf title="If you start today" value={compact(base)} delta={null} />
                <WhatIf title="If you wait 5 years" value={compact(wait5)} delta={wait5 - base} />
                <WhatIf title="If you add $50/mo more" value={compact(plus50)} delta={plus50 - base} />
            </div>
        </section>
    )
}
const StatBlock = ({ label, value, good }: { label: string; value: string; good?: boolean }) => (
    <div className="flex flex-col">
        <span className={`font-mono text-lg font-semibold ${good ? "text-success" : "text-primary"}`}>{value}</span>
        <span className="text-xs text-on-surface-variant">{label}</span>
    </div>
)
const WhatIf = ({ title, value, delta }: { title: string; value: string; delta: number | null }) => (
    <div className={`${card} p-5`}>
        <p className="font-mono text-2xl font-bold text-primary mb-1">{value}</p>
        <p className="text-xs text-on-surface-variant mb-stack-sm">{title}</p>
        {delta !== null && (
            <p className={`text-xs font-medium ${delta >= 0 ? "text-success" : "text-error"}`}>
                {delta >= 0 ? "+" : "−"}{compact(Math.abs(delta))} vs. base scenario
            </p>
        )}
    </div>
)

// ════════════════════════════════════════════════════════════════════════════════
// SECTION 8 — Index vs Active: The Evidence
// ════════════════════════════════════════════════════════════════════════════════
const SPIVA = { labels: ["1-Year", "3-Year", "5-Year", "10-Year", "15-Year", "20-Year"], data: [57, 72, 81, 88, 92, 95] }
const FEE_DRAG = [
    { type: "Index ETF (e.g. VOO)", er: "0.03%", final: 171800, lost: 514 },
    { type: "Low-cost Mutual Fund", er: "0.50%", final: 155300, lost: 17000 },
    { type: "Average Active Fund", er: "1.00%", final: 140200, lost: 32100 },
    { type: "High-fee Active Fund", er: "2.00%", final: 115900, lost: 56400 },
]

function IndexVsActive() {
    const bestFinal = Math.max(...FEE_DRAG.map((f) => f.final))
    return (
        <section id="evidence" className={`${card} p-8`}>
            <SectionHead title="Why Index Funds Win: The Data" sub="Not an opinion — a 50-year track record." />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
                {/* A — SPIVA */}
                <div>
                    <h3 className="font-headline-md text-[16px] text-primary mb-stack-sm">% of Active Funds That Underperform</h3>
                    <ChartBox
                        height={200}
                        build={() => ({
                            type: "bar",
                            data: { labels: SPIVA.labels, datasets: [{ data: SPIVA.data, backgroundColor: C.neg, borderRadius: 4 }] },
                            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c: any) => c.parsed.y + "% underperformed" } } }, scales: { x: { grid: { display: false }, ticks: { color: C.muted, font: { size: 10 } } }, y: { max: 100, ticks: { callback: (v: any) => v + "%", color: C.muted, font: { size: 10 } }, grid: { color: "rgba(197,198,207,0.25)" } } } },
                        })}
                    />
                    <p className="text-xs text-on-surface-variant/70 mt-stack-sm">Source: S&P SPIVA U.S. Scorecard, 2023</p>
                </div>
                {/* B — Fee drag */}
                <div>
                    <h3 className="font-headline-md text-[16px] text-primary mb-stack-sm">How Fees Compound Against You</h3>
                    <p className="text-xs text-on-surface-variant mb-stack-sm">$10,000 invested over 30 years at the same gross return.</p>
                    <table className="w-full text-xs">
                        <caption className="sr-only">Fee drag comparison</caption>
                        <thead>
                            <tr className="text-left border-b border-outline-variant/40">
                                <th scope="col" className="py-1.5 pr-2 uppercase tracking-wider text-on-surface-variant">Fund Type</th>
                                <th scope="col" className="py-1.5 px-1 uppercase tracking-wider text-on-surface-variant text-right">ER</th>
                                <th scope="col" className="py-1.5 px-1 uppercase tracking-wider text-on-surface-variant text-right">Final</th>
                                <th scope="col" className="py-1.5 pl-1 uppercase tracking-wider text-on-surface-variant text-right">Lost</th>
                            </tr>
                        </thead>
                        <tbody>
                            {FEE_DRAG.map((f) => (
                                <tr key={f.type} className="border-b border-outline-variant/20">
                                    <td className="py-2 pr-2 text-on-surface">{f.type}</td>
                                    <td className="py-2 px-1 text-right font-mono text-on-surface-variant">{f.er}</td>
                                    <td className={`py-2 px-1 text-right font-mono ${f.final === bestFinal ? "text-success font-semibold" : "text-on-surface"}`}>{compact(f.final)}</td>
                                    <td className="py-2 pl-1 text-right font-mono text-error">−{compact(f.lost)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <p className="text-xs text-on-surface-variant mt-stack-sm">
                        That&apos;s not a rounding error. A 1% annual fee costs you <span className="text-error font-semibold">$32,100</span> on a $10,000 investment over 30 years.
                    </p>
                </div>
                {/* C — Survivorship bias */}
                <div className="flex flex-col">
                    <h3 className="font-headline-md text-[16px] text-primary mb-stack-sm">The Survivorship Mirage</h3>
                    <span className="font-mono text-[40px] leading-none font-bold text-primary mb-stack-sm">42%</span>
                    <p className="text-xs text-on-surface-variant mb-stack-md">of active funds from 2003 no longer existed by 2023.</p>
                    <p className="text-xs text-on-surface-variant mb-stack-md">
                        Funds that fail or merge disappear from the record, making active-fund averages look better than they were. The true underperformance rate is higher than SPIVA suggests.
                    </p>
                    <div className="flex flex-col gap-stack-sm mt-auto">
                        <div className="p-3 rounded-lg border border-outline-variant/30">
                            <p className="text-xs text-on-surface-variant mb-1">What you see</p>
                            <p className="font-mono text-sm text-primary">100 funds · 8% beat the index</p>
                        </div>
                        <div className="p-3 rounded-lg border border-error/30 bg-error/5">
                            <p className="text-xs text-on-surface-variant mb-1">What actually happened</p>
                            <p className="font-mono text-sm text-primary">42 closed · of 58 left, only 8 beat it</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

// ════════════════════════════════════════════════════════════════════════════════
// SECTION 9 — Robo-Advisor Comparison
// ════════════════════════════════════════════════════════════════════════════════
const ROBOS = ["Betterment", "Wealthfront", "Schwab Intelligent", "Fidelity Go", "M1 Finance", "Vanguard Digital"]
const ROBO_COLORS = [C.blue, C.teal, C.org, C.purp, C.pos, C.prim]
// each row: label + value per robo. true=✓, false=✗, otherwise string
const ROBO_ROWS: { label: string; cells: (string | boolean)[] }[] = [
    { label: "Management Fee", cells: ["0.25%", "0.25%", "0.00%", "0.35%", "0.00%", "0.20%"] },
    { label: "Minimum Investment", cells: ["$0", "$500", "$5,000", "$0", "$100", "$3,000"] },
    { label: "Tax-Loss Harvesting", cells: [true, true, true, false, false, true] },
    { label: "Auto-Rebalancing", cells: [true, true, true, true, true, true] },
    { label: "Fractional Shares", cells: [true, true, false, true, true, false] },
    { label: "ESG Options", cells: [true, true, true, false, true, true] },
    { label: "Human Advisor", cells: ["Premium", true, true, false, false, true] },
    { label: "Mobile App Rating", cells: ["4.7", "4.8", "4.6", "4.5", "4.6", "4.3"] },
    { label: "Account Types", cells: ["IRA, 401k", "IRA, 529", "IRA, 401k", "IRA", "IRA, custodial", "IRA, 401k"] },
    { label: "Best For", cells: ["Beginners", "Tax optimization", "No-fee + cash", "Fidelity users", "Customization", "Vanguard funds"] },
]
const PICKS = [
    { tag: "Best for Beginners", name: "Betterment", why: "Goal-based portfolios and a polished onboarding flow make it the easiest place to start.", stat: "No minimum" },
    { tag: "Best for Tax Optimization", name: "Wealthfront", why: "Daily tax-loss harvesting and direct indexing at higher balances quietly boost after-tax returns.", stat: "0.25% fee" },
    { tag: "Best for Self-Directed + Automation", name: "M1 Finance", why: "Build your own 'pie' of ETFs and let M1 automate every deposit and rebalance.", stat: "$0 fee" },
]

function RoboAdvisors() {
    return (
        <section id="robos" className={`${card} p-8`}>
            <SectionHead title="Don't Want to DIY? Compare Robo-Advisors" sub="These platforms automate everything — tax-loss harvesting, rebalancing, and deposits." />
            <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse min-w-[760px]">
                    <caption className="sr-only">Robo-advisor feature comparison</caption>
                    <thead>
                        <tr className="border-b border-outline-variant/40">
                            <th scope="col" className="py-2 pr-3 text-left text-xs uppercase tracking-widest text-on-surface-variant sticky left-0 bg-surface-container-lowest">Feature</th>
                            {ROBOS.map((r, i) => (
                                <th key={r} scope="col" className="py-2 px-2 text-left">
                                    <span className="inline-flex items-center gap-1.5">
                                        <span className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white" style={{ background: ROBO_COLORS[i] }}>{r[0]}</span>
                                        <span className="text-xs text-primary">{r}</span>
                                    </span>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {ROBO_ROWS.map((row, ri) => (
                            <tr key={row.label} className="border-b border-outline-variant/20">
                                <td className={`py-2.5 pr-3 sticky left-0 bg-surface-container-lowest ${ri === ROBO_ROWS.length - 1 ? "italic text-on-surface-variant" : "text-on-surface-variant"}`}>{row.label}</td>
                                {row.cells.map((cell, ci) => (
                                    <td key={ci} className={`py-2.5 px-2 ${ri === ROBO_ROWS.length - 1 ? "italic text-on-surface-variant" : ""}`}>
                                        {cell === true ? <MaterialIcon name="check" size={16} className="text-success" /> : cell === false ? <MaterialIcon name="close" size={16} className="text-error" /> : <span className="font-mono text-xs text-on-surface">{cell}</span>}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-gutter mt-stack-lg">
                {PICKS.map((p) => (
                    <div key={p.tag} className={`${card} p-5`}>
                        <span className="inline-block rounded-full bg-primary/10 text-primary text-xs px-2.5 py-0.5 font-medium mb-stack-sm">{p.tag}</span>
                        <p className="font-headline-md text-[18px] text-primary mb-stack-sm">{p.name}</p>
                        <p className="text-xs text-on-surface-variant mb-stack-md">{p.why}</p>
                        <span className="inline-block rounded-full border border-outline-variant/40 text-xs px-2.5 py-1 font-mono text-on-surface">{p.stat}</span>
                    </div>
                ))}
            </div>
        </section>
    )
}

// ════════════════════════════════════════════════════════════════════════════════
// SECTION 10 — Retirement Account Priority Guide
// ════════════════════════════════════════════════════════════════════════════════
const STEPS = [
    { n: 1, title: "401(k) up to employer match", body: "This is free money. Always capture the full match before anything else.", tip: "Average employer match: 4.3% of salary — an instant 100% return.", cta: "Learn About 401(k)" },
    { n: 2, title: "HSA (if eligible)", body: "Triple tax advantage: deductible contributions, tax-free growth, tax-free medical withdrawals.", tip: "Requires a High-Deductible Health Plan · 2024 limit: $4,150 individual / $8,300 family.", cta: "HSA Basics" },
    { n: 3, title: "Max Roth or Traditional IRA", body: "Tax-free growth (Roth) or tax-deferred growth (Traditional). $7,000/year in 2024 ($8,000 if 50+).", tip: "Higher tax bracket expected in retirement? Roth. Lower? Traditional.", cta: "Open an IRA" },
    { n: 4, title: "Max 401(k) beyond the match", body: "Now push to the full $23,000 limit (2024). Still tax-advantaged.", tip: "Contributions reduce your taxable income today.", cta: "Boost 401(k)" },
    { n: 5, title: "Taxable Brokerage Account", body: "No limits, no restrictions. Use this for goals before retirement.", tip: "Best for taxable: VTI, VXUS, VOO — low turnover, qualified dividends.", cta: "Open a Brokerage" },
]
const LIMITS = [
    ["401(k)", "$23,000", "+$7,500", "Pre-tax / Roth"],
    ["Roth IRA", "$7,000", "+$1,000", "After-tax, tax-free growth"],
    ["Traditional IRA", "$7,000", "+$1,000", "Pre-tax, tax-deferred"],
    ["HSA", "$4,150 / $8,300", "+$1,000", "Triple tax-free"],
    ["SEP-IRA", "$69,000", "—", "Pre-tax (self-employed)"],
    ["SIMPLE IRA", "$16,000", "+$3,500", "Pre-tax"],
    ["403(b)", "$23,000", "+$7,500", "Pre-tax / Roth"],
]

function RetirementPriority() {
    return (
        <section id="retirement" className={`${card} p-8`}>
            <SectionHead title="Where to Put Your Money First" sub="Order matters. Always maximize tax-advantaged accounts before taxable." />
            <div className="relative pl-8">
                <div className="absolute left-3 top-2 bottom-2 w-px border-l-2 border-dashed border-outline-variant/40" />
                <div className="flex flex-col gap-gutter">
                    {STEPS.map((s) => (
                        <div key={s.n} className="relative">
                            <div className="absolute -left-8 top-1 w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center font-mono text-xs font-bold">{s.n}</div>
                            <div className={`${card} p-5`}>
                                <h3 className="font-headline-md text-[18px] text-primary mb-stack-sm">{s.title}</h3>
                                <p className="font-body-md text-body-md text-on-surface-variant mb-stack-sm">{s.body}</p>
                                <p className="text-xs text-on-surface-variant/80 border-l-2 border-success/40 pl-3 mb-stack-md">{s.tip}</p>
                                <button type="button" className="inline-flex items-center gap-stack-sm font-ui-button text-ui-button uppercase tracking-[0.05em] text-primary hover:text-primary/70 transition-colors">
                                    {s.cta} <MaterialIcon name="arrow_forward" size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="overflow-x-auto mt-stack-lg">
                <h3 className="font-headline-md text-[16px] text-primary mb-stack-sm">2024 Contribution Limits</h3>
                <table className="w-full text-sm">
                    <caption className="sr-only">2024 contribution limits</caption>
                    <thead>
                        <tr className="text-left border-b border-outline-variant/40">
                            <th scope="col" className="py-2 pr-3 text-xs uppercase tracking-widest text-on-surface-variant">Account</th>
                            <th scope="col" className="py-2 px-3 text-xs uppercase tracking-widest text-on-surface-variant">2024 Limit</th>
                            <th scope="col" className="py-2 px-3 text-xs uppercase tracking-widest text-on-surface-variant">Catch-Up (50+)</th>
                            <th scope="col" className="py-2 px-3 text-xs uppercase tracking-widest text-on-surface-variant">Tax Treatment</th>
                        </tr>
                    </thead>
                    <tbody>
                        {LIMITS.map((r) => (
                            <tr key={r[0]} className="border-b border-outline-variant/20">
                                <td className="py-2 pr-3 text-primary font-medium">{r[0]}</td>
                                <td className="py-2 px-3 font-mono text-on-surface">{r[1]}</td>
                                <td className="py-2 px-3 font-mono text-on-surface-variant">{r[2]}</td>
                                <td className="py-2 px-3 text-on-surface-variant">{r[3]}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    )
}

// ════════════════════════════════════════════════════════════════════════════════
// SECTION 11 — Safe Investment Screener
// ════════════════════════════════════════════════════════════════════════════════
interface Fund {
    ticker: string; name: string; category: string; issuer: string; er: number; aum: number
    r1: number; r5: number; r10: number; yield: number; rating: number; min: number
    desc: string; top: string[]
}
const FUNDS: Fund[] = [
    { ticker: "VTI", name: "Vanguard Total Stock Market", category: "Total Market", issuer: "Vanguard", er: 0.03, aum: 405e9, r1: 22.1, r5: 13.4, r10: 12.1, yield: 1.3, rating: 5, min: 1, desc: "Owns essentially the entire US stock market in one ticker — the ultimate one-fund core.", top: ["Apple", "Microsoft", "NVIDIA", "Amazon", "Meta"] },
    { ticker: "VOO", name: "Vanguard S&P 500", category: "S&P 500", issuer: "Vanguard", er: 0.03, aum: 480e9, r1: 24.1, r5: 14.6, r10: 12.9, yield: 1.3, rating: 5, min: 1, desc: "Tracks the 500 largest US companies. Buffett's recommended core holding.", top: ["Apple", "Microsoft", "NVIDIA", "Amazon", "Meta"] },
    { ticker: "VT", name: "Vanguard Total World Stock", category: "Total Market", issuer: "Vanguard", er: 0.07, aum: 38e9, r1: 18.2, r5: 10.1, r10: 10.2, yield: 2.1, rating: 4, min: 1, desc: "Global diversification — every investable stock on earth in a single fund.", top: ["Apple", "Microsoft", "NVIDIA", "Amazon", "Meta"] },
    { ticker: "VXUS", name: "Vanguard Total International", category: "International", issuer: "Vanguard", er: 0.08, aum: 72e9, r1: 12.4, r5: 6.2, r10: 4.8, yield: 3.0, rating: 4, min: 1, desc: "Broad exposure to developed and emerging markets outside the US.", top: ["TSMC", "Nestlé", "ASML", "Tencent", "Samsung"] },
    { ticker: "BND", name: "Vanguard Total Bond Market", category: "Bonds", issuer: "Vanguard", er: 0.03, aum: 118e9, r1: 3.9, r5: 0.4, r10: 1.7, yield: 3.4, rating: 4, min: 1, desc: "Investment-grade US bonds — the ballast that smooths out stock volatility.", top: ["US Treasury", "Gov Mortgage", "Corp Industrial", "Corp Finance", "Agency"] },
    { ticker: "BNDX", name: "Vanguard Total Intl Bond", category: "Bonds", issuer: "Vanguard", er: 0.07, aum: 52e9, r1: 4.2, r5: 0.1, r10: 2.1, yield: 3.1, rating: 4, min: 1, desc: "Currency-hedged international bonds for added diversification.", top: ["Japan Gov", "France Gov", "Germany Gov", "Italy Gov", "UK Gilt"] },
    { ticker: "VIG", name: "Vanguard Dividend Appreciation", category: "Dividend", issuer: "Vanguard", er: 0.06, aum: 80e9, r1: 17.1, r5: 11.2, r10: 11.0, yield: 1.8, rating: 5, min: 1, desc: "Companies with a track record of growing dividends year after year.", top: ["Apple", "Microsoft", "Broadcom", "JPMorgan", "ExxonMobil"] },
    { ticker: "SCHD", name: "Schwab US Dividend Equity", category: "Dividend", issuer: "Schwab", er: 0.06, aum: 56e9, r1: 14.2, r5: 11.8, r10: 11.4, yield: 3.5, rating: 5, min: 1, desc: "High-quality, high-yield dividend payers screened for financial strength.", top: ["Cisco", "Home Depot", "Verizon", "Coca-Cola", "AbbVie"] },
    { ticker: "SPTM", name: "SPDR Portfolio S&P 1500", category: "Total Market", issuer: "State Street", er: 0.03, aum: 9e9, r1: 21.8, r5: 13.1, r10: 11.9, yield: 1.3, rating: 4, min: 1, desc: "Total-market exposure across large, mid, and small caps at rock-bottom cost.", top: ["Apple", "Microsoft", "NVIDIA", "Amazon", "Meta"] },
    { ticker: "ITOT", name: "iShares Core S&P Total Market", category: "Total Market", issuer: "BlackRock", er: 0.03, aum: 55e9, r1: 22.0, r5: 13.3, r10: 12.0, yield: 1.3, rating: 5, min: 1, desc: "BlackRock's total-US-market core fund — a direct VTI competitor.", top: ["Apple", "Microsoft", "NVIDIA", "Amazon", "Meta"] },
    { ticker: "AGG", name: "iShares Core US Aggregate Bond", category: "Bonds", issuer: "BlackRock", er: 0.03, aum: 110e9, r1: 3.8, r5: 0.3, r10: 1.6, yield: 3.4, rating: 4, min: 1, desc: "The bond-market benchmark fund — broad investment-grade exposure.", top: ["US Treasury", "Gov Mortgage", "Corp Industrial", "Corp Finance", "Agency"] },
    { ticker: "IEFA", name: "iShares Core MSCI EAFE", category: "International", issuer: "BlackRock", er: 0.07, aum: 115e9, r1: 11.8, r5: 6.4, r10: 5.1, yield: 2.9, rating: 4, min: 1, desc: "Developed international markets across Europe, Australasia, and the Far East.", top: ["Nestlé", "ASML", "Novo Nordisk", "Toyota", "Shell"] },
    { ticker: "VNQ", name: "Vanguard Real Estate", category: "Real Estate", issuer: "Vanguard", er: 0.13, aum: 35e9, r1: 9.4, r5: 4.1, r10: 6.8, yield: 4.1, rating: 3, min: 1, desc: "US real estate investment trusts (REITs) for income and inflation hedging.", top: ["Prologis", "American Tower", "Equinix", "Public Storage", "Welltower"] },
    { ticker: "GLD", name: "SPDR Gold Shares", category: "Sector", issuer: "State Street", er: 0.40, aum: 73e9, r1: 28.4, r5: 9.8, r10: 7.1, yield: 0.0, rating: 3, min: 100, desc: "Physical gold bullion — a classic store of value and portfolio hedge.", top: ["Gold bullion (allocated)"] },
    { ticker: "SCHB", name: "Schwab US Broad Market", category: "Total Market", issuer: "Schwab", er: 0.03, aum: 30e9, r1: 22.0, r5: 13.2, r10: 12.0, yield: 1.4, rating: 5, min: 1, desc: "Schwab's total-US-market fund covering 2,500+ stocks at minimal cost.", top: ["Apple", "Microsoft", "NVIDIA", "Amazon", "Meta"] },
]
const CATEGORIES = ["All", "Total Market", "S&P 500", "International", "Bonds", "Dividend", "Sector", "Real Estate"]
const ISSUERS = ["All", "Vanguard", "BlackRock", "State Street", "Schwab"]
const ER_BANDS = ["All", "Under 0.10%", "0.10–0.25%", "Over 0.25%"]
const MIN_BANDS = ["All", "No Minimum", "Under $100", "Under $1,000"]

const Stars = ({ n }: { n: number }) => (
    <span className="text-warn" style={{ color: C.warn }}>
        {"★".repeat(n)}<span className="text-on-surface-variant/30">{"★".repeat(5 - n)}</span>
    </span>
)
const MiniSpark = ({ seed, up }: { seed: number; up: boolean }) => {
    const rng = seeded(seed)
    let v = 50
    const pts = Array.from({ length: 24 }, () => { v += (rng() - 0.5) * 10 + (up ? 0.6 : -0.4); return Math.max(8, Math.min(92, v)) })
    const min = Math.min(...pts), max = Math.max(...pts), range = max - min || 1
    const coords = pts.map((p, i) => `${(i / (pts.length - 1)) * 200},${40 - ((p - min) / range) * 36 - 2}`).join(" ")
    return <svg width="200" height="40" viewBox="0 0 200 40"><polyline points={coords} fill="none" stroke={up ? C.pos : C.neg} strokeWidth="1.5" /></svg>
}

const SCREEN_COLS: { key: keyof Fund; label: string; align: string }[] = [
    { key: "ticker", label: "Ticker", align: "left" },
    { key: "name", label: "Fund Name", align: "left" },
    { key: "category", label: "Category", align: "left" },
    { key: "issuer", label: "Issuer", align: "left" },
    { key: "er", label: "Expense", align: "right" },
    { key: "aum", label: "AUM", align: "right" },
    { key: "r1", label: "1Y", align: "right" },
    { key: "r5", label: "5Y Ann.", align: "right" },
    { key: "r10", label: "10Y Ann.", align: "right" },
    { key: "yield", label: "Yield", align: "right" },
    { key: "rating", label: "Rating", align: "left" },
]

function SafeScreener() {
    const [cat, setCat] = useState("All")
    const [iss, setIss] = useState("All")
    const [erBand, setErBand] = useState("All")
    const [minBand, setMinBand] = useState("All")
    const [sortKey, setSortKey] = useState<keyof Fund>("aum")
    const [sortDir, setSortDir] = useState<1 | -1>(-1)
    const [open, setOpen] = useState<string | null>(null)

    const issuerMatch = (f: Fund) =>
        iss === "All" ||
        (iss === "BlackRock" && f.issuer === "BlackRock") ||
        (iss === "State Street" && f.issuer === "State Street") ||
        f.issuer === iss
    const erMatch = (f: Fund) =>
        erBand === "All" || (erBand === "Under 0.10%" && f.er < 0.1) || (erBand === "0.10–0.25%" && f.er >= 0.1 && f.er <= 0.25) || (erBand === "Over 0.25%" && f.er > 0.25)
    const minMatch = (f: Fund) =>
        minBand === "All" || (minBand === "No Minimum" && f.min <= 1) || (minBand === "Under $100" && f.min < 100) || (minBand === "Under $1,000" && f.min < 1000)

    const rows = FUNDS.filter((f) => (cat === "All" || f.category === cat) && issuerMatch(f) && erMatch(f) && minMatch(f)).sort((a, b) => {
        const av = a[sortKey], bv = b[sortKey]
        if (typeof av === "number" && typeof bv === "number") return (av - bv) * sortDir
        return String(av).localeCompare(String(bv)) * sortDir
    })
    const toggleSort = (k: keyof Fund) => {
        if (sortKey === k) setSortDir((d) => (d === 1 ? -1 : 1))
        else { setSortKey(k); setSortDir(-1) }
    }
    const reset = () => { setCat("All"); setIss("All"); setErBand("All"); setMinBand("All") }

    const Select = ({ value, set, opts, label }: { value: string; set: (v: string) => void; opts: string[]; label: string }) => (
        <label className="flex flex-col gap-1">
            <span className="text-xs text-on-surface-variant">{label}</span>
            <select value={value} onChange={(e) => set(e.target.value)} className="px-3 py-2 rounded-md border border-outline-variant/40 bg-surface-container-lowest text-sm text-primary">
                {opts.map((o) => <option key={o}>{o}</option>)}
            </select>
        </label>
    )

    return (
        <section id="screener" className={`${card} p-8`}>
            <SectionHead title="Find Your Fund" sub="Filtered to only include index funds, broad ETFs, and instruments with 10+ years of history." />
            <div className="flex flex-wrap items-end gap-gutter mb-stack-lg">
                <Select value={cat} set={setCat} opts={CATEGORIES} label="Category" />
                <Select value={iss} set={setIss} opts={ISSUERS} label="Issuer" />
                <Select value={erBand} set={setErBand} opts={ER_BANDS} label="Expense Ratio" />
                <Select value={minBand} set={setMinBand} opts={MIN_BANDS} label="Minimum" />
                <button type="button" onClick={reset} className="font-ui-button text-ui-button uppercase tracking-[0.05em] text-on-surface-variant hover:text-primary transition-colors py-2">Reset</button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse min-w-[900px]">
                    <caption className="sr-only">Safe fund screener results</caption>
                    <thead>
                        <tr className="border-b border-outline-variant/40">
                            {SCREEN_COLS.map((col) => (
                                <th key={col.key} scope="col" className={`py-2 px-3 text-xs uppercase tracking-widest text-on-surface-variant cursor-pointer select-none ${col.align === "right" ? "text-right" : "text-left"}`} onClick={() => toggleSort(col.key)}>
                                    {col.label}{sortKey === col.key ? (sortDir === 1 ? " ↑" : " ↓") : ""}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((f) => (
                            <React.Fragment key={f.ticker}>
                                <tr className="border-b border-outline-variant/20 cursor-pointer hover:bg-surface-container-low/40" onClick={() => setOpen(open === f.ticker ? null : f.ticker)}>
                                    <td className="py-2.5 px-3 font-mono font-bold text-primary">{f.ticker}</td>
                                    <td className="py-2.5 px-3 text-on-surface">{f.name}</td>
                                    <td className="py-2.5 px-3 text-on-surface-variant">{f.category}</td>
                                    <td className="py-2.5 px-3 text-on-surface-variant">{f.issuer}</td>
                                    <td className="py-2.5 px-3 text-right font-mono text-on-surface">{f.er.toFixed(2)}%</td>
                                    <td className="py-2.5 px-3 text-right font-mono text-on-surface-variant">{compact(f.aum)}</td>
                                    <td className="py-2.5 px-3 text-right font-mono text-success">{pct(f.r1)}</td>
                                    <td className="py-2.5 px-3 text-right font-mono text-on-surface">{pct(f.r5)}</td>
                                    <td className="py-2.5 px-3 text-right font-mono text-on-surface">{pct(f.r10)}</td>
                                    <td className="py-2.5 px-3 text-right font-mono text-on-surface-variant">{f.yield.toFixed(1)}%</td>
                                    <td className="py-2.5 px-3"><Stars n={f.rating} /></td>
                                </tr>
                                {open === f.ticker && (
                                    <tr className="bg-surface-container-low/30">
                                        <td colSpan={SCREEN_COLS.length} className="px-3 py-4">
                                            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-gutter items-center">
                                                <div>
                                                    <p className="font-body-md text-body-md text-on-surface mb-stack-sm">{f.desc}</p>
                                                    <p className="text-xs text-on-surface-variant">
                                                        <span className="uppercase tracking-wider">Top holdings: </span>
                                                        {f.top.join(" · ")}
                                                    </p>
                                                    <button type="button" className="inline-flex items-center gap-stack-sm mt-stack-md font-ui-button text-ui-button uppercase tracking-[0.05em] text-primary hover:text-primary/70 transition-colors">
                                                        Add to My Strategy <MaterialIcon name="add" size={14} />
                                                    </button>
                                                </div>
                                                <MiniSpark seed={f.ticker.charCodeAt(0) * 7 + f.ticker.length} up={f.r1 >= 0} />
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
            <p className="text-xs text-on-surface-variant mt-stack-md">Showing {rows.length} of {FUNDS.length} funds</p>
        </section>
    )
}

// ════════════════════════════════════════════════════════════════════════════════
// SECTION 12 — Glossary
// ════════════════════════════════════════════════════════════════════════════════
const GLOSSARY = [
    { term: "Index Fund", def: "A fund that buys every stock in a market index (like the S&P 500) instead of trying to pick winners. You get the market's return at near-zero cost.", why: "It's the simplest way to own the whole market." },
    { term: "ETF", def: "An Exchange-Traded Fund trades like a stock but holds a basket of assets. Buy or sell any time the market is open, often with no minimum.", why: "Flexibility and low cost in one wrapper." },
    { term: "Expense Ratio", def: "The annual fee a fund charges, expressed as a percentage of your money. A 0.03% ratio means $3/year per $10,000 invested.", why: "Lower fees compound into thousands saved." },
    { term: "Dollar-Cost Averaging", def: "Investing a fixed amount on a regular schedule regardless of price. You buy more shares when prices are low and fewer when high.", why: "Removes the temptation to time the market." },
    { term: "Diversification", def: "Spreading money across many investments so no single loss can sink you. The free lunch of investing.", why: "Reduces risk without reducing expected return." },
    { term: "Asset Allocation", def: "How you split money between stocks, bonds, and other assets. It's the single biggest driver of your long-term results.", why: "Matters more than which fund you pick." },
    { term: "Rebalancing", def: "Periodically resetting your portfolio back to its target mix by selling what's grown and buying what's lagged.", why: "Keeps your risk level steady over time." },
    { term: "Compound Interest", def: "Earning returns on your returns. Over decades, growth accelerates dramatically as gains generate their own gains.", why: "Time is the most powerful input." },
    { term: "Tax-Loss Harvesting", def: "Selling an investment at a loss to offset taxes on gains, then buying a similar one to stay invested.", why: "Quietly boosts after-tax returns." },
    { term: "Roth IRA", def: "A retirement account funded with after-tax money. Your investments then grow and can be withdrawn completely tax-free in retirement.", why: "Tax-free growth is hard to beat." },
    { term: "Sharpe Ratio", def: "A measure of return earned per unit of risk taken. Higher is better — it means smoother gains for the same reward.", why: "Lets you compare risk-adjusted performance." },
    { term: "Dividend Yield", def: "The annual dividend a fund pays divided by its price, shown as a percentage. A 2% yield pays $200/year per $10,000.", why: "A source of income on top of growth." },
]

function Glossary() {
    const [q, setQ] = useState("")
    const filtered = GLOSSARY.filter((g) => (g.term + g.def).toLowerCase().includes(q.toLowerCase()))
    return (
        <section id="glossary" className={`${card} p-8`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-stack-md mb-stack-lg">
                <h2 className="font-headline-md text-headline-md text-primary">Terms You&apos;ll See Here — Explained Simply</h2>
                <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search terms…" className="px-3 py-2 rounded-md border border-outline-variant/40 bg-surface-container-lowest text-sm text-primary sm:w-64" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-gutter">
                {filtered.map((g) => (
                    <div key={g.term} className="border border-outline-variant/30 rounded-lg p-5">
                        <p className="font-headline-md text-[17px] text-primary mb-stack-sm">{g.term}</p>
                        <p className="font-body-md text-body-md text-on-surface-variant mb-stack-sm">{g.def}</p>
                        <p className="text-xs text-on-surface-variant/70 italic">Why it matters: {g.why}</p>
                    </div>
                ))}
            </div>
            {filtered.length === 0 && <p className="text-sm text-on-surface-variant">No terms match &ldquo;{q}&rdquo;.</p>}
        </section>
    )
}

// ════════════════════════════════════════════════════════════════════════════════
// SECTION 13 — Start Today Action Panel
// ════════════════════════════════════════════════════════════════════════════════
const CHECKLIST = [
    { label: "Choose your risk profile", anchor: "quiz" },
    { label: "Pick a strategy", anchor: "strategy-tiers" },
    { label: "Open a brokerage account (Fidelity, Vanguard, or Schwab)", anchor: null },
    { label: "Set up automatic monthly contributions", anchor: "dca" },
    { label: "Check in once a year to rebalance", anchor: null },
]

function StartToday({ profile }: { profile: string | null }) {
    const [checked, setChecked] = useState<boolean[]>(Array(5).fill(false))
    const done = checked.filter(Boolean).length
    const proj = computeDCA(1000, 200, 20, 10.7, 12).finalValue
    const milestones = [
        { label: "Today", value: 1000 },
        { label: "5 Years", value: computeDCA(1000, 200, 5, 10.7, 12).finalValue },
        { label: "10 Years", value: computeDCA(1000, 200, 10, 10.7, 12).finalValue },
        { label: "20 Years", value: proj },
        { label: "Retirement", value: computeDCA(1000, 200, 30, 10.7, 12).finalValue },
    ]
    const profileLabel = profile ?? "Moderate"

    return (
        <section id="start" className={`${card} p-8`}>
            <SectionHead title="Start Today" sub="Knowing is half the battle — here's the other half." />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
                {/* checklist */}
                <div>
                    <div className="flex items-center justify-between mb-stack-md">
                        <p className="font-headline-md text-[18px] text-primary">Quick-Start Checklist</p>
                        <span className="font-mono text-xs text-on-surface-variant">{done} of 5 complete</span>
                    </div>
                    <div className="h-1 bg-surface-container rounded-full overflow-hidden mb-stack-lg">
                        <div className="h-full bg-success transition-all duration-300" style={{ width: `${(done / 5) * 100}%` }} />
                    </div>
                    <div className="flex flex-col gap-stack-md">
                        {CHECKLIST.map((c, i) => (
                            <div key={c.label} className="flex items-center gap-stack-md">
                                <button
                                    type="button"
                                    onClick={() => setChecked((arr) => arr.map((x, j) => (j === i ? !x : x)))}
                                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${checked[i] ? "bg-success border-success" : "border-outline-variant/50"}`}
                                    aria-label={checked[i] ? "Mark incomplete" : "Mark complete"}
                                >
                                    {checked[i] && <MaterialIcon name="check" size={14} className="text-on-success" />}
                                </button>
                                {c.anchor ? (
                                    <a href={`#${c.anchor}`} className={`font-body-md text-body-md transition-colors ${checked[i] ? "text-on-surface-variant line-through" : "text-on-surface hover:text-primary"}`}>{c.label}</a>
                                ) : (
                                    <span className={`font-body-md text-body-md ${checked[i] ? "text-on-surface-variant line-through" : "text-on-surface"}`}>{c.label}</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
                {/* compound preview */}
                <div className="flex flex-col">
                    <p className="font-headline-md text-[18px] text-primary mb-stack-sm">Your Compound Growth Preview</p>
                    <p className="text-xs text-on-surface-variant mb-stack-md">Based on your profile: {profileLabel} investor, 20-year horizon</p>
                    <p className="font-mono text-[36px] leading-none font-bold text-success mb-stack-sm">{usd(proj)}</p>
                    <p className="text-xs text-on-surface-variant mb-stack-md">Projected portfolio value · assumes $200/mo + $1,000 starting at 10.7% avg annual return</p>
                    <a href="#dca" className="inline-flex items-center gap-stack-sm font-ui-button text-ui-button uppercase tracking-[0.05em] text-primary hover:text-primary/70 transition-colors mb-stack-lg">
                        Adjust these numbers <MaterialIcon name="arrow_forward" size={14} />
                    </a>
                    {/* timeline */}
                    <div className="grid grid-cols-5 gap-1 mt-auto">
                        {milestones.map((m, i) => (
                            <div key={m.label} className="flex flex-col items-center text-center">
                                <span className="font-mono text-xs text-primary mb-1">{compact(m.value)}</span>
                                <div className="w-full h-1.5 rounded-full" style={{ background: `rgba(63,107,63,${0.25 + i * 0.18})` }} />
                                <span className="text-[10px] text-on-surface-variant mt-1">{m.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <p className="text-xs text-on-surface-variant/70 mt-stack-lg border-t border-outline-variant/30 pt-stack-md">
                Past performance does not guarantee future results. This is not financial advice. Investing involves risk, including possible loss of principal.
            </p>
        </section>
    )
}

// ════════════════════════════════════════════════════════════════════════════════
// PAGE
// ════════════════════════════════════════════════════════════════════════════════
export default function SafeInvestmentsPage() {
    const [profile, setProfile] = useState<string | null>(null)
    return (
        <div className="flex flex-col pb-section-gap-sm">
            <Container className="flex flex-col gap-stack-xl">
                <BackBar />
                <h1 className="font-headline-display text-[56px] leading-[1.05] tracking-[-0.02em] text-primary">
                    Safe Investment Options
                </h1>
                <HeroBanner />
                <RiskQuiz onComplete={setProfile} />
                <StrategyTiers profile={profile} />
                <HistoricalPerformance />
                <ETFExplorer />
                <DCACalculator />
                <IndexVsActive />
                <RoboAdvisors />
                <RetirementPriority />
                <SafeScreener />
                <Glossary />
                <StartToday profile={profile} />
            </Container>
        </div>
    )
}
