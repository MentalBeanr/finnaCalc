import * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { MaterialIcon } from "@/components/ds/material-icon"
import { Eyebrow } from "@/components/ds/eyebrow"

interface SectionHeadingProps {
    eyebrow?: string
    title: string
    cta?: { label: string; href: string }
    className?: string
}

export function SectionHeading({ eyebrow, title, cta, className }: SectionHeadingProps) {
    return (
        <div
            className={cn(
                "flex flex-col gap-stack-md md:flex-row md:items-end md:justify-between border-b border-outline-variant/20 pb-stack-sm",
                className,
            )}
        >
            <div className="flex flex-col gap-stack-sm">
                {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
                <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary">
                    {title}
                </h2>
            </div>
            {cta ? (
                <Link
                    href={cta.href}
                    className="inline-flex items-center gap-stack-sm font-ui-button text-ui-button uppercase tracking-[0.05em] text-secondary hover:text-primary transition-colors"
                >
                    {cta.label}
                    <MaterialIcon name="arrow_forward" size={18} />
                </Link>
            ) : null}
        </div>
    )
}
