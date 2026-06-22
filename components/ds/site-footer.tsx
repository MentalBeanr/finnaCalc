import * as React from "react"
import Link from "next/link"
import { Container } from "@/components/ds/container"
import { Eyebrow } from "@/components/ds/eyebrow"

const FOOTER_NAV = [
    {
        heading: "Calculators",
        links: [
            { label: "Loan Calculator", href: "/loan-calculator" },
            { label: "ROI Calculator", href: "/roi-calculator" },
            { label: "Tax Savings", href: "/tax-calculator" },
            { label: "Break-Even", href: "/break-even-calculator" },
            { label: "Emergency Fund", href: "/emergency-fund-calculator" },
        ],
    },
    {
        heading: "Topics",
        links: [
            { label: "Budgeting", href: "/budgeting" },
            { label: "Investing", href: "/investing" },
            { label: "Taxes", href: "/taxes" },
            { label: "Education", href: "/education" },
        ],
    },
    {
        heading: "Company",
        links: [
            { label: "About", href: "/about" },
            { label: "Advising", href: "/advising" },
            { label: "Premium", href: "/premium" },
        ],
    },
    {
        heading: "Legal",
        links: [
            { label: "Terms of Service", href: "/terms" },
            { label: "Privacy Policy", href: "/privacy" },
        ],
    },
] as const

export function SiteFooter() {
    return (
        <footer className="mt-auto border-t border-outline-variant/20 bg-surface-container-low pt-section-gap-sm md:pt-section-gap pb-10">
            <Container className="grid grid-cols-2 md:grid-cols-5 gap-gutter mb-stack-xl">
                <div className="col-span-2 md:col-span-1 flex flex-col gap-stack-sm">
                    <div className="font-headline-md text-[24px] leading-none text-primary">
                        FinnaCalc
                    </div>
                    <p className="font-body-md text-body-md text-on-surface-variant max-w-xs">
                        Financial clarity, without complexity.
                    </p>
                </div>

                {FOOTER_NAV.map((column) => (
                    <div key={column.heading} className="flex flex-col gap-stack-sm">
                        <Eyebrow className="mb-stack-sm">{column.heading}</Eyebrow>
                        {column.links.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors duration-200"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>
                ))}
            </Container>

            <Container className="border-t border-outline-variant/15 pt-stack-lg flex flex-col md:flex-row md:items-center md:justify-between gap-stack-sm">
                <p className="font-body-md text-sm text-on-surface-variant">
                    &copy; {new Date().getFullYear()} FinnaCalc. All rights reserved.
                </p>
                <p className="font-body-md text-sm text-on-surface-variant">
                    Calculators are for informational purposes and are not financial advice.
                </p>
            </Container>
        </footer>
    )
}
