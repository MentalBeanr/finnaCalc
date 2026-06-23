import Link from "next/link"
import { notFound } from "next/navigation"
import { getCurrentUser } from "@/lib/server/auth"
import { getReturn } from "@/lib/server/returns"
import { getConsents, getLatestFiling } from "@/lib/server/filing"
import { CONSENT_ITEMS, filingStateLabel, rejectMessage } from "@/lib/filing-shared"
import { Container } from "@/components/ds/container"
import { Section } from "@/components/ds/section"
import { MaterialIcon } from "@/components/ds/material-icon"
import { ConsentStep, ReopenButton, SignStep, SubmitStep } from "./filing-client"

export const dynamic = "force-dynamic"

export default async function FilingPage({
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
                        Sign in to file
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

    const consents = await getConsents(user.id, returnId)
    const filing = await getLatestFiling(user.id, returnId)

    const consentsDone = consents.length >= CONSENT_ITEMS.length
    // Use return state only — a reopened-after-rejection return goes back to draft
    // and its old filing record must not keep it in a terminal display.
    const terminal = ["submitted", "accepted", "rejected"].includes(ret.state)

    return (
        <div className="flex flex-col">
            <Section spacing="default" className="pt-section-gap-sm pb-0">
                <Container className="flex flex-col gap-stack-lg">
                    <Link
                        href={`/file/${ret.id}/payment`}
                        className="inline-flex items-center gap-stack-sm self-start font-ui-button text-ui-button uppercase tracking-[0.05em] text-on-surface-variant hover:text-primary transition-colors"
                    >
                        <MaterialIcon name="arrow_back" size={16} />
                        Payment
                    </Link>
                    <h1 className="font-headline-display text-[56px] leading-[1.1] tracking-[-0.02em] text-primary">
                        File your return
                    </h1>
                </Container>
            </Section>

            <Section spacing="default">
                <Container className="flex flex-col gap-gutter max-w-2xl">
                    {/* Terminal status */}
                    {terminal && filing ? (
                        <FilingStatus
                            state={filing.state}
                            ackCode={filing.ackCode}
                            rejectCodes={filing.rejectCodes as { code: string; desc: string }[] | null}
                            returnId={ret.id}
                        />
                    ) : ret.state === "draft" || ret.state === "ready_to_review" ? (
                        // Not yet reviewed.
                        <div className="border border-outline-variant/30 rounded-lg bg-surface-container-lowest p-10 flex flex-col gap-stack-md">
                            <p className="font-body-md text-body-md text-on-surface">
                                Finish reviewing your return before filing.
                            </p>
                            <Link
                                href={`/file/${ret.id}/review`}
                                className="inline-flex items-center gap-stack-sm self-start px-6 py-3 rounded-full bg-primary text-on-primary font-ui-button text-ui-button uppercase tracking-[0.05em] hover:opacity-90 transition-opacity"
                            >
                                Go to review
                                <MaterialIcon name="arrow_forward" size={16} />
                            </Link>
                        </div>
                    ) : !consentsDone ? (
                        <ConsentStep returnId={ret.id} />
                    ) : ret.state !== "signed" ? (
                        <SignStep returnId={ret.id} />
                    ) : (
                        <SubmitStep returnId={ret.id} />
                    )}
                </Container>
            </Section>
        </div>
    )
}

function FilingStatus({
    state,
    ackCode,
    rejectCodes,
    returnId,
}: {
    state: string
    ackCode: string | null
    rejectCodes: { code: string; desc: string }[] | null
    returnId: string
}) {
    const accepted = state === "accepted" || state === "imperfect"
    const rejected = state === "rejected"

    return (
        <div className="flex flex-col gap-gutter">
            <div
                className={`border rounded-lg p-10 flex flex-col gap-stack-md ${
                    accepted
                        ? "border-success/30 bg-success/5"
                        : rejected
                          ? "border-error/30 bg-error/5"
                          : "border-outline-variant/30 bg-surface-container-lowest"
                }`}
            >
                <div className="flex items-center gap-stack-md">
                    <MaterialIcon
                        name={accepted ? "check_circle" : rejected ? "error" : "schedule"}
                        size={28}
                        className={accepted ? "text-success" : rejected ? "text-error" : "text-on-surface-variant"}
                    />
                    <h2 className="font-headline-md text-headline-md text-primary">
                        {filingStateLabel(state)}
                    </h2>
                </div>
                {accepted && (
                    <p className="font-body-md text-body-md text-on-surface-variant">
                        Your federal return was accepted by the IRS{ackCode ? ` (${ackCode})` : ""}.
                    </p>
                )}
                {rejected && (
                    <div className="flex flex-col gap-stack-md">
                        <p className="font-body-md text-body-md text-on-surface-variant">
                            The IRS found issues with your return. Correct the errors below and
                            resubmit — you&apos;ll go through the sign &amp; file steps again.
                        </p>
                        <ul className="flex flex-col gap-stack-sm">
                            {(rejectCodes ?? []).map((r) => (
                                <li
                                    key={r.code}
                                    className="flex gap-stack-md items-start rounded-lg border border-error/20 bg-error/5 p-4"
                                >
                                    <MaterialIcon
                                        name="report"
                                        size={18}
                                        className="text-error shrink-0 mt-0.5"
                                    />
                                    <div className="flex flex-col gap-0.5">
                                        <p className="font-ui-button text-ui-button uppercase tracking-[0.05em] text-error">
                                            {r.code}
                                        </p>
                                        <p className="font-body-md text-body-md text-on-surface">
                                            {rejectMessage(r.code)}
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                        <ReopenButton returnId={returnId} />
                    </div>
                )}
            </div>
        </div>
    )
}
