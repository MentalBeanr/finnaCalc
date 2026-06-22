import * as React from "react"
import { cn } from "@/lib/utils"

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
    spacing?: "compact" | "default" | "loose"
}

const spacingMap = {
    compact: "py-section-gap-sm",
    default: "py-section-gap-sm md:py-section-gap",
    loose: "py-section-gap",
} as const

export function Section({ className, spacing = "default", children, ...props }: SectionProps) {
    return (
        <section className={cn(spacingMap[spacing], className)} {...props}>
            {children}
        </section>
    )
}
