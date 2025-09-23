"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

interface StocksPageProps {
    onBack: () => void;
}

export default function StocksPage({ onBack }: StocksPageProps) {
    return (
        <div>
            <Button variant="outline" size="sm" onClick={onBack} className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Investing
            </Button>
            <h1 className="text-2xl font-bold">Stocks</h1>
            <p>Content about stock investing will go here.</p>
        </div>
    )
}