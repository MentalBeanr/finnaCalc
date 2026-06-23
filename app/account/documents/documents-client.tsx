"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { MaterialIcon } from "@/components/ds/material-icon"
import { UPLOADABLE_KINDS } from "@/lib/documents-shared"
import {
    deleteDocumentAction,
    getDownloadUrlAction,
    uploadDocumentAction,
} from "./actions"

export interface DocumentRow {
    id: string
    name: string
    kind: string
    bytesSize: number
    mime: string
    virusScanStatus: string
    uploadedAt: string
}

const KIND_LABELS: Record<string, string> = {
    w2: "W-2",
    "1099": "1099",
    "1095_a": "1095-A",
    receipt: "Receipt",
    other: "Other",
    filed_return_pdf: "Filed return",
    mef_payload: "MeF payload",
}

function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(value: string): string {
    return new Date(value).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    })
}

export function DocumentsClient({ documents }: { documents: DocumentRow[] }) {
    const router = useRouter()
    const inputRef = React.useRef<HTMLInputElement>(null)
    const [kind, setKind] = React.useState<string>("w2")
    const [busy, setBusy] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)

    const upload = async (file: File) => {
        setBusy(true)
        setError(null)
        const formData = new FormData()
        formData.set("file", file)
        formData.set("kind", kind)
        const result = await uploadDocumentAction(formData)
        setBusy(false)
        if (!result.ok) {
            setError(result.error)
            return
        }
        router.refresh()
    }

    const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) void upload(file)
        e.target.value = ""
    }

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault()
        const file = e.dataTransfer.files?.[0]
        if (file) void upload(file)
    }

    const onDownload = async (id: string) => {
        const url = await getDownloadUrlAction(id)
        if (url) window.open(url, "_blank", "noopener,noreferrer")
        else setError("Could not generate a download link.")
    }

    const onDelete = async (id: string) => {
        setError(null)
        const result = await deleteDocumentAction(id)
        if (!result.ok) {
            setError(result.error)
            return
        }
        router.refresh()
    }

    return (
        <div className="flex flex-col gap-gutter">
            {/* Upload panel */}
            <div className="border border-outline-variant/30 rounded-lg bg-surface-container-lowest p-10 flex flex-col gap-stack-lg">
                <div className="flex items-center gap-stack-md">
                    <label className="font-ui-button text-ui-button uppercase tracking-[0.05em] text-on-surface-variant">
                        Document type
                    </label>
                    <select
                        value={kind}
                        onChange={(e) => setKind(e.target.value)}
                        className="rounded-lg border border-outline-variant/40 bg-surface px-3 py-2 font-body-md text-body-md text-on-surface outline-none focus:border-primary"
                    >
                        {UPLOADABLE_KINDS.map((k) => (
                            <option key={k} value={k}>
                                {KIND_LABELS[k] ?? k}
                            </option>
                        ))}
                    </select>
                </div>

                <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={onDrop}
                    className="border-2 border-dashed border-outline-variant/40 rounded-lg p-8 text-center hover:border-primary/40 transition-colors"
                >
                    <MaterialIcon name="upload" size={40} className="text-on-surface-variant mx-auto mb-stack-md" />
                    <p className="font-body-md text-body-md text-on-surface-variant mb-stack-md">
                        Drag a document here, or
                    </p>
                    <input
                        ref={inputRef}
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        className="hidden"
                        onChange={onPick}
                        disabled={busy}
                    />
                    <button
                        onClick={() => inputRef.current?.click()}
                        disabled={busy}
                        className="inline-flex items-center gap-stack-sm px-5 py-2.5 rounded-full border border-outline-variant/40 font-ui-button text-ui-button uppercase tracking-[0.05em] text-on-surface-variant hover:border-primary/40 hover:text-primary transition-colors disabled:opacity-50"
                    >
                        {busy ? "Uploading…" : "Choose file"}
                    </button>
                    <p className="font-label-caps uppercase tracking-[0.15em] text-[10px] text-on-surface-variant mt-stack-md">
                        PDF, PNG, JPG · max 10MB
                    </p>
                </div>

                {error && <p className="font-body-md text-body-md text-error">{error}</p>}
            </div>

            {/* Document list */}
            <div className="border border-outline-variant/30 rounded-lg bg-surface-container-lowest p-10">
                <h2 className="font-headline-md text-headline-md text-primary mb-stack-lg">
                    Your documents ({documents.length})
                </h2>

                {documents.length === 0 ? (
                    <p className="font-body-md text-body-md text-on-surface-variant">
                        No documents yet. Upload your W-2s, 1099s, and other tax documents to keep
                        them organized and secure.
                    </p>
                ) : (
                    <div className="flex flex-col divide-y divide-outline-variant/20">
                        {documents.map((doc) => (
                            <div key={doc.id} className="flex items-center justify-between py-stack-md">
                                <div className="flex items-center gap-stack-md min-w-0">
                                    <MaterialIcon name="description" size={20} className="text-primary flex-shrink-0" />
                                    <div className="min-w-0">
                                        <p className="font-body-md text-body-md text-on-surface truncate max-w-[320px]">
                                            {doc.name}
                                        </p>
                                        <p className="font-label-caps uppercase tracking-[0.15em] text-[10px] text-on-surface-variant">
                                            {KIND_LABELS[doc.kind] ?? doc.kind} · {formatSize(doc.bytesSize)} ·{" "}
                                            {formatDate(doc.uploadedAt)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-stack-sm flex-shrink-0">
                                    <button
                                        onClick={() => onDownload(doc.id)}
                                        aria-label="Download"
                                        className="p-2 rounded-lg text-on-surface-variant hover:text-primary transition-colors"
                                    >
                                        <MaterialIcon name="download" size={18} />
                                    </button>
                                    <button
                                        onClick={() => onDelete(doc.id)}
                                        aria-label="Delete"
                                        className="p-2 rounded-lg text-on-surface-variant hover:text-error transition-colors"
                                    >
                                        <MaterialIcon name="delete" size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
