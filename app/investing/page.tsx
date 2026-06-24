import { Container } from "@/components/ds/container"
import { Section } from "@/components/ds/section"
import { Eyebrow } from "@/components/ds/eyebrow"
import { MaterialIcon } from "@/components/ds/material-icon"
import Link from "next/link"

const CARDS = [
    {
        href: "/investing/markets",
        icon: "bar_chart",
        title: "Markets Dashboard",
        body: "Portfolio overview, holdings, market movers, screener, news sentiment, watchlist, and dividend calendar.",
        cta: "Open dashboard",
    },
    {
        href: "/investing/research",
        icon: "trending_up",
        title: "Stock research tools",
        body: "Deep-dive research: price charts, analyst ratings, financials, technicals, DCF calculator, and more.",
        cta: "Open research tools",
    },
    {
        href: "/investing/safe-investments",
        icon: "shield",
        title: "Safe investing options",
        body: "Proven passive strategies, a risk quiz, ETF explorer, DCA calculator, and a curated fund screener.",
        cta: "View safe options",
    },
    {
        href: "/education",
        icon: "school",
        title: "Learn investing basics",
        body: "Educational content about stocks, bonds, and building a portfolio.",
        cta: "Start learning",
    },
] as const

export default function InvestingPage() {
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
                        {CARDS.map((card) => (
                            <Link
                                key={card.href}
                                href={card.href}
                                className="group flex flex-col gap-stack-md p-10 border border-outline-variant/30 rounded-lg bg-surface-container-lowest transition-colors duration-200 hover:border-primary/40"
                            >
                                <MaterialIcon name={card.icon} size={28} className="text-primary" />
                                <h3 className="font-headline-md text-headline-md text-primary">
                                    {card.title}
                                </h3>
                                <p className="font-body-md text-body-md text-on-surface-variant flex-grow">
                                    {card.body}
                                </p>
                                <span className="inline-flex items-center gap-stack-sm pt-stack-sm font-ui-button text-ui-button uppercase tracking-[0.05em] text-primary">
                                    {card.cta}
                                    <MaterialIcon
                                        name="arrow_forward"
                                        size={16}
                                        className="transition-transform duration-200 group-hover:translate-x-0.5"
                                    />
                                </span>
                            </Link>
                        ))}
                    </div>
                </Container>
            </Section>
        </div>
    )
}
