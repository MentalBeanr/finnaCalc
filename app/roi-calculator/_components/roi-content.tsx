import type { CalculatorFaqEntry } from "@/components/ds/calculator-page-shell"

export const ROI_FAQ: ReadonlyArray<CalculatorFaqEntry> = [
    {
        question: "Simple ROI vs annualized — which one matters?",
        answer: (
            <>
                For anything held over a year, annualized (CAGR) is the more honest
                comparison — it shows the consistent yearly rate that, compounded,
                produces the observed result. Simple ROI divided by years overstates
                long-term performance because it ignores compounding.
            </>
        ),
    },
    {
        question: "What's a reasonable inflation rate to enter?",
        answer: (
            <>
                The US long-run average is roughly 2–3% per year. Look at the
                most recent CPI print for a current view, but for long horizons the
                long-run average is the more useful planning number — short-term
                inflation is noisier than long-term realized rates.
            </>
        ),
    },
    {
        question: "Why does the calculator only tax positive returns?",
        answer: (
            <>
                Capital gains tax only applies to gains. Losses can sometimes offset
                gains elsewhere (tax-loss harvesting), but that&apos;s an inter-asset
                operation outside the scope of a single-position calculator.
                Dividends and interest are taxed regardless of capital gain or loss.
            </>
        ),
    },
    {
        question: "Is the real return formula the right one?",
        answer: (
            <>
                We use the Fisher equation: real = (1 + nominal) / (1 + inflation) − 1.
                A common shortcut is real ≈ nominal − inflation, which is close at
                low rates but diverges meaningfully at higher inflation. The Fisher
                version is exact.
            </>
        ),
    },
] as const

export function RoiEducation() {
    return (
        <>
            <p>
                Return on Investment compresses an entire investment&apos;s story
                into one number — the percent by which it grew (or shrank) relative
                to what you put in. For comparing two outcomes side-by-side it&apos;s
                indispensable; for predicting future returns it&apos;s no more
                reliable than the assumptions behind it.
            </p>
            <p>
                Pay close attention to three modifiers the headline ROI hides:
                <em> time</em> (annualizing makes long holds comparable to short
                ones), <em>taxes</em> (after-tax return is what you actually keep),
                and <em>inflation</em> (real return is what you keep in purchasing
                power). A 10% nominal return at 8% inflation isn&apos;t much
                different from breaking even.
            </p>
            <p>
                Historical benchmarks: broad US equities have produced ~7% real
                annualized returns over long periods, investment-grade bonds 1–3%,
                cash near zero (historically). Use those as sanity checks rather
                than forecasts — past performance is a poor predictor.
            </p>
        </>
    )
}
