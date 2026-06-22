import * as React from "react"
import Link from "next/link"
import { MaterialIcon } from "@/components/ds/material-icon"
import { cn } from "@/lib/utils"

export interface CalculatorCardProps {
    title: string
    description: string
    href: string
    icon: string
    estimatedMinutes?: number
    cta?: string
    variant?: "default" | "compact"
    className?: string
}

export function CalculatorCard({
    title,
    description,
    href,
    icon,
    estimatedMinutes,
    cta = "Calculate",
    variant = "default",
    className,
}: CalculatorCardProps) {
    const isCompact = variant === "compact"
    return (
        <Link
            href={href}
            className={cn(
                "group flex flex-col gap-stack-md border border-outline-variant/30 rounded-lg bg-surface-container-lowest transition-colors duration-200 hover:border-primary/40",
                isCompact ? "p-6" : "p-10",
                className,
            )}
        >
            <MaterialIcon
                name={icon}
                size={isCompact ? 24 : 32}
                className="text-primary"
            />
            <div className="flex flex-col gap-stack-sm flex-grow">
                <h3
                    className={cn(
                        "font-headline-md text-primary",
                        isCompact ? "text-[22px] leading-[1.3]" : "text-headline-md",
                    )}
                >
                    {title}
                </h3>
                <p className="font-body-md text-body-md text-on-surface-variant flex-grow">
                    {description}
                </p>
            </div>
            <div className="flex items-center justify-between gap-stack-md pt-stack-sm">
                {estimatedMinutes ? (
                    <span className="font-label-caps text-label-caps uppercase tracking-[0.15em] text-secondary">
                        {estimatedMinutes} min calculation
                    </span>
                ) : (
                    <span />
                )}
                <span className="inline-flex items-center gap-stack-sm font-ui-button text-ui-button uppercase tracking-[0.05em] text-primary">
                    {cta}
                    <MaterialIcon
                        name="arrow_forward"
                        size={16}
                        className="transition-transform duration-200 group-hover:translate-x-0.5"
                    />
                </span>
            </div>
        </Link>
    )
}
