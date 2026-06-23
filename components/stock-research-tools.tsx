"use client"

import { useState, useEffect, useRef } from "react"
import { Container } from "@/components/ds/container"
import { Section } from "@/components/ds/section"
import { MaterialIcon } from "@/components/ds/material-icon"
import { Input } from "@/components/ui/input"

const TradingViewWidget = ({ symbol }: { symbol: string }) => {
    const container = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const script = document.createElement("script")
        script.src = "https://s3.tradingview.com/tv.js"
        script.type = "text/javascript"
        script.async = true
        script.onload = () => {
            if (window.TradingView && container.current) {
                new window.TradingView.widget({
                    autosize: true,
                    symbol,
                    interval: "D",
                    timezone: "Etc/UTC",
                    theme: "light",
                    style: "1",
                    locale: "en",
                    toolbar_bg: "#f1f3f6",
                    enable_publishing: false,
                    allow_symbol_change: true,
                    container_id: container.current.id,
                })
            }
        }
        container.current?.appendChild(script)
    }, [symbol])

    return (
        <div style={{ height: "400px", width: "100%" }}>
            <div id={`tradingview_${symbol}`} ref={container} style={{ height: "100%", width: "100%" }} />
        </div>
    )
}

interface StockResearchToolsProps {
    onBack: () => void
}

interface StockData {
    symbol: string
    name: string
    price: string
    change: string
    changePercent: string
    peRatio: string
    marketCap: string
    description: string
}

interface ChartDataPoint {
    date: string
    price: number
}

interface SearchResult {
    "1. symbol": string
    "2. name": string
    "4. region": string
}

const TABS = [
    { id: "screener", label: "Stock Screener" },
    { id: "analysis", label: "Company Analysis" },
    { id: "portfolio", label: "Portfolio Tracker" },
] as const

const METRICS = [
    {
        title: "P/E Ratio (Price-to-Earnings)",
        body: "How much you pay for each dollar of earnings. Lower is often better.",
    },
    {
        title: "Market Cap",
        body: "Total value of all company shares. Shows company size.",
    },
    {
        title: "Revenue Growth",
        body: "How fast the company is growing its sales year over year.",
    },
    {
        title: "Debt-to-Equity",
        body: "How much debt vs equity the company has. Lower is safer.",
    },
]

const CHECKLIST = [
    "Company has growing revenue",
    "P/E ratio is reasonable (under 30)",
    "Company has manageable debt",
    "Business model makes sense",
    "Strong competitive position",
    "Experienced management team",
]

export default function StockResearchTools({ onBack }: StockResearchToolsProps) {
    const [searchTerm, setSearchTerm] = useState("")
    const [activeTab, setActiveTab] = useState<"screener" | "analysis" | "portfolio">("screener")
    const [searchResults, setSearchResults] = useState<SearchResult[]>([])
    const [isSearching, setIsSearching] = useState(false)
    const [stockData, setStockData] = useState<StockData | null>(null)
    const [isLoadingDetails, setIsLoadingDetails] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const formatMarketCap = (marketCap: string) => {
        const num = parseInt(marketCap)
        if (isNaN(num) || num === 0) return "N/A"
        if (num >= 1_000_000_000_000) return `$${(num / 1_000_000_000_000).toFixed(2)}T`
        if (num >= 1_000_000_000) return `$${(num / 1_000_000_000).toFixed(2)}B`
        return `$${(num / 1_000_000).toFixed(2)}M`
    }

    const findSymbols = async () => {
        if (!searchTerm.trim()) return
        setIsSearching(true)
        setError(null)
        setStockData(null)
        setSearchResults([])
        try {
            const response = await fetch(`/api/stock-search?keywords=${searchTerm}`)
            const data = await response.json()
            if (!response.ok) throw new Error(data.error || "An error occurred during search.")
            setSearchResults(data)
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Search failed.")
        } finally {
            setIsSearching(false)
        }
    }

    const fetchStockDetails = async (symbol: string) => {
        setIsLoadingDetails(true)
        setError(null)
        setStockData(null)
        setSearchResults([])
        try {
            const response = await fetch(`/api/stock?symbol=${symbol}`)
            const data = await response.json()
            if (!response.ok) throw new Error(data.error || "An error occurred fetching stock data.")
            const { quote, overview, timeSeries } = data
            if (!quote || !overview || !overview.Name || !timeSeries)
                throw new Error(`Incomplete data found for symbol "${symbol}".`)
            setStockData({
                symbol: quote["01. symbol"],
                name: overview.Name,
                price: `$${parseFloat(quote["05. price"]).toFixed(2)}`,
                change: parseFloat(quote["09. change"]).toFixed(2),
                changePercent: parseFloat(quote["10. change percent"].replace("%", "")).toFixed(2),
                peRatio: overview.PERatio || "N/A",
                marketCap: formatMarketCap(overview.MarketCapitalization),
                description: overview.Description || "No description available.",
            })
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to load stock data.")
        } finally {
            setIsLoadingDetails(false)
        }
    }

    const isUp = stockData ? parseFloat(stockData.change) >= 0 : true

    return (
        <div className="flex flex-col">
            <Section spacing="default" className="pt-section-gap-sm pb-0">
                <Container className="flex flex-col gap-stack-lg">
                    <button
                        onClick={onBack}
                        className="inline-flex items-center gap-stack-sm self-start font-ui-button text-ui-button uppercase tracking-[0.05em] text-on-surface-variant hover:text-primary transition-colors"
                    >
                        <MaterialIcon name="arrow_back" size={16} />
                        Back
                    </button>
                    <h1 className="font-headline-display text-[56px] leading-[1.1] tracking-[-0.02em] text-primary">
                        Stock Research Tools
                    </h1>
                    <p className="font-body-lg text-body-lg text-on-surface-variant max-w-prose">
                        Simple tools to research and understand investments.
                    </p>
                </Container>
            </Section>

            <Section spacing="default">
                <Container className="flex flex-col gap-gutter">
                    {/* Tabs */}
                    <div className="flex gap-stack-sm border-b border-outline-variant/30">
                        {TABS.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-3 font-ui-button text-ui-button uppercase tracking-[0.05em] border-b-2 transition-colors ${
                                    activeTab === tab.id
                                        ? "border-primary text-primary"
                                        : "border-transparent text-on-surface-variant hover:text-primary"
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Stock Screener */}
                    {activeTab === "screener" && (
                        <div className="border border-outline-variant/30 rounded-lg bg-surface-container-lowest p-10 flex flex-col gap-stack-lg">
                            <div>
                                <h2 className="font-headline-md text-headline-md text-primary mb-stack-sm">
                                    Find Stocks
                                </h2>
                                <p className="font-body-md text-body-md text-on-surface-variant mb-stack-lg">
                                    Search for stocks by company name or ticker symbol.
                                </p>
                                <div className="flex gap-stack-md">
                                    <Input
                                        placeholder="Search by company name or symbol (e.g., Apple, MSFT)"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && findSymbols()}
                                        className="flex-1"
                                    />
                                    <button
                                        onClick={findSymbols}
                                        disabled={isSearching}
                                        className="inline-flex items-center gap-stack-sm px-6 py-2 rounded-lg border border-outline-variant/40 font-ui-button text-ui-button uppercase tracking-[0.05em] text-on-surface-variant hover:border-primary/40 hover:text-primary transition-colors disabled:opacity-50"
                                    >
                                        <MaterialIcon name="search" size={16} />
                                        {isSearching ? "Searching..." : "Search"}
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <p className="font-body-md text-body-md text-error">{error}</p>
                            )}

                            {searchResults.length > 0 && (
                                <div className="flex flex-col gap-stack-sm">
                                    <p className="font-ui-button text-ui-button uppercase tracking-[0.05em] text-on-surface-variant">
                                        Search Results
                                    </p>
                                    {searchResults.map((result) => (
                                        <button
                                            key={result["1. symbol"]}
                                            onClick={() => fetchStockDetails(result["1. symbol"])}
                                            className="flex items-center justify-between p-4 rounded-lg border border-outline-variant/30 hover:border-primary/40 transition-colors text-left"
                                        >
                                            <div>
                                                <p className="font-body-md text-body-md text-primary font-semibold">
                                                    {result["1. symbol"]}
                                                </p>
                                                <p className="font-body-md text-body-md text-on-surface-variant">
                                                    {result["2. name"]}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-stack-sm">
                                                <span className="font-label-caps text-label-caps uppercase tracking-[0.15em] text-on-surface-variant border border-outline-variant/40 rounded-full px-3 py-1">
                                                    {result["4. region"]}
                                                </span>
                                                <MaterialIcon name="chevron_right" size={16} className="text-on-surface-variant" />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {isLoadingDetails && (
                                <p className="font-body-md text-body-md text-on-surface-variant">
                                    Loading details...
                                </p>
                            )}

                            {stockData && (
                                <div className="flex flex-col gap-stack-lg">
                                    <div className="flex items-start justify-between p-6 rounded-lg border border-outline-variant/30">
                                        <div>
                                            <div className="flex items-center gap-stack-sm mb-stack-sm">
                                                <p className="font-headline-md text-headline-md text-primary">
                                                    {stockData.symbol}
                                                </p>
                                                <span
                                                    className={`inline-flex items-center gap-1 font-label-caps text-label-caps uppercase tracking-[0.15em] rounded-full px-3 py-1 ${
                                                        isUp
                                                            ? "bg-success/10 text-success"
                                                            : "bg-error/10 text-error"
                                                    }`}
                                                >
                                                    <MaterialIcon
                                                        name={isUp ? "trending_up" : "trending_down"}
                                                        size={12}
                                                    />
                                                    {stockData.changePercent}%
                                                </span>
                                            </div>
                                            <p className="font-body-md text-body-md text-on-surface-variant mb-stack-sm">
                                                {stockData.name}
                                            </p>
                                            <p className="font-body-md text-body-md text-on-surface-variant max-w-prose line-clamp-2">
                                                {stockData.description}
                                            </p>
                                        </div>
                                        <div className="text-right pl-stack-lg flex-shrink-0">
                                            <p className="font-headline-md text-headline-md text-primary">
                                                {stockData.price}
                                            </p>
                                            <p className="font-body-md text-body-md text-on-surface-variant">
                                                P/E: {stockData.peRatio} · Cap: {stockData.marketCap}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="border border-outline-variant/30 rounded-lg p-6">
                                        <p className="font-ui-button text-ui-button uppercase tracking-[0.05em] text-on-surface-variant mb-stack-md">
                                            TradingView Chart
                                        </p>
                                        <TradingViewWidget symbol={stockData.symbol} />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Company Analysis */}
                    {activeTab === "analysis" && (
                        <div className="grid grid-cols-2 gap-gutter">
                            <div className="border border-outline-variant/30 rounded-lg bg-surface-container-lowest p-10 flex flex-col gap-stack-lg">
                                <h2 className="font-headline-md text-headline-md text-primary">
                                    Key Metrics Explained
                                </h2>
                                <div className="flex flex-col gap-stack-md">
                                    {METRICS.map((metric) => (
                                        <div
                                            key={metric.title}
                                            className="p-4 border border-outline-variant/30 rounded-lg"
                                        >
                                            <p className="font-body-md text-body-md text-primary font-medium mb-1">
                                                {metric.title}
                                            </p>
                                            <p className="font-body-md text-body-md text-on-surface-variant">
                                                {metric.body}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="border border-outline-variant/30 rounded-lg bg-surface-container-lowest p-10 flex flex-col gap-stack-lg">
                                <h2 className="font-headline-md text-headline-md text-primary">
                                    Analysis Checklist
                                </h2>
                                <div className="flex flex-col gap-stack-md">
                                    {CHECKLIST.map((item) => (
                                        <label
                                            key={item}
                                            className="flex items-center gap-stack-md font-body-md text-body-md text-on-surface-variant cursor-pointer"
                                        >
                                            <input type="checkbox" className="rounded" />
                                            {item}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Portfolio Tracker */}
                    {activeTab === "portfolio" && (
                        <div className="border border-outline-variant/30 rounded-lg bg-surface-container-lowest p-10">
                            <div className="flex flex-col items-center text-center py-stack-xl gap-stack-lg">
                                <MaterialIcon name="account_balance_wallet" size={48} className="text-on-surface-variant" />
                                <div>
                                    <h2 className="font-headline-md text-headline-md text-primary mb-stack-sm">
                                        Start Tracking Your Portfolio
                                    </h2>
                                    <p className="font-body-md text-body-md text-on-surface-variant max-w-prose">
                                        Add your investments to see performance, allocation, and get personalized insights.
                                    </p>
                                </div>
                                <button className="inline-flex items-center gap-stack-sm px-6 py-3 rounded-lg border border-outline-variant/40 font-ui-button text-ui-button uppercase tracking-[0.05em] text-on-surface-variant hover:border-primary/40 hover:text-primary transition-colors">
                                    Add Your First Investment
                                </button>
                            </div>
                        </div>
                    )}
                </Container>
            </Section>
        </div>
    )
}
