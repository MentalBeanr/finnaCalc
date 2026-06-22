"use client"

import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
    return (
        <Sonner
            theme="light"
            className="toaster group"
            toastOptions={{
                classNames: {
                    toast:
                        "group toast group-[.toaster]:bg-surface-container-lowest group-[.toaster]:text-on-background group-[.toaster]:border group-[.toaster]:border-outline-variant",
                    description: "group-[.toast]:text-on-surface-variant",
                    actionButton:
                        "group-[.toast]:bg-primary group-[.toast]:text-on-primary",
                    cancelButton:
                        "group-[.toast]:bg-surface-container group-[.toast]:text-on-surface-variant",
                },
            }}
            {...props}
        />
    )
}

export { Toaster }
