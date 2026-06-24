import Link from "next/link"
import { Container } from "@/components/ds/container"
import { Section } from "@/components/ds/section"
import { Eyebrow } from "@/components/ds/eyebrow"
import { MaterialIcon } from "@/components/ds/material-icon"

const TOOLS = [
    {
        href: "/taxes/filing",
        icon: "description",
        title: "Easy tax filing",
        body: "Guided step-by-step tax preparation. Supports personal, business, and rental properties.",
        cta: "Start filing",
    },
    {
        href: "/taxes/calculators",
        icon: "calculate",
        title: "Tax calculators & tools",
        body: "Tax calculator, deduction finder, refund estimator, and withholding calculator to optimize your taxes.",
        cta: "Explore tools",
    },
] as const

export default function TaxesPage() {
    return (
        <div className="flex flex-col">
            <Section spacing="loose" className="pt-section-gap-sm">
                <Container className="flex flex-col gap-stack-lg max-w-3xl">
                    <Eyebrow>Taxes</Eyebrow>
                    <h1 className="font-headline-display text-[56px] leading-[1.1] tracking-[-0.02em] text-primary">
                        Maximize your tax returns
                    </h1>
                    <p className="font-body-lg text-body-lg text-on-surface-variant max-w-prose">
                        Filing, calculators, and education — tools that help you
                        understand and optimize your tax position.
                    </p>
                </Container>
            </Section>

            <Section spacing="default">
                <Container>
                    <div className="grid grid-cols-3 gap-gutter">
                        {TOOLS.map((tool) => (
                            <Link
                                key={tool.href}
                                href={tool.href}
                                className="group flex flex-col gap-stack-md p-10 border border-outline-variant/30 rounded-lg bg-surface-container-lowest transition-colors duration-200 hover:border-primary/40"
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
                            </Link>
                        ))}
                        <Link
                            href="/education"
                            className="group flex flex-col gap-stack-md p-10 border border-outline-variant/30 rounded-lg bg-surface-container-lowest transition-colors duration-200 hover:border-primary/40"
                        >
                            <MaterialIcon name="menu_book" size={28} className="text-primary" />
                            <h3 className="font-headline-md text-headline-md text-primary">
                                Tax education
                            </h3>
                            <p className="font-body-md text-body-md text-on-surface-variant flex-grow">
                                Understand tax brackets, deductions vs credits, and
                                business vs personal tax strategies.
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
