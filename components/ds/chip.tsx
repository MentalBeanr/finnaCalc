import * as React from "react"
import { cn } from "@/lib/utils"

interface ChipProps extends React.HTMLAttributes<HTMLSpanElement> {
    tone?: "neutral" | "primary" | "success"
}

const toneMap = {
    neutral: "bg-surface-container text-on-surface-variant",
    primary: "bg-surface-container text-primary",
    success: "bg-surface-container text-success",
} as const

export function Chip({ tone = "neutral", className, children, ...props }: ChipProps) {
    return (
        <span
            className={cn(
                "inline-flex items-center font-label-caps text-label-caps uppercase tracking-[0.15em] rounded-full px-3 py-1",
                toneMap[tone],
                className,
            )}
            {...props}
        >
            {children}
        </span>
    )
}
