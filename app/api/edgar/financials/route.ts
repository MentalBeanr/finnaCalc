/**
 * GET /api/edgar/financials?ticker=AAPL
 * Returns the last 5 fiscal years of income statement, balance sheet,
 * and cash flow data from SEC EDGAR XBRL company facts (free, no API key).
 * Values are in raw USD — client divides by 1e9 for billions display.
 */
import { NextRequest, NextResponse } from "next/server"

const TICKER_MAP = "https://www.sec.gov/files/company_tickers.json"
const EDGAR_FACTS = "https://data.sec.gov/api/xbrl/companyfacts"
const UA = "finnaCalc/1.0 (contact@finnacalc.com)"

// In-memory CIK cache, refreshed every 24 h (module scope = lives for process lifetime)
let cikMap: Record<string, number> = {}
let cikLoaded = 0

async function loadCikMap() {
    if (Date.now() - cikLoaded < 86_400_000 && Object.keys(cikMap).length) return
    const res = await fetch(TICKER_MAP, { headers: { "User-Agent": UA }, next: { revalidate: 86400 } })
    if (!res.ok) return
    const data = await res.json() as Record<string, { cik_str: number; ticker: string }>
    cikMap = {}
    for (const entry of Object.values(data)) {
        cikMap[entry.ticker.toUpperCase()] = entry.cik_str
    }
    cikLoaded = Date.now()
}

/** Extract annual 10-K FY values for a us-gaap concept, newest first, deduplicated. */
function annual(facts: Record<string, unknown>, concept: string, limit = 5) {
    const gaap = (facts.facts as Record<string, unknown>)?.["us-gaap"] as Record<string, unknown>
    const usd = (gaap?.[concept] as { units?: { USD?: unknown[] } })?.units?.USD
    if (!Array.isArray(usd)) return []

    const seen = new Map<string, { end: string; val: number; filed: string }>()
    for (const d of usd as { form: string; fp: string; end: string; val: number; filed: string }[]) {
        if (d.form !== "10-K" || d.fp !== "FY") continue
        const existing = seen.get(d.end)
        if (!existing || d.filed > existing.filed) seen.set(d.end, d)
    }

    return Array.from(seen.values())
        .sort((a, b) => b.end.localeCompare(a.end))
        .slice(0, limit)
        .reverse()
        .map(d => ({ label: `FY${new Date(d.end).getFullYear()}`, val: d.val }))
}

/** Try concept names in order until one has data. */
function pick(facts: Record<string, unknown>, names: string[], limit = 5) {
    for (const n of names) {
        const r = annual(facts, n, limit)
        if (r.length) return r
    }
    return []
}

/** Align a series to a label axis; missing years → null. */
function align(
    series: { label: string; val: number }[],
    labels: string[]
): (number | null)[] {
    const map = new Map(series.map(d => [d.label, d.val]))
    return labels.map(l => map.get(l) ?? null)
}

export async function GET(req: NextRequest) {
    const ticker = req.nextUrl.searchParams.get("ticker")?.trim().toUpperCase()
    if (!ticker) return NextResponse.json({ error: "ticker required" }, { status: 400 })

    try {
        await loadCikMap()
        const cik = cikMap[ticker]
        if (!cik) return NextResponse.json({ error: `Unknown ticker: ${ticker}` }, { status: 404 })

        const cikPad = String(cik).padStart(10, "0")
        const res = await fetch(`${EDGAR_FACTS}/CIK${cikPad}.json`, {
            headers: { "User-Agent": UA },
            next: { revalidate: 3600 },
        })
        if (!res.ok) return NextResponse.json({ error: `EDGAR ${res.status}` }, { status: 502 })
        const facts = await res.json()

        // Income Statement
        const revenue    = pick(facts, ["RevenueFromContractWithCustomerExcludingAssessedTax", "Revenues", "SalesRevenueNet", "RevenueFromContractWithCustomerIncludingAssessedTax"])
        const grossProfit = pick(facts, ["GrossProfit"])
        const opIncome   = pick(facts, ["OperatingIncomeLoss"])
        const netIncome  = pick(facts, ["NetIncomeLoss", "ProfitLoss", "IncomeLossFromContinuingOperations"])
        const eps        = annual(facts, "EarningsPerShareBasic")
        const rnd        = pick(facts, ["ResearchAndDevelopmentExpense"])
        const sga        = pick(facts, ["SellingGeneralAndAdministrativeExpense"])

        // Balance Sheet
        const assets     = pick(facts, ["Assets"])
        const liabilities = pick(facts, ["Liabilities"])
        const equity     = pick(facts, ["StockholdersEquity", "StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest"])
        const cash       = pick(facts, ["CashAndCashEquivalentsAtCarryingValue", "CashCashEquivalentsAndShortTermInvestments"])
        const ltDebt     = pick(facts, ["LongTermDebt", "LongTermDebtNoncurrent"])

        // Cash Flow
        const cfo   = pick(facts, ["NetCashProvidedByUsedInOperatingActivities"])
        const cfi   = pick(facts, ["NetCashProvidedByUsedInInvestingActivities"])
        const cff   = pick(facts, ["NetCashProvidedByUsedInFinancingActivities"])
        const capex = pick(facts, ["PaymentsToAcquirePropertyPlantAndEquipment", "CapitalExpenditureDiscontinuedOperations"])

        // Build axis from the richest series
        const axisSrc = [revenue, netIncome, assets, cfo].reduce(
            (best, s) => s.length > best.length ? s : best, []
        )
        const labels = axisSrc.map(d => d.label)

        return NextResponse.json({
            data: {
                ticker, cik, years: labels,
                income: {
                    revenue:    align(revenue,    labels),
                    grossProfit: align(grossProfit, labels),
                    opIncome:   align(opIncome,   labels),
                    netIncome:  align(netIncome,  labels),
                    eps:        align(eps,        labels),
                    rnd:        align(rnd,        labels),
                    sga:        align(sga,        labels),
                },
                balance: {
                    assets:      align(assets,      labels),
                    liabilities: align(liabilities, labels),
                    equity:      align(equity,      labels),
                    cash:        align(cash,        labels),
                    longTermDebt: align(ltDebt,    labels),
                },
                cashflow: {
                    cfo:   align(cfo,   labels),
                    cfi:   align(cfi,   labels),
                    cff:   align(cff,   labels),
                    capex: align(capex, labels),
                },
            },
        }, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200" } })
    } catch (err) {
        return NextResponse.json({ error: err instanceof Error ? err.message : "EDGAR error" }, { status: 502 })
    }
}
