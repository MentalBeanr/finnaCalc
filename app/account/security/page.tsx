import Link from "next/link"
import { getCurrentUser } from "@/lib/server/auth"
import { Container } from "@/components/ds/container"
import { Section } from "@/components/ds/section"
import { MaterialIcon } from "@/components/ds/material-icon"

export const dynamic = "force-dynamic"

export default async function SecurityPage() {
    const user = await getCurrentUser()

    if (!user) {
        return (
            <Section spacing="default" className="pt-section-gap-sm">
                <Container className="flex flex-col items-center text-center gap-stack-lg max-w-xl">
                    <MaterialIcon name="shield" size={48} className="text-on-surface-variant" />
                    <h1 className="font-headline-display text-[40px] leading-[1.1] tracking-[-0.02em] text-primary">
                        Sign in to manage security
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

    return (
        <div className="flex flex-col">
            <Section spacing="default" className="pt-section-gap-sm pb-0">
                <Container className="flex flex-col gap-stack-lg">
                    <Link
                        href="/account"
                        className="inline-flex items-center gap-stack-sm self-start font-ui-button text-ui-button uppercase tracking-[0.05em] text-on-surface-variant hover:text-primary transition-colors"
                    >
                        <MaterialIcon name="arrow_back" size={16} />
                        Account
                    </Link>
                    <h1 className="font-headline-display text-[56px] leading-[1.1] tracking-[-0.02em] text-primary">
                        Security
                    </h1>
                    <p className="font-body-lg text-body-lg text-on-surface-variant max-w-prose">
                        How you sign in and protect your account. Tax data demands bank-grade
                        protection — multi-factor authentication is strongly recommended.
                    </p>
                </Container>
            </Section>

            <Section spacing="default">
                <Container className="flex flex-col gap-gutter">
                    <div className="border border-outline-variant/30 rounded-lg bg-surface-container-lowest p-10 flex flex-col gap-stack-md">
                        <h2 className="font-headline-md text-headline-md text-primary">Sign-in method</h2>
                        <div className="flex items-center gap-stack-md">
                            <MaterialIcon name="mail" size={20} className="text-on-surface-variant" />
                            <div>
                                <p className="font-body-md text-body-md text-on-surface">{user.email}</p>
                                <p className="font-label-caps uppercase tracking-[0.15em] text-[10px] text-on-surface-variant">
                                    Email &amp; password
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="border border-outline-variant/30 rounded-lg bg-surface-container-lowest p-10 flex flex-col gap-stack-md">
                        <div className="flex items-center justify-between">
                            <h2 className="font-headline-md text-headline-md text-primary">
                                Multi-factor authentication
                            </h2>
                            <span
                                className={`font-label-caps text-label-caps uppercase tracking-[0.15em] rounded-full px-3 py-1 ${
                                    user.mfaEnabled
                                        ? "bg-success/10 text-success"
                                        : "bg-error/10 text-error"
                                }`}
                            >
                                {user.mfaEnabled ? "Enabled" : "Not enabled"}
                            </span>
                        </div>
                        <p className="font-body-md text-body-md text-on-surface-variant max-w-prose">
                            {user.mfaEnabled
                                ? "Your account is protected with a second factor."
                                : "Add a second factor to protect your tax data. MFA enrollment is handled by the identity provider and will be available here."}
                        </p>
                    </div>
                </Container>
            </Section>
        </div>
    )
}
