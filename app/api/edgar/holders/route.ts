/**
 * GET /api/edgar/holders?ticker=AAPL
 * Returns recent SEC 13-F institutional filers whose filings mention this ticker,
 * via EDGAR EFTS full-text search. Returns filer names and dates; share counts
 * require parsing individual filing XML (not done here — link to EDGAR provided).
 */
import { NextRequest, NextResponse } from "next/server"

const UA = "finnaCalc/1.0 (contact@finnacalc.com)"

// Date helpers
function yyyymmdd(d: Date) {
    return d.toISOString().split("T")[0]
}

export async function GET(req: NextRequest) {
    const ticker = req.nextUrl.searchParams.get("ticker")?.trim().toUpperCase()
    if (!ticker) return NextResponse.json({ error: "ticker required" }, { status: 400 })

    const endDate   = new Date()
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - 9)   // look back 9 months

    // EDGAR EFTS full-text search — finds 13-F-HR filings containing this ticker string
    const url = new URL("https://efts.sec.gov/LATEST/search-index")
    url.searchParams.set("q",         `"${ticker}"`)
    url.searchParams.set("forms",     "13F-HR")
    url.searchParams.set("dateRange", "custom")
    url.searchParams.set("startdt",   yyyymmdd(startDate))
    url.searchParams.set("enddt",     yyyymmdd(endDate))

    try {
        const res = await fetch(url.toString(), {
            headers: { "User-Agent": UA },
            next: { revalidate: 86400 },
        })
        if (!res.ok) return NextResponse.json({ error: `EFTS ${res.status}` }, { status: 502 })
        const data = await res.json() as {
            hits?: {
                total?: { value: number }
                hits?: Array<{
                    _id: string
                    _source?: {
                        entity_name?: string
                        display_names?: Array<{ name: string; id: string }>
                        file_date?: string
                        period_of_report?: string
                    }
                }>
            }
        }

        const hits   = data.hits?.hits ?? []
        const total  = data.hits?.total?.value ?? 0

        const holders = hits.slice(0, 20).map(hit => {
            const src  = hit._source ?? {}
            const name = src.entity_name
                ?? src.display_names?.[0]?.name
                ?? "Unknown Institution"
            const cik  = src.display_names?.[0]?.id ?? null
            const accn = hit._id?.replace(/-/g, "") ?? null
            const edgarUrl = cik && accn
                ? `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${cik}&type=13F-HR&dateb=&owner=include&count=10`
                : `https://www.sec.gov/cgi-bin/srqsb?text=form-type%3D13F-HR+%22${ticker}%22`
            return {
                name,
                cik,
                filedAt:       src.file_date ?? null,
                reportPeriod:  src.period_of_report ?? null,
                edgarUrl,
            }
        })

        return NextResponse.json({ data: holders, total }, {
            headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=172800" },
        })
    } catch (err) {
        return NextResponse.json({ error: err instanceof Error ? err.message : "EDGAR error" }, { status: 502 })
    }
}
