"use client"

import * as React from "react"
import Papa from "papaparse"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Eyebrow } from "@/components/ds/eyebrow"
import { MaterialIcon } from "@/components/ds/material-icon"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    detectFileKind,
    parseCsvRows,
    parsePdfText,
    parseTxtText,
} from "@/lib/calculations/budget-import"
import { formatCurrency } from "@/lib/money/decimal"
import type { BudgetItem, BudgetType } from "@/lib/types/budget"
import { BUSINESS_CATEGORIES, PERSONAL_CATEGORIES } from "@/lib/types/budget"
import type {
    ImportPreviewItem,
    ParsedTransaction,
} from "@/lib/types/budget-import"

interface ImportStatementPanelProps {
    budgetType: BudgetType
    onImport: (items: BudgetItem[]) => void
}

async function readFile(file: File, kind: "csv" | "txt"): Promise<string> {
    if (kind === "csv" || kind === "txt") {
        return await file.text()
    }
    throw new Error("readFile: not for pdf")
}

async function extractPdfText(file: File): Promise<string> {
    // Dynamically import pdfjs to avoid pulling it into the server bundle.
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs")
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`
    const buffer = await file.arrayBuffer()
    const pdf = await pdfjs.getDocument({ data: buffer }).promise
    let text = ""
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const content = await page.getTextContent()
        text +=
            content.items
                .map((item: unknown) =>
                    typeof item === "object" && item && "str" in item
                        ? String((item as { str: string }).str)
                        : "",
                )
                .join(" ") + "\n"
    }
    return text
}

function parsedToPreviewItems(
    parsed: ReadonlyArray<ParsedTransaction>,
    budgetType: BudgetType,
): ImportPreviewItem[] {
    return parsed.map((tx, idx) => ({
        ...tx,
        id: `import-${Date.now()}-${idx}`,
        selected: true,
        budgetType,
    }))
}

function previewToBudgetItem(item: ImportPreviewItem): BudgetItem {
    return {
        id: item.id,
        category: item.category,
        subcategory: item.description,
        amount: item.amount,
        frequency: "monthly",
        type: item.type,
        isFixed: false,
        budgetType: item.budgetType,
    }
}

export function ImportStatementPanel({
    budgetType,
    onImport,
}: ImportStatementPanelProps) {
    const [open, setOpen] = React.useState(false)
    const [fileName, setFileName] = React.useState<string>("")
    const [preview, setPreview] = React.useState<ImportPreviewItem[] | null>(null)
    const [error, setError] = React.useState<string | null>(null)
    const [busy, setBusy] = React.useState(false)
    const fileRef = React.useRef<HTMLInputElement | null>(null)

    const reset = () => {
        setFileName("")
        setPreview(null)
        setError(null)
        if (fileRef.current) fileRef.current.value = ""
    }

    const handleFile = async (file: File) => {
        setBusy(true)
        setError(null)
        try {
            const kind = detectFileKind(file.name)
            if (!kind) {
                setError("Unsupported file. Use .csv, .txt, or .pdf.")
                return
            }
            let parsed: ParsedTransaction[] = []
            if (kind === "csv") {
                const text = await readFile(file, "csv")
                const result = Papa.parse<Record<string, string>>(text, {
                    header: true,
                    skipEmptyLines: true,
                })
                parsed = parseCsvRows(result.data, budgetType)
            } else if (kind === "txt") {
                const text = await readFile(file, "txt")
                parsed = parseTxtText(text, budgetType)
            } else {
                const text = await extractPdfText(file)
                parsed = parsePdfText(text, budgetType)
            }
            if (parsed.length === 0) {
                setError(
                    "No transactions found. Check the file format — we look for date / description / amount columns or lines.",
                )
                setPreview(null)
                return
            }
            setPreview(parsedToPreviewItems(parsed, budgetType))
            setFileName(file.name)
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to read file.")
        } finally {
            setBusy(false)
        }
    }

    const updatePreview = (
        id: string,
        update: (prev: ImportPreviewItem) => ImportPreviewItem,
    ) =>
        setPreview((prev) =>
            prev ? prev.map((it) => (it.id === id ? update(it) : it)) : prev,
        )

    const toggle = (id: string) =>
        updatePreview(id, (it) => ({ ...it, selected: !it.selected }))

    const setCategory = (id: string, category: string) =>
        updatePreview(id, (it) => ({ ...it, category }))

    const setAllSelected = (selected: boolean) =>
        setPreview((prev) =>
            prev ? prev.map((it) => ({ ...it, selected })) : prev,
        )

    const selectedCount = preview?.filter((p) => p.selected).length ?? 0

    const commitImport = () => {
        if (!preview) return
        const toAdd = preview.filter((p) => p.selected).map(previewToBudgetItem)
        if (toAdd.length === 0) return
        onImport(toAdd)
        reset()
        setOpen(false)
    }

    const categories =
        budgetType === "personal" ? PERSONAL_CATEGORIES : BUSINESS_CATEGORIES

    return (
        <div className="flex flex-col gap-stack-md">
            <div className="flex items-center justify-between gap-stack-md border-b border-outline-variant/20 pb-stack-sm">
                <div className="flex flex-col gap-stack-sm">
                    <Eyebrow>Import</Eyebrow>
                    <h3 className="font-headline-md text-headline-md text-primary">
                        Pull items from a bank statement
                    </h3>
                </div>
                <Button
                    variant={open ? "outline" : "default"}
                    onClick={() => {
                        if (open) reset()
                        setOpen((s) => !s)
                    }}
                >
                    <MaterialIcon
                        name={open ? "close" : "upload_file"}
                        size={16}
                    />
                    {open ? "Cancel" : "Import Statement"}
                </Button>
            </div>

            {open ? (
                <div className="flex flex-col gap-stack-lg p-10 border border-outline-variant/30 rounded-lg bg-surface-container-lowest">
                    <div className="flex flex-col gap-stack-sm">
                        <p className="font-body-md text-body-md text-on-surface-variant max-w-prose">
                            Upload a CSV, plain-text, or PDF statement. We
                            extract transactions, guess a category for each one,
                            and let you review before anything is added to your
                            budget. Files never leave your browser.
                        </p>
                        <input
                            ref={fileRef}
                            type="file"
                            accept=".csv,.txt,.pdf"
                            onChange={(e) => {
                                const f = e.target.files?.[0]
                                if (f) handleFile(f)
                            }}
                            className="font-body-md text-body-md file:mr-stack-md file:border file:border-outline-variant/40 file:rounded-full file:bg-transparent file:px-4 file:py-2 file:font-ui-button file:text-ui-button file:uppercase file:tracking-[0.05em] file:text-primary hover:file:bg-surface-container"
                        />
                        {fileName ? (
                            <span className="font-body-md text-sm text-on-surface-variant">
                                Loaded: {fileName}
                            </span>
                        ) : null}
                        {busy ? (
                            <span className="font-body-md text-sm text-on-surface-variant">
                                Parsing&hellip;
                            </span>
                        ) : null}
                        {error ? (
                            <span className="font-body-md text-sm text-error">
                                {error}
                            </span>
                        ) : null}
                    </div>

                    {preview ? (
                        <div className="flex flex-col gap-stack-md">
                            <div className="flex items-center justify-between gap-stack-md pt-stack-sm border-t border-outline-variant/20">
                                <span className="font-label-caps text-label-caps uppercase tracking-[0.15em] text-on-surface-variant">
                                    Found {preview.length} · {selectedCount} selected
                                </span>
                                <div className="flex gap-stack-sm">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setAllSelected(true)}
                                    >
                                        Select all
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setAllSelected(false)}
                                    >
                                        Deselect all
                                    </Button>
                                </div>
                            </div>
                            <ul className="flex flex-col max-h-[420px] overflow-y-auto">
                                {preview.map((item) => (
                                    <li
                                        key={item.id}
                                        className="flex items-center gap-stack-md py-3 border-b border-outline-variant/15 last:border-b-0"
                                    >
                                        <Checkbox
                                            checked={item.selected}
                                            onCheckedChange={() => toggle(item.id)}
                                            aria-label={`Include ${item.description}`}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-baseline gap-stack-sm">
                                                <span className="font-body-md text-body-md text-primary truncate">
                                                    {item.description}
                                                </span>
                                                <span className="font-label-caps text-[10px] uppercase tracking-[0.15em] text-on-surface-variant border border-outline-variant/40 rounded-full px-2 py-0.5">
                                                    {item.type}
                                                </span>
                                            </div>
                                            {item.date ? (
                                                <span className="font-body-md text-sm text-on-surface-variant">
                                                    {item.date}
                                                </span>
                                            ) : null}
                                        </div>
                                        <div className="w-48">
                                            <Select
                                                value={item.category}
                                                onValueChange={(v) =>
                                                    setCategory(item.id, v)
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {categories[item.type].map(
                                                        (c) => (
                                                            <SelectItem
                                                                key={c}
                                                                value={c}
                                                            >
                                                                {c}
                                                            </SelectItem>
                                                        ),
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <span className="font-body-md text-body-md tabular-nums w-24 text-right">
                                            {item.type === "income" ? "+" : "−"}
                                            {formatCurrency(item.amount)}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                            <div className="flex justify-end gap-stack-sm pt-stack-md border-t border-outline-variant/20">
                                <Button variant="outline" onClick={reset}>
                                    Pick a different file
                                </Button>
                                <Button
                                    onClick={commitImport}
                                    disabled={selectedCount === 0}
                                >
                                    Import {selectedCount}{" "}
                                    {selectedCount === 1 ? "item" : "items"}
                                </Button>
                            </div>
                        </div>
                    ) : null}
                </div>
            ) : null}
        </div>
    )
}
