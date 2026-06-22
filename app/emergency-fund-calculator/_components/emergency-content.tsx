import type { CalculatorFaqEntry } from "@/components/ds/calculator-page-shell"

export const EMERGENCY_FAQ: ReadonlyArray<CalculatorFaqEntry> = [
    {
        question: "How many months of expenses should I aim for?",
        answer: (
            <>
                The common guidance is 3 to 6 months of essential expenses. Lean
                toward 6 if your income is variable, you have dependents, or your
                industry is cyclical; 3 is a defensible floor for dual-income
                households with stable jobs. The right number depends on the
                tail-risk you&apos;re protecting against.
            </>
        ),
    },
    {
        question: "Which expenses count toward the &lsquo;monthly expenses&rsquo; figure?",
        answer: (
            <>
                The expenses you&apos;d still have to pay if your income stopped —
                housing, food, utilities, insurance, minimum debt payments,
                transportation. Discretionary spending (subscriptions, dining out)
                shrinks naturally in an emergency, so leaving it out gives a more
                honest reserve target.
            </>
        ),
    },
    {
        question: "Where should I keep my emergency fund?",
        answer: (
            <>
                Somewhere accessible within a few days, insured, and earning enough
                interest to roughly offset inflation. High-yield savings accounts
                or money-market funds are the typical choice. Avoid market
                investments — needing the money on the exact day a crisis hits is
                a near-guaranteed way to sell at a bad price.
            </>
        ),
    },
    {
        question: "What does the projection assume about interest?",
        answer: (
            <>
                Monthly compounding at the rate you provide, applied to both your
                existing balance and your incoming contributions. Real-world rates
                fluctuate, but for planning horizons of 1–3 years this assumption
                is a reasonable simplification.
            </>
        ),
    },
] as const

export function EmergencyEducation() {
    return (
        <>
            <p>
                An emergency fund is the financial buffer that lets you absorb
                shocks — a job loss, a medical bill, a roof — without resorting to
                credit cards or selling investments at a loss. Its job isn&apos;t
                to grow your wealth; it&apos;s to protect the rest of your plan
                from being derailed when something unexpected happens.
            </p>
            <p>
                The right size depends on your essential monthly expenses and your
                tolerance for uncertainty. Single-income households, freelancers,
                and people with dependents typically need a larger reserve than
                dual-income households with stable employment. The chart above
                projects how your current balance plus contributions, compounding
                at your stated rate, reach the target.
            </p>
            <p>
                Treat the fund as untouchable for ordinary expenses. Automating a
                fixed monthly contribution to a separate high-yield savings account
                — out of sight of your everyday spending — is the single
                highest-leverage move most people can make.
            </p>
        </>
    )
}
