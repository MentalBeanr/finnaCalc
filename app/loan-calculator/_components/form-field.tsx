"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface FormFieldProps {
    id: string
    label: string
    value: string
    onChange: (value: string) => void
    placeholder?: string
    type?: string
    step?: string
    error?: string
    inputMode?: "numeric" | "decimal" | "text"
    className?: string
}

export function FormField({
    id,
    label,
    value,
    onChange,
    placeholder,
    type = "number",
    step,
    error,
    inputMode = "decimal",
    className,
}: FormFieldProps) {
    return (
        <div className={cn("flex flex-col gap-stack-sm", className)}>
            <Label htmlFor={id}>{label}</Label>
            <Input
                id={id}
                type={type}
                step={step}
                inputMode={inputMode}
                placeholder={placeholder}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? `${id}-error` : undefined}
                className={error ? "border-error focus-visible:border-error" : undefined}
            />
            {error ? (
                <p
                    id={`${id}-error`}
                    className="font-body-md text-sm text-error"
                >
                    {error}
                </p>
            ) : null}
        </div>
    )
}

interface SelectFieldShellProps {
    id: string
    label: string
    children: React.ReactNode
    error?: string
    className?: string
}

export function SelectFieldShell({
    id,
    label,
    children,
    error,
    className,
}: SelectFieldShellProps) {
    return (
        <div className={cn("flex flex-col gap-stack-sm", className)}>
            <Label htmlFor={id}>{label}</Label>
            {children}
            {error ? (
                <p className="font-body-md text-sm text-error">{error}</p>
            ) : null}
        </div>
    )
}
