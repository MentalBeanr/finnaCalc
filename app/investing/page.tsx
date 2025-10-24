"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Shield, GraduationCap } from "lucide-react"
import InvestingOptions from "@/components/investing-options"
import StocksPage from "@/components/stocks-page"
import BondsPage from "@/components/bonds-page"
import SafeInvestmentsPage from "@/components/safe-investments-page"
import StockResearchTools from "@/components/stock-research-tools"
import Link from "next/link"

export default function InvestingPage() {
  const [activeSection, setActiveSection] = useState("")

  const handleSectionClick = (section: string) => {
    setActiveSection(section)
  }

  const handleBackToTab = () => {
    setActiveSection("")
  }

  const renderContent = () => {
    if (activeSection === "investing-options") {
      return <InvestingOptions onBack={handleBackToTab} onSelect={handleSectionClick} />
    }
    if (activeSection === "stocks") {
      return <StocksPage onBack={() => setActiveSection("investing-options")} />
    }
    if (activeSection === "bonds") {
      return <BondsPage onBack={() => setActiveSection("investing-options")} />
    }
    if (activeSection === "safe-investments") {
      return <SafeInvestmentsPage onBack={() => setActiveSection("investing-options")} />
    }
    if (activeSection === "stock-research") {
      return <StockResearchTools onBack={handleBackToTab} />
    }
    // "investment-education" is now handled by a direct link
    return (
        <section className="space-y-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Smart Investing Made Simple</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Professional investment tools to help individuals and businesses make better financial decisions.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card
                className="bg-white hover:shadow-lg transition-shadow cursor-pointer border border-gray-200"
                onClick={() => handleSectionClick("investing-options")}
            >
              <CardHeader className="text-center pb-4">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-lg text-gray-900">Investing</CardTitle>
                <CardDescription className="text-sm text-gray-600">Explore safe investment options</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-gray-600 mb-4">
                  Explore curated safe investment options including index funds, ETFs, and bonds.
                </p>
                <Button className="w-full bg-blue-600 hover:bg-blue-700">View Safe Options</Button>
              </CardContent>
            </Card>
            <Card
                className="bg-white hover:shadow-lg transition-shadow cursor-pointer border border-gray-200"
                onClick={() => handleSectionClick("stock-research")}
            >
              <CardHeader className="text-center pb-4">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-lg text-gray-900">Stock Research Tools</CardTitle>
                <CardDescription className="text-sm text-gray-600">
                  Tools to research and analyze stocks
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-gray-600 mb-4">
                  Basic stock screener and analysis tools designed for beginners.
                </p>
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  Explore Tools
                </Button>
              </CardContent>
            </Card>
            <Link href="/education">
              <Card
                  className="bg-white hover:shadow-lg transition-shadow cursor-pointer border border-gray-200 h-full"
              >
                <CardHeader className="text-center pb-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <GraduationCap className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-lg text-gray-900">Learn Investing Basics</CardTitle>
                  <CardDescription className="text-sm text-gray-600">Learn the fundamentals of investing</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-sm text-gray-600 mb-4">
                    Educational content about stocks, bonds, and building a portfolio.
                  </p>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <main className="container mx-auto px-4 py-8 max-w-6xl">
          {renderContent()}
        </main>
      </div>
  )
}