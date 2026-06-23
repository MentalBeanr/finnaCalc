import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { getCurrentIdentity, setIdentityProvider, type AuthIdentity } from "@/lib/server/auth"

const saved = {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    key: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
}

describe("auth identity seam", () => {
    beforeEach(() => {
        // Ensure the build-safe no-op path: no Supabase env, no explicit provider.
        delete process.env.NEXT_PUBLIC_SUPABASE_URL
        delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
        setIdentityProvider(null)
    })

    afterEach(() => {
        if (saved.url) process.env.NEXT_PUBLIC_SUPABASE_URL = saved.url
        if (saved.key) process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = saved.key
        setIdentityProvider(null)
    })

    it("resolves to null identity when nothing is configured", async () => {
        expect(await getCurrentIdentity()).toBeNull()
    })

    it("uses an explicitly set provider over the default", async () => {
        const identity: AuthIdentity = { provider: "test", subject: "abc", email: "a@b.com" }
        setIdentityProvider({ async getIdentity() { return identity } })
        expect(await getCurrentIdentity()).toEqual(identity)
    })
})
