/**
 * Generates a printable tax summary page in a new browser window.
 * Uses window.print() — no npm dependencies, works in all modern browsers.
 * Users can "Save as PDF" from the print dialog.
 */

interface TaxSummaryData {
    filingStatus: string
    state: string
    taxYear: number
    // Federal
    totalIncome: number
    agi: number
    deduction: number
    usingItemized: boolean
    taxableIncome: number
    taxBeforeCredits: number
    credits: number
    taxAfterCredits: number
    withheld: number
    refundOrOwed: number
    owes: boolean
    marginalRate: number
    effectiveFederalRate: number
    // State
    stateName: string
    stateNoIncomeTax: boolean
    stateTaxableIncome: number
    stateTax: number
    stateEffectiveRate: number
    stateWithheld?: number
    // Filer info
    firstName?: string
    lastName?: string
}

const FILING_LABELS: Record<string, string> = {
    single:             "Single",
    married_jointly:    "Married Filing Jointly",
    married_separately: "Married Filing Separately",
    head_of_household:  "Head of Household",
    qualifying_widow:   "Qualifying Surviving Spouse",
}

function fmt(n: number): string {
    return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function pct(n: number): string {
    return (n * 100).toFixed(2) + "%"
}

function row(label: string, value: string, highlight = false, isNeg = false): string {
    const bg   = highlight ? (isNeg ? "#fef2f2" : "#f0fdf4") : "#f8fafc"
    const col  = highlight ? (isNeg ? "#b91c1c" : "#15803d") : "#0f172a"
    const bold = highlight ? "bold" : "normal"
    return `
        <tr style="border-bottom:1px solid #e2e8f0">
            <td style="padding:10px 16px;color:#475569;font-size:14px">${label}</td>
            <td style="padding:10px 16px;text-align:right;font-size:14px;font-weight:${bold};color:${col};background:${bg};border-radius:4px">${value}</td>
        </tr>`
}

export function openTaxSummaryPDF(data: TaxSummaryData): void {
    const filerName = data.firstName && data.lastName
        ? `${data.firstName} ${data.lastName}`
        : "Taxpayer"

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Tax Summary ${data.taxYear} — ${filerName}</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #0f172a; background: #fff; padding: 40px; max-width: 800px; margin: 0 auto; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 16px; border-bottom: 2px solid #0f172a; }
        .logo { font-size: 22px; font-weight: 800; letter-spacing: -0.02em; }
        .meta { text-align: right; font-size: 12px; color: #64748b; }
        h2 { font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; margin: 24px 0 8px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
        .refund-box { background: #f0fdf4; border: 2px solid #16a34a; border-radius: 8px; padding: 20px 24px; display: flex; justify-content: space-between; align-items: center; margin: 8px 0 24px; }
        .owe-box { background: #fef2f2; border: 2px solid #dc2626; border-radius: 8px; padding: 20px 24px; display: flex; justify-content: space-between; align-items: center; margin: 8px 0 24px; }
        .big-amount { font-size: 32px; font-weight: 800; }
        .refund-amount { color: #15803d; }
        .owe-amount { color: #b91c1c; }
        .disclaimer { margin-top: 32px; padding: 16px; background: #f8fafc; border-radius: 6px; font-size: 11px; color: #64748b; line-height: 1.6; }
        @media print {
            body { padding: 20px; }
            .no-print { display: none; }
        }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
        .info-item { padding: 12px 16px; background: #f8fafc; border-radius: 6px; }
        .info-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; margin-bottom: 4px; }
        .info-value { font-size: 14px; font-weight: 600; }
    </style>
</head>
<body>
    <div class="header">
        <div>
            <div class="logo">FinnaCalc</div>
            <div style="font-size:13px;color:#64748b;margin-top:4px">Tax Summary — ${data.taxYear} Tax Year</div>
        </div>
        <div class="meta">
            <div style="font-size:15px;font-weight:700;margin-bottom:4px">${filerName}</div>
            <div>Generated ${new Date().toLocaleDateString("en-US", { year:"numeric", month:"long", day:"numeric" })}</div>
            <div style="margin-top:4px;color:#94a3b8;font-style:italic">Estimate only — not an official IRS form</div>
        </div>
    </div>

    <div class="info-grid">
        <div class="info-item"><div class="info-label">Filing Status</div><div class="info-value">${FILING_LABELS[data.filingStatus] ?? data.filingStatus}</div></div>
        <div class="info-item"><div class="info-label">State</div><div class="info-value">${data.stateName} (${data.state})</div></div>
        <div class="info-item"><div class="info-label">Deduction Type</div><div class="info-value">${data.usingItemized ? "Itemized" : "Standard"}</div></div>
        <div class="info-item"><div class="info-label">Tax Year</div><div class="info-value">${data.taxYear}</div></div>
    </div>

    <h2>Federal Income Tax</h2>
    <table>
        ${row("Total Gross Income", `$${fmt(data.totalIncome)}`)}
        ${row("Adjusted Gross Income (AGI)", `$${fmt(data.agi)}`)}
        ${row(`${data.usingItemized ? "Itemized" : "Standard"} Deduction`, `- $${fmt(data.deduction)}`)}
        ${row("Federal Taxable Income", `$${fmt(data.taxableIncome)}`)}
        ${row("Tax Before Credits", `$${fmt(data.taxBeforeCredits)}`)}
        ${row("Tax Credits Applied", `- $${fmt(data.credits)}`)}
        ${row("Federal Tax Liability", `$${fmt(data.taxAfterCredits)}`)}
        ${row("Federal Tax Withheld (W-2/1099)", `$${fmt(data.withheld)}`)}
        ${row("Marginal Tax Rate", pct(data.marginalRate))}
        ${row("Effective Federal Rate", pct(data.effectiveFederalRate))}
    </table>

    <div class="${data.owes ? "owe-box" : "refund-box"}">
        <div style="font-size:14px;font-weight:600">${data.owes ? "Federal Tax Owed" : "Estimated Federal Refund"}</div>
        <div class="big-amount ${data.owes ? "owe-amount" : "refund-amount"}">$${fmt(Math.abs(data.refundOrOwed))}</div>
    </div>

    <h2>State Income Tax — ${data.stateName}</h2>
    ${data.stateNoIncomeTax
        ? `<p style="padding:16px;background:#f8fafc;border-radius:6px;font-size:14px;color:#64748b">${data.stateName} has no state income tax. $0 owed.</p>`
        : `<table>
            ${row("State Taxable Income", `$${fmt(data.stateTaxableIncome)}`)}
            ${row("State Tax Liability", `$${fmt(data.stateTax)}`)}
            ${data.stateWithheld != null ? row("State Tax Withheld", `$${fmt(data.stateWithheld)}`) : ""}
            ${row("Effective State Rate", pct(data.stateEffectiveRate))}
           </table>
           ${data.stateWithheld != null
               ? `<div class="${data.stateTax > data.stateWithheld ? "owe-box" : "refund-box"}" style="margin-top:8px">
                      <div style="font-size:14px;font-weight:600">${data.stateTax > data.stateWithheld ? "State Tax Owed" : "Estimated State Refund"}</div>
                      <div class="big-amount ${data.stateTax > data.stateWithheld ? "owe-amount" : "refund-amount"}">$${fmt(Math.abs(data.stateTax - (data.stateWithheld ?? 0)))}</div>
                  </div>`
               : ""}`
    }

    <h2>Combined Summary</h2>
    <table>
        ${row("Federal Tax Liability", `$${fmt(data.taxAfterCredits)}`)}
        ${row(data.stateNoIncomeTax ? `${data.stateName} — No State Income Tax` : `${data.stateName} State Tax`, `$${fmt(data.stateNoIncomeTax ? 0 : data.stateTax)}`)}
        ${row("Total Tax Liability", `$${fmt(data.taxAfterCredits + (data.stateNoIncomeTax ? 0 : data.stateTax))}`, true)}
    </table>

    <div class="disclaimer">
        <strong>Important Disclaimer:</strong> This summary is an <em>estimate</em> generated by FinnaCalc for planning purposes only. It is not an official IRS tax return or state tax filing. Tax liability may differ based on additional income, deductions, credits, Alternative Minimum Tax (AMT), self-employment tax, and other factors not captured in this summary. Consult a qualified tax professional or use official IRS software for your actual filing. State tax calculations are approximations using published 2024 tax brackets.
    </div>

    <div class="no-print" style="margin-top:32px;text-align:center">
        <button onclick="window.print()" style="padding:12px 32px;background:#0f172a;color:#fff;border:none;border-radius:6px;font-size:14px;font-weight:600;cursor:pointer;letter-spacing:0.02em">
            Save as PDF / Print
        </button>
    </div>
</body>
</html>`

    const win = window.open("", "_blank", "width=900,height=750")
    if (!win) { alert("Please allow pop-ups to generate your PDF."); return }
    win.document.write(html)
    win.document.close()
    // Small delay so browser finishes rendering before auto-print
    setTimeout(() => win.print(), 600)
}
