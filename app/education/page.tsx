"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Container } from "@/components/ds/container"
import { Section } from "@/components/ds/section"
import { Eyebrow } from "@/components/ds/eyebrow"
import { MaterialIcon } from "@/components/ds/material-icon"
import FinancialEducationHub from "@/components/financial-education-hub"

const TOPICS = [
    {
        id: "credit",
        icon: "credit_card",
        title: "Credit & Debt",
        bullets: ["Understanding credit scores", "How to improve credit", "Debt payoff strategies"],
    },
    {
        id: "investing",
        icon: "trending_up",
        title: "Investing",
        bullets: ["What are stocks & bonds?", "Risk vs reward explained", "Portfolio diversification"],
    },
    {
        id: "budgeting",
        icon: "pie_chart",
        title: "Budgeting",
        bullets: ["Creating a budget", "Tracking expenses", "Emergency fund planning"],
    },
    {
        id: "retirement",
        icon: "savings",
        title: "Retirement",
        bullets: ["401(k) vs IRA explained", "Compound interest power", "Retirement calculators"],
    },
    {
        id: "taxes",
        icon: "receipt_long",
        title: "Tax Planning",
        bullets: ["Understanding tax brackets", "Deductions vs credits", "Business vs personal taxes"],
    },
] as const

export default function EducationPage() {
    const [activeSection, setActiveSection] = useState("")
    const [selectedTopic, setSelectedTopic] = useState("credit")

    const handleSectionClick = (section: string, topic?: string) => {
        setActiveSection(section)
        if (topic) setSelectedTopic(topic)
    }

    const handleBack = () => setActiveSection("")

    if (activeSection === "financial-education") {
        return <FinancialEducationHub onBack={handleBack} initialTopic={selectedTopic} />
    }

    return (
        <div className="flex flex-col">
            <Section spacing="loose" className="pt-section-gap-sm">
                <Container className="flex flex-col gap-stack-lg max-w-3xl">
                    <Eyebrow>Education</Eyebrow>
                    <h1 className="font-headline-display text-[56px] leading-[1.1] tracking-[-0.02em] text-primary">
                        Build financial confidence
                    </h1>
                    <p className="font-body-lg text-body-lg text-on-surface-variant max-w-prose">
                        Master personal finance fundamentals with clear explanations,
                        worked examples, and the math behind every concept.
                    </p>
                </Container>
            </Section>

            <Section spacing="default">
                <Container>
                    <div className="grid grid-cols-3 gap-gutter">
                        {TOPICS.map((topic) => (
                            <button
                                key={topic.id}
                                type="button"
                                onClick={() => handleSectionClick("financial-education", topic.id)}
                                className="group flex flex-col gap-stack-md p-10 border border-outline-variant/30 rounded-lg bg-surface-container-lowest text-left transition-colors duration-200 hover:border-primary/40"
                            >
                                <MaterialIcon name={topic.icon} size={28} className="text-primary" />
                                <h3 className="font-headline-md text-headline-md text-primary">
                                    {topic.title}
                                </h3>
                                <ul className="flex flex-col gap-1 flex-grow">
                                    {topic.bullets.map((b) => (
                                        <li
                                            key={b}
                                            className="font-body-md text-sm text-on-surface-variant"
                                        >
                                            {b}
                                        </li>
                                    ))}
                                </ul>
                                <span className="inline-flex items-center gap-stack-sm pt-stack-sm font-ui-button text-ui-button uppercase tracking-[0.05em] text-primary">
                                    Learn more
                                    <MaterialIcon
                                        name="arrow_forward"
                                        size={16}
                                        className="transition-transform duration-200 group-hover:translate-x-0.5"
                                    />
                                </span>
                            </button>
                        ))}
                    </div>
                </Container>
            </Section>
        </div>
    )
}
