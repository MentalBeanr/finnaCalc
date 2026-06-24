/**
 * GET /api/markets/fear-greed
 * Returns a composite Fear & Greed score (0–100) built from four real-market signals:
 *   1. Market Momentum — SPY vs its 125-day SMA
 *   2. Market Volatility — VIX level (or realized vol if VIX unavailable)
 *   3. Safe Haven Demand — SPY 20-day return vs TLT 20-day return
 *   4. Junk Bond Demand — HYG 20-day return vs TLT 20-day return
 */
import { NextResponse } from "next/server"
import { getQuote, getCandles } from "@/lib/markets/finnhub"

const now = () => Math.floor(Date.now() / 1000)
const daysAgo = (d: number) => now() - d * 86_400

function clamp01(x: number) { return Math.max(0, Math.min(100, x)) }

function color(s: number) {
    return s >= 75 ? "#3f6b3f"
         : s >= 55 ? "#78a56d"
         : s >= 45 ? "#b45309"
         : s >= 25 ? "#e06c00"
                   : "#ba1a1a"
}
function label(s: number) {
    return s >= 75 ? "Extreme Greed"
         : s >= 55 ? "Greed"
         : s >= 45 ? "Neutral"
         : s >= 25 ? "Fear"
                   : "Extreme Fear"
}

function sma(arr: number[], n: number) {
    const slice = arr.slice(-n)
    return slice.reduce((a, b) => a + b, 0) / slice.length
}

function ret20(arr: number[]) {
    if (arr.length < 20) return null
    const last = arr.at(-1)!
    const prev = arr.at(-20)!
    return ((last - prev) / prev) * 100
}

export async function GET() {
    try {
        const [spyRes, tltRes, hygRes, vixRes] = await Promise.allSettled([
            getCandles("SPY", daysAgo(200), now()),
            getCandles("TLT", daysAgo(60),  now()),
            getCandles("HYG", daysAgo(60),  now()),
            getQuote("^VIX"),
        ])

        const spy = spyRes.status === "fulfilled" && spyRes.value.s === "ok" ? spyRes.value.c : []
        const tlt = tltRes.status === "fulfilled" && tltRes.value.s === "ok" ? tltRes.value.c : []
        const hyg = hygRes.status === "fulfilled" && hygRes.value.s === "ok" ? hygRes.value.c : []
        const vix = vixRes.status === "fulfilled" ? (vixRes.value?.c ?? null) : null

        // ── 1. Market Momentum ────────────────────────────────────────────────
        let momentum = 50
        if (spy.length >= 30) {
            const ma125 = sma(spy, Math.min(125, spy.length))
            const ratio = spy.at(-1)! / ma125
            // ratio=1.15+ → ~100, ratio=0.85- → 0; linear between 0.85–1.15
            momentum = clamp01((ratio - 0.85) / 0.30 * 100)
        }

        // ── 2. Market Volatility ──────────────────────────────────────────────
        let volatility = 50
        if (vix != null) {
            // VIX 10 → 100 (extreme greed), VIX 35 → 0 (extreme fear); linear
            volatility = clamp01((35 - vix) / 25 * 100)
        } else if (spy.length >= 21) {
            // Fallback: 20-day annualized realized vol
            const rets = spy.slice(-21).map((v, i, a) => i === 0 ? 0 : (v - a[i - 1]) / a[i - 1]).slice(1)
            const mean = rets.reduce((a, b) => a + b, 0) / rets.length
            const sd   = Math.sqrt(rets.reduce((a, b) => a + (b - mean) ** 2, 0) / rets.length)
            const annVol = sd * Math.sqrt(252) * 100
            volatility = clamp01((35 - annVol) / 25 * 100)
        }

        // ── 3. Safe Haven Demand ─────────────────────────────────────────────
        let safeHaven = 50
        const spyRet = ret20(spy)
        const tltRet = ret20(tlt)
        if (spyRet != null && tltRet != null) {
            // SPY outperforming TLT → greed; TLT outperforming → fear
            // Typical range ±15 pp; map to 0–100
            const diff = spyRet - tltRet
            safeHaven = clamp01((diff + 15) / 30 * 100)
        }

        // ── 4. Junk Bond Demand ───────────────────────────────────────────────
        let junkBond = 50
        const hygRet = ret20(hyg)
        if (hygRet != null && tltRet != null) {
            // HYG outperforming TLT → risk-on (greed); typical spread ±10 pp
            const diff = hygRet - tltRet
            junkBond = clamp01((diff + 10) / 20 * 100)
        }

        const scores = [momentum, volatility, safeHaven, junkBond]
        const composite = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)

        return NextResponse.json({
            data: {
                score:   composite,
                label:   label(composite),
                color:   color(composite),
                vix:     vix != null ? +vix.toFixed(2) : null,
                factors: [
                    { name: "Momentum",          score: Math.round(momentum),   color: color(momentum) },
                    { name: "Volatility (VIX)",  score: Math.round(volatility), color: color(volatility) },
                    { name: "Safe Haven Demand", score: Math.round(safeHaven),  color: color(safeHaven) },
                    { name: "Junk Bond Demand",  score: Math.round(junkBond),   color: color(junkBond) },
                ],
            },
        }, { headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800" } })
    } catch (err) {
        return NextResponse.json({ error: err instanceof Error ? err.message : "error" }, { status: 502 })
    }
}
