/**
 * Supabase session-refresh middleware.
 *
 * Required by `@supabase/ssr`: refreshes the auth cookie on every request so
 * Server Components and Route Handlers see a fresh session. Short-circuits when
 * Supabase env is not configured (build, CI, anonymous deploys) so the
 * calculator surface still serves.
 */

import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function middleware(request: NextRequest) {
    const response = NextResponse.next({ request })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    if (!url || !key) return response

    const supabase = createServerClient(url, key, {
        cookies: {
            getAll() {
                return request.cookies.getAll()
            },
            setAll(toSet) {
                for (const { name, value, options } of toSet) {
                    request.cookies.set(name, value)
                    response.cookies.set(name, value, options)
                }
            },
        },
    })

    // Touching getUser() refreshes the access token cookie when needed.
    await supabase.auth.getUser()

    return response
}

export const config = {
    matcher: [
        // Run on everything except Next.js internals and static assets.
        "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
    ],
}
