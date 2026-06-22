import { FormulaDisplay, FormulaLegend } from "@/components/ds/formula-display"
import type { CalculationMode } from "@/lib/types/loan"

const PAYMENT_LEGEND = [
    { symbol: "PMT", description: "Periodic payment" },
    { symbol: "P", description: "Principal (loan amount minus down payment)" },
    { symbol: "r", description: "Periodic interest rate (annual rate ÷ periods per year)" },
    { symbol: "n", description: "Total number of payment periods" },
] as const

const APR_LEGEND = [
    { symbol: "APR", description: "Annual percentage rate" },
    { symbol: "I", description: "Total interest paid" },
    { symbol: "F", description: "Total fees" },
    { symbol: "P", description: "Principal" },
    { symbol: "Y", description: "Loan term in years" },
] as const

const LOAN_AMOUNT_LEGEND = [
    { symbol: "P", description: "Maximum loan amount" },
    { symbol: "PMT", description: "Monthly payment you can afford" },
    { symbol: "r", description: "Monthly interest rate (annual ÷ 12)" },
    { symbol: "n", description: "Loan term in months" },
] as const

const REMAINING_LEGEND = [
    { symbol: "B", description: "Remaining balance after k payments" },
    { symbol: "P", description: "Original loan amount" },
    { symbol: "PMT", description: "Contractual monthly payment" },
    { symbol: "r", description: "Monthly interest rate" },
    { symbol: "k", description: "Payments already made" },
] as const

interface LoanFormulaProps {
    mode: CalculationMode
}

export function LoanFormula({ mode }: LoanFormulaProps) {
    if (mode === "payment") {
        return (
            <div className="flex flex-col gap-stack-lg">
                <FormulaDisplay caption="Standard PMT formula for an amortizing loan">
                    PMT = P × r × (1 + r)<sup>n</sup> ÷ ((1 + r)<sup>n</sup> − 1)
                </FormulaDisplay>
                <FormulaLegend items={PAYMENT_LEGEND} />
                <p className="font-body-md text-body-md text-on-surface-variant max-w-3xl">
                    When the rate is zero, the formula reduces to a straight-line
                    amortization: PMT = P ÷ n.
                </p>
            </div>
        )
    }

    if (mode === "apr") {
        return (
            <div className="flex flex-col gap-stack-lg">
                <FormulaDisplay caption="Simple-interest APR approximation">
                    APR ≈ (I + F) ÷ P ÷ Y × 100
                </FormulaDisplay>
                <FormulaLegend items={APR_LEGEND} />
                <p className="font-body-md text-body-md text-on-surface-variant max-w-3xl">
                    This is the consumer-comparison approximation, not the actuarial
                    APR (which would solve for the discount rate equating all cash
                    flows to the loan amount). It&apos;s useful for comparing two loans
                    with different fee structures at a glance.
                </p>
            </div>
        )
    }

    if (mode === "loanAmount") {
        return (
            <div className="flex flex-col gap-stack-lg">
                <FormulaDisplay caption="The PMT formula inverted to solve for principal">
                    P = PMT × (1 − (1 + r)<sup>−n</sup>) ÷ r
                </FormulaDisplay>
                <FormulaLegend items={LOAN_AMOUNT_LEGEND} />
                <p className="font-body-md text-body-md text-on-surface-variant max-w-3xl">
                    With a zero rate this collapses to P = PMT × n: every dollar of
                    payment funds one dollar of principal.
                </p>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-stack-lg">
            <FormulaDisplay caption="Balance on an amortizing loan after k payments">
                B<sub>k</sub> = P × (1 + r)<sup>k</sup> − PMT × ((1 + r)<sup>k</sup> − 1) ÷ r
            </FormulaDisplay>
            <FormulaLegend items={REMAINING_LEGEND} />
            <p className="font-body-md text-body-md text-on-surface-variant max-w-3xl">
                Clamped to zero on the final payment to absorb sub-cent residue from
                periodic rounding. Zero-rate loans reduce to B = P − PMT × k.
            </p>
        </div>
    )
}
