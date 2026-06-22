import { FormulaDisplay, FormulaLegend } from "@/components/ds/formula-display"

const LEGEND = [
    { symbol: "ROI", description: "Total return as a percent of initial investment" },
    { symbol: "Vf", description: "Final value" },
    { symbol: "V0", description: "Initial investment" },
    { symbol: "t", description: "Time in years" },
    { symbol: "i", description: "Inflation rate (per year)" },
] as const

export function RoiFormula() {
    return (
        <div className="flex flex-col gap-stack-lg">
            <FormulaDisplay caption="Total ROI as a percent of initial outlay">
                ROI = (Vf − V0) ÷ V0 × 100
            </FormulaDisplay>
            <FormulaDisplay caption="Annualized return (CAGR) — geometric mean per year">
                CAGR = (Vf ÷ V0)<sup>1/t</sup> − 1
            </FormulaDisplay>
            <FormulaDisplay caption="Real (inflation-adjusted) return — Fisher equation">
                Real = (1 + CAGR) ÷ (1 + i) − 1
            </FormulaDisplay>
            <FormulaLegend items={LEGEND} />
            <p className="font-body-md text-body-md text-on-surface-variant max-w-3xl">
                Simple annualization divides total ROI by years (linear). CAGR
                compounds — usually the more honest figure for multi-year holdings
                because it acknowledges that returns build on returns.
            </p>
        </div>
    )
}
