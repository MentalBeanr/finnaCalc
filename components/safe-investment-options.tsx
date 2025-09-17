"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, TrendingUp, Shield, ExternalLink, ChevronRight } from "lucide-react"

interface SafeInvestmentOptionsProps {
    onBack: () => void
}

export default function SafeInvestmentOptions({ onBack }: SafeInvestmentOptionsProps) {
    const safeInvestments = [
        {
            name: "S&P 500 Index Fund",
            symbol: "SPY",
            avgReturn: "10.5%",
            risk: "Low-Medium",
            description: "Tracks the 500 largest US companies",
            minInvestment: "$1",
        },
        {
            name: "Total Stock Market",
            symbol: "VTI",
            avgReturn: "10.2%",
            risk: "Low-Medium",
            description: "Owns the entire US stock market",
            minInvestment: "$1",
        },
        {
            name: "Treasury Bond Fund",
            symbol: "BND",
            avgReturn: "4.1%",
            risk: "Very Low",
            description: "US government bonds - safest option",
            minInvestment: "$1",
        },
        {
            name: "High-Yield Savings",
            symbol: "HYSA",
            avgReturn: "4.5%",
            risk: "None",
            description: "FDIC insured savings account",
            minInvestment: "$0",
        },
        {
            name: "Target Date Fund 2060",
            symbol: "TDF",
            avgReturn: "9.8%",
            risk: "Low-Medium",
            description: "Auto-adjusts as you near retirement",
            minInvestment: "$1",
        },
        {
            name: "International Index",
            symbol: "VTIAX",
            avgReturn: "8.9%",
            risk: "Medium",
            description: "Global market diversification",
            minInvestment: "$3,000",
        },
        {
            name: "Real Estate Investment Trust",
            symbol: "VNQ",
            avgReturn: "9.1%",
            risk: "Medium",
            description: "Real estate without buying property",
            minInvestment: "$1",
        },
        {
            name: "Corporate Bond Fund",
            symbol: "LQD",
            avgReturn: "5.2%",
            risk: "Low",
            description: "Investment-grade corporate bonds",
            minInvestment: "$1",
        },
    ]

    const getRiskColor = (risk: string) => {
        switch (risk) {
            case "None":
            case "Very Low": // Added fall-through for cleaner code
                return "bg-green-100 text-green-700"
            case "Low":
                return "bg-blue-100 text-blue-700"
            case "Low-Medium":
                return "bg-yellow-100 text-yellow-700"
            case "Medium":
                return "bg-orange-100 text-orange-700"
            default:
                return "bg-gray-100 text-gray-700"
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" onClick={onBack}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Safe Investment Options</h1>
                    <p className="text-gray-600">Top safest investments with consistent returns</p>
                </div>
            </div>

            <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Shield className="h-6 w-6 text-blue-600" />
                            <div>
                                <h3 className="font-semibold text-gray-900">Secure Your Investments</h3>
                                <p className="text-sm text-gray-600">FDIC insured accounts up to $250,000</p>
                            </div>
                        </div>
                        <Button size="sm" variant="outline">
                            Learn More <ExternalLink className="h-3 w-3 ml-1" />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-0">
                    <div className="divide-y divide-gray-100">
                        {safeInvestments.map((investment, index) => (
                            <div key={index} className="p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                            <TrendingUp className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-gray-900">{investment.name}</h3>
                                                <span className="text-sm text-gray-500">({investment.symbol})</span>
                                            </div>
                                            <p className="text-sm text-gray-600">{investment.description}</p>
                                            <div className="flex items-center gap-3 mt-1">
                                                <Badge className={getRiskColor(investment.risk)} variant="secondary">
                                                    {investment.risk}
                                                </Badge>
                                                <span className="text-xs text-gray-500">Min: {investment.minInvestment}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right flex items-center gap-3">
                                        <div>
                                            <div className="text-lg font-bold text-green-600">{investment.avgReturn}</div>
                                            <div className="text-xs text-gray-500">avg return</div>
                                        </div>
                                        <ChevronRight className="h-5 w-5 text-gray-400" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-yellow-50 border-yellow-200">
                <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                        <Shield className="h-5 w-5 text-yellow-600 mt-0.5" />
                        <div className="text-sm">
                            <h4 className="font-semibold text-yellow-900 mb-1">Investment Risk Disclaimer</h4>
                            <p className="text-yellow-800">
                                All investments carry risk and may lose value. Past performance does not guarantee future results.
                                Please invest responsibly and consider your financial situation.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}