import Link from "next/link"
import { getCurrentUser } from "@/lib/server/auth"
import { listReturns } from "@/lib/server/returns"
import { availableTaxYears, filingStatusLabel, returnStateLabel } from "@/lib/returns-shared"
import { Container } from "@/components/ds/container"
import { Section } from "@/components/ds/section"
import { MaterialIcon } from "@/components/ds/material-icon"
import { NewReturn } from "./new-return"

export const dynamic = "force-dynamic"

export default async function FilePage() {
    const user = await getCurrentUser()

    if (!user) {
        return (
            <Section spacing="default" className="pt-section-gap-sm">
                <Container className="flex flex-col items-center text-center gap-stack-lg max-w-xl">
                    <MaterialIcon name="receipt_long" size={48} className="text-on-surface-variant" />
                    <h1 className="font-headline-display text-[40px] leading-[1.1] tracking-[-0.02em] text-primary">
                        Sign in to file your taxes
                    </h1>
                    <p className="font-body-lg text-body-lg text-on-surface-variant">
                        Create and manage your tax returns in one secure place.
                    </p>
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

    const returns = await listReturns(user.id)
    const latestYear = new Date().getFullYear() - 1

    return (
        <div className="flex flex-col">
            <Section spacing="default" className="pt-section-gap-sm pb-0">
                <Container className="flex flex-col gap-stack-lg">
                    <h1 className="font-headline-display text-[56px] leading-[1.1] tracking-[-0.02em] text-primary">
                        Your tax returns
                    </h1>
                    <p className="font-body-lg text-body-lg text-on-surface-variant max-w-prose">
                        Prepare and track your federal returns. Each return is saved automatically as
                        you go.
                    </p>
                </Container>
            </Section>

            <Section spacing="default">
                <Container className="flex flex-col gap-gutter">
                    <NewReturn years={availableTaxYears(latestYear)} />

                    {returns.length > 0 && (
                        <div className="border border-outline-variant/30 rounded-lg bg-surface-container-lowest p-10">
                            <h2 className="font-headline-md text-headline-md text-primary mb-stack-lg">
                                In progress
                            </h2>
                            <div className="flex flex-col divide-y divide-outline-variant/20">
                                {returns.map((ret) => (
                                    <Link
                                        key={ret.id}
                                        href={`/file/${ret.id}`}
                                        className="flex items-center justify-between py-stack-md group"
                                    >
                                        <div className="flex items-center gap-stack-md">
                                            <MaterialIcon
                                                name="description"
                                                size={20}
                                                className="text-primary"
                                            />
                                            <div>
                                                <p className="font-body-md text-body-md text-on-surface">
                                                    {ret.taxYear} Federal Return
                                                </p>
                                                <p className="font-label-caps uppercase tracking-[0.15em] text-[10px] text-on-surface-variant">
                                                    {filingStatusLabel(ret.filingStatus)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-stack-md">
                                            <span className="font-label-caps text-label-caps uppercase tracking-[0.15em] text-on-surface-variant border border-outline-variant/40 rounded-full px-3 py-1">
                                                {returnStateLabel(ret.state)}
                                            </span>
                                            <MaterialIcon
                                                name="chevron_right"
                                                size={18}
                                                className="text-on-surface-variant group-hover:text-primary transition-colors"
                                            />
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </Container>
            </Section>
        </div>
    )
}
