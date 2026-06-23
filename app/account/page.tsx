import Link from "next/link"
import { getCurrentUser } from "@/lib/server/auth"
import { Container } from "@/components/ds/container"
import { Section } from "@/components/ds/section"
import { MaterialIcon } from "@/components/ds/material-icon"
import { AccountActions } from "./account-actions"

// Resolves the signed-in user from cookies on every request.
export const dynamic = "force-dynamic"

function formatDate(value: Date | string | null): string {
    if (!value) return "—"
    const d = typeof value === "string" ? new Date(value) : value
    return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
}

export default async function AccountPage() {
    const user = await getCurrentUser()

    if (!user) {
        return (
            <Section spacing="default" className="pt-section-gap-sm">
                <Container className="flex flex-col items-center text-center gap-stack-lg max-w-xl">
                    <MaterialIcon name="account_circle" size={48} className="text-on-surface-variant" />
                    <h1 className="font-headline-display text-[40px] leading-[1.1] tracking-[-0.02em] text-primary">
                        You&apos;re signed out
                    </h1>
                    <p className="font-body-lg text-body-lg text-on-surface-variant">
                        Sign in to view your account, saved work, and tax returns.
                    </p>
                    <div className="flex items-center gap-stack-md">
                        <Link
                            href="/sign-in"
                            className="inline-flex items-center gap-stack-sm px-6 py-3 rounded-full bg-primary text-on-primary font-ui-button text-ui-button uppercase tracking-[0.05em] hover:opacity-90 transition-opacity"
                        >
                            Sign In
                        </Link>
                        <Link
                            href="/sign-up"
                            className="inline-flex items-center gap-stack-sm px-6 py-3 rounded-full border border-outline-variant/40 font-ui-button text-ui-button uppercase tracking-[0.05em] text-on-surface-variant hover:border-primary/40 hover:text-primary transition-colors"
                        >
                            Create Account
                        </Link>
                    </div>
                </Container>
            </Section>
        )
    }

    return (
        <div className="flex flex-col">
            <Section spacing="default" className="pt-section-gap-sm pb-0">
                <Container className="flex flex-col gap-stack-lg">
                    <h1 className="font-headline-display text-[56px] leading-[1.1] tracking-[-0.02em] text-primary">
                        Account
                    </h1>
                    <p className="font-body-lg text-body-lg text-on-surface-variant max-w-prose">
                        Manage your profile and security settings.
                    </p>
                </Container>
            </Section>

            <Section spacing="default">
                <Container className="flex flex-col gap-gutter">
                    {/* Profile */}
                    <div className="border border-outline-variant/30 rounded-lg bg-surface-container-lowest p-10 flex flex-col gap-stack-lg">
                        <h2 className="font-headline-md text-headline-md text-primary">Profile</h2>
                        <dl className="flex flex-col divide-y divide-outline-variant/20">
                            <Row label="Name" value={user.displayName || "—"} />
                            <Row label="Email" value={user.email} />
                            <Row label="Member since" value={formatDate(user.createdAt)} />
                            <Row label="Account ID" value={user.id} mono />
                        </dl>
                        <AccountActions />
                    </div>

                    {/* Security shortcut */}
                    <Link
                        href="/account/security"
                        className="border border-outline-variant/30 rounded-lg bg-surface-container-lowest p-8 flex items-center justify-between hover:border-primary/40 transition-colors group"
                    >
                        <div className="flex items-center gap-stack-md">
                            <MaterialIcon name="shield" size={24} className="text-primary" />
                            <div>
                                <p className="font-body-md text-body-md text-on-surface font-semibold">
                                    Security
                                </p>
                                <p className="font-body-md text-body-md text-on-surface-variant">
                                    Multi-factor authentication and sign-in method
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

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
    return (
        <div className="flex items-center justify-between py-stack-md">
            <dt className="font-ui-button text-ui-button uppercase tracking-[0.05em] text-on-surface-variant">
                {label}
            </dt>
            <dd
                className={`font-body-md text-body-md text-on-surface ${
                    mono ? "font-mono text-xs" : ""
                }`}
            >
                {value}
            </dd>
        </div>
    )
}
