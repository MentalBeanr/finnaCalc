/**
 * Object storage for tax documents (Supabase Storage).
 *
 * Bytes live in a PRIVATE bucket; the `documents` table holds only metadata and
 * the object key (database-design.md §7). Uses the Supabase secret key for
 * privileged server-side operations — never exposed to the browser.
 *
 * Build-safe: the admin client is created on first use, never at import, so build
 * and CI run without Supabase env. A missing secret throws only at runtime.
 *
 * NOTE: Supabase Storage encrypts objects at rest under Supabase-managed keys.
 * The production target (database-design.md §7) is per-object KMS envelope
 * encryption; that is a later infrastructure step.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js"

export const DOCUMENTS_BUCKET = "tax-documents"

let cached: SupabaseClient | null = null

function getAdminClient(): SupabaseClient {
    if (cached) return cached
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const secret = process.env.SUPABASE_SECRET_KEY
    if (!url || !secret) {
        throw new Error(
            "Supabase storage is not configured. Set NEXT_PUBLIC_SUPABASE_URL and " +
                "SUPABASE_SECRET_KEY.",
        )
    }
    cached = createClient(url, secret, { auth: { persistSession: false } })
    return cached
}

/** Idempotently ensure the private documents bucket exists. */
export async function ensureDocumentsBucket(): Promise<void> {
    const client = getAdminClient()
    const { data } = await client.storage.getBucket(DOCUMENTS_BUCKET)
    if (data) return
    await client.storage.createBucket(DOCUMENTS_BUCKET, { public: false })
}

/** The storage interface, scoped to the documents bucket. */
export function getStorage() {
    return getAdminClient().storage
}
