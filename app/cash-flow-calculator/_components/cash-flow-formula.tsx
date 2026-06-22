import { FormulaDisplay, FormulaLegend } from "@/components/ds/formula-display"

const LEGEND = [
    { symbol: "R0", description: "Monthly revenue in month 1" },
    { symbol: "g", description: "Monthly revenue growth rate (decimal)" },
    { symbol: "E", description: "Monthly expenses (held constant)" },
    { symbol: "S", description: "Starting cash balance" },
    { symbol: "Ct", description: "Cumulative cash at end of month t" },
] as const

export function CashFlowFormula() {
    return (
        <div className="flex flex-col gap-stack-lg">
            <FormulaDisplay caption="Revenue compounds monthly at rate g">
                R<sub>t</sub> = R<sub>0</sub> × (1 + g)<sup>t−1</sup>
            </FormulaDisplay>
            <FormulaDisplay caption="Net cash flow and cumulative balance, month by month">
                C<sub>t</sub> = C<sub>t−1</sub> + (R<sub>t</sub> − E)
            </FormulaDisplay>
            <FormulaLegend items={LEGEND} />
            <p className="font-body-md text-body-md text-on-surface-variant max-w-3xl">
                Runway is the first month at which C<sub>t</sub> crosses below
                zero — the moment the bank balance hits empty. A negative growth
                rate models declining revenue; expenses are held constant on the
                assumption that fixed costs don&apos;t respond to short-term
                revenue shocks.
            </p>
        </div>
    )
}
