"use client"

import * as React from "react"
import { MaterialIcon } from "@/components/ds/material-icon"

interface FaqItemProps {
    question: string
    children: React.ReactNode
    defaultOpen?: boolean
}

export function FaqItem({ question, children, defaultOpen = false }: FaqItemProps) {
    const [open, setOpen] = React.useState(defaultOpen)

    return (
        <div className="border-b border-outline-variant/30">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="flex items-center justify-between gap-stack-md w-full py-6 text-left transition-colors hover:text-primary"
                aria-expanded={open}
            >
                <span className="font-headline-md text-[22px] leading-[1.3] text-primary">
                    {question}
                </span>
                <MaterialIcon
                    name={open ? "remove" : "add"}
                    size={24}
                    className="text-primary shrink-0"
                />
            </button>
            {open ? (
                <div className="pb-6 pr-12 font-body-md text-body-md text-on-surface-variant animate-fade-in">
                    {children}
                </div>
            ) : null}
        </div>
    )
}
