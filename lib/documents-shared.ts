/**
 * Client-safe document constants and pure helpers.
 *
 * No Node or database imports — safe to import from client components, server
 * actions, and the server document service alike. I/O lives in
 * lib/server/documents.ts.
 */

/** User-uploadable document kinds (system-generated kinds are excluded). */
export const UPLOADABLE_KINDS = ["w2", "1099", "1095_a", "receipt", "other"] as const
export type UploadableKind = (typeof UPLOADABLE_KINDS)[number]

export const ACCEPTED_MIME_TYPES = ["application/pdf", "image/png", "image/jpeg"] as const
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024 // 10 MB

/** Replace unsafe characters and bound the length for use in an object key. */
export function sanitizeFilename(name: string): string {
    const cleaned = name
        .replace(/[^\w.\-]+/g, "_")
        .replace(/_{2,}/g, "_")
        .replace(/^[_.]+|[_.]+$/g, "")
    return cleaned.slice(0, 120) || "file"
}

/** Validate an upload's size and MIME type before touching storage. */
export function validateUpload(input: { size: number; type: string }):
    | { ok: true }
    | { ok: false; error: string } {
    if (input.size <= 0) return { ok: false, error: "The file is empty." }
    if (input.size > MAX_UPLOAD_BYTES) return { ok: false, error: "File exceeds the 10MB limit." }
    if (!ACCEPTED_MIME_TYPES.includes(input.type as (typeof ACCEPTED_MIME_TYPES)[number])) {
        return { ok: false, error: "Only PDF, PNG, and JPG files are accepted." }
    }
    return { ok: true }
}

/** Human-readable name derived from the object key (`userId/id/filename`). */
export function documentDisplayName(objectKey: string): string {
    return objectKey.split("/").pop() ?? objectKey
}

export function isUploadableKind(value: string): value is UploadableKind {
    return (UPLOADABLE_KINDS as readonly string[]).includes(value)
}
