"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { MaterialIcon } from "@/components/ds/material-icon"
import { useAuth } from "@/lib/auth"

export default function SignInPage() {
    const router = useRouter()
    const { signIn, user } = useAuth()
    const [step, setStep] = React.useState<"email" | "password">("email")
    const [email, setEmail] = React.useState("")
    const [password, setPassword] = React.useState("")
    const [error, setError] = React.useState<string | null>(null)
    const [submitting, setSubmitting] = React.useState(false)

    React.useEffect(() => {
        if (user) router.replace("/")
    }, [user, router])

    const handleNext = (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        if (!email.trim()) {
            setError("Please enter your email.")
            return
        }
        setStep("password")
    }

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setSubmitting(true)
        try {
            await signIn(email, password)
            router.push("/")
        } catch (err) {
            setError(err instanceof Error ? err.message : "Sign in failed.")
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen bg-surface flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">
                <div className="flex justify-center mb-8">
                    <div className="w-12 h-12 rounded-full bg-primary text-on-primary flex items-center justify-center">
                        <MaterialIcon name="calculate" size={24} />
                    </div>
                </div>
                <h1 className="font-headline-display text-[40px] leading-[1.1] tracking-[-0.02em] text-primary mb-8">
                    {step === "email" ? "Sign in to FinnaCalc" : "Enter your password"}
                </h1>

                {step === "email" ? (
                    <form onSubmit={handleNext} className="flex flex-col gap-stack-lg">
                        <FloatingInput
                            label="Email"
                            type="email"
                            autoComplete="email"
                            autoFocus
                            value={email}
                            onChange={(v) => setEmail(v)}
                        />

                        {error && <p className="font-body-md text-body-md text-error">{error}</p>}

                        <button
                            type="submit"
                            className="w-full rounded-full bg-primary text-on-primary font-ui-button text-ui-button uppercase tracking-[0.05em] py-3 hover:opacity-90 transition-opacity"
                        >
                            Next
                        </button>

                        <SocialButtons />

                        <p className="font-body-md text-body-md text-on-surface-variant text-center">
                            Don&apos;t have an account?{" "}
                            <Link href="/sign-up" className="text-primary hover:underline">
                                Sign up
                            </Link>
                        </p>
                    </form>
                ) : (
                    <form onSubmit={handleSignIn} className="flex flex-col gap-stack-lg">
                        <div className="rounded-lg border border-outline-variant/40 bg-surface-container px-4 py-3 font-body-md text-body-md text-on-surface-variant">
                            {email}
                        </div>
                        <FloatingInput
                            label="Password"
                            type="password"
                            autoComplete="current-password"
                            autoFocus
                            value={password}
                            onChange={(v) => setPassword(v)}
                        />

                        {error && <p className="font-body-md text-body-md text-error">{error}</p>}

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full rounded-full bg-primary text-on-primary font-ui-button text-ui-button uppercase tracking-[0.05em] py-3 hover:opacity-90 transition-opacity disabled:opacity-40"
                        >
                            {submitting ? "Signing in..." : "Log in"}
                        </button>

                        <button
                            type="button"
                            onClick={() => { setStep("email"); setError(null); setPassword("") }}
                            className="w-full rounded-full border border-outline-variant/40 font-ui-button text-ui-button uppercase tracking-[0.05em] py-3 text-on-surface-variant hover:border-primary/40 hover:text-primary transition-colors"
                        >
                            Use a different email
                        </button>

                        <p className="font-body-md text-body-md text-on-surface-variant text-center">
                            Don&apos;t have an account?{" "}
                            <Link href="/sign-up" className="text-primary hover:underline">
                                Sign up
                            </Link>
                        </p>
                    </form>
                )}
            </div>
        </div>
    )
}

function FloatingInput({
    label,
    value,
    onChange,
    type = "text",
    autoComplete,
    autoFocus,
}: {
    label: string
    value: string
    onChange: (v: string) => void
    type?: string
    autoComplete?: string
    autoFocus?: boolean
}) {
    const id = React.useId()
    const [focused, setFocused] = React.useState(false)
    const floated = focused || value.length > 0

    return (
        <div
            className={`relative rounded-lg border bg-surface transition-colors ${
                focused ? "border-primary ring-1 ring-primary" : "border-outline-variant/40"
            }`}
        >
            <label
                htmlFor={id}
                className={`absolute left-3 pointer-events-none transition-all font-body-md ${
                    floated ? "top-1.5 text-xs text-on-surface-variant" : "top-4 text-base text-on-surface-variant"
                } ${focused ? "text-primary" : ""}`}
            >
                {label}
            </label>
            <input
                id={id}
                type={type}
                autoComplete={autoComplete}
                autoFocus={autoFocus}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                className="w-full bg-transparent outline-none px-3 pt-6 pb-2 font-body-md text-body-md text-on-surface"
            />
        </div>
    )
}

function SocialButtons() {
    return (
        <div className="flex flex-col gap-stack-md">
            <div className="flex items-center gap-stack-md">
                <div className="flex-1 h-px bg-outline-variant/30" />
                <span className="font-label-caps text-label-caps uppercase tracking-[0.15em] text-on-surface-variant">Or</span>
                <div className="flex-1 h-px bg-outline-variant/30" />
            </div>
            <button
                type="button"
                disabled
                className="w-full rounded-full bg-surface border border-outline-variant/40 font-ui-button text-ui-button uppercase tracking-[0.05em] py-3 text-on-surface-variant hover:border-primary/40 transition-colors flex items-center justify-center gap-stack-sm disabled:opacity-50 disabled:cursor-not-allowed"
                title="Coming soon"
            >
                <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
                </svg>
                Sign in with Google
            </button>
            <button
                type="button"
                disabled
                className="w-full rounded-full bg-surface border border-outline-variant/40 font-ui-button text-ui-button uppercase tracking-[0.05em] py-3 text-on-surface-variant hover:border-primary/40 transition-colors flex items-center justify-center gap-stack-sm disabled:opacity-50 disabled:cursor-not-allowed"
                title="Coming soon"
            >
                <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M16.365 1.43c0 1.14-.42 2.21-1.18 3.04-.81.89-2.13 1.58-3.36 1.49-.16-1.18.46-2.39 1.18-3.16.79-.86 2.16-1.49 3.36-1.37zM20.5 17.36c-.55 1.27-.81 1.83-1.52 2.96-.99 1.57-2.39 3.52-4.13 3.54-1.55.02-1.95-1.01-4.05-1-2.1.01-2.54 1.02-4.09.99-1.74-.03-3.07-1.78-4.06-3.35-2.78-4.39-3.07-9.54-1.36-12.28 1.21-1.95 3.13-3.09 4.93-3.09 1.83 0 2.98.99 4.49.99 1.46 0 2.36-.99 4.48-.99 1.6 0 3.3.87 4.51 2.36-3.97 2.18-3.32 7.86.8 9.87z" />
                </svg>
                Sign in with Apple
            </button>
        </div>
    )
}
