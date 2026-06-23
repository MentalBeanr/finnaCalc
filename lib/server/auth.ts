/**
 * Server-side authentication seam.
 *
 * Architecture (v2 §5): "Don't build your own IdP or crypto." This module defines
 * the boundary between a managed identity provider and the application user model,
 * not an identity store of its own.
 *
 * - `IdentityProvider` is the interface a concrete IdP adapter implements.
 * - The default provider is a no-op so `next build`, CI, and local dev run without
 *   any IdP configured (and without keys). Activate the real adapter at startup
 *   via `setIdentityProvider(new ClerkIdentityProvider())` (lib/server/auth-clerk.ts).
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

/** Build/CI/dev default: nobody is signed in until a real provider is set. */
class NullIdentityProvider implements IdentityProvider {
    async getIdentity(): Promise<AuthIdentity | null> {
        return null
    }
}

let provider: IdentityProvider = new NullIdentityProvider()

/** Install the active identity provider (call once at server startup). */
export function setIdentityProvider(next: IdentityProvider): void {
    provider = next
}

/** The raw identity from the active provider (no DB access). */
export async function getCurrentIdentity(): Promise<AuthIdentity | null> {
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
