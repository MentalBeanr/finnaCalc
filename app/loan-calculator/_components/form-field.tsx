"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface FormFieldProps {
    id: string
    label: string
    value: string
    onChange: (value: string) => void
    placeholder?: string
    type?: string
    step?: string
    error?: string
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
}: FormFieldProps) {
    return (
        <div>
            <Label htmlFor={id}>{label}</Label>
            <Input
                id={id}
                type={type}
                step={step}
                placeholder={placeholder}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? `${id}-error` : undefined}
            />
            {error && (
                <p id={`${id}-error`} className="mt-1 text-xs text-red-500">
                    {error}
                </p>
            )}
        </div>
    )
}
