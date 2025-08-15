import { Calculator, Crown, Check, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import Link from "next/link"

export default function PremiumPage() {
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <Crown className="h-16 w-16 text-yellow-500 mx-auto mb-6" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">FinnaCalc Premium</h1>
          <p className="text-xl text-gray-600 mb-8">Coming Soon</p>

          <Card className="max-w-3xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                Premium Features
                <Star className="h-5 w-5 text-yellow-500" />
              </CardTitle>
              <CardDescription>Advanced tools and features for serious financial planning</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-gray-900">Advanced Calculators</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Advanced Investment Portfolio Analysis</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Multi-Scenario Financial Planning</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Business Valuation Calculator</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Advanced Tax Planning Tools</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-gray-900">Premium Features</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Save & Export Detailed PDF Reports</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Unlimited Calculation History</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Priority Email Support</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Ad-Free Experience</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-gray-900">Data & Analytics</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Financial Dashboard & Tracking</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Custom Financial Goals</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Automated Reminders & Alerts</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Data Export & Integration</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-gray-900">Expert Guidance</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-sm">AI-Powered Financial Insights</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Personalized Recommendations</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Monthly Financial Health Reports</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Access to Financial Webinars</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
                <h3 className="font-semibold text-lg text-gray-900 mb-2">Early Bird Pricing</h3>
                <p className="text-gray-700 mb-4">
                  Be among the first to access FinnaCalc Premium and lock in special launch pricing!
                </p>
                <div className="flex items-center justify-center gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Regular Price</p>
                    <p className="text-2xl font-bold text-gray-400 line-through">$49/month</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-green-600 font-medium">Early Bird Price</p>
                    <p className="text-3xl font-bold text-green-600">$19/month</p>
                  </div>
                </div>
                <p className="text-xs text-gray-600 text-center">
                  Lock in this price forever when you join our early access list
                </p>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600 mb-4 text-center">
                  Join our exclusive early access list and be the first to experience FinnaCalc Premium!
                </p>
                <div className="flex gap-2 max-w-md mx-auto">
                  <Input placeholder="Enter your email for early access" className="flex-1" />
                  <Button className="bg-blue-600 hover:bg-blue-700">Join Waitlist</Button>
                </div>
                <p className="text-xs text-gray-500 text-center mt-2">
                  No spam. Unsubscribe anytime. Early access members get 60% off forever.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="mt-8">
            <p className="text-gray-600 mb-4">Continue using our free calculators while you wait:</p>
            <Link href="/">
              <Button variant="outline" className="mr-4">
                Back to Calculators
              </Button>
            </Link>
            <Link href="/about">
              <Button className="bg-blue-600 hover:bg-blue-700">Learn More About FinnaCalc</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
