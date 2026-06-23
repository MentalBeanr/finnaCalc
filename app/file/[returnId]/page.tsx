import Link from "next/link"
import { notFound } from "next/navigation"
import { getCurrentUser } from "@/lib/server/auth"
import { getReturn, getReturnSummary } from "@/lib/server/returns"
import { canDelete, formatCents, returnStateLabel } from "@/lib/returns-shared"
import { Container } from "@/components/ds/container"
import { Section } from "@/components/ds/section"
import { MaterialIcon } from "@/components/ds/material-icon"
import { ReturnOverviewClient } from "./return-overview-client"

export const dynamic = "force-dynamic"

export default async function ReturnOverviewPage({
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
                        Sign in to view this return
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

    const summary = await getReturnSummary(ret.id)
    const basicsComplete = Boolean(ret.filingStatus && ret.stateOfResidence)

    const nextAction =
        ret.state === "draft"
            ? { toState: "ready_to_review", label: "Mark ready for review" }
            : ret.state === "ready_to_review"
              ? { toState: "ready_to_file", label: "Mark ready to file" }
              : null

    return (
        <div className="flex flex-col">
            <Section spacing="default" className="pt-section-gap-sm pb-0">
                <Container className="flex flex-col gap-stack-lg">
                    <Link
                        href="/file"
                        className="inline-flex items-center gap-stack-sm self-start font-ui-button text-ui-button uppercase tracking-[0.05em] text-on-surface-variant hover:text-primary transition-colors"
                    >
                        <MaterialIcon name="arrow_back" size={16} />
                        All returns
                    </Link>
                    <div className="flex items-center gap-stack-md">
                        <h1 className="font-headline-display text-[56px] leading-[1.1] tracking-[-0.02em] text-primary">
                            {ret.taxYear} Federal Return
                        </h1>
                        <span className="font-label-caps text-label-caps uppercase tracking-[0.15em] text-on-surface-variant border border-outline-variant/40 rounded-full px-3 py-1">
                            {returnStateLabel(ret.state)}
                        </span>
                    </div>
                </Container>
            </Section>

            <Section spacing="default">
                <Container className="flex flex-col gap-gutter">
                    {/* Summary tiles */}
                    <div className="grid grid-cols-3 gap-gutter">
                        <SummaryTile
                            icon="payments"
                            label="Income sources"
                            value={String(summary.incomeCount)}
                            sub={formatCents(summary.incomeTotalCents)}
                        />
                        <SummaryTile
                            icon="receipt"
                            label="Deductions"
                            value={String(summary.deductionCount)}
                            sub={formatCents(summary.deductionTotalCents)}
                        />
                        <SummaryTile
                            icon="redeem"
                            label="Credits"
                            value={String(summary.creditCount)}
                            sub="claimed"
                        />
                    </div>

                    <ReturnOverviewClient
                        returnId={ret.id}
                        state={ret.state}
                        filingStatus={ret.filingStatus}
                        stateOfResidence={ret.stateOfResidence}
                        canDelete={canDelete(ret.state)}
                        nextAction={nextAction}
                        basicsComplete={basicsComplete}
                    />

                    {/* Interview entry point (built in a later phase). */}
                    <div className="border border-dashed border-outline-variant/40 rounded-lg p-8 flex items-center gap-stack-md">
                        <MaterialIcon name="forum" size={24} className="text-on-surface-variant" />
                        <div>
                            <p className="font-body-md text-body-md text-on-surface font-semibold">
                                Guided interview
                            </p>
                            <p className="font-body-md text-body-md text-on-surface-variant">
                                Step-by-step entry of income, deductions, and credits is coming next.
                            </p>
                        </div>
                    </div>
                </Container>
            </Section>
        </div>
    )
}

function SummaryTile({
    icon,
    label,
    value,
    sub,
}: {
    icon: string
    label: string
    value: string
    sub: string
}) {
    return (
        <div className="border border-outline-variant/30 rounded-lg bg-surface-container-lowest p-8 flex flex-col gap-stack-sm">
            <MaterialIcon name={icon} size={24} className="text-primary" />
            <p className="font-headline-md text-[32px] leading-none text-primary">{value}</p>
            <p className="font-ui-button text-ui-button uppercase tracking-[0.05em] text-on-surface-variant">
                {label}
            </p>
            <p className="font-body-md text-body-md text-on-surface-variant">{sub}</p>
        </div>
    )
}
