import * as React from "react"
import { cn } from "@/lib/utils"

interface MaterialIconProps extends React.HTMLAttributes<HTMLSpanElement> {
    name: string
    size?: number
    fill?: 0 | 1
    weight?: 100 | 200 | 300 | 400 | 500 | 600 | 700
}

export function MaterialIcon({
    name,
    size = 24,
    fill = 0,
    weight = 300,
    className,
    style,
    ...props
}: MaterialIconProps) {
    return (
        <span
            aria-hidden="true"
            className={cn("material-symbols-outlined leading-none", className)}
            style={{
                fontSize: `${size}px`,
                fontVariationSettings: `'FILL' ${fill}, 'wght' ${weight}, 'GRAD' 0, 'opsz' ${size}`,
                ...style,
            }}
            {...props}
        >
            {name}
        </span>
    )
}
