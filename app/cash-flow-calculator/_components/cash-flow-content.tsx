import type { CalculatorFaqEntry } from "@/components/ds/calculator-page-shell"

export const CASH_FLOW_FAQ: ReadonlyArray<CalculatorFaqEntry> = [
    {
        question: "What does &lsquo;runway&rsquo; actually measure?",
        answer: (
            <>
                The first month at which cumulative cash crosses below zero — the
                moment you&apos;d need new financing, cost cuts, or revenue
                acceleration to keep operating. If the projection stays solvent
                across the entire horizon, runway is reported as &ldquo;Solvent&rdquo;
                rather than a month number.
            </>
        ),
    },
    {
        question: "Why are expenses held constant?",
        answer: (
            <>
                For short horizons (12–24 months) and modest revenue swings, fixed
                costs don&apos;t respond on the time scale that revenue does —
                leases, salaries, software contracts all have fixed cadences. If
                you&apos;re modeling a deliberate cost change (a hire, a layoff,
                a price renegotiation), run two projections and compare.
            </>
        ),
    },
    {
        question: "Can growth be negative?",
        answer: (
            <>
                Yes — a negative monthly growth rate models declining revenue.
                It&apos;s the most useful setting for stress-testing: enter the
                pessimistic revenue trajectory and see whether the business
                stays solvent through it.
            </>
        ),
    },
    {
        question: "How is this different from a forecast?",
        answer: (
            <>
                A forecast estimates what will happen; this is a deterministic
                projection of what <em>does</em> happen if your inputs hold. Use
                it to test scenarios — best case, base case, downside — by
                changing one assumption at a time and comparing the cash
                trajectories.
            </>
        ),
    },
] as const

export function CashFlowEducation() {
    return (
        <>
            <p>
                Cash flow projection is the operating cousin of a P&amp;L: same
                inputs, but the question is &ldquo;when does the bank account go
                empty?&rdquo; rather than &ldquo;were we profitable this year?&rdquo;
                Profitability and cash are not the same — a business can be
                profitable on accrual basis and still run out of cash because of
                timing.
            </p>
            <p>
                The chart above traces cumulative cash by month. As long as the
                line stays above zero, the business can pay its bills. The first
                time it touches zero is runway — the date by which you need to
                either raise capital, cut costs, or accelerate revenue. The
                slope of the line is your net monthly burn (downward) or
                accumulation (upward).
            </p>
            <p>
                Use this for stress-testing: enter a realistic base case, then
                run it again with a 30% revenue cut, then again with expenses up
                15%. The three trajectories side by side make it easy to see
                which inputs your survival actually depends on — usually
                revenue, sometimes a single large expense, rarely both.
            </p>
        </>
    )
}
