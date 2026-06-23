/**
 * User repository — the DB-backed user record (db/schema/identity.ts).
 *
 * Server-only. Resolves and provisions the application `users` row from an
 * external identity-provider subject. Per the architecture (v2 §5) FinnaCalc does
 * not build its own IdP; this module is the boundary between the managed IdP and
 * the application's user model.
 */
import { eq } from "drizzle-orm"
import { getDb } from "@/db/client"
import { users, type User } from "@/db/schema"

/** Look up a user by their stable `provider:subject` reference. */
export async function getUserByAuthRef(authProviderRef: string): Promise<User | null> {
    const db = getDb()
    const rows = await db
        .select()
        .from(users)
        .where(eq(users.authProviderRef, authProviderRef))
        .limit(1)
    return rows[0] ?? null
}

export interface IdentityInput {
    authProviderRef: string
    email: string
    displayName?: string | null
}

/**
 * Idempotently provision the user for an authenticated identity: insert on first
 * sign-in, refresh email/display name on subsequent ones.
 */
export async function upsertUserFromIdentity(input: IdentityInput): Promise<User> {
    const db = getDb()
    const existing = await getUserByAuthRef(input.authProviderRef)

    if (existing) {
        const [updated] = await db
            .update(users)
            .set({
                email: input.email,
                displayName: input.displayName ?? existing.displayName,
                updatedAt: new Date(),
            })
            .where(eq(users.id, existing.id))
            .returning()
        return updated
    }

    const [created] = await db
        .insert(users)
        .values({
            authProviderRef: input.authProviderRef,
            email: input.email,
            displayName: input.displayName ?? null,
        })
        .returning()
    return created
}
