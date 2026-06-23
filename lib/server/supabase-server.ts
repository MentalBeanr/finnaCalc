/**
 * Server-side Supabase client.
 *
 * Wires the auth session into Next.js cookies via `@supabase/ssr`. Use this in
 * Server Components, Route Handlers, and Server Actions where the current user
 * needs to be resolved or auth-aware queries need to be made.
 *
 * Server Components may not write cookies during render; the `setAll` block
 * tolerates that case so reads still work. Writes happen via middleware
 * (middleware.ts) and Server Actions / Route Handlers.
 */

import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"

export async function createSupabaseServerClient(): Promise<SupabaseClient> {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    if (!url || !key) {
        throw new Error(
            "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and " +
                "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in your environment.",
        )
    }
    const cookieStore = await cookies()
    return createServerClient(url, key, {
        cookies: {
            getAll() {
                return cookieStore.getAll()
            },
            setAll(toSet) {
                try {
                    for (const { name, value, options } of toSet) {
                        cookieStore.set(name, value, options)
                    }
                } catch {
                    // Server Components cannot mutate cookies; safe to ignore.
                }
            },
        },
    })
}
