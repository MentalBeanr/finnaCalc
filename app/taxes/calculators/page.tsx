"use client"

import { useRouter } from "next/navigation"
import TaxCalculators from "@/components/tax-calculators"

export default function TaxCalculatorsPage() {
    const router = useRouter()
    return <TaxCalculators onBack={() => router.push("/taxes")} />
}
