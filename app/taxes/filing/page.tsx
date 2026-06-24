"use client"

import { useRouter } from "next/navigation"
import { TaxFilingInterface } from "@/components/tax-filing-interface"

export default function TaxFilingPage() {
    const router = useRouter()
    return <TaxFilingInterface onBack={() => router.push("/taxes")} />
}
