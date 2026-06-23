/**
 * Server-side authentication seam.
 *
 * Architecture (v2 §5): "Don't build your own IdP or crypto." This module defines
 * the boundary between a managed identity provider and the application user model,
 * not an identity store of its own.
 *
 * - `IdentityProvider` is the interface a concrete IdP adapter implements.
 * - When Supabase env is configured, the seam defaults to the Supabase adapter
 *   (lib/server/auth-supabase.ts), imported lazily so `next build`, CI, and local
 *   dev run without keys (and without ever loading Supabase). With no env and no
 *   explicit provider, the seam resolves to a no-op (nobody signed in).
 * - `setIdentityProvider()` overrides the default (for tests or an alternate IdP).
 * - `getCurrentUser()` resolves the authenticated identity to the DB `users` row,
 *   provisioning it on first sign-in.
 */
import type { User } from "@/db/schema"
import { upsertUserFromIdentity } from "./users"

/** A normalized identity from whatever IdP is configured. */
export interface AuthIdentity {
    /** IdP name, e.g. 'clerk'. */
    provider: string
    /** Stable per-user subject id within that provider. */
    subject: string
    email: string
    displayName?: string | null
}

export interface IdentityProvider {
    /** Returns the current request's identity, or null if unauthenticated. */
    getIdentity(): Promise<AuthIdentity | null>
}

/** Build/CI/dev fallback: nobody is signed in. */
const nullProvider: IdentityProvider = {
    async getIdentity() {
        return null
    },
}

let explicitProvider: IdentityProvider | null = null

/** Override the identity provider (tests or an alternate IdP). Pass null to reset. */
export function setIdentityProvider(next: IdentityProvider | null): void {
    explicitProvider = next
}

/** True when the Supabase env needed by the default adapter is present. */
function supabaseConfigured(): boolean {
    return Boolean(
        process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    )
}

/**
 * Resolve the active provider: an explicit override, else the Supabase adapter
 * when configured, else the no-op. Supabase is imported lazily so the static
 * build graph never requires it.
 */
async function resolveProvider(): Promise<IdentityProvider> {
    if (explicitProvider) return explicitProvider
    if (supabaseConfigured()) {
        const { SupabaseIdentityProvider } = await import("./auth-supabase")
        return new SupabaseIdentityProvider()
    }
    return nullProvider
}

/** The raw identity from the active provider (no DB access). */
export async function getCurrentIdentity(): Promise<AuthIdentity | null> {
    const provider = await resolveProvider()
    return provider.getIdentity()
}

/**
 * The authenticated application user, provisioned from the IdP identity on first
 * sign-in. Returns null when unauthenticated.
 */
export async function getCurrentUser(): Promise<User | null> {
    const identity = await getCurrentIdentity()
    if (!identity) return null
    return upsertUserFromIdentity({
        authProviderRef: `${identity.provider}:${identity.subject}`,
        email: identity.email,
        displayName: identity.displayName,
    })
}

/** Like `getCurrentUser` but throws when unauthenticated — for protected paths. */
export async function requireUser(): Promise<User> {
    const user = await getCurrentUser()
    if (!user) throw new Error("Unauthenticated")
    return user
}
