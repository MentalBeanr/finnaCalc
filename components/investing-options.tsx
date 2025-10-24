"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ArrowLeft, TrendingUp, TrendingDown, Cpu, HeartPulse, Landmark, Fuel } from "lucide-react"

interface Mover {
    symbol: string;
    name: string;
    change: number;
    price: number;
    changesPercentage: number;
}

interface InvestingOptionsProps {
    onBack: () => void;
    onSelect: (option: 'stocks' | 'bonds' | 'safe-investments', symbol?: string) => void;
}

const industries = [
    {
        name: "Technology",
        icon: <Cpu className="h-5 w-5" />,
        stocks: [
            { symbol: "AAPL", name: "Apple Inc.", logo: "https://financialmodelingprep.com/image-stock/AAPL.png" },
            { symbol: "MSFT", name: "Microsoft Corp.", logo: "https://financialmodelingprep.com/image-stock/MSFT.png" },
            { symbol: "NVDA", name: "NVIDIA Corp.", logo: "https://financialmodelingprep.com/image-stock/NVDA.png" },
            { symbol: "AMD", name: "Advanced Micro Devices", logo: "https://financialmodelingprep.com/image-stock/AMD.png" },
        ]
    },
    {
        name: "Healthcare",
        icon: <HeartPulse className="h-5 w-5" />,
        stocks: [
            { symbol: "JNJ", name: "Johnson & Johnson", logo: "https://financialmodelingprep.com/image-stock/JNJ.png" },
            { symbol: "PFE", name: "Pfizer Inc.", logo: "https://financialmodelingprep.com/image-stock/PFE.png" },
            { symbol: "UNH", name: "UnitedHealth Group", logo: "https://financialmodelingprep.com/image-stock/UNH.png" },
            { symbol: "LLY", name: "Eli Lilly and Co", logo: "https://financialmodelingprep.com/image-stock/LLY.png" },
        ]
    },
    {
        name: "Financials",
        icon: <Landmark className="h-5 w-5" />,
        stocks: [
            { symbol: "JPM", name: "JPMorgan Chase & Co.", logo: "https://financialmodelingprep.com/image-stock/JPM.png" },
            { symbol: "BAC", name: "Bank of America Corp", logo: "https://financialmodelingprep.com/image-stock/BAC.png" },
            { symbol: "V", name: "Visa Inc.", logo: "https://financialmodelingprep.com/image-stock/V.png" },
            { symbol: "MA", name: "Mastercard Inc.", logo: "https://financialmodelingprep.com/image-stock/MA.png" },
        ]
    },
    {
        name: "Energy",
        icon: <Fuel className="h-5 w-5" />,
        stocks: [
            { symbol: "XOM", name: "Exxon Mobil Corp.", logo: "https://financialmodelingprep.com/image-stock/XOM.png" },
            { symbol: "CVX", name: "Chevron Corp.", logo: "https://financialmodelingprep.com/image-stock/CVX.png" },
            { symbol: "SHEL", name: "Shell plc", logo: "https://financialmodelingprep.com/image-stock/SHEL.png" },
            { symbol: "TTE", name: "TotalEnergies SE", logo: "https://financialmodelingprep.com/image-stock/TTE.png" },
        ]
    }
];

export default function InvestingOptions({ onBack, onSelect }: InvestingOptionsProps) {
    const [topMovers, setTopMovers] = useState<Mover[]>([]);
    const [topLosers, setTopLosers] = useState<Mover[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedIndustry, setSelectedIndustry] = useState(industries[0]);

    useEffect(() => {
        const fetchMovers = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const response = await fetch('/api/top-movers');
                if (!response.ok) {
                    throw new Error('Failed to fetch market data.');
                }
                const data = await response.json();
                setTopMovers(data.topGainers);
                setTopLosers(data.topLosers);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMovers();
    }, []);


    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" onClick={onBack}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Market Overview</h1>
                    <p className="text-gray-600 dark:text-gray-400">Discover today's trending stocks and market leaders.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Market Movers</CardTitle>
                    <CardDescription>Stocks with the biggest gains and losses today.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading && <p>Loading market data...</p>}
                    {error && <p className="text-red-500">{error}</p>}
                    {!isLoading && !error && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <h3 className="font-semibold flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-green-500" />
                                    Today's Top Movers
                                </h3>
                                {topMovers.map(stock => (
                                    <div key={stock.symbol} onClick={() => onSelect('stocks', stock.symbol)} className="p-2 rounded-md hover:bg-muted cursor-pointer flex justify-between items-center">
                                        <div>
                                            <p className="font-bold text-sm">{stock.symbol}</p>
                                            <p className="text-xs text-muted-foreground truncate">{stock.name}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-sm text-green-600">+${stock.change.toFixed(2)}</p>
                                            <span className="font-semibold text-xs text-green-600">({stock.changesPercentage.toFixed(2)}%)</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="space-y-3">
                                <h3 className="font-semibold flex items-center gap-2">
                                    <TrendingDown className="h-5 w-5 text-red-500" />
                                    Today's Top Losers
                                </h3>
                                {topLosers.map(stock => (
                                    <div key={stock.symbol} onClick={() => onSelect('stocks', stock.symbol)} className="p-2 rounded-md hover:bg-muted cursor-pointer flex justify-between items-center">
                                        <div>
                                            <p className="font-bold text-sm">{stock.symbol}</p>
                                            <p className="text-xs text-muted-foreground truncate">{stock.name}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-sm text-red-600">${stock.change.toFixed(2)}</p>
                                            <span className="font-semibold text-xs text-red-600">({stock.changesPercentage.toFixed(2)}%)</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Browse by Industry</CardTitle>
                    <CardDescription>Explore popular stocks from different market sectors.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-2 mb-4">
                        {industries.map(industry => (
                            <Button
                                key={industry.name}
                                variant={selectedIndustry.name === industry.name ? "default" : "outline"}
                                onClick={() => setSelectedIndustry(industry)}
                                className="flex items-center gap-2"
                            >
                                {industry.icon}
                                {industry.name}
                            </Button>
                        ))}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {selectedIndustry.stocks.map(stock => (
                            <div key={stock.symbol} onClick={() => onSelect('stocks', stock.symbol)} className="p-3 rounded-lg hover:bg-muted cursor-pointer text-center flex flex-col items-center gap-2">
                                <img src={stock.logo} alt={`${stock.name} logo`} className="h-10 w-10 rounded-full bg-white border" />
                                <div>
                                    <p className="font-bold">{stock.symbol}</p>
                                    <p className="text-xs text-muted-foreground">{stock.name}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

        </div>
    )
}