import Link from "next/link"
import { Container } from "@/components/ds/container"
import { Section } from "@/components/ds/section"
import { Eyebrow } from "@/components/ds/eyebrow"
import { SectionHeading } from "@/components/ds/section-heading"
import { CalculatorCard } from "@/components/ds/calculator-card"
import { HeroGrowthChart } from "@/components/ds/hero-growth-chart"
import { MaterialIcon } from "@/components/ds/material-icon"
import { FaqItem } from "@/components/ds/faq-item"
import { Button } from "@/components/ui/button"
import {
    CATEGORY_GROUPS,
    FEATURED_CALCULATORS,
    POPULAR_CALCULATORS,
} from "@/lib/calculators"

const EDUCATION_ARTICLES = [
    {
        title: "How Compound Interest Actually Works",
        description:
            "Why time-in-market beats market-timing — and how to read the curve underneath every projection.",
        icon: "trending_up",
        href: "/education",
        readMinutes: 6,
    },
    {
        title: "Reading a Loan Amortization Schedule",
        description:
            "What the principal and interest split tells you, and how extra payments change the picture.",
        icon: "account_balance",
        href: "/education",
        readMinutes: 8,
    },
    {
        title: "Pre-Tax vs Post-Tax Contributions",
        description:
            "A practical framework for choosing between traditional and Roth accounts under real constraints.",
        icon: "receipt_long",
        href: "/education",
        readMinutes: 7,
    },
] as const

export default function HomePage() {
    return (
        <div className="flex flex-col">
            {/* HERO */}
            <Section spacing="loose" className="pt-section-gap-sm">
                <Container className="grid grid-cols-12 gap-gutter items-center">
                    <div className="col-span-6 flex flex-col gap-stack-lg">
                        <Eyebrow>Financial Calculators</Eyebrow>
                        <h1 className="font-headline-display text-headline-display text-primary">
                            Calculate Smarter.
                            <br />
                            Plan Better.
                            <br />
                            Grow Confidently.
                        </h1>
                        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-prose">
                            Editorial-grade financial tools built on deterministic, decimal-safe
                            math. Loans, investing, taxes, and business — calculated with the
                            precision investors and operators expect.
                        </p>
                        <div className="flex flex-wrap gap-stack-md pt-stack-sm">
                            <Button asChild size="lg">
                                <Link href="#featured">Explore Calculators</Link>
                            </Button>
                            <Button asChild variant="outline" size="lg">
                                <Link href="/education">Learn the Methods</Link>
                            </Button>
                        </div>
                    </div>
                    <div className="col-span-6">
                        <HeroGrowthChart />
                    </div>
                </Container>
            </Section>

            {/* CATEGORIES */}
            <Section spacing="default">
                <Container className="flex flex-col gap-stack-lg">
                    <SectionHeading
                        eyebrow="Core Calculators"
                        title="Built for every financial decision"
                    />
                    <div className="grid grid-cols-3 gap-gutter">
                        {CATEGORY_GROUPS.map((group) => (
                            <Link
                                key={group.id}
                                href={group.href}
                                className="group flex flex-col gap-stack-md border border-outline-variant/30 rounded-lg bg-surface-container-lowest p-10 transition-colors duration-200 hover:border-primary/40"
                            >
                                <MaterialIcon
                                    name={group.icon}
                                    size={32}
                                    className="text-primary"
                                />
                                <h3 className="font-headline-md text-headline-md text-primary">
                                    {group.title}
                                </h3>
                                <p className="font-body-md text-body-md text-on-surface-variant flex-grow">
                                    {group.description}
                                </p>
                                <span className="inline-flex items-center gap-stack-sm pt-stack-sm font-ui-button text-ui-button uppercase tracking-[0.05em] text-primary">
                                    Explore
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

            {/* FEATURED CALCULATORS */}
            <Section id="featured" spacing="default">
                <Container className="flex flex-col gap-stack-lg">
                    <SectionHeading
                        eyebrow="Featured"
                        title="Where most people start"
                        cta={{ label: "View All", href: "#popular" }}
                    />
                    <div className="grid grid-cols-3 gap-gutter">
                        {FEATURED_CALCULATORS.map((calc) => (
                            <CalculatorCard
                                key={calc.slug}
                                title={calc.title}
                                description={calc.description}
                                href={calc.href}
                                icon={calc.icon}
                                estimatedMinutes={calc.estimatedMinutes}
                            />
                        ))}
                    </div>
                </Container>
            </Section>

            {/* POPULAR CALCULATORS — compact list */}
            <Section id="popular" spacing="default">
                <Container className="flex flex-col gap-stack-lg">
                    <SectionHeading eyebrow="Popular" title="Calculators in active use" />
                    <div className="grid grid-cols-4 gap-gutter">
                        {POPULAR_CALCULATORS.map((calc) => (
                            <CalculatorCard
                                key={calc.slug}
                                title={calc.title}
                                description={calc.description}
                                href={calc.href}
                                icon={calc.icon}
                                variant="compact"
                            />
                        ))}
                    </div>
                </Container>
            </Section>

            {/* EDUCATIONAL CONTENT */}
            <Section spacing="default">
                <Container className="flex flex-col gap-stack-lg">
                    <SectionHeading
                        eyebrow="Education"
                        title="Understand the math before you trust it"
                        cta={{ label: "All Articles", href: "/education" }}
                    />
                    <div className="grid grid-cols-3 gap-gutter">
                        {EDUCATION_ARTICLES.map((article) => (
                            <Link
                                key={article.title}
                                href={article.href}
                                className="group flex flex-col gap-stack-md border border-outline-variant/30 rounded-lg bg-surface-container-lowest p-10 transition-colors duration-200 hover:border-primary/40"
                            >
                                <MaterialIcon
                                    name={article.icon}
                                    size={24}
                                    className="text-primary"
                                />
                                <h3 className="font-headline-md text-[24px] leading-[1.3] text-primary">
                                    {article.title}
                                </h3>
                                <p className="font-body-md text-body-md text-on-surface-variant flex-grow">
                                    {article.description}
                                </p>
                                <span className="font-label-caps text-label-caps uppercase tracking-[0.15em] text-secondary pt-stack-sm">
                                    {article.readMinutes} min read
                                </span>
                            </Link>
                        ))}
                    </div>
                </Container>
            </Section>

            {/* FAQ */}
            <Section spacing="default">
                <Container className="grid grid-cols-12 gap-gutter">
                    <div className="col-span-4 flex flex-col gap-stack-md">
                        <Eyebrow>FAQ</Eyebrow>
                        <h2 className="font-headline-lg text-headline-lg text-primary">
                            Common questions
                        </h2>
                        <p className="font-body-md text-body-md text-on-surface-variant max-w-prose">
                            How FinnaCalc approaches accuracy, privacy, and the difference between
                            calculation and advice.
                        </p>
                    </div>
                    <div className="col-span-8">
                        <FaqItem
                            question="Are the calculations accurate enough for real decisions?"
                            defaultOpen
                        >
                            Every calculator runs deterministic, decimal-safe math (no JavaScript
                            float drift). Formulas are textbook and the loan calculator is
                            test-covered against published reference cases. Results are precise to
                            the cent — the limits are your inputs, not our arithmetic.
                        </FaqItem>
                        <FaqItem question="Is my financial data stored anywhere?">
                            Calculator inputs stay in your browser. We don&apos;t transmit or
                            persist them on our servers. If you sign in, only your account profile
                            is stored — calculations remain local.
                        </FaqItem>
                        <FaqItem question="Is this financial advice?">
                            No. FinnaCalc is a set of calculators and educational tools. They model
                            the math behind common financial decisions, but choosing what to do
                            with that information is yours — and for material decisions, worth
                            running by a qualified advisor.
                        </FaqItem>
                        <FaqItem question="What does &ldquo;deterministic&rdquo; actually mean here?">
                            Given the same inputs, you get exactly the same outputs — every time,
                            on every device. No randomness, no quietly-changing defaults, no
                            floating-point drift. The math is the math.
                        </FaqItem>
                    </div>
                </Container>
            </Section>
        </div>
    )
}
