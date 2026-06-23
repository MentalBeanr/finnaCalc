import { Container } from "@/components/ds/container"
import { Section } from "@/components/ds/section"
import { Eyebrow } from "@/components/ds/eyebrow"
import { SectionHeading } from "@/components/ds/section-heading"
import { MaterialIcon } from "@/components/ds/material-icon"

const VALUES = [
    {
        icon: "verified",
        title: "Accuracy",
        body: "Every calculation is decimal-safe and test-covered. We don't float-round your money.",
    },
    {
        icon: "public",
        title: "Accessibility",
        body: "Free tools for everyone — no paywall on the math that matters most.",
    },
    {
        icon: "insights",
        title: "Transparency",
        body: "Formulas are textbook. The methodology is visible. You can verify every output.",
    },
    {
        icon: "cached",
        title: "Continuous improvement",
        body: "Tax rates, formulas, and UX are updated as regulations and user needs evolve.",
    },
] as const

const WHAT_WE_OFFER = [
    {
        icon: "calculate",
        title: "Business calculators",
        body: "Startup costs, break-even, ROI, cash flow, pricing, and hiring analysis — the numbers operators reach for first.",
    },
    {
        icon: "person",
        title: "Personal finance",
        body: "Loan amortization, tax estimation, emergency fund sizing, investment projections, and budget planning.",
    },
    {
        icon: "lock",
        title: "Privacy by default",
        body: "All calculations run locally in your browser. Nothing is transmitted or stored on our servers.",
    },
] as const

export default function AboutPage() {
    return (
        <div className="flex flex-col">
            <Section spacing="loose" className="pt-section-gap-sm">
                <Container className="flex flex-col gap-stack-lg max-w-3xl">
                    <Eyebrow>About FinnaCalc</Eyebrow>
                    <h1 className="font-headline-display text-[56px] leading-[1.1] tracking-[-0.02em] text-primary">
                        Empowering smarter financial decisions
                    </h1>
                    <p className="font-body-lg text-body-lg text-on-surface-variant max-w-prose">
                        FinnaCalc provides editorial-grade financial calculators and
                        planning tools built on deterministic, decimal-safe math — for
                        individuals, families, and businesses making decisions that matter.
                    </p>
                </Container>
            </Section>

            <Section spacing="default">
                <Container className="flex flex-col gap-stack-lg">
                    <SectionHeading eyebrow="Mission & Vision" title="Why FinnaCalc exists" />
                    <div className="grid grid-cols-2 gap-gutter">
                        <div className="flex flex-col gap-stack-md p-10 border border-outline-variant/30 rounded-lg bg-surface-container-lowest">
                            <MaterialIcon name="flag" size={28} className="text-primary" />
                            <h3 className="font-headline-md text-headline-md text-primary">Our mission</h3>
                            <p className="font-body-md text-body-md text-on-surface-variant">
                                To democratize financial planning by providing free, accurate, and
                                easy-to-use calculators that empower everyone to make better
                                decisions — regardless of background or experience level.
                            </p>
                        </div>
                        <div className="flex flex-col gap-stack-md p-10 border border-outline-variant/30 rounded-lg bg-surface-container-lowest">
                            <MaterialIcon name="visibility" size={28} className="text-primary" />
                            <h3 className="font-headline-md text-headline-md text-primary">Our vision</h3>
                            <p className="font-body-md text-body-md text-on-surface-variant">
                                To become the most trusted platform for financial calculations
                                — helping millions achieve their goals through informed,
                                math-backed decisions rather than guesswork.
                            </p>
                        </div>
                    </div>
                </Container>
            </Section>

            <Section spacing="default">
                <Container className="flex flex-col gap-stack-lg">
                    <SectionHeading eyebrow="What We Offer" title="Tools built for real decisions" />
                    <div className="grid grid-cols-3 gap-gutter">
                        {WHAT_WE_OFFER.map((item) => (
                            <div
                                key={item.title}
                                className="flex flex-col gap-stack-md p-10 border border-outline-variant/30 rounded-lg bg-surface-container-lowest"
                            >
                                <MaterialIcon name={item.icon} size={28} className="text-primary" />
                                <h3 className="font-headline-md text-headline-md text-primary">{item.title}</h3>
                                <p className="font-body-md text-body-md text-on-surface-variant">{item.body}</p>
                            </div>
                        ))}
                    </div>
                </Container>
            </Section>

            <Section spacing="default">
                <Container className="flex flex-col gap-stack-lg">
                    <SectionHeading eyebrow="Core Values" title="What we stand for" />
                    <div className="grid grid-cols-4 gap-gutter">
                        {VALUES.map((v) => (
                            <div key={v.title} className="flex flex-col gap-stack-md">
                                <MaterialIcon name={v.icon} size={24} className="text-primary" />
                                <h4 className="font-headline-md text-[20px] leading-[1.3] text-primary">{v.title}</h4>
                                <p className="font-body-md text-body-md text-on-surface-variant">{v.body}</p>
                            </div>
                        ))}
                    </div>
                </Container>
            </Section>

            <Section spacing="default">
                <Container className="flex flex-col gap-stack-lg">
                    <SectionHeading eyebrow="Contact" title="Get in touch" />
                    <div className="flex flex-col gap-stack-sm">
                        <p className="font-body-md text-body-md text-on-surface-variant max-w-prose">
                            Questions, suggestions, or feedback — we&apos;d love to hear from you.
                        </p>
                        <div className="flex flex-col gap-stack-sm pt-stack-md">
                            <span className="font-body-md text-body-md text-on-surface-variant">
                                Help &amp; Assistance:{" "}
                                <a
                                    href="mailto:helpfinnacalc@gmail.com"
                                    className="text-primary underline-offset-2 hover:underline"
                                >
                                    helpfinnacalc@gmail.com
                                </a>
                            </span>
                            <span className="font-body-md text-body-md text-on-surface-variant">
                                Business Inquiries:{" "}
                                <a
                                    href="mailto:finnacalc@gmail.com"
                                    className="text-primary underline-offset-2 hover:underline"
                                >
                                    finnacalc@gmail.com
                                </a>
                            </span>
                        </div>
                    </div>
                </Container>
            </Section>
        </div>
    )
}
