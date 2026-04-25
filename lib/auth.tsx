"use client"

import * as React from "react"

type User = { email: string; name: string }

type AuthContextValue = {
    user: User | null
    loading: boolean
    signIn: (email: string, password: string) => Promise<void>
    signUp: (email: string, password: string, name: string) => Promise<void>
    signOut: () => void
}

const STORAGE_USER = "finnacalc.user"
const STORAGE_DB = "finnacalc.users"

const AuthContext = React.createContext<AuthContextValue | null>(null)

type StoredUser = { email: string; name: string; password: string }

function readDb(): StoredUser[] {
    if (typeof window === "undefined") return []
    try {
        return JSON.parse(localStorage.getItem(STORAGE_DB) ?? "[]")
    } catch {
        return []
    }
}

function writeDb(users: StoredUser[]) {
    localStorage.setItem(STORAGE_DB, JSON.stringify(users))
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = React.useState<User | null>(null)
    const [loading, setLoading] = React.useState(true)

    React.useEffect(() => {
        try {
            const raw = localStorage.getItem(STORAGE_USER)
            if (raw) setUser(JSON.parse(raw))
        } catch {}
        setLoading(false)
    }, [])

    const signIn = React.useCallback(async (email: string, password: string) => {
        const normalized = email.trim().toLowerCase()
        const match = readDb().find((u) => u.email === normalized && u.password === password)
        if (!match) throw new Error("Invalid email or password.")
        const session = { email: match.email, name: match.name }
        localStorage.setItem(STORAGE_USER, JSON.stringify(session))
        setUser(session)
    }, [])

    const signUp = React.useCallback(async (email: string, password: string, name: string) => {
        const normalized = email.trim().toLowerCase()
        const db = readDb()
        if (db.some((u) => u.email === normalized)) {
            throw new Error("An account with that email already exists.")
        }
        if (password.length < 6) throw new Error("Password must be at least 6 characters.")
        db.push({ email: normalized, name: name.trim(), password })
        writeDb(db)
        const session = { email: normalized, name: name.trim() }
        localStorage.setItem(STORAGE_USER, JSON.stringify(session))
        setUser(session)
    }, [])

    const signOut = React.useCallback(() => {
        localStorage.removeItem(STORAGE_USER)
        setUser(null)
    }, [])

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
