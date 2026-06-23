/**
 * Supabase adapter for the identity seam (lib/server/auth.ts).
 *
 * Supabase is the production managed IdP. This adapter resolves the current
 * Supabase user into the normalized `AuthIdentity` the seam consumes, which the
 * application code (getCurrentUser / requireUser) maps to the DB users row.
 *
 * Per the architecture (tax-platform-architecture-v2.md §5), FinnaCalc does not
 * build its own IdP; this file is the boundary between Supabase Auth and the
 * application user model.
 */

import type { AuthIdentity, IdentityProvider } from "./auth"
import { createSupabaseServerClient } from "./supabase-server"

export class SupabaseIdentityProvider implements IdentityProvider {
    async getIdentity(): Promise<AuthIdentity | null> {
        const supabase = await createSupabaseServerClient()
        const { data, error } = await supabase.auth.getUser()
        if (error || !data.user) return null

        const meta = (data.user.user_metadata ?? {}) as { name?: unknown }
        const displayName = typeof meta.name === "string" ? meta.name : null

        return {
            provider: "supabase",
            subject: data.user.id,
            email: data.user.email ?? "",
            displayName,
        }
    }
}
