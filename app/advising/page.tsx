import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Container } from "@/components/ds/container"
import { Section } from "@/components/ds/section"
import { Eyebrow } from "@/components/ds/eyebrow"
import { MaterialIcon } from "@/components/ds/material-icon"

const COMING_FEATURES = [
    { icon: "smart_toy", label: "AI-powered financial planning" },
    { icon: "savings", label: "Personalized budget recommendations" },
    { icon: "account_balance", label: "Debt consolidation strategies" },
    { icon: "elderly", label: "Retirement planning guidance" },
    { icon: "receipt_long", label: "Tax optimization strategies" },
    { icon: "trending_up", label: "Business growth financial planning" },
] as const

export default function AdvisingPage() {
    return (
        <div className="flex flex-col">
            <Section spacing="loose" className="pt-section-gap-sm">
                <Container className="flex flex-col gap-stack-lg max-w-3xl">
                    <Eyebrow>Premium · Coming Soon</Eyebrow>
                    <h1 className="font-headline-display text-[56px] leading-[1.1] tracking-[-0.02em] text-primary">
                        Personal Financial Advising
                    </h1>
                    <p className="font-body-lg text-body-lg text-on-surface-variant max-w-prose">
                        Personalized guidance and advisory services — built on the same
                        deterministic math as the calculators, with a human layer on top.
                        Launching in the premium tier.
                    </p>
                </Container>
            </Section>

            <Section spacing="default">
                <Container>
                    <div className="grid grid-cols-12 gap-gutter">
                        <div className="col-span-5 flex flex-col gap-stack-md">
                            <Eyebrow>What&apos;s coming</Eyebrow>
                            <h2 className="font-headline-lg text-headline-lg text-primary">
                                Premium advisory features
                            </h2>
                            <p className="font-body-md text-body-md text-on-surface-variant">
                                A suite of tools that go beyond calculation — into recommendation
                                and planning with real context about your situation.
                            </p>
                        </div>
                        <div className="col-span-7">
                            <ul className="flex flex-col gap-stack-md">
                                {COMING_FEATURES.map((f) => (
                                    <li
                                        key={f.label}
                                        className="flex items-center gap-stack-md py-4 border-b border-outline-variant/20 last:border-b-0"
                                    >
                                        <MaterialIcon
                                            name={f.icon}
                                            size={20}
                                            className="text-primary shrink-0"
                                        />
                                        <span className="font-body-md text-body-md text-on-background">
                                            {f.label}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </Container>
            </Section>

            <Section spacing="default">
                <Container className="flex flex-col gap-stack-md">
                    <p className="font-body-md text-body-md text-on-surface-variant">
                        In the meantime, start with the free calculators:
                    </p>
                    <div className="flex gap-stack-md">
                        <Button asChild>
                            <Link href="/">View all calculators</Link>
                        </Button>
                        <Button asChild variant="outline">
                            <Link href="/emergency-fund-calculator">Emergency Fund Calculator</Link>
                        </Button>
                    </div>
                </Container>
            </Section>
        </div>
    )
}
