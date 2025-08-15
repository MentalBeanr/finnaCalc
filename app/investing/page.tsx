import { Calculator, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import Link from "next/link"

export default function InvestingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <Calculator className="h-8 w-8 text-blue-600" />
                <span className="ml-2 text-xl font-bold text-gray-900">FinnaCalc</span>
              </Link>
            </div>
            <Link href="/">
              <Button variant="outline">Back to Home</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="text-center">
          <TrendingUp className="h-12 w-12 sm:h-16 sm:w-16 text-blue-600 mx-auto mb-6" />
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Advanced Investing Tools</h1>
          <p className="text-lg sm:text-xl text-gray-600 mb-8">Coming Soon to Premium Version</p>

          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>What's Coming to Premium</CardTitle>
              <CardDescription>Revolutionary investing tools and portfolio management features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-left space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span>Portfolio Analysis & Optimization</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span>Investment Risk Assessment Tools</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span>Retirement Planning Calculators</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span>Compound Interest Projections</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span>Asset Allocation Recommendations</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span>Tax-Efficient Investment Strategies</span>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600 mb-4">
                  Be the first to know when our premium investing tools launch!
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input placeholder="Enter your email" className="flex-1" />
                  <Button className="bg-blue-600 hover:bg-blue-700">Notify Me</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mt-8">
            <p className="text-gray-600 mb-4">In the meantime, check out our current financial calculators:</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/">
                <Button variant="outline">View All Calculators</Button>
              </Link>
              <Link href="/roi-calculator">
                <Button className="bg-blue-600 hover:bg-blue-700">Try ROI Calculator</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
