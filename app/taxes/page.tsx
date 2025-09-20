"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Calculator, BookOpen } from "lucide-react"
import TaxFilingInterface from "@/components/tax-filing-interface"
import TaxCalculators from "@/components/tax-calculators"
import Link from "next/link" // Import Link

export default function TaxesPage() {
    const [activeSection, setActiveSection] = useState("")

    const handleSectionClick = (section: string) => {
        setActiveSection(section)
    }

    const handleBackToTab = () => {
        setActiveSection("")
    }

    const renderContent = () => {
        if (activeSection === "tax-filing") {
            return <TaxFilingInterface onBack={handleBackToTab} />
        }
        if (activeSection === "tax-calculators") {
            return <TaxCalculators onBack={handleBackToTab} />
        }
        // "tax-education" is now handled by a direct link
        return (
            <section className="space-y-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-primary mb-4">Maximize Your Tax Returns</h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Easy tax filing, smart calculators, and tools to help you save money and optimize your tax strategy.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <Card
                        className="bg-white hover:shadow-lg transition-shadow cursor-pointer border border-gray-200"
                        onClick={() => handleSectionClick("tax-filing")}
                    >
                        <CardHeader className="text-center pb-4">
                            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mx-auto mb-3">
                                <FileText className="h-6 w-6 text-primary-foreground" />
                            </div>
                            <CardTitle className="text-lg">Easy Tax Filing</CardTitle>
                            <CardDescription className="text-sm text-gray-600">Simple, step-by-step tax preparation</CardDescription>
                        </CardHeader>
                        <CardContent className="text-center">
                            <p className="text-sm text-gray-600 mb-4">
                                File your taxes easily with our guided interface. Supports personal, business, and rental
                                properties.
                            </p>
                            <Button className="w-full">Start Filing</Button>
                        </CardContent>
                    </Card>
                    <Card
                        className="bg-white hover:shadow-lg transition-shadow cursor-pointer border border-gray-200"
                        onClick={() => handleSectionClick("tax-calculators")}
                    >
                        <CardHeader className="text-center pb-4">
                            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mx-auto mb-3">
                                <Calculator className="h-6 w-6 text-primary-foreground" />
                            </div>
                            <CardTitle className="text-lg">Tax Calculators & Tools</CardTitle>
                            <CardDescription className="text-sm text-gray-600">Calculators to maximize your refund</CardDescription>
                        </CardHeader>
                        <CardContent className="text-center">
                            <p className="text-sm text-gray-600 mb-4">
                                Tax calculator, deduction finder, refund estimator, and withholding calculator to optimize your
                                taxes.
                            </p>
                            <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary/5 bg-transparent">
                                Explore Tools
                            </Button>
                        </CardContent>
                    </Card>
                    <Link href="/education">
                        <Card
                            className="bg-white hover:shadow-lg transition-shadow cursor-pointer border border-gray-200 h-full"
                        >
                            <CardHeader className="text-center pb-4">
                                <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mx-auto mb-3">
                                    <BookOpen className="h-6 w-6 text-primary-foreground" />
                                </div>
                                <CardTitle className="text-lg">Tax Education</CardTitle>
                                <CardDescription className="text-sm text-gray-600">Learn tax strategies and planning</CardDescription>
                            </CardHeader>
                            <CardContent className="text-center">
                                <p className="text-sm text-gray-600 mb-4">
                                    Understand tax brackets, deductions, business vs personal taxes, and planning strategies.
                                </p>
                                <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary/5 bg-transparent">
                                    Start Learning
                                </Button>
                            </CardContent>
                        </Card>
                    </Link>
                </div>
            </section>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <main className="container mx-auto px-4 py-8 max-w-6xl">
                {renderContent()}
            </main>
        </div>
    )
}