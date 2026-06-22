import { z } from "zod"
import { Decimal, parseAmount } from "@/lib/money/decimal"

export type ValidationResult<T> =
    | { ok: true; data: T }
    | { ok: false; errors: Record<string, string> }

interface DecimalFieldOptions {
    /** Minimum allowed value. Default 0. */
    min?: number
    /** Maximum allowed value. */
    max?: number
    /** If false, the value must be strictly greater than `min`. Default true (allows equal to `min`). */
    allowZero?: boolean
}

/**
 * Zod field producing a typed Decimal from a form string. Adds a typed
 * error message on parse failure, range failure, or empty input.
 */
export function decimalField(label: string, options: DecimalFieldOptions = {}) {
    const min = options.min ?? 0
    const allowZero = options.allowZero ?? true

    return z.string().transform((raw, ctx): Decimal => {
        const parsed = parseAmount(raw)
        if (parsed === null) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `${label} must be a valid number.`,
            })
            return z.NEVER as unknown as Decimal
        }
        if (allowZero ? parsed.lt(min) : parsed.lte(min)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `${label} must be ${allowZero ? "at least" : "greater than"} ${min}.`,
            })
            return z.NEVER as unknown as Decimal
        }
        if (options.max !== undefined && parsed.gt(options.max)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `${label} must be no greater than ${options.max}.`,
            })
            return z.NEVER as unknown as Decimal
        }
        return parsed
    })
}

/** Flatten a ZodError into a field-keyed message map (first message wins per field). */
export function flattenErrors(error: z.ZodError): Record<string, string> {
    const out: Record<string, string> = {}
    for (const issue of error.issues) {
        const key = issue.path.join(".") || "_form"
        if (!out[key]) out[key] = issue.message
    }
    return out
}

/** Run a Zod schema and produce a ValidationResult. */
export function runSchema<T>(
    schema: z.ZodType<T, z.ZodTypeDef, unknown>,
    raw: unknown,
): ValidationResult<T> {
    const parsed = schema.safeParse(raw)
    if (parsed.success) return { ok: true, data: parsed.data }
    return { ok: false, errors: flattenErrors(parsed.error) }
}
