import { FormulaDisplay, FormulaLegend } from "@/components/ds/formula-display"

const LEGEND = [
    { symbol: "S", description: "Base annual salary" },
    { symbol: "b", description: "Benefits load (decimal)" },
    { symbol: "p", description: "Payroll tax rate (decimal)" },
    { symbol: "w", description: "Workers' comp rate (decimal)" },
    { symbol: "u", description: "Unemployment rate (decimal); cap applied" },
    { symbol: "R", description: "Contractor hourly rate" },
    { symbol: "h", description: "Total hours (per week × weeks per year)" },
] as const

export function EmployeeContractorFormula() {
    return (
        <div className="flex flex-col gap-stack-lg">
            <FormulaDisplay caption="Fully-loaded employee cost includes salary plus four employer-side adds">
                Employee = S × (1 + b + p + w) + min(S × u, cap)
            </FormulaDisplay>
            <FormulaDisplay caption="Contractor annual cost is the rate times the hours">
                Contractor = R × h
            </FormulaDisplay>
            <FormulaDisplay caption="Breakeven contractor rate — match the employee&apos;s effective hourly cost">
                Breakeven = Employee ÷ h
            </FormulaDisplay>
            <FormulaLegend items={LEGEND} />
            <p className="font-body-md text-body-md text-on-surface-variant max-w-3xl">
                This is a pure dollar-for-dollar comparison. It doesn&apos;t
                price productivity, IP ownership, ramp time, or the legal risk
                of misclassifying a contractor who behaves like an employee.
                Use the dollar delta as one input among several, not the
                whole decision.
            </p>
        </div>
    )
}
