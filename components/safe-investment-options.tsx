"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, TrendingUp, Shield, ExternalLink } from "lucide-react"

interface SafeInvestmentOptionsProps {
    onBack: () => void
}

export default function SafeInvestmentOptions({ onBack }: SafeInvestmentOptionsProps) {
    const safeInvestments = [
        {
            name: "S&P 500 Index Fund (IVV)",
            symbol: "IVV",
            avgReturn: "10.5%",
            risk: "Low-Medium",
            description: "Tracks the 500 largest US companies.",
            minInvestment: "$1",
            link: "https://www.ishares.com/us/products/239726/ishares-core-sp-500-etf",
        },
        {
            name: "Total Stock Market (VTI)",
            symbol: "VTI",
            avgReturn: "10.2%",
            risk: "Low-Medium",
            description: "Owns the entire US stock market.",
            minInvestment: "$1",
            link: "https://investor.vanguard.com/investment-products/etfs/profile/vti",
        },
        {
            name: "High-Yield Savings",
            symbol: "HYSA",
            avgReturn: "4.5%+",
            risk: "None",
            description: "FDIC insured savings account.",
            minInvestment: "$0",
            link: "https://www.nerdwallet.com/best/banking/high-yield-online-savings-accounts",
        },
        // ... other investments
    ]

    const getRiskColor = (risk: string) => {
        switch (risk) {
            case "None":
            case "Very Low":
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
            {/* ... (Disclaimer cards) ... */}
            <Card>
                <CardContent className="p-0">
                    <div className="divide-y divide-gray-100">
                        {safeInvestments.map((investment, index) => (
                            <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                                <div className="grid grid-cols-3 items-center gap-4">
                                    {/* Left side: Info */}
                                    <div className="col-span-2 flex items-center gap-4">
                                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                            <TrendingUp className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">{investment.name}</h3>
                                            <p className="text-sm text-gray-600">{investment.description}</p>
                                            <div className="flex items-center gap-3 mt-1">
                                                <Badge className={getRiskColor(investment.risk)} variant="secondary">
                                                    {investment.risk}
                                                </Badge>
                                                <span className="text-xs text-gray-500">Min: {investment.minInvestment}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right side: Price and Button */}
                                    <div className="text-right flex flex-col items-end gap-2">
                                        <div>
                                            <div className="text-lg font-bold text-green-600">{investment.avgReturn}</div>
                                            <div className="text-xs text-gray-500">avg return</div>
                                        </div>
                                        <a href={investment.link} target="_blank" rel="noopener noreferrer">
                                            <Button size="sm">
                                                Invest Now <ExternalLink className="h-4 w-4 ml-2"/>
                                            </Button>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}