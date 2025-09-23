"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ArrowLeft, TrendingUp, Landmark, Shield } from "lucide-react"

interface InvestingOptionsProps {
    onBack: () => void;
    onSelect: (option: 'stocks' | 'bonds' | 'safe-investments') => void;
}

export default function InvestingOptions({ onBack, onSelect }: InvestingOptionsProps) {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" onClick={onBack}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Investing</h1>
                    <p className="text-gray-600 dark:text-gray-400">Choose an option to learn more and get started.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onSelect('stocks')}>
                    <CardHeader className="flex flex-row items-center gap-4">
                        <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                            <TrendingUp className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <CardTitle>Stocks</CardTitle>
                            <CardDescription>Invest in companies and watch your wealth grow.</CardDescription>
                        </div>
                    </CardHeader>
                </Card>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onSelect('bonds')}>
                    <CardHeader className="flex flex-row items-center gap-4">
                        <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                            <Landmark className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <CardTitle>Bonds</CardTitle>
                            <CardDescription>Lower-risk investments with steady returns.</CardDescription>
                        </div>
                    </CardHeader>
                </Card>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onSelect('safe-investments')}>
                    <CardHeader className="flex flex-row items-center gap-4">
                        <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                            <Shield className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <CardTitle>Safe Investments</CardTitle>
                            <CardDescription>CDs, high-yield savings, and other secure options.</CardDescription>
                        </div>
                    </CardHeader>
                </Card>
            </div>
        </div>
    )
}