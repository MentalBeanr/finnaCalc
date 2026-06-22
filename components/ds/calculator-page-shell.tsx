import * as React from "react"
import Link from "next/link"
import { Container } from "@/components/ds/container"
import { Section } from "@/components/ds/section"
import { Eyebrow } from "@/components/ds/eyebrow"
import { SectionHeading } from "@/components/ds/section-heading"
import { Chip } from "@/components/ds/chip"
import { MaterialIcon } from "@/components/ds/material-icon"
import { FaqItem } from "@/components/ds/faq-item"

export interface CalculatorFaqEntry {
    question: string
    answer: React.ReactNode
}

export interface CalculatorPageShellProps {
    eyebrow?: string
    title: string
    description: string
    category?: string
    estimatedMinutes?: number
    backHref?: string
    form: React.ReactNode
    result: React.ReactNode
    chart?: React.ReactNode
    formula?: {
        eyebrow?: string
        title?: string
        children: React.ReactNode
    }
    education?: {
        eyebrow?: string
        title?: string
        children: React.ReactNode
    }
    faq?: {
        eyebrow?: string
        title?: string
        description?: string
        items: ReadonlyArray<CalculatorFaqEntry>
    }
}

export function CalculatorPageShell({
    eyebrow,
    title,
    description,
    category,
    estimatedMinutes,
    backHref,
    form,
    result,
    chart,
    formula,
    education,
    faq,
}: CalculatorPageShellProps) {
    return (
        <div className="flex flex-col">
            <Section spacing="default" className="pt-section-gap-sm pb-0">
                <Container className="flex flex-col gap-stack-lg">
                    {backHref ? (
                        <Link
                            href={backHref}
                            className="inline-flex items-center gap-stack-sm self-start font-ui-button text-ui-button uppercase tracking-[0.05em] text-on-surface-variant hover:text-primary transition-colors"
                        >
                            <MaterialIcon name="arrow_back" size={16} />
                            Back
                        </Link>
                    ) : null}
                    {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
                    <h1 className="font-headline-display text-[64px] leading-[1.1] tracking-[-0.02em] text-primary max-w-4xl">
                        {title}
                    </h1>
                    <p className="font-body-lg text-body-lg text-on-surface-variant max-w-prose">
                        {description}
                    </p>
                    {category || estimatedMinutes ? (
                        <div className="flex flex-wrap gap-stack-sm pt-stack-sm">
                            {category ? <Chip tone="primary">{category}</Chip> : null}
                            {estimatedMinutes ? (
                                <Chip>{estimatedMinutes} min calculation</Chip>
                            ) : null}
                        </div>
                    ) : null}
                </Container>
            </Section>

            <Section spacing="default">
                <Container className="grid grid-cols-12 gap-gutter items-stretch">
                    <div className="col-span-7">
                        <div className="border border-outline-variant/30 rounded-lg bg-surface-container-lowest h-full">
                            {form}
                        </div>
                    </div>
                    <div className="col-span-5">
                        <div className="border border-outline-variant/30 rounded-lg bg-surface-container-lowest h-full">
                            {result}
                        </div>
                    </div>
                </Container>
            </Section>

            {chart ? (
                <Section spacing="default" className="pt-0">
                    <Container>{chart}</Container>
                </Section>
            ) : null}

            {formula ? (
                <Section spacing="default">
                    <Container className="flex flex-col gap-stack-lg">
                        <SectionHeading
                            eyebrow={formula.eyebrow ?? "Formula"}
                            title={formula.title ?? "How it's calculated"}
                        />
                        <div className="pt-stack-md">{formula.children}</div>
                    </Container>
                </Section>
            ) : null}

            {education ? (
                <Section spacing="default">
                    <Container className="flex flex-col gap-stack-lg">
                        <SectionHeading
                            eyebrow={education.eyebrow ?? "Education"}
                            title={education.title ?? "What to know"}
                        />
                        <div className="pt-stack-md font-body-md text-body-md text-on-surface-variant max-w-3xl flex flex-col gap-stack-md">
                            {education.children}
                        </div>
                    </Container>
                </Section>
            ) : null}

            {faq ? (
                <Section spacing="default">
                    <Container className="grid grid-cols-12 gap-gutter">
                        <div className="col-span-4 flex flex-col gap-stack-md">
                            <Eyebrow>{faq.eyebrow ?? "FAQ"}</Eyebrow>
                            <h2 className="font-headline-lg text-headline-lg text-primary">
                                {faq.title ?? "Common questions"}
                            </h2>
                            {faq.description ? (
                                <p className="font-body-md text-body-md text-on-surface-variant max-w-prose">
                                    {faq.description}
                                </p>
                            ) : null}
                        </div>
                        <div className="col-span-8">
                            {faq.items.map((item, idx) => (
                                <FaqItem
                                    key={item.question}
                                    question={item.question}
                                    defaultOpen={idx === 0}
                                >
                                    {item.answer}
                                </FaqItem>
                            ))}
                        </div>
                    </Container>
                </Section>
            ) : null}
        </div>
    )
}
