import * as React from "react"
import { cn } from "@/lib/utils"

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
    as?: "div" | "section" | "header" | "footer" | "main" | "nav"
}

export function Container({ as: Tag = "div", className, ...props }: ContainerProps) {
    return (
        <Tag
            className={cn(
                "mx-auto w-full max-w-container-max px-page-gutter",
                className,
            )}
            {...props}
        />
    )
}
