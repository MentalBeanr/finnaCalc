"use client"

import { Container } from "@/components/ds/container"
import { Section } from "@/components/ds/section"
import { MaterialIcon } from "@/components/ds/material-icon"

interface SafeInvestmentsPageProps {
    onBack: () => void
}

const INVESTMENTS = [
    {
        name: "S&P 500 Index Fund (IVV)",
        symbol: "IVV",
        avgReturn: "10.5%",
        risk: "Low-Medium",
        description: "Tracks the 500 largest US companies.",
        minInvestment: "$1",
        link: "https://www.ishares.com/us/products/239726/ishares-core-sp-500-etf",
    },
    {
        name: "Total Stock Market (VTI)",
        symbol: "VTI",
        avgReturn: "10.2%",
        risk: "Low-Medium",
        description: "Owns the entire US stock market.",
        minInvestment: "$1",
        link: "https://investor.vanguard.com/investment-products/etfs/profile/vti",
    },
    {
        name: "High-Yield Savings",
        symbol: "HYSA",
        avgReturn: "4.5%+",
        risk: "None",
        description: "FDIC insured savings account.",
        minInvestment: "$0",
        link: "https://www.nerdwallet.com/best/banking/high-yield-online-savings-accounts",
    },
]

const riskColor: Record<string, string> = {
    None: "text-success bg-success/10",
    "Very Low": "text-success bg-success/10",
    Low: "text-primary bg-primary/10",
    "Low-Medium": "text-secondary bg-surface-container",
    Medium: "text-error bg-error/10",
}

export default function SafeInvestmentsPage({ onBack }: SafeInvestmentsPageProps) {
    return (
        <div className="flex flex-col">
            <Section spacing="default" className="pt-section-gap-sm pb-0">
                <Container className="flex flex-col gap-stack-lg">
                    <button
                        onClick={onBack}
                        className="inline-flex items-center gap-stack-sm self-start font-ui-button text-ui-button uppercase tracking-[0.05em] text-on-surface-variant hover:text-primary transition-colors"
                    >
                        <MaterialIcon name="arrow_back" size={16} />
                        Back to Investing
                    </button>
                    <h1 className="font-headline-display text-[56px] leading-[1.1] tracking-[-0.02em] text-primary">
                        Safe Investment Options
                    </h1>
                    <p className="font-body-lg text-body-lg text-on-surface-variant max-w-prose">
                        Top safest investments with consistent, predictable returns.
                    </p>
                </Container>
            </Section>

            <Section spacing="default">
                <Container>
                    <div className="border border-outline-variant/30 rounded-lg bg-surface-container-lowest divide-y divide-outline-variant/20">
                        {INVESTMENTS.map((inv) => (
                            <div key={inv.symbol} className="flex items-center gap-stack-lg p-8">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                    <MaterialIcon name="trending_up" size={20} className="text-primary" />
                                </div>
                                <div className="flex-grow">
                                    <p className="font-body-md text-body-md text-primary font-semibold mb-1">
                                        {inv.name}
                                    </p>
                                    <p className="font-body-md text-body-md text-on-surface-variant mb-stack-sm">
                                        {inv.description}
                                    </p>
                                    <div className="flex items-center gap-stack-sm">
                                        <span
                                            className={`font-label-caps text-label-caps uppercase tracking-[0.15em] rounded-full px-3 py-1 ${riskColor[inv.risk] ?? "text-on-surface-variant bg-surface-container"}`}
                                        >
                                            {inv.risk}
                                        </span>
                                        <span className="font-body-md text-body-md text-on-surface-variant">
                                            Min: {inv.minInvestment}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <p className="font-headline-md text-headline-md text-success mb-1">
                                        {inv.avgReturn}
                                    </p>
                                    <p className="font-body-md text-body-md text-on-surface-variant mb-stack-md">
                                        avg return
                                    </p>
                                    <a
                                        href={inv.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-stack-sm font-ui-button text-ui-button uppercase tracking-[0.05em] text-primary hover:text-primary/70 transition-colors"
                                    >
                                        Invest Now
                                        <MaterialIcon name="open_in_new" size={14} />
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                </Container>
            </Section>
        </div>
    )
}
