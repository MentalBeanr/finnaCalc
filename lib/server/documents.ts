/**
 * Document service: upload, list, download, delete.
 *
 * Bytes go to the private Supabase Storage bucket; metadata to the `documents`
 * table (database-design.md §7). All operations are user-scoped — a caller can
 * only ever touch their own documents.
 *
 * The pure helpers (validation, sanitization, display name) are exported for unit
 * testing and carry no I/O.
 */
import { createHash, randomUUID } from "node:crypto"
import { and, desc, eq } from "drizzle-orm"
import { getDb } from "@/db/client"
import { documents, type Document } from "@/db/schema"
import { sanitizeFilename, type UploadableKind } from "@/lib/documents-shared"
import { DOCUMENTS_BUCKET, ensureDocumentsBucket, getStorage } from "./storage"

// Pure helpers and constants live in lib/documents-shared.ts (client-safe).
// This module is server-only: it carries the I/O (node:crypto, db, storage).

export interface UploadInput {
    userId: string
    returnId?: string | null
    kind: UploadableKind
    filename: string
    mime: string
    bytes: Buffer
}

/**
 * Store a document: hash for dedup/integrity, upload bytes, record metadata.
 * Re-uploading identical bytes for the same user returns the existing row.
 */
export async function uploadDocument(input: UploadInput): Promise<Document> {
    const db = getDb()
    const sha256 = createHash("sha256").update(input.bytes).digest("hex")

    const existing = await db
        .select()
        .from(documents)
        .where(and(eq(documents.userId, input.userId), eq(documents.sha256, sha256)))
        .limit(1)
    if (existing[0]) return existing[0]

    await ensureDocumentsBucket()

    const id = randomUUID()
    const objectKey = `${input.userId}/${id}/${sanitizeFilename(input.filename)}`

    const { error } = await getStorage()
        .from(DOCUMENTS_BUCKET)
        .upload(objectKey, input.bytes, { contentType: input.mime, upsert: false })
    if (error) throw new Error(`Upload failed: ${error.message}`)

    const [row] = await db
        .insert(documents)
        .values({
            id,
            userId: input.userId,
            returnId: input.returnId ?? null,
            kind: input.kind,
            objectKey,
            bytesSize: input.bytes.byteLength,
            mime: input.mime,
            sha256,
            // Virus scanning is a deferred infrastructure step; stays 'pending'
            // until a scanner flips it to 'clean' or 'quarantined'.
            virusScanStatus: "pending",
            ocrStatus: "none",
            isFinal: false,
            encryptionKeyRef: "supabase-managed",
        })
        .returning()
    return row
}

/** All of a user's documents, newest first. */
export async function listDocuments(userId: string): Promise<Document[]> {
    const db = getDb()
    return db
        .select()
        .from(documents)
        .where(eq(documents.userId, userId))
        .orderBy(desc(documents.uploadedAt))
}

/** A short-lived signed URL for a user's own document, or null if not found. */
export async function getDocumentDownloadUrl(
    userId: string,
    documentId: string,
    expiresInSeconds = 60,
): Promise<string | null> {
    const db = getDb()
    const [row] = await db
        .select()
        .from(documents)
        .where(and(eq(documents.id, documentId), eq(documents.userId, userId)))
        .limit(1)
    if (!row) return null

    const { data, error } = await getStorage()
        .from(DOCUMENTS_BUCKET)
        .createSignedUrl(row.objectKey, expiresInSeconds)
    if (error || !data) return null
    return data.signedUrl
}

/** Remove a user's own document (object + metadata). Returns false if not found. */
export async function deleteDocument(userId: string, documentId: string): Promise<boolean> {
    const db = getDb()
    const [row] = await db
        .select()
        .from(documents)
        .where(and(eq(documents.id, documentId), eq(documents.userId, userId)))
        .limit(1)
    if (!row) return false

    await getStorage().from(DOCUMENTS_BUCKET).remove([row.objectKey])
    await db.delete(documents).where(eq(documents.id, documentId))
    return true
}
