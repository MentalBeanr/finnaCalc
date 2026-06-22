import * as React from "react"
import { cn } from "@/lib/utils"

interface EyebrowProps extends React.HTMLAttributes<HTMLSpanElement> {
    tone?: "default" | "primary"
}

export function Eyebrow({ tone = "default", className, children, ...props }: EyebrowProps) {
    return (
        <span
            className={cn(
                "font-label-caps text-label-caps uppercase tracking-[0.15em]",
                tone === "primary" ? "text-primary" : "text-secondary",
                className,
            )}
            {...props}
        >
            {children}
        </span>
    )
}
