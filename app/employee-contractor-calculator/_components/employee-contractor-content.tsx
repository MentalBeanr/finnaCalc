import type { CalculatorFaqEntry } from "@/components/ds/calculator-page-shell"

export const EMPLOYEE_CONTRACTOR_FAQ: ReadonlyArray<CalculatorFaqEntry> = [
    {
        question: "Why is the employee cost so much higher than just the salary?",
        answer: (
            <>
                Because the salary is only one of five lines. Employer-side
                payroll taxes (7.65% FICA), benefits load (typically 20–30%
                of salary across health, retirement match, and PTO), workers&apos;
                comp insurance, and unemployment insurance all add up. A common
                rule of thumb is that a fully-loaded employee costs 1.25–1.35×
                their base salary; this calculator makes the components
                explicit.
            </>
        ),
    },
    {
        question: "What&apos;s the &lsquo;breakeven contractor rate&rsquo;?",
        answer: (
            <>
                The hourly rate at which the contractor and the employee cost
                the same. It equals the employee&apos;s fully-loaded total cost
                divided by total hours — the employee&apos;s effective hourly
                rate. Pay a contractor below that and they&apos;re cheaper than
                an equivalent employee; pay them above it and the employee is.
            </>
        ),
    },
    {
        question: "If contractors are cheaper, should I always hire them?",
        answer: (
            <>
                No — cost is one factor, not the whole picture. Employees give
                you control over schedule and method, IP ownership by default,
                ramp time investment that pays off long-term, and team
                cohesion. Contractors give you flexibility and lower cost when
                the work is project-shaped. There&apos;s also legal risk: a
                contractor you treat like an employee can be reclassified by
                the IRS or state labor authorities — with back-taxes and
                penalties that wipe out years of savings.
            </>
        ),
    },
    {
        question: "Are the default percentages accurate for my situation?",
        answer: (
            <>
                They&apos;re US national averages. Benefits run higher in
                regulated industries with rich health plans (30–40%) and lower
                in lean startups (15–20%). Workers&apos; comp varies enormously
                by occupation — office roles are under 1%, construction and
                healthcare can be 5–10%. Override the defaults with your
                actual numbers for a defensible comparison.
            </>
        ),
    },
    {
        question: "Does this include income tax?",
        answer: (
            <>
                No — the comparison is from the employer&apos;s perspective.
                Income tax is the employee&apos;s personal expense (and a
                contractor pays both halves of self-employment tax themselves).
                For the personal side of the same trade-off, the contractor
                typically needs to charge a higher gross rate to net the same
                take-home pay as a salaried employee.
            </>
        ),
    },
] as const

export function EmployeeContractorEducation() {
    return (
        <>
            <p>
                The headline question — &ldquo;is a W-2 employee or a 1099
                contractor cheaper for this role?&rdquo; — is a useful starting
                point that almost no operator can answer without doing this
                math. The base salary feels like the cost; the benefits load,
                payroll taxes, workers&apos; comp, and unemployment line items
                quietly add another 25–35% on top.
            </p>
            <p>
                The right way to read this calculator is as a way to find the
                <em> breakeven contractor rate</em> — the rate at which the
                fully-loaded employee and the contractor cost the same. From
                there, the question becomes: at the rate you&apos;d actually
                pay this contractor, is the dollar delta worth the non-dollar
                trade-offs? Less control, IP that has to be assigned in
                writing, harder-to-build team cohesion, and a misclassification
                risk that depends on how you actually manage them day-to-day.
            </p>
            <p>
                Long-term roles where you set the schedule, the tools, and the
                methods are almost always employees by law, regardless of what
                you call them. Project-shaped work with a clear deliverable
                and contractor autonomy is the safer 1099 territory. If
                you&apos;re unsure, lean toward the employee classification —
                back-pay and penalties on a misclassified contractor often
                exceed years of comparison-table savings.
            </p>
        </>
    )
}
