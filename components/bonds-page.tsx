"use client"

import { Container } from "@/components/ds/container"
import { Section } from "@/components/ds/section"
import { MaterialIcon } from "@/components/ds/material-icon"

interface BondsPageProps {
    onBack: () => void
}

export default function BondsPage({ onBack }: BondsPageProps) {
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
                        Bonds
                    </h1>
                    <p className="font-body-lg text-body-lg text-on-surface-variant max-w-prose">
                        Fixed-income investments that pay predictable interest over time.
                    </p>
                </Container>
            </Section>

            <Section spacing="default">
                <Container>
                    <div className="border border-outline-variant/30 rounded-lg bg-surface-container-lowest p-10">
                        <p className="font-body-md text-body-md text-on-surface-variant">
                            Bond investing content coming soon.
                        </p>
                    </div>
                </Container>
            </Section>
        </div>
    )
}
