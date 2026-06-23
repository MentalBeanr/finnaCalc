"use client"

import { useState, useEffect, useRef } from "react"
import { Container } from "@/components/ds/container"
import { Section } from "@/components/ds/section"
import { MaterialIcon } from "@/components/ds/material-icon"
import { Input } from "@/components/ui/input"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from "recharts"

interface StocksPageProps {
    onBack: () => void
    initialSymbol?: string
}

interface StockData {
    symbol: string
    name: string
    price: number
    change: number
    changePercent: number
    marketCap: string
    description: string
    logo: string
}

interface SearchResult {
    "1. symbol": string
    "2. name": string
}

interface ChartDataPoint {
    date: string
    price: number
}

export default function StocksPage({ onBack, initialSymbol }: StocksPageProps) {
    const [searchTerm, setSearchTerm] = useState("")
    const [searchResults, setSearchResults] = useState<SearchResult[]>([])
    const [selectedStock, setSelectedStock] = useState<StockData | null>(null)
    const [chartData, setChartData] = useState<ChartDataPoint[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isTradeModalOpen, setIsTradeModalOpen] = useState(false)
    const [tradeType, setTradeType] = useState<"buy" | "sell">("buy")
    const [tradeQuantity, setTradeQuantity] = useState(1)

    useEffect(() => {
        if (initialSymbol) {
            fetchStockDetails(initialSymbol)
        }
    }, [initialSymbol])

    const handleSearch = async () => {
        if (!searchTerm.trim()) return
        setIsLoading(true)
        setError(null)
        setSelectedStock(null)
        setSearchResults([])
        try {
            const response = await fetch(`/api/stock-search?keywords=${searchTerm}`)
            const data = await response.json()
            if (!response.ok) throw new Error(data.error || "Search failed.")
            setSearchResults(data)
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Search failed.")
        } finally {
            setIsLoading(false)
        }
    }

    const fetchStockDetails = async (symbol: string) => {
        setIsLoading(true)
        setError(null)
        setSelectedStock(null)
        setSearchResults([])
        try {
            const response = await fetch(`/api/stock?symbol=${symbol}`)
            const data = await response.json()
            if (!response.ok) throw new Error(data.error || "Failed to fetch stock data.")
            const { quote, overview, timeSeries } = data
            setSelectedStock({
                symbol: quote["01. symbol"],
                name: overview.Name,
                price: parseFloat(quote["05. price"]),
                change: parseFloat(quote["09. change"]),
                changePercent: parseFloat(quote["10. change percent"].replace("%", "")),
                marketCap: overview.MarketCapitalization,
                description: overview.Description,
                logo: overview.Logo,
            })
            const formattedChartData = Object.entries(timeSeries)
                .map(([date, values]: [string, unknown]) => ({
                    date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
                    price: parseFloat((values as Record<string, string>)["4. close"]),
                }))
                .slice(-30)
            setChartData(formattedChartData)
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to load stock data.")
        } finally {
            setIsLoading(false)
        }
    }

    const openTradeModal = (type: "buy" | "sell") => {
        setTradeType(type)
        setTradeQuantity(1)
        setIsTradeModalOpen(true)
    }

    const handleTrade = () => {
        alert(
            `${tradeType === "buy" ? "Buying" : "Selling"} ${tradeQuantity} share(s) of ${selectedStock?.symbol}. (This is a demo action)`,
        )
        setIsTradeModalOpen(false)
    }

    const isUp = selectedStock ? selectedStock.change >= 0 : true

    return (
        <div className="flex flex-col">
            <Section spacing="default" className="pt-section-gap-sm pb-0">
                <Container className="flex flex-col gap-stack-lg">
                    <button
                        onClick={onBack}
                        className="inline-flex items-center gap-stack-sm self-start font-ui-button text-ui-button uppercase tracking-[0.05em] text-on-surface-variant hover:text-primary transition-colors"
                    >
                        <MaterialIcon name="arrow_back" size={16} />
                        Back to Investing
                    </button>
                    <h1 className="font-headline-display text-[56px] leading-[1.1] tracking-[-0.02em] text-primary">
                        Stocks
                    </h1>
                    <p className="font-body-lg text-body-lg text-on-surface-variant max-w-prose">
                        Search stocks, view price history, and simulate trades.
                    </p>
                </Container>
            </Section>

            <Section spacing="default">
                <Container className="flex flex-col gap-gutter">
                    <div className="border border-outline-variant/30 rounded-lg bg-surface-container-lowest p-10">
                        <h2 className="font-headline-md text-headline-md text-primary mb-stack-lg">
                            Search Stocks
                        </h2>
                        <div className="flex gap-stack-md mb-stack-lg">
                            <Input
                                placeholder="e.g., AAPL, Microsoft"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                className="flex-1"
                            />
                            <button
                                onClick={handleSearch}
                                disabled={isLoading}
                                className="inline-flex items-center gap-stack-sm px-6 py-2 rounded-lg border border-outline-variant/40 font-ui-button text-ui-button uppercase tracking-[0.05em] text-on-surface-variant hover:border-primary/40 hover:text-primary transition-colors disabled:opacity-50"
                            >
                                <MaterialIcon name="search" size={16} />
                                {isLoading ? "Searching..." : "Search"}
                            </button>
                        </div>

                        {error && (
                            <p className="font-body-md text-body-md text-error mb-stack-md">{error}</p>
                        )}

                        {searchResults.length > 0 && (
                            <div className="flex flex-col gap-stack-sm">
                                {searchResults.map((result) => (
                                    <button
                                        key={result["1. symbol"]}
                                        onClick={() => fetchStockDetails(result["1. symbol"])}
                                        className="flex items-center gap-stack-md p-4 rounded-lg border border-outline-variant/30 hover:border-primary/40 transition-colors text-left"
                                    >
                                        <p className="font-body-md text-body-md text-primary font-semibold min-w-[60px]">
                                            {result["1. symbol"]}
                                        </p>
                                        <p className="font-body-md text-body-md text-on-surface-variant">
                                            {result["2. name"]}
                                        </p>
                                        <MaterialIcon name="chevron_right" size={16} className="text-on-surface-variant ml-auto" />
                                    </button>
                                ))}
                            </div>
                        )}

                        {isLoading && !searchResults.length && (
                            <p className="font-body-md text-body-md text-on-surface-variant">
                                Loading...
                            </p>
                        )}

                        {selectedStock && (
                            <div className="flex flex-col gap-stack-lg mt-stack-lg">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-stack-lg">
                                        <img
                                            src={selectedStock.logo}
                                            alt={`${selectedStock.name} logo`}
                                            className="h-12 w-12 rounded-full bg-surface border border-outline-variant/20"
                                        />
                                        <div>
                                            <p className="font-headline-md text-headline-md text-primary">
                                                {selectedStock.name}{" "}
                                                <span className="font-body-lg text-body-lg text-on-surface-variant">
                                                    ({selectedStock.symbol})
                                                </span>
                                            </p>
                                            <p className="font-headline-md text-headline-md text-primary">
                                                ${selectedStock.price.toFixed(2)}
                                            </p>
                                            <p className={`font-body-md text-body-md ${isUp ? "text-success" : "text-error"}`}>
                                                {selectedStock.change.toFixed(2)} ({selectedStock.changePercent.toFixed(2)}%)
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-stack-sm">
                                        <button
                                            onClick={() => openTradeModal("buy")}
                                            className="px-6 py-2 rounded-lg bg-success text-on-success font-ui-button text-ui-button uppercase tracking-[0.05em] hover:opacity-90 transition-opacity"
                                        >
                                            Buy
                                        </button>
                                        <button
                                            onClick={() => openTradeModal("sell")}
                                            className="px-6 py-2 rounded-lg border border-outline-variant/40 font-ui-button text-ui-button uppercase tracking-[0.05em] text-on-surface-variant hover:border-primary/40 hover:text-primary transition-colors"
                                        >
                                            Sell
                                        </button>
                                    </div>
                                </div>

                                {chartData.length > 0 && (
                                    <div className="h-64 w-full">
                                        <ResponsiveContainer>
                                            <LineChart data={chartData}>
                                                <XAxis dataKey="date" interval="preserveStartEnd" tick={{ fontSize: 12, fill: "#45464e" }} />
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: "#ffffff",
                                                        border: "1px solid #c5c6cf",
                                                        borderRadius: "8px",
                                                        fontSize: "14px",
                                                    }}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="price"
                                                    stroke="#00061a"
                                                    strokeWidth={2}
                                                    dot={false}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </Container>
            </Section>

            <Dialog open={isTradeModalOpen} onOpenChange={setIsTradeModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {tradeType === "buy" ? "Buy" : "Sell"} {selectedStock?.symbol}
                        </DialogTitle>
                        <DialogDescription>
                            Current price: ${selectedStock?.price.toFixed(2)}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-stack-md py-stack-md">
                        <label
                            htmlFor="trade-quantity"
                            className="font-ui-button text-ui-button uppercase tracking-[0.05em] text-on-surface-variant"
                        >
                            Quantity
                        </label>
                        <Input
                            id="trade-quantity"
                            type="number"
                            min="1"
                            value={tradeQuantity}
                            onChange={(e) => setTradeQuantity(parseInt(e.target.value) || 1)}
                        />
                        <p className="font-headline-md text-headline-md text-primary">
                            Total: ${(selectedStock ? selectedStock.price * tradeQuantity : 0).toFixed(2)}
                        </p>
                    </div>
                    <DialogFooter>
                        <button
                            onClick={() => setIsTradeModalOpen(false)}
                            className="px-6 py-2 rounded-lg border border-outline-variant/40 font-ui-button text-ui-button uppercase tracking-[0.05em] text-on-surface-variant hover:border-primary/40 hover:text-primary transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleTrade}
                            className={`px-6 py-2 rounded-lg font-ui-button text-ui-button uppercase tracking-[0.05em] text-on-primary transition-opacity hover:opacity-90 ${
                                tradeType === "buy" ? "bg-success" : "bg-error"
                            }`}
                        >
                            Confirm {tradeType === "buy" ? "Buy" : "Sell"}
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
