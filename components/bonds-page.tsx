"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

interface BondsPageProps {
    onBack: () => void;
}

export default function BondsPage({ onBack }: BondsPageProps) {
    return (
        <div>
            <Button variant="outline" size="sm" onClick={onBack} className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Investing
            </Button>
            <h1 className="text-2xl font-bold">Bonds</h1>
            <p>Content about bond investing will go here.</p>
        </div>
    )
}