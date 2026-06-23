import Link from "next/link"
import { notFound } from "next/navigation"
import { getCurrentUser } from "@/lib/server/auth"
import { getReturn } from "@/lib/server/returns"
import { listPayments } from "@/lib/server/payments"
import { priceReturn } from "@/lib/pricing-shared"
import { formatCents } from "@/lib/returns-shared"
import { Container } from "@/components/ds/container"
import { Section } from "@/components/ds/section"
import { MaterialIcon } from "@/components/ds/material-icon"
import { PayButton } from "./pay-client"

export const dynamic = "force-dynamic"

export default async function PaymentPage({
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
                        Sign in to continue
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

    const pricing = priceReturn({})
    const payments = await listPayments(user.id, returnId)
    const isFree = pricing.totalCents <= 0
    const paid = payments.some((p) => p.kind === "filing_fee" && p.status === "captured")

    return (
        <div className="flex flex-col">
            <Section spacing="default" className="pt-section-gap-sm pb-0">
                <Container className="flex flex-col gap-stack-lg">
                    <Link
                        href={`/file/${ret.id}/review`}
                        className="inline-flex items-center gap-stack-sm self-start font-ui-button text-ui-button uppercase tracking-[0.05em] text-on-surface-variant hover:text-primary transition-colors"
                    >
                        <MaterialIcon name="arrow_back" size={16} />
                        Review
                    </Link>
                    <h1 className="font-headline-display text-[56px] leading-[1.1] tracking-[-0.02em] text-primary">
                        Payment
                    </h1>
                    <p className="font-body-lg text-body-lg text-on-surface-variant max-w-prose">
                        No surprises — here&apos;s exactly what you&apos;ll pay before you file.
                    </p>
                </Container>
            </Section>

            <Section spacing="default">
                <Container className="flex flex-col gap-gutter max-w-2xl">
                    {/* Order summary */}
                    <div className="border border-outline-variant/30 rounded-lg bg-surface-container-lowest p-10 flex flex-col gap-stack-md">
                        <h2 className="font-headline-md text-headline-md text-primary mb-stack-sm">
                            Order summary
                        </h2>
                        <div className="flex flex-col divide-y divide-outline-variant/20">
                            {pricing.items.map((item) => (
                                <div
                                    key={item.label}
                                    className="flex items-center justify-between py-stack-md"
                                >
                                    <span className="font-body-md text-body-md text-on-surface-variant">
                                        {item.label}
                                    </span>
                                    <span className="font-body-md text-body-md text-on-surface">
                                        {item.amountCents === 0 ? "Free" : formatCents(item.amountCents)}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div className="flex items-center justify-between pt-stack-md border-t border-outline-variant/30">
                            <span className="font-body-md text-body-md text-on-surface font-semibold">
                                Total
                            </span>
                            <span className="font-headline-md text-[28px] text-primary">
                                {isFree ? "Free" : formatCents(pricing.totalCents)}
                            </span>
                        </div>
                    </div>

                    {/* Action */}
                    {isFree ? (
                        <div className="border border-outline-variant/30 rounded-lg bg-success/5 p-8 flex items-start gap-stack-md">
                            <MaterialIcon name="check_circle" size={24} className="text-success mt-0.5" />
                            <div className="flex flex-col gap-stack-sm">
                                <p className="font-body-md text-body-md text-on-surface font-semibold">
                                    Your federal return is free to file
                                </p>
                                <p className="font-body-md text-body-md text-on-surface-variant">
                                    No payment is required. Continue to file your return.
                                </p>
                            </div>
                        </div>
                    ) : paid ? (
                        <div className="flex items-center gap-stack-sm font-body-md text-body-md text-success">
                            <MaterialIcon name="check_circle" size={20} />
                            Payment received.
                        </div>
                    ) : (
                        <PayButton returnId={ret.id} label={`Pay ${formatCents(pricing.totalCents)}`} />
                    )}

                    {/* Continue to filing */}
                    <Link
                        href={`/file/${ret.id}/file`}
                        className="border border-outline-variant/30 rounded-lg bg-surface-container-lowest p-8 flex items-center justify-between hover:border-primary/40 transition-colors group"
                    >
                        <div className="flex items-center gap-stack-md">
                            <MaterialIcon name="send" size={24} className="text-primary" />
                            <div>
                                <p className="font-body-md text-body-md text-on-surface font-semibold">
                                    Continue to e-file
                                </p>
                                <p className="font-body-md text-body-md text-on-surface-variant">
                                    Consent, sign, and transmit your federal return
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
