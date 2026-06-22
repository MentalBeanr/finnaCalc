"use client"

import { FormField } from "@/components/ds/form-field"
import type { ProductPricingFormState } from "@/lib/validators/pricing"

interface ProductFormProps {
    value: ProductPricingFormState
    onChange: (next: ProductPricingFormState) => void
    errors: Record<string, string>
}

export function ProductForm({ value, onChange, errors }: ProductFormProps) {
    const set = <K extends keyof ProductPricingFormState>(
        key: K,
        next: ProductPricingFormState[K],
    ) => onChange({ ...value, [key]: next })

    return (
        <div className="grid grid-cols-2 gap-stack-lg">
            <FormField
                id="productCost"
                label="Product Cost ($)"
                value={value.productCost}
                onChange={(v) => set("productCost", v)}
                placeholder="25"
                step="0.01"
                helperText="Total cost to make or acquire one unit"
                error={errors.productCost}
            />
            <FormField
                id="desiredMarginPercent"
                label="Target Margin (%)"
                value={value.desiredMarginPercent}
                onChange={(v) => set("desiredMarginPercent", v)}
                placeholder="50"
                step="0.1"
                helperText="Profit as a percent of the selling price"
                error={errors.desiredMarginPercent}
            />
            <FormField
                id="competitorPrice"
                label="Competitor Price ($)"
                value={value.competitorPrice}
                onChange={(v) => set("competitorPrice", v)}
                placeholder="60"
                step="0.01"
                helperText="Optional — for relative positioning"
                error={errors.competitorPrice}
            />
            <FormField
                id="shippingCost"
                label="Shipping Cost ($)"
                value={value.shippingCost}
                onChange={(v) => set("shippingCost", v)}
                placeholder="5"
                step="0.01"
                error={errors.shippingCost}
            />
            <FormField
                id="volumeDiscountPercent"
                label="Volume Discount (%)"
                value={value.volumeDiscountPercent}
                onChange={(v) => set("volumeDiscountPercent", v)}
                placeholder="10"
                step="0.1"
                helperText="For bulk orders"
                error={errors.volumeDiscountPercent}
                className="col-span-2"
            />
        </div>
    )
}
