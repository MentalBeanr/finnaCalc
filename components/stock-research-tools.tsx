"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Search, TrendingUp, TrendingDown, DollarSign, BarChart3, ExternalLink } from "lucide-react"

interface StockResearchToolsProps {
    onBack: () => void
}

export default function StockResearchTools({ onBack }: StockResearchToolsProps) {
    const [searchTerm, setSearchTerm] = useState("")
    const [activeTab, setActiveTab] = useState("screener")

    const popularStocks = [
        {
            symbol: "AAPL",
            name: "Apple Inc.",
            price: "$175.43",
            change: "+2.34%",
            peRatio: "28.5",
            marketCap: "$2.8T",
            description: "Technology company known for iPhone, iPad, and Mac computers.",
        },
        {
            symbol: "MSFT",
            name: "Microsoft Corporation",
            price: "$378.85",
            change: "+1.87%",
            peRatio: "32.1",
            marketCap: "$2.8T",
            description: "Software company behind Windows, Office, and Azure cloud services.",
        },
        {
            symbol: "GOOGL",
            name: "Alphabet Inc.",
            price: "$138.21",
            change: "-0.45%",
            peRatio: "25.8",
            marketCap: "$1.7T",
            description: "Parent company of Google, YouTube, and other internet services.",
        },
        {
            symbol: "AMZN",
            name: "Amazon.com Inc.",
            price: "$145.86",
            change: "+3.21%",
            peRatio: "45.2",
            marketCap: "$1.5T",
            description: "E-commerce and cloud computing giant with AWS services.",
        },
        {
            symbol: "TSLA",
            name: "Tesla Inc.",
            price: "$248.50",
            change: "-1.23%",
            peRatio: "65.4",
            marketCap: "$790B",
            description: "Electric vehicle and clean energy company led by Elon Musk.",
        },
        {
            symbol: "NVDA",
            name: "NVIDIA Corporation",
            price: "$875.28",
            change: "+4.56%",
            peRatio: "71.2",
            marketCap: "$2.2T",
            description: "Semiconductor company specializing in graphics and AI chips.",
        },
    ]

    const filteredStocks = popularStocks.filter(
        (stock) =>
            stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
            stock.name.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" onClick={onBack}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                </Button>
                <div>
                    <h1 className="text-3xl font-bold">Stock Research Tools</h1>
                    <p className="text-muted-foreground">Simple tools to research and understand investments</p>
                </div>
            </div>

            {/* Advertisement Space */}
            <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <BarChart3 className="h-8 w-8 text-purple-600" />
                            <div>
                                <h3 className="font-semibold">Advanced Analytics</h3>
                                <p className="text-sm text-muted-foreground">Professional-grade research tools</p>
                            </div>
                        </div>
                        <Button size="sm" variant="outline">
                            Upgrade <ExternalLink className="h-3 w-3 ml-1" />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Tool Tabs */}
            <div className="flex gap-2 border-b">
                <button
                    onClick={() => setActiveTab("screener")}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === "screener"
                            ? "border-primary text-primary"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                >
                    Stock Screener
                </button>
                <button
                    onClick={() => setActiveTab("analysis")}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === "analysis"
                            ? "border-primary text-primary"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                >
                    Company Analysis
                </button>
                <button
                    onClick={() => setActiveTab("portfolio")}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === "portfolio"
                            ? "border-primary text-primary"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                >
                    Portfolio Tracker
                </button>
            </div>

            {/* Stock Screener Tab */}
            {activeTab === "screener" && (
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Find Stocks</CardTitle>
                            <CardDescription>Search and filter stocks based on your criteria</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-4 mb-6">
                                <div className="flex-1">
                                    <Input
                                        placeholder="Search by company name or symbol (e.g., AAPL, Apple)"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full"
                                    />
                                </div>
                                <Button>
                                    <Search className="h-4 w-4 mr-2" />
                                    Search
                                </Button>
                            </div>

                            <div className="grid gap-4">
                                {filteredStocks.map((stock, index) => (
                                    <Card key={index} className="hover:shadow-md transition-shadow">
                                        <CardContent className="p-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h3 className="font-bold text-lg">{stock.symbol}</h3>
                                                            <Badge variant={stock.change.startsWith("+") ? "default" : "destructive"}>
                                                                {stock.change.startsWith("+") ? (
                                                                    <TrendingUp className="h-3 w-3 mr-1" />
                                                                ) : (
                                                                    <TrendingDown className="h-3 w-3 mr-1" />
                                                                )}
                                                                {stock.change}
                                                            </Badge>
                                                        </div>
                                                        <p className="text-sm text-muted-foreground">{stock.name}</p>
                                                        <p className="text-xs text-muted-foreground mt-1">{stock.description}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-2xl font-bold">{stock.price}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        P/E: {stock.peRatio} • Cap: {stock.marketCap}
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Company Analysis Tab */}
            {activeTab === "analysis" && (
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Company Analysis</CardTitle>
                            <CardDescription>Understand key financial metrics in simple terms</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Key Metrics Explained</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-3">
                                            <div className="p-3 border rounded-lg">
                                                <h4 className="font-medium">P/E Ratio (Price-to-Earnings)</h4>
                                                <p className="text-sm text-muted-foreground">
                                                    How much you pay for each dollar of earnings. Lower is often better.
                                                </p>
                                            </div>
                                            <div className="p-3 border rounded-lg">
                                                <h4 className="font-medium">Market Cap</h4>
                                                <p className="text-sm text-muted-foreground">
                                                    Total value of all company shares. Shows company size.
                                                </p>
                                            </div>
                                            <div className="p-3 border rounded-lg">
                                                <h4 className="font-medium">Revenue Growth</h4>
                                                <p className="text-sm text-muted-foreground">
                                                    How fast the company is growing its sales year over year.
                                                </p>
                                            </div>
                                            <div className="p-3 border rounded-lg">
                                                <h4 className="font-medium">Debt-to-Equity</h4>
                                                <p className="text-sm text-muted-foreground">
                                                    How much debt vs equity the company has. Lower is safer.
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Analysis Checklist</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2">
                                                <input type="checkbox" className="rounded" />
                                                <span className="text-sm">Company has growing revenue</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input type="checkbox" className="rounded" />
                                                <span className="text-sm">P/E ratio is reasonable (under 30)</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input type="checkbox" className="rounded" />
                                                <span className="text-sm">Company has manageable debt</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input type="checkbox" className="rounded" />
                                                <span className="text-sm">Business model makes sense</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input type="checkbox" className="rounded" />
                                                <span className="text-sm">Strong competitive position</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input type="checkbox" className="rounded" />
                                                <span className="text-sm">Experienced management team</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Portfolio Tracker Tab */}
            {activeTab === "portfolio" && (
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Portfolio Tracker</CardTitle>
                            <CardDescription>Monitor your investments simply and clearly</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-12">
                                <DollarSign className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                                <h3 className="text-xl font-semibold mb-2">Start Tracking Your Portfolio</h3>
                                <p className="text-muted-foreground mb-6">
                                    Add your investments to see performance, allocation, and get personalized insights.
                                </p>
                                <Button>Add Your First Investment</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}