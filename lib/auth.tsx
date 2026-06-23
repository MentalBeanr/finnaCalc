"use client"

/**
 * Client-side auth context, Supabase-backed.
 *
 * Replaces the prior localStorage mock. Keeps the same public interface
 * (`useAuth()` returns `{ user, loading, signIn, signUp, signOut }`) so existing
 * consumers (sign-in / sign-up pages, the site header) continue to work
 * unchanged.
 *
 * If Supabase env is not configured, the provider degrades to anonymous mode
 * (no auth) so the calculator surface still runs.
 */

import * as React from "react"
import type { SupabaseClient } from "@supabase/supabase-js"
import { createSupabaseBrowserClient } from "./supabase-browser"

type User = { email: string; name: string }

type AuthContextValue = {
    user: User | null
    loading: boolean
    signIn: (email: string, password: string) => Promise<void>
    signUp: (email: string, password: string, name: string) => Promise<void>
    signOut: () => void
}

const AuthContext = React.createContext<AuthContextValue | null>(null)

function toUser(
    raw: { email?: string | null; user_metadata?: Record<string, unknown> } | null | undefined,
): User | null {
    if (!raw) return null
    const meta = raw.user_metadata ?? {}
    const name = typeof meta.name === "string" ? meta.name : ""
    return { email: raw.email ?? "", name }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = React.useState<User | null>(null)
    const [loading, setLoading] = React.useState(true)

    const supabase = React.useMemo<SupabaseClient | null>(() => {
        try {
            return createSupabaseBrowserClient()
        } catch {
            return null
        }
    }, [])

    React.useEffect(() => {
        if (!supabase) {
            setLoading(false)
            return
        }
        let mounted = true

        supabase.auth.getUser().then(({ data }) => {
            if (!mounted) return
            setUser(toUser(data.user))
            setLoading(false)
        })

        const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(toUser(session?.user ?? null))
        })

        return () => {
            mounted = false
            sub.subscription.unsubscribe()
        }
    }, [supabase])

    const signIn = React.useCallback(
        async (email: string, password: string) => {
            if (!supabase) throw new Error("Auth is not configured.")
            const { error } = await supabase.auth.signInWithPassword({
                email: email.trim().toLowerCase(),
                password,
            })
            if (error) throw new Error(error.message)
        },
        [supabase],
    )

    const signUp = React.useCallback(
        async (email: string, password: string, name: string) => {
            if (!supabase) throw new Error("Auth is not configured.")
            const { error } = await supabase.auth.signUp({
                email: email.trim().toLowerCase(),
                password,
                options: { data: { name: name.trim() } },
            })
            if (error) throw new Error(error.message)
        },
        [supabase],
    )

    const signOut = React.useCallback(() => {
        if (!supabase) return
        // Fire-and-forget; onAuthStateChange clears the user.
        void supabase.auth.signOut()
    }, [supabase])

    const value = React.useMemo(
        () => ({ user, loading, signIn, signUp, signOut }),
        [user, loading, signIn, signUp, signOut],
    )

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
    const ctx = React.useContext(AuthContext)
    if (!ctx) throw new Error("useAuth must be used within AuthProvider")
    return ctx
}
