"use client"

import { useState } from "react"
import { Calculator, Mail, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function AboutPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <Calculator className="h-8 w-8 text-blue-600" />
                <span className="ml-2 text-xl font-bold text-gray-900">FinnaCalc</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              <Link href="/" className="text-gray-700 hover:text-blue-600">
                Home
              </Link>
              <Link href="/budgeting" className="text-gray-700 hover:text-blue-600">
                Budgeting
              </Link>
              <Link href="/investing" className="text-gray-700 hover:text-blue-600">
                Investing
              </Link>
              <Link href="/advising" className="text-gray-700 hover:text-blue-600">
                Advising
              </Link>
              <Link href="/about" className="text-blue-600 font-medium">
                About
              </Link>
            </nav>

            {/* Desktop Premium Button */}
            <div className="hidden md:block">
              <Link href="/premium">
                <Button className="bg-blue-600 hover:bg-blue-700">Get Premium</Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <Button variant="ghost" size="sm" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </Button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 bg-white">
              <div className="px-2 pt-2 pb-3 space-y-1">
                <Link
                  href="/"
                  className="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Home
                </Link>
                <Link
                  href="/budgeting"
                  className="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Budgeting
                </Link>
                <Link
                  href="/investing"
                  className="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Investing
                </Link>
                <Link
                  href="/advising"
                  className="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Advising
                </Link>
                <Link
                  href="/about"
                  className="block px-3 py-2 text-blue-600 font-medium hover:bg-gray-50 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  About
                </Link>
                <div className="px-3 py-2">
                  <Link href="/premium" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full bg-blue-600 hover:bg-blue-700">Get Premium</Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Hero Section */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="flex justify-center mb-6">
            <Calculator className="h-12 w-12 sm:h-16 sm:w-16 text-blue-600" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">About FinnaCalc</h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            Professional financial calculators and planning tools designed to empower individuals, small business
            owners, and entrepreneurs with the tools they need to make informed financial decisions.
          </p>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Our Mission</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p className="text-gray-700 leading-relaxed">
                At FinnaCalc, we believe that everyone deserves access to professional-grade financial tools without the
                complexity or cost of expensive software. Our mission is to democratize financial planning by providing
                accurate, easy-to-use calculators and planning tools that help individuals and entrepreneurs make
                smarter financial decisions.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Whether you're calculating loan payments, planning your emergency fund, projecting cash flow, or
                determining the right pricing for your services, our tools are designed to give you the insights you
                need to achieve your financial goals with confidence.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Our Vision & Future Goals</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed mb-4">
                We're just getting started. Our vision extends far beyond calculators to become your comprehensive
                financial partner:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">Comprehensive Budgeting Platform</h3>
                  <p className="text-sm text-blue-700">
                    Advanced budgeting tools that integrate with your business operations, providing real-time insights
                    and automated expense tracking.
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">Investment Advisory Services</h3>
                  <p className="text-sm text-green-700">
                    Personalized investment recommendations and portfolio management tools tailored for individuals and
                    small business owners.
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-purple-800 mb-2">AI-Powered Financial Planning</h3>
                  <p className="text-sm text-purple-700">
                    Intelligent financial planning that adapts to your business cycles and provides predictive insights
                    for better decision-making.
                  </p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-orange-800 mb-2">Business Growth Advisory</h3>
                  <p className="text-sm text-orange-700">
                    Strategic financial guidance to help you scale your business, optimize cash flow, and maximize
                    profitability.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Why Choose FinnaCalc?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Calculator className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Professional Accuracy</h3>
                  <p className="text-sm text-gray-600">
                    Our calculators use industry-standard formulas and are regularly updated to ensure accuracy you can
                    trust.
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-green-600 font-bold">$0</span>
                  </div>
                  <h3 className="font-semibold mb-2">Always Free</h3>
                  <p className="text-sm text-gray-600">
                    Core financial calculators are completely free to use, with premium features available for advanced
                    needs.
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-purple-600 text-xl">⚡</span>
                  </div>
                  <h3 className="font-semibold mb-2">Instant Results</h3>
                  <p className="text-sm text-gray-600">
                    Get immediate calculations and insights without waiting for complex software to load or process.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Get in Touch
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">
                Have questions, suggestions, or need help with our calculators? We'd love to hear from you!
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="h-4 w-4 text-gray-600" />
                  <span className="font-medium">Email:</span>
                </div>
                <a href="mailto:finnacalc@gmail.com" className="text-blue-600 hover:text-blue-800 font-medium">
                  finnacalc@gmail.com
                </a>
              </div>
              <p className="text-sm text-gray-600 mt-4">We typically respond within 24 hours during business days.</p>
            </CardContent>
          </Card>

          {/* Founder Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Our Founder
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
                <p className="text-gray-700 mb-4">
                  FinnaCalc was founded with the vision of making professional financial tools accessible to every
                  business owner, regardless of their size or budget.
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">IM</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Founded by Ivan Mariscal</p>
                    <p className="text-sm text-gray-600">Entrepreneur & Financial Technology Advocate</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-8 sm:mt-12 p-6 sm:p-8 bg-blue-600 rounded-lg text-white">
          <h2 className="text-xl sm:text-2xl font-bold mb-4">Ready to Take Control of Your Finances?</h2>
          <p className="mb-6">
            Join thousands of individuals and entrepreneurs who trust FinnaCalc for their financial planning needs.
          </p>
          <Link href="/">
            <Button className="bg-white text-blue-600 hover:bg-gray-100 px-6 sm:px-8 py-3">
              Start Using Our Calculators
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
