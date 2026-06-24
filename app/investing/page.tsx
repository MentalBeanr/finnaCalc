"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Container } from "@/components/ds/container"
import { Section } from "@/components/ds/section"
import { Eyebrow } from "@/components/ds/eyebrow"
import { MaterialIcon } from "@/components/ds/material-icon"
import InvestingOptions from "@/components/investing-options"
import StocksPage from "@/components/stocks-page"
import BondsPage from "@/components/bonds-page"
import SafeInvestmentsPage from "@/components/safe-investments-page"
import Link from "next/link"

const TOOLS = [
    {
        id: "investing-options",
        icon: "shield",
        title: "Safe investing options",
        body: "Curated safe investment options including index funds, ETFs, and bonds.",
        cta: "View safe options",
    },
] as const

export default function InvestingPage() {
    const [activeSection, setActiveSection] = useState("")
    const [initialSymbol, setInitialSymbol] = useState<string | undefined>()

    const handleSectionClick = (section: string, symbol?: string) => {
        setInitialSymbol(symbol)
        setActiveSection(section)
    }

    const handleBack = () => setActiveSection("")

    if (activeSection === "investing-options") {
        return <InvestingOptions onBack={handleBack} onSelect={handleSectionClick} />
    }
    if (activeSection === "stocks") {
        return <StocksPage onBack={() => setActiveSection("investing-options")} initialSymbol={initialSymbol} />
    }
    if (activeSection === "bonds") {
        return <BondsPage onBack={() => setActiveSection("investing-options")} />
    }
    if (activeSection === "safe-investments") {
        return <SafeInvestmentsPage onBack={() => setActiveSection("investing-options")} />
    }
    return (
        <div className="flex flex-col">
            <Section spacing="loose" className="pt-section-gap-sm">
                <Container className="flex flex-col gap-stack-lg max-w-3xl">
                    <Eyebrow>Investing</Eyebrow>
                    <h1 className="font-headline-display text-[56px] leading-[1.1] tracking-[-0.02em] text-primary">
                        Smart investing made simple
                    </h1>
                    <p className="font-body-lg text-body-lg text-on-surface-variant max-w-prose">
                        Research tools and investment options to help individuals
                        and businesses make better, math-backed decisions.
                    </p>
                </Container>
            </Section>

            <Section spacing="default">
                <Container>
                    <div className="grid grid-cols-3 gap-gutter">
                        {/* Markets Dashboard — links directly to the dashboard page */}
                        <Link
                            href="/investing/markets"
                            className="group flex flex-col gap-stack-md p-10 border border-outline-variant/30 rounded-lg bg-surface-container-lowest transition-colors duration-200 hover:border-primary/40"
                        >
                            <MaterialIcon name="bar_chart" size={28} className="text-primary" />
                            <h3 className="font-headline-md text-headline-md text-primary">
                                Markets Dashboard
                            </h3>
                            <p className="font-body-md text-body-md text-on-surface-variant flex-grow">
                                Portfolio overview, holdings, market movers, screener, news sentiment, watchlist, and dividend calendar.
                            </p>
                            <span className="inline-flex items-center gap-stack-sm pt-stack-sm font-ui-button text-ui-button uppercase tracking-[0.05em] text-primary">
                                Open dashboard
                                <MaterialIcon
                                    name="arrow_forward"
                                    size={16}
                                    className="transition-transform duration-200 group-hover:translate-x-0.5"
                                />
                            </span>
                        </Link>
                        {/* Stock Research Tools — links to dedicated research page */}
                        <Link
                            href="/investing/research"
                            className="group flex flex-col gap-stack-md p-10 border border-outline-variant/30 rounded-lg bg-surface-container-lowest transition-colors duration-200 hover:border-primary/40"
                        >
                            <MaterialIcon name="trending_up" size={28} className="text-primary" />
                            <h3 className="font-headline-md text-headline-md text-primary">
                                Stock research tools
                            </h3>
                            <p className="font-body-md text-body-md text-on-surface-variant flex-grow">
                                Deep-dive research: price charts, analyst ratings, financials, technicals, DCF calculator, and more.
                            </p>
                            <span className="inline-flex items-center gap-stack-sm pt-stack-sm font-ui-button text-ui-button uppercase tracking-[0.05em] text-primary">
                                Open research tools
                                <MaterialIcon
                                    name="arrow_forward"
                                    size={16}
                                    className="transition-transform duration-200 group-hover:translate-x-0.5"
                                />
                            </span>
                        </Link>
                        {TOOLS.map((tool) => (
                            <button
                                key={tool.id}
                                type="button"
                                onClick={() => handleSectionClick(tool.id)}
                                className="group flex flex-col gap-stack-md p-10 border border-outline-variant/30 rounded-lg bg-surface-container-lowest text-left transition-colors duration-200 hover:border-primary/40"
                            >
                                <MaterialIcon name={tool.icon} size={28} className="text-primary" />
                                <h3 className="font-headline-md text-headline-md text-primary">
                                    {tool.title}
                                </h3>
                                <p className="font-body-md text-body-md text-on-surface-variant flex-grow">
                                    {tool.body}
                                </p>
                                <span className="inline-flex items-center gap-stack-sm pt-stack-sm font-ui-button text-ui-button uppercase tracking-[0.05em] text-primary">
                                    {tool.cta}
                                    <MaterialIcon
                                        name="arrow_forward"
                                        size={16}
                                        className="transition-transform duration-200 group-hover:translate-x-0.5"
                                    />
                                </span>
                            </button>
                        ))}
                        <Link
                            href="/education"
                            className="group flex flex-col gap-stack-md p-10 border border-outline-variant/30 rounded-lg bg-surface-container-lowest transition-colors duration-200 hover:border-primary/40"
                        >
                            <MaterialIcon name="school" size={28} className="text-primary" />
                            <h3 className="font-headline-md text-headline-md text-primary">
                                Learn investing basics
                            </h3>
                            <p className="font-body-md text-body-md text-on-surface-variant flex-grow">
                                Educational content about stocks, bonds, and building a portfolio.
                            </p>
                            <span className="inline-flex items-center gap-stack-sm pt-stack-sm font-ui-button text-ui-button uppercase tracking-[0.05em] text-primary">
                                Start learning
                                <MaterialIcon
                                    name="arrow_forward"
                                    size={16}
                                    className="transition-transform duration-200 group-hover:translate-x-0.5"
                                />
                            </span>
                        </Link>
                    </div>
                </Container>
            </Section>
        </div>
    )
}
