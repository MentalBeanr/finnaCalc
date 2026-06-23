/**
 * Clerk adapter for the identity seam (lib/server/auth.ts).
 *
 * Clerk is the recommended managed IdP (it is already a dependency). This adapter
 * is the production path; it is NOT installed by default so the app builds and runs
 * without Clerk keys. To activate, call once at server startup:
 *
 *   import { setIdentityProvider } from "@/lib/server/auth"
 *   import { ClerkIdentityProvider } from "@/lib/server/auth-clerk"
 *   setIdentityProvider(new ClerkIdentityProvider())
 *
 * Activation also requires Clerk middleware to be wired (middleware.ts) and the
 * Clerk env keys to be present. The `@clerk/nextjs/server` module is imported
 * dynamically so merely importing this file has no build-time effect.
 */
import type { AuthIdentity, IdentityProvider } from "./auth"

export class ClerkIdentityProvider implements IdentityProvider {
    async getIdentity(): Promise<AuthIdentity | null> {
        const { currentUser } = await import("@clerk/nextjs/server")
        const user = await currentUser()
        if (!user) return null

        const email =
            user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress ??
            user.emailAddresses[0]?.emailAddress
        if (!email) return null

        const displayName = [user.firstName, user.lastName].filter(Boolean).join(" ") || null

        return { provider: "clerk", subject: user.id, email, displayName }
    }
}
