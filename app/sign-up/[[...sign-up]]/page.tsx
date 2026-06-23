"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { MaterialIcon } from "@/components/ds/material-icon"
import { useAuth } from "@/lib/auth"

export default function SignUpPage() {
    const router = useRouter()
    const { signUp, user } = useAuth()
    const [name, setName] = React.useState("")
    const [email, setEmail] = React.useState("")
    const [password, setPassword] = React.useState("")
    const [error, setError] = React.useState<string | null>(null)
    const [submitting, setSubmitting] = React.useState(false)

    React.useEffect(() => {
        if (user) router.replace("/")
    }, [user, router])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        if (!name.trim()) return setError("Please enter your name.")
        if (!email.trim()) return setError("Please enter your email.")
        setSubmitting(true)
        try {
            await signUp(email, password, name)
            router.push("/")
        } catch (err) {
            setError(err instanceof Error ? err.message : "Sign up failed.")
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
                <h1 className="font-headline-display text-[40px] leading-[1.1] tracking-[-0.02em] text-primary mb-2">
                    Create your account
                </h1>
                <p className="font-body-lg text-body-lg text-on-surface-variant mb-8">
                    Save your calculations and progress across devices.
                </p>

                <form onSubmit={handleSubmit} className="flex flex-col gap-stack-md">
                    <FloatingInput label="Name" value={name} onChange={setName} autoComplete="name" autoFocus />
                    <FloatingInput label="Email" value={email} onChange={setEmail} type="email" autoComplete="email" />
                    <FloatingInput label="Password" value={password} onChange={setPassword} type="password" autoComplete="new-password" />

                    <p className="font-body-md text-body-md text-on-surface-variant">
                        By signing up, you agree to our{" "}
                        <Link href="/terms" className="text-primary hover:underline">Terms</Link>
                        {" "}and{" "}
                        <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
                    </p>

                    {error && <p className="font-body-md text-body-md text-error">{error}</p>}

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full rounded-full bg-primary text-on-primary font-ui-button text-ui-button uppercase tracking-[0.05em] py-3 hover:opacity-90 transition-opacity disabled:opacity-40"
                    >
                        {submitting ? "Creating account..." : "Sign up"}
                    </button>

                    <p className="font-body-md text-body-md text-on-surface-variant text-center pt-2">
                        Already have an account?{" "}
                        <Link href="/sign-in" className="text-primary hover:underline">
                            Sign in
                        </Link>
                    </p>
                </form>
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
