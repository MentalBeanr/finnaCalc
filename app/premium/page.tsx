"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Container } from "@/components/ds/container"
import { Section } from "@/components/ds/section"
import { Eyebrow } from "@/components/ds/eyebrow"
import { SectionHeading } from "@/components/ds/section-heading"
import { MaterialIcon } from "@/components/ds/material-icon"

const FEATURES = [
    { icon: "smart_toy", title: "AI-Powered Financial Planning", body: "Context-aware recommendations that adapt to your actual numbers, not generic advice." },
    { icon: "savings", title: "Personalized Budget Coaching", body: "Goal-based nudges and milestone tracking tuned to your income and expense profile." },
    { icon: "account_balance", title: "Debt Strategy Builder", body: "Snowball vs avalanche analysis with payoff projections and interest saved." },
    { icon: "elderly", title: "Retirement Runway", body: "Project savings longevity with customizable withdrawal rates and market scenarios." },
    { icon: "receipt_long", title: "Tax Optimization", body: "Year-round tax planning integrated with your real income and deduction data." },
    { icon: "trending_up", title: "Business Growth Planning", body: "Cash runway, hiring impact, and pricing sensitivity — in one integrated view." },
] as const

export default function PremiumPage() {
    const [email, setEmail] = useState("")
    const [message, setMessage] = useState("")
    const [submitting, setSubmitting] = useState(false)

    const handleJoinWaitlist = async () => {
        setMessage("")
        if (!email) {
            setMessage("Please enter a valid email address.")
            return
        }
        setSubmitting(true)
        try {
            const res = await fetch("/api/send-email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            })
            const data = await res.json()
            if (res.ok) {
                setMessage("You're on the list. A confirmation is on its way.")
                setEmail("")
            } else {
                setMessage(data.error || "Something went wrong. Please try again.")
            }
        } catch {
            setMessage("An unexpected error occurred.")
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="flex flex-col">
            <Section spacing="loose" className="pt-section-gap-sm">
                <Container className="flex flex-col gap-stack-lg max-w-3xl">
                    <Eyebrow>Coming Soon</Eyebrow>
                    <h1 className="font-headline-display text-[56px] leading-[1.1] tracking-[-0.02em] text-primary">
                        FinnaCalc Premium
                    </h1>
                    <p className="font-body-lg text-body-lg text-on-surface-variant max-w-prose">
                        Advanced planning tools, AI-powered recommendations, and
                        full-picture financial coaching — built on the same
                        deterministic math, with a lot more depth.
                    </p>
                    <div className="flex items-center gap-stack-md pt-stack-md">
                        <Input
                            placeholder="your@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="max-w-xs"
                            onKeyDown={(e) => { if (e.key === "Enter") handleJoinWaitlist() }}
                        />
                        <Button onClick={handleJoinWaitlist} disabled={submitting} size="lg">
                            Join the waitlist
                        </Button>
                    </div>
                    {message ? (
                        <p className="font-body-md text-body-md text-on-surface-variant">{message}</p>
                    ) : null}
                    <p className="font-body-md text-sm text-on-surface-variant">
                        No spam. Unsubscribe anytime. Early access members get 60% off forever.
                    </p>
                </Container>
            </Section>

            <Section spacing="default">
                <Container className="flex flex-col gap-stack-lg">
                    <SectionHeading eyebrow="Premium Features" title="What you get" />
                    <div className="grid grid-cols-3 gap-gutter">
                        {FEATURES.map((f) => (
                            <div
                                key={f.title}
                                className="flex flex-col gap-stack-md p-10 border border-outline-variant/30 rounded-lg bg-surface-container-lowest"
                            >
                                <MaterialIcon name={f.icon} size={24} className="text-primary" />
                                <h3 className="font-headline-md text-[20px] leading-[1.3] text-primary">
                                    {f.title}
                                </h3>
                                <p className="font-body-md text-body-md text-on-surface-variant">
                                    {f.body}
                                </p>
                            </div>
                        ))}
                    </div>
                </Container>
            </Section>

            <Section spacing="default">
                <Container className="flex flex-col gap-stack-md">
                    <p className="font-body-md text-body-md text-on-surface-variant">
                        While you wait — all existing calculators are free:
                    </p>
                    <div className="flex gap-stack-md">
                        <Button asChild variant="outline">
                            <Link href="/">Explore free calculators</Link>
                        </Button>
                        <Button asChild variant="outline">
                            <Link href="/about">About FinnaCalc</Link>
                        </Button>
                    </div>
                </Container>
            </Section>
        </div>
    )
}
