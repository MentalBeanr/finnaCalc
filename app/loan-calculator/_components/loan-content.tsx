import type { CalculatorFaqEntry } from "@/components/ds/calculator-page-shell"

export const LOAN_FAQ: ReadonlyArray<CalculatorFaqEntry> = [
    {
        question: "What's the difference between APR and interest rate?",
        answer: (
            <>
                The interest rate is the cost of borrowing the principal, expressed
                as a percentage. APR adds origination fees and other recurring
                charges to that interest, so it&apos;s the closer figure for
                comparing two loans that price their fees differently. A loan with
                a slightly higher headline rate but no fees can be cheaper than one
                with a lower rate and an origination fee.
            </>
        ),
    },
    {
        question: "Does a longer term always lower my payment?",
        answer: (
            <>
                Yes — lengthening the term reduces the periodic payment because the
                principal is spread across more periods. But each additional period
                accrues interest, so total interest paid rises. The amortization
                chart above makes the trade-off concrete: longer terms produce a
                gentler curve and a much larger area under it.
            </>
        ),
    },
    {
        question: "Why does my early payment go mostly to interest?",
        answer: (
            <>
                Each period&apos;s interest is computed on the current outstanding
                balance. Early on, the balance is highest, so most of your fixed
                payment funds interest and only a sliver reduces principal. As the
                balance falls, the interest portion shrinks and the principal
                portion grows — the schedule&apos;s most striking visual feature.
            </>
        ),
    },
    {
        question: "Does paying extra reduce my interest cost?",
        answer: (
            <>
                Yes — any extra payment applied to principal lowers the balance
                that future interest is computed against. The savings compound for
                the rest of the loan&apos;s life. Confirm with your servicer that
                extra payments are applied to principal (not pre-paid into the next
                period&apos;s scheduled payment).
            </>
        ),
    },
    {
        question: "How accurate are these calculations?",
        answer: (
            <>
                The math is deterministic and decimal-safe (no JavaScript float
                drift). The payment, APR, max loan amount, and remaining balance
                computations match published textbook references to the cent, and
                the test suite checks them on every change. The amortization
                schedule is constructed period-by-period and closes the final
                balance exactly to zero.
            </>
        ),
    },
] as const

export function LoanEducation() {
    return (
        <>
            <p>
                A loan is a present-value exchange: a lender hands you a lump sum
                today, and you return a series of equal payments over time that —
                taken together — sum to the principal plus interest. Every loan
                calculator below is a different rearrangement of the same
                underlying PMT equation.
            </p>
            <p>
                The four modes here cover the most common questions: <em>what will
                my payment be?</em> (payment), <em>what&apos;s the true cost?</em>{" "}
                (APR), <em>how much can I borrow?</em> (loan amount), and{" "}
                <em>how much do I still owe?</em> (remaining balance). The
                amortization chart visualizes the payment-by-payment trajectory
                that the closed-form numbers summarize.
            </p>
            <p>
                Two factors drive almost every result: the interest rate and the
                term. A small change in rate can shift total interest by tens of
                thousands of dollars on a long-term mortgage. A longer term lowers
                each individual payment but typically raises the total cost. Use
                the form to test scenarios — the calculator updates the chart on
                each calculation.
            </p>
        </>
    )
}
