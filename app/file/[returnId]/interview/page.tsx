import Link from "next/link"
import { notFound } from "next/navigation"
import { computeFederalReturn } from "@/tax-engine"
import { getCurrentUser } from "@/lib/server/auth"
import { getReturn } from "@/lib/server/returns"
import { getQualifyingChildren, listIncome } from "@/lib/server/return-inputs"
import { mapToFederalInput } from "@/lib/interview-shared"
import { Container } from "@/components/ds/container"
import { Section } from "@/components/ds/section"
import { MaterialIcon } from "@/components/ds/material-icon"
import { InterviewClient, type EstimateView, type IncomeRow } from "./interview-client"

export const dynamic = "force-dynamic"

export default async function InterviewPage({
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
                        Sign in to continue your return
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

    const incomeRows = await listIncome(user.id, returnId)
    const numChildren = await getQualifyingChildren(user.id, returnId)

    const income: IncomeRow[] = incomeRows.map((r) => ({
        id: r.id,
        type: r.type,
        amountCents: r.amountCents,
        withholdingCents: r.withholdingCents,
    }))

    // Live estimate, computed server-side via the engine (ephemeral — not persisted).
    const fedInput = mapToFederalInput({
        filingStatus: ret.filingStatus,
        income,
        numChildren,
    })
    let estimate: EstimateView | null = null
    if (fedInput) {
        const r = computeFederalReturn(fedInput)
        estimate = {
            agiCents: r.agiCents,
            taxableIncomeCents: r.taxableIncomeCents,
            taxAfterCreditsCents: r.taxAfterCreditsCents,
            withholdingCents: r.withholdingCents,
            refundOrDueCents: r.refundOrDueCents,
            marginalRateBp: r.marginalRateBp,
        }
    }

    return (
        <div className="flex flex-col">
            <Section spacing="default" className="pt-section-gap-sm pb-0">
                <Container className="flex flex-col gap-stack-lg">
                    <Link
                        href={`/file/${ret.id}`}
                        className="inline-flex items-center gap-stack-sm self-start font-ui-button text-ui-button uppercase tracking-[0.05em] text-on-surface-variant hover:text-primary transition-colors"
                    >
                        <MaterialIcon name="arrow_back" size={16} />
                        Return overview
                    </Link>
                    <h1 className="font-headline-display text-[56px] leading-[1.1] tracking-[-0.02em] text-primary">
                        {ret.taxYear} Interview
                    </h1>
                    <p className="font-body-lg text-body-lg text-on-surface-variant max-w-prose">
                        Answer a few questions and watch your estimate update in real time.
                    </p>
                </Container>
            </Section>

            <Section spacing="default">
                <Container>
                    <InterviewClient
                        returnId={ret.id}
                        filingStatus={ret.filingStatus}
                        income={income}
                        numChildren={numChildren}
                        estimate={estimate}
                    />
                </Container>
            </Section>
        </div>
    )
}
