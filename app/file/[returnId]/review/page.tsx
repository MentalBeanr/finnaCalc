import Link from "next/link"
import { notFound } from "next/navigation"
import { getCurrentUser } from "@/lib/server/auth"
import { getReturn } from "@/lib/server/returns"
import { listIncome, getQualifyingChildren } from "@/lib/server/return-inputs"
import { computeForReturn, getLatestCalculation } from "@/lib/server/federal-support"
import {
    buildFederalBreakdown,
    federalReviewDiagnostics,
} from "@/lib/federal-support-shared"
import { formatCents } from "@/lib/returns-shared"
import { Container } from "@/components/ds/container"
import { Section } from "@/components/ds/section"
import { MaterialIcon } from "@/components/ds/material-icon"
import { ReviewActions } from "./review-actions-client"

export const dynamic = "force-dynamic"

export default async function ReviewPage({
    params,
}: {
    params: Promise<{ returnId: string }>
}) {
    const { returnId } = await params
    const user = await getCurrentUser()

    if (!user) {
        return (
            <Section spacing="default" className="pt-section-gap-sm">
                <Container className="flex flex-col items-center text-center gap-stack-lg max-w-xl">
                    <h1 className="font-headline-display text-[40px] leading-[1.1] tracking-[-0.02em] text-primary">
                        Sign in to review your return
                    </h1>
                    <Link
                        href="/sign-in"
                        className="inline-flex items-center gap-stack-sm px-6 py-3 rounded-full bg-primary text-on-primary font-ui-button text-ui-button uppercase tracking-[0.05em] hover:opacity-90 transition-opacity"
                    >
                        Sign In
                    </Link>
                </Container>
            </Section>
        )
    }

    const ret = await getReturn(user.id, returnId)
    if (!ret) notFound()

    const income = await listIncome(user.id, returnId)
    const numChildren = await getQualifyingChildren(user.id, returnId)
    const result = await computeForReturn(user.id, returnId)
    const latest = await getLatestCalculation(user.id, returnId)

    const diagnostics = federalReviewDiagnostics({
        filingStatus: ret.filingStatus,
        incomeCount: income.length,
    })
    const hasErrors = diagnostics.some((d) => d.severity === "error")
    const breakdown = result ? buildFederalBreakdown(result) : []
    const owes = result ? result.refundOrDueCents < 0 : false
    const alreadyReadyToFile = ["ready_to_file", "signed", "submitted", "accepted"].includes(
        ret.state,
    )

    return (
        <div className="flex flex-col">
            <Section spacing="default" className="pt-section-gap-sm pb-0">
                <Container className="flex flex-col gap-stack-lg">
                    <Link
                        href={`/file/${ret.id}/interview`}
                        className="inline-flex items-center gap-stack-sm self-start font-ui-button text-ui-button uppercase tracking-[0.05em] text-on-surface-variant hover:text-primary transition-colors"
                    >
                        <MaterialIcon name="arrow_back" size={16} />
                        Interview
                    </Link>
                    <h1 className="font-headline-display text-[56px] leading-[1.1] tracking-[-0.02em] text-primary">
                        Review &amp; file
                    </h1>
                    <p className="font-body-lg text-body-lg text-on-surface-variant max-w-prose">
                        Review your {ret.taxYear} federal return summary before filing.
                    </p>
                </Container>
            </Section>

            <Section spacing="default">
                <Container className="flex flex-col gap-gutter">
                    {/* Diagnostics */}
                    {diagnostics.length > 0 && (
                        <div className="flex flex-col gap-stack-sm">
                            {diagnostics.map((d) => (
                                <div
                                    key={d.code}
                                    className="flex items-start gap-stack-md p-4 rounded-lg border border-error/30 bg-error/5"
                                >
                                    <MaterialIcon
                                        name="error"
                                        size={20}
                                        className="text-error mt-0.5 flex-shrink-0"
                                    />
                                    <p className="font-body-md text-body-md text-on-surface">
                                        {d.message}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Summary */}
                    {result && (
                        <div className="border border-outline-variant/30 rounded-lg bg-surface-container-lowest p-10 flex flex-col gap-stack-lg">
                            <h2 className="font-headline-md text-headline-md text-primary">
                                Federal tax summary
                            </h2>
                            <div className="flex flex-col divide-y divide-outline-variant/20">
                                {breakdown.map((row) => (
                                    <div
                                        key={row.label}
                                        className="flex items-center justify-between py-stack-md"
                                    >
                                        <span
                                            className={`font-body-md text-body-md ${
                                                row.emphasis
                                                    ? "text-on-surface font-semibold"
                                                    : "text-on-surface-variant"
                                            }`}
                                        >
                                            {row.label}
                                        </span>
                                        <span
                                            className={`font-body-md text-body-md ${
                                                row.emphasis ? "text-on-surface font-semibold" : "text-on-surface"
                                            }`}
                                        >
                                            {row.negative ? "−" : ""}
                                            {formatCents(row.valueCents)}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div
                                className={`flex items-center justify-between p-4 rounded-lg ${
                                    owes ? "bg-error/10" : "bg-success/10"
                                }`}
                            >
                                <span className="font-body-md text-body-md text-on-surface font-semibold">
                                    {owes ? "Amount you owe" : "Your refund"}
                                </span>
                                <span
                                    className={`font-headline-md text-[28px] font-bold ${
                                        owes ? "text-error" : "text-success"
                                    }`}
                                >
                                    {formatCents(Math.abs(result.refundOrDueCents))}
                                </span>
                            </div>

                            <p className="font-label-caps uppercase tracking-[0.15em] text-[10px] text-on-surface-variant">
                                Federal only · standard deduction · estimate
                                {latest
                                    ? ` · last saved ${new Date(
                                          latest.computedAt as unknown as string,
                                      ).toLocaleString("en-US")}`
                                    : ""}
                            </p>
                        </div>
                    )}

                    {/* Advance */}
                    <ReviewActions
                        returnId={ret.id}
                        canAdvance={!hasErrors && Boolean(result)}
                        alreadyReadyToFile={alreadyReadyToFile}
                    />

                    {/* Continue to payment */}
                    <Link
                        href={`/file/${ret.id}/payment`}
                        className="border border-outline-variant/30 rounded-lg bg-surface-container-lowest p-8 flex items-center justify-between hover:border-primary/40 transition-colors group"
                    >
                        <div className="flex items-center gap-stack-md">
                            <MaterialIcon name="payments" size={24} className="text-primary" />
                            <div>
                                <p className="font-body-md text-body-md text-on-surface font-semibold">
                                    Continue to payment
                                </p>
                                <p className="font-body-md text-body-md text-on-surface-variant">
                                    Review pricing before you file — federal is free
                                </p>
                            </div>
                        </div>
                        <MaterialIcon
                            name="chevron_right"
                            size={20}
                            className="text-on-surface-variant group-hover:text-primary transition-colors"
                        />
                    </Link>
                </Container>
            </Section>
        </div>
    )
}
