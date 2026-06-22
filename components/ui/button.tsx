import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap font-ui-button text-ui-button uppercase tracking-[0.05em] transition-colors duration-200 disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 [&_.material-symbols-outlined]:text-[18px]",
    {
        variants: {
            variant: {
                default:
                    "bg-primary text-on-primary hover:bg-primary/90 rounded-full",
                outline:
                    "border border-outline-variant text-primary bg-transparent hover:bg-surface-container-high rounded-full",
                ghost:
                    "text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-full",
                link:
                    "text-primary underline-offset-4 hover:underline normal-case tracking-normal",
                destructive:
                    "bg-error text-on-error hover:bg-error/90 rounded-full",
                secondary:
                    "bg-secondary-container text-on-secondary-container hover:bg-surface-container-highest rounded-full",
            },
            size: {
                default: "h-11 px-6",
                sm: "h-9 px-4",
                lg: "h-12 px-8",
                xl: "h-14 px-10 text-[15px]",
                icon: "h-11 w-11 rounded-full",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    },
)

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
        VariantProps<typeof buttonVariants> {
    asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : "button"
        return (
            <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
        )
    },
)
Button.displayName = "Button"

export { Button, buttonVariants }
