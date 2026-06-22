import { FormulaDisplay, FormulaLegend } from "@/components/ds/formula-display"

const LEGEND = [
    { symbol: "R", description: "Revenue" },
    { symbol: "C", description: "Cost of goods sold (direct costs)" },
    { symbol: "O", description: "Operating expenses (indirect costs)" },
    { symbol: "t", description: "Effective tax rate (decimal)" },
] as const

export function ProfitMarginFormula() {
    return (
        <div className="flex flex-col gap-stack-lg">
            <FormulaDisplay caption="Gross margin — profitability after direct costs">
                Gross % = (R − C) ÷ R × 100
            </FormulaDisplay>
            <FormulaDisplay caption="Operating margin — adds indirect costs">
                Operating % = (R − C − O) ÷ R × 100
            </FormulaDisplay>
            <FormulaDisplay caption="Net margin — after income tax on operating profit">
                Net % = (R − C − O) × (1 − t) ÷ R × 100
            </FormulaDisplay>
            <FormulaLegend items={LEGEND} />
            <p className="font-body-md text-body-md text-on-surface-variant max-w-3xl">
                Tax is applied only on positive operating profit — losses
                don&apos;t generate refunds inside this calculator. Each margin
                strips away one more layer of cost: gross is the cleanest view
                of unit economics, operating shows whether the overhead structure
                works, net is what you actually keep.
            </p>
        </div>
    )
}
