"use client"

import { useState, useEffect } from "react"
import { Container } from "@/components/ds/container"
import { Section } from "@/components/ds/section"
import { MaterialIcon } from "@/components/ds/material-icon"

interface Mover {
    symbol: string
    name: string
    change: number
    price: number
    changesPercentage: number
}

interface InvestingOptionsProps {
    onBack: () => void
    onSelect: (option: "stocks" | "bonds" | "safe-investments", symbol?: string) => void
}

const INDUSTRIES = [
    {
        name: "Technology",
        icon: "computer" as const,
        stocks: [
            { symbol: "AAPL", name: "Apple Inc.", logo: "https://financialmodelingprep.com/image-stock/AAPL.png" },
            { symbol: "MSFT", name: "Microsoft Corp.", logo: "https://financialmodelingprep.com/image-stock/MSFT.png" },
            { symbol: "NVDA", name: "NVIDIA Corp.", logo: "https://financialmodelingprep.com/image-stock/NVDA.png" },
            { symbol: "AMD", name: "Advanced Micro Devices", logo: "https://financialmodelingprep.com/image-stock/AMD.png" },
        ],
    },
    {
        name: "Healthcare",
        icon: "local_hospital" as const,
        stocks: [
            { symbol: "JNJ", name: "Johnson & Johnson", logo: "https://financialmodelingprep.com/image-stock/JNJ.png" },
            { symbol: "PFE", name: "Pfizer Inc.", logo: "https://financialmodelingprep.com/image-stock/PFE.png" },
            { symbol: "UNH", name: "UnitedHealth Group", logo: "https://financialmodelingprep.com/image-stock/UNH.png" },
            { symbol: "LLY", name: "Eli Lilly and Co", logo: "https://financialmodelingprep.com/image-stock/LLY.png" },
        ],
    },
    {
        name: "Financials",
        icon: "account_balance" as const,
        stocks: [
            { symbol: "JPM", name: "JPMorgan Chase & Co.", logo: "https://financialmodelingprep.com/image-stock/JPM.png" },
            { symbol: "BAC", name: "Bank of America Corp", logo: "https://financialmodelingprep.com/image-stock/BAC.png" },
            { symbol: "V", name: "Visa Inc.", logo: "https://financialmodelingprep.com/image-stock/V.png" },
            { symbol: "MA", name: "Mastercard Inc.", logo: "https://financialmodelingprep.com/image-stock/MA.png" },
        ],
    },
    {
        name: "Energy",
        icon: "bolt" as const,
        stocks: [
            { symbol: "XOM", name: "Exxon Mobil Corp.", logo: "https://financialmodelingprep.com/image-stock/XOM.png" },
            { symbol: "CVX", name: "Chevron Corp.", logo: "https://financialmodelingprep.com/image-stock/CVX.png" },
            { symbol: "SHEL", name: "Shell plc", logo: "https://financialmodelingprep.com/image-stock/SHEL.png" },
            { symbol: "TTE", name: "TotalEnergies SE", logo: "https://financialmodelingprep.com/image-stock/TTE.png" },
        ],
    },
]

export default function InvestingOptions({ onBack, onSelect }: InvestingOptionsProps) {
    const [topMovers, setTopMovers] = useState<Mover[]>([])
    const [topLosers, setTopLosers] = useState<Mover[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedIndustry, setSelectedIndustry] = useState(INDUSTRIES[0])

    useEffect(() => {
        const fetchMovers = async () => {
            try {
                setIsLoading(true)
                setError(null)
                const response = await fetch("/api/top-movers")
                if (!response.ok) throw new Error("Failed to fetch market data.")
                const data = await response.json()
                setTopMovers(data.topGainers)
                setTopLosers(data.topLosers)
            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : "Failed to load market data.")
            } finally {
                setIsLoading(false)
            }
        }
        fetchMovers()
    }, [])

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
                        Market Overview
                    </h1>
                    <p className="font-body-lg text-body-lg text-on-surface-variant max-w-prose">
                        Discover today&apos;s trending stocks and market leaders.
                    </p>
                </Container>
            </Section>

            <Section spacing="default">
                <Container className="flex flex-col gap-gutter">
                    <div className="border border-outline-variant/30 rounded-lg bg-surface-container-lowest p-10">
                        <h2 className="font-headline-md text-headline-md text-primary mb-stack-md">
                            Market Movers
                        </h2>
                        <p className="font-body-md text-body-md text-on-surface-variant mb-stack-lg">
                            Stocks with the biggest gains and losses today.
                        </p>
                        {isLoading && (
                            <p className="font-body-md text-body-md text-on-surface-variant">
                                Loading market data...
                            </p>
                        )}
                        {error && (
                            <p className="font-body-md text-body-md text-error">{error}</p>
                        )}
                        {!isLoading && !error && (
                            <div className="grid grid-cols-2 gap-gutter">
                                <div className="flex flex-col gap-stack-sm">
                                    <p className="font-ui-button text-ui-button uppercase tracking-[0.05em] text-on-surface-variant flex items-center gap-stack-sm">
                                        <MaterialIcon name="trending_up" size={16} className="text-success" />
                                        Top Movers
                                    </p>
                                    {topMovers.map((stock) => (
                                        <button
                                            key={stock.symbol}
                                            onClick={() => onSelect("stocks", stock.symbol)}
                                            className="flex justify-between items-center p-3 rounded-lg hover:bg-surface-container transition-colors text-left"
                                        >
                                            <div>
                                                <p className="font-body-md text-body-md text-primary font-semibold">
                                                    {stock.symbol}
                                                </p>
                                                <p className="font-body-md text-body-md text-on-surface-variant truncate max-w-[160px]">
                                                    {stock.name}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-body-md text-body-md text-success font-semibold">
                                                    +${stock.change.toFixed(2)}
                                                </p>
                                                <p className="font-body-md text-body-md text-success">
                                                    ({stock.changesPercentage.toFixed(2)}%)
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                                <div className="flex flex-col gap-stack-sm">
                                    <p className="font-ui-button text-ui-button uppercase tracking-[0.05em] text-on-surface-variant flex items-center gap-stack-sm">
                                        <MaterialIcon name="trending_down" size={16} className="text-error" />
                                        Top Losers
                                    </p>
                                    {topLosers.map((stock) => (
                                        <button
                                            key={stock.symbol}
                                            onClick={() => onSelect("stocks", stock.symbol)}
                                            className="flex justify-between items-center p-3 rounded-lg hover:bg-surface-container transition-colors text-left"
                                        >
                                            <div>
                                                <p className="font-body-md text-body-md text-primary font-semibold">
                                                    {stock.symbol}
                                                </p>
                                                <p className="font-body-md text-body-md text-on-surface-variant truncate max-w-[160px]">
                                                    {stock.name}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-body-md text-body-md text-error font-semibold">
                                                    ${stock.change.toFixed(2)}
                                                </p>
                                                <p className="font-body-md text-body-md text-error">
                                                    ({stock.changesPercentage.toFixed(2)}%)
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="border border-outline-variant/30 rounded-lg bg-surface-container-lowest p-10">
                        <h2 className="font-headline-md text-headline-md text-primary mb-stack-md">
                            Browse by Industry
                        </h2>
                        <p className="font-body-md text-body-md text-on-surface-variant mb-stack-lg">
                            Explore popular stocks from different market sectors.
                        </p>
                        <div className="flex gap-stack-sm mb-stack-lg">
                            {INDUSTRIES.map((industry) => (
                                <button
                                    key={industry.name}
                                    onClick={() => setSelectedIndustry(industry)}
                                    className={`inline-flex items-center gap-stack-sm px-4 py-2 rounded-full border font-ui-button text-ui-button uppercase tracking-[0.05em] transition-colors ${
                                        selectedIndustry.name === industry.name
                                            ? "border-primary bg-primary text-on-primary"
                                            : "border-outline-variant/40 text-on-surface-variant hover:border-primary/40 hover:text-primary"
                                    }`}
                                >
                                    <MaterialIcon name={industry.icon} size={14} />
                                    {industry.name}
                                </button>
                            ))}
                        </div>
                        <div className="grid grid-cols-4 gap-gutter">
                            {selectedIndustry.stocks.map((stock) => (
                                <button
                                    key={stock.symbol}
                                    onClick={() => onSelect("stocks", stock.symbol)}
                                    className="flex flex-col items-center gap-stack-sm p-6 rounded-lg border border-outline-variant/30 hover:border-primary/40 transition-colors text-center"
                                >
                                    <img
                                        src={stock.logo}
                                        alt={`${stock.name} logo`}
                                        className="h-10 w-10 rounded-full bg-surface border border-outline-variant/20"
                                    />
                                    <p className="font-body-md text-body-md text-primary font-semibold">
                                        {stock.symbol}
                                    </p>
                                    <p className="font-body-md text-body-md text-on-surface-variant text-xs">
                                        {stock.name}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </div>
                </Container>
            </Section>
        </div>
    )
}
