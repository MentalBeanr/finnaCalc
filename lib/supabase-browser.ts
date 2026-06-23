"use client"

/**
 * Browser-side Supabase client.
 *
 * Used by client components and the auth context (lib/auth.tsx). Reads the
 * publishable key from `NEXT_PUBLIC_*` env vars, which Next.js inlines at build
 * time. Throws a clear error when the env is unconfigured so failures surface
 * loudly instead of producing a silently-broken client.
 */

import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"

export function createSupabaseBrowserClient(): SupabaseClient {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    if (!url || !key) {
        throw new Error(
            "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and " +
                "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in your environment.",
        )
    }
    return createBrowserClient(url, key)
}
