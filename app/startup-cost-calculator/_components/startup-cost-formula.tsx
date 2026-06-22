import { FormulaDisplay, FormulaLegend } from "@/components/ds/formula-display"

const LEGEND = [
    { symbol: "T", description: "Sum of all line-item costs" },
    { symbol: "b", description: "Contingency buffer percent (decimal)" },
    { symbol: "R", description: "Recommended capital — total with buffer" },
    { symbol: "F", description: "Sum of available funding sources" },
    { symbol: "G", description: "Funding gap (positive = need more)" },
] as const

export function StartupCostFormula() {
    return (
        <div className="flex flex-col gap-stack-lg">
            <FormulaDisplay caption="Recommended capital includes the contingency buffer">
                R = T × (1 + b)
            </FormulaDisplay>
            <FormulaDisplay caption="Funding gap, signed (positive means short)">
                G = R − F
            </FormulaDisplay>
            <FormulaLegend items={LEGEND} />
            <p className="font-body-md text-body-md text-on-surface-variant max-w-3xl">
                The buffer absorbs the costs you didn&apos;t plan for —
                contractors overrunning, equipment failing, marketing not
                converting as expected. 20% is the conservative default; 10%
                makes sense only if you&apos;ve built businesses like this
                before. Below 10% is a bet on no surprises.
            </p>
        </div>
    )
}
