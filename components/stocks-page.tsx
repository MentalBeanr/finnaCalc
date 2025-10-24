"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { ArrowLeft, Search, TrendingUp, TrendingDown, Wallet, LineChart as LineChartIcon, Plus, Minus } from "lucide-react"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface StocksPageProps {
    onBack: () => void;
}

interface StockData {
    symbol: string
    name: string
    price: number
    change: number
    changePercent: number
    marketCap: string
    description: string
}

interface PortfolioItem {
    symbol: string
    name: string
    quantity: number
    purchasePrice: number
}

interface SearchResult {
    "1. symbol": string
    "2. name": string
}

interface ChartDataPoint {
    date: string
    price: number
}

export default function StocksPage({ onBack }: StocksPageProps) {
    const [portfolio, setPortfolio] = useLocalStorage<PortfolioItem[]>("stock_portfolio", []);
    const [cashBalance, setCashBalance] = useLocalStorage<number>("cash_balance", 10000);

    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [selectedStock, setSelectedStock] = useState<StockData | null>(null);
    const [chartData, setChartData] = useState<ChartDataPoint[]>([]);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
    const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
    const [tradeQuantity, setTradeQuantity] = useState(1);

    const handleSearch = async () => {
        if (!searchTerm.trim()) return;
        setIsLoading(true);
        setError(null);
        setSelectedStock(null);
        setSearchResults([]);

        try {
            const response = await fetch(`/api/stock-search?keywords=${searchTerm}`);
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Search failed.");
            setSearchResults(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchStockDetails = async (symbol: string) => {
        setIsLoading(true);
        setError(null);
        setSelectedStock(null);
        setSearchResults([]);

        try {
            const response = await fetch(`/api/stock?symbol=${symbol}`);
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Failed to fetch stock data.");

            const { quote, overview, timeSeries } = data;
            setSelectedStock({
                symbol: quote["01. symbol"],
                name: overview.Name,
                price: parseFloat(quote["05. price"]),
                change: parseFloat(quote["09. change"]),
                changePercent: parseFloat(quote["10. change percent"].replace("%", "")),
                marketCap: overview.MarketCapitalization,
                description: overview.Description,
            });

            const formattedChartData = Object.entries(timeSeries)
                .map(([date, values]: [string, any]) => ({
                    date: new Date(date).toLocaleDateString("en-US", { month: 'short', day: 'numeric' }),
                    price: parseFloat(values["4. close"]),
                }))
                .slice(-30);
            setChartData(formattedChartData);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const openTradeModal = (type: 'buy' | 'sell') => {
        setTradeType(type);
        setTradeQuantity(1);
        setIsTradeModalOpen(true);
    };

    const handleTrade = () => {
        if (!selectedStock || tradeQuantity <= 0) return;

        const tradeValue = selectedStock.price * tradeQuantity;
        const existingHolding = portfolio.find(item => item.symbol === selectedStock.symbol);

        if (tradeType === 'buy') {
            if (cashBalance < tradeValue) {
                alert("Not enough cash to complete this purchase.");
                return;
            }
            setCashBalance(cashBalance - tradeValue);
            if (existingHolding) {
                const updatedPortfolio = portfolio.map(item =>
                    item.symbol === selectedStock.symbol
                        ? { ...item, quantity: item.quantity + tradeQuantity }
                        : item
                );
                setPortfolio(updatedPortfolio);
            } else {
                setPortfolio([...portfolio, {
                    symbol: selectedStock.symbol,
                    name: selectedStock.name,
                    quantity: tradeQuantity,
                    purchasePrice: selectedStock.price
                }]);
            }
        } else { // Sell
            if (!existingHolding || existingHolding.quantity < tradeQuantity) {
                alert("You don't own enough shares to sell.");
                return;
            }
            setCashBalance(cashBalance + tradeValue);
            const updatedPortfolio = portfolio.map(item =>
                item.symbol === selectedStock.symbol
                    ? { ...item, quantity: item.quantity - tradeQuantity }
                    : item
            ).filter(item => item.quantity > 0);
            setPortfolio(updatedPortfolio);
        }
        setIsTradeModalOpen(false);
    };

    const portfolioValue = portfolio.reduce((total, item) => total + (item.quantity * (selectedStock?.symbol === item.symbol ? selectedStock.price : item.purchasePrice)), 0);
    const totalValue = portfolioValue + cashBalance;

    return (
        <div className="space-y-6">
            <Button variant="outline" size="sm" onClick={onBack} className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Investing
            </Button>

            <Card>
                <CardHeader>
                    <CardTitle>Search Stocks</CardTitle>
                    <div className="flex gap-2 mt-4">
                        <Input
                            placeholder="e.g., AAPL, Microsoft"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <Button onClick={handleSearch} disabled={isLoading}>
                            <Search className="h-4 w-4 mr-2" />
                            {isLoading ? 'Searching...' : 'Search'}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    {searchResults.length > 0 && (
                        <div className="space-y-2">
                            {searchResults.map((result) => (
                                <div key={result["1. symbol"]} onClick={() => fetchStockDetails(result["1. symbol"])} className="p-2 rounded-md hover:bg-muted cursor-pointer">
                                    <p className="font-bold">{result["1. symbol"]}</p>
                                    <p className="text-sm text-muted-foreground">{result["2. name"]}</p>
                                </div>
                            ))}
                        </div>
                    )}
                    {selectedStock && (
                        <div className="space-y-4 mt-4">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-xl font-bold">{selectedStock.name} ({selectedStock.symbol})</h3>
                                    <p className="text-2xl font-bold">${selectedStock.price.toFixed(2)}</p>
                                    <p className={`text-sm font-medium ${selectedStock.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {selectedStock.change.toFixed(2)} ({selectedStock.changePercent.toFixed(2)}%)
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <Button onClick={() => openTradeModal('buy')} className="bg-green-600 hover:bg-green-700">Buy</Button>
                                    <Button onClick={() => openTradeModal('sell')} variant="outline">Sell</Button>
                                </div>
                            </div>

                            {chartData.length > 0 && (
                                <div className="h-64 w-full">
                                    <ResponsiveContainer>
                                        <LineChart data={chartData}>
                                            <XAxis dataKey="date" interval="preserveStartEnd" />
                                            <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
                                            <Line type="monotone" dataKey="price" stroke="#3b82f6" strokeWidth={3} dot={false} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isTradeModalOpen} onOpenChange={setIsTradeModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {tradeType === 'buy' ? 'Buy' : 'Sell'} {selectedStock?.symbol}
                        </DialogTitle>
                        <DialogDescription>
                            Current Price: ${selectedStock?.price.toFixed(2)}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <label htmlFor="quantity">Quantity</label>
                        <Input
                            id="quantity"
                            type="number"
                            min="1"
                            value={tradeQuantity}
                            onChange={(e) => setTradeQuantity(parseInt(e.target.value) || 1)}
                        />
                        <p className="font-bold">
                            Total: ${(selectedStock ? selectedStock.price * tradeQuantity : 0).toFixed(2)}
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsTradeModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleTrade} className={tradeType === 'buy' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}>
                            Confirm {tradeType === 'buy' ? 'Buy' : 'Sell'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}