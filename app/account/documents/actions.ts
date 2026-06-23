"use server"

import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/server/auth"
import { isUploadableKind, validateUpload } from "@/lib/documents-shared"
import { deleteDocument, getDocumentDownloadUrl, uploadDocument } from "@/lib/server/documents"

export type ActionResult = { ok: true } | { ok: false; error: string }

export async function uploadDocumentAction(formData: FormData): Promise<ActionResult> {
    const user = await getCurrentUser()
    if (!user) return { ok: false, error: "You must be signed in to upload documents." }

    const file = formData.get("file")
    const kindRaw = String(formData.get("kind") ?? "other")
    if (!(file instanceof File)) return { ok: false, error: "No file was provided." }

    const valid = validateUpload({ size: file.size, type: file.type })
    if (!valid.ok) return valid

    const kind = isUploadableKind(kindRaw) ? kindRaw : "other"
    const bytes = Buffer.from(await file.arrayBuffer())

    try {
        await uploadDocument({ userId: user.id, kind, filename: file.name, mime: file.type, bytes })
        revalidatePath("/account/documents")
        return { ok: true }
    } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : "Upload failed." }
    }
}

export async function deleteDocumentAction(documentId: string): Promise<ActionResult> {
    const user = await getCurrentUser()
    if (!user) return { ok: false, error: "You must be signed in." }
    try {
        const removed = await deleteDocument(user.id, documentId)
        if (!removed) return { ok: false, error: "Document not found." }
        revalidatePath("/account/documents")
        return { ok: true }
    } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : "Delete failed." }
    }
}

export async function getDownloadUrlAction(documentId: string): Promise<string | null> {
    const user = await getCurrentUser()
    if (!user) return null
    return getDocumentDownloadUrl(user.id, documentId)
}
