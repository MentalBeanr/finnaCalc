"use client"

import * as React from "react"
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
    helperText?: string
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
    helperText,
    className,
}: FormFieldProps) {
    const helperId = helperText ? `${id}-helper` : undefined
    const errorId = error ? `${id}-error` : undefined
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
                aria-describedby={errorId ?? helperId}
                className={error ? "border-error focus-visible:border-error" : undefined}
            />
            {helperText && !error ? (
                <p id={helperId} className="font-body-md text-sm text-on-surface-variant">
                    {helperText}
                </p>
            ) : null}
            {error ? (
                <p id={errorId} className="font-body-md text-sm text-error">
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
    helperText?: string
    className?: string
}

export function SelectFieldShell({
    id,
    label,
    children,
    error,
    helperText,
    className,
}: SelectFieldShellProps) {
    return (
        <div className={cn("flex flex-col gap-stack-sm", className)}>
            <Label htmlFor={id}>{label}</Label>
            {children}
            {helperText && !error ? (
                <p className="font-body-md text-sm text-on-surface-variant">{helperText}</p>
            ) : null}
            {error ? (
                <p className="font-body-md text-sm text-error">{error}</p>
            ) : null}
        </div>
    )
}

interface CheckboxFieldRowProps {
    id: string
    label: string
    description?: string
    children: React.ReactNode
    className?: string
}

export function CheckboxFieldRow({
    id,
    label,
    description,
    children,
    className,
}: CheckboxFieldRowProps) {
    return (
        <label
            htmlFor={id}
            className={cn(
                "flex items-start gap-stack-md cursor-pointer select-none",
                className,
            )}
        >
            <div className="pt-1">{children}</div>
            <div className="flex flex-col gap-1">
                <span className="font-body-md text-body-md text-on-background">{label}</span>
                {description ? (
                    <span className="font-body-md text-sm text-on-surface-variant">
                        {description}
                    </span>
                ) : null}
            </div>
        </label>
    )
}
