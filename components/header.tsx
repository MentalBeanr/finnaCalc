"use client"

import Link from "next/link"
import { Calculator, TrendingUp, FileText, GraduationCap } from "lucide-react"
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { useState } from "react" // Make sure to import useState

export default function Header() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false) // Add state for mobile menu

    return (
        <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
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
                        <Link href="/" className="text-gray-700 hover:text-blue-600 font-bold">
                            Home
                        </Link>
                        <Link href="/budgeting" className="text-gray-700 hover:text-blue-600 font-bold">
                            Budgeting
                        </Link>
                        <Link href="/investing" className="text-gray-700 hover:text-blue-600 font-bold">
                            Investing
                        </Link>
                        <Link href="/taxes" className="text-gray-700 hover:text-blue-600 font-bold">
                            Taxes
                        </Link>
                        <Link href="/education" className="text-gray-700 hover:text-blue-600 font-bold">
                            Education
                        </Link>
                    </nav>

                    {/* Auth and Mobile Menu Button */}
                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex">
                            <SignedOut>
                                <Link href="/sign-in">
                                    <Button className="bg-blue-600 hover:bg-blue-700">Sign In</Button>
                                </Link>
                            </SignedOut>
                            <SignedIn>
                                <UserButton afterSignOutUrl="/"/>
                            </SignedIn>
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
                </div>

                {/* Mobile Navigation Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden border-t border-gray-200 bg-white">
                        <div className="px-2 pt-2 pb-3 space-y-1">
                            <Link href="/" className="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md font-bold" onClick={() => setMobileMenuOpen(false)}>Home</Link>
                            <Link href="/budgeting" className="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md font-bold" onClick={() => setMobileMenuOpen(false)}>Budgeting</Link>
                            <Link href="/investing" className="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md font-bold" onClick={() => setMobileMenuOpen(false)}>Investing</Link>
                            <Link href="/taxes" className="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md font-bold" onClick={() => setMobileMenuOpen(false)}>Taxes</Link>
                            <Link href="/education" className="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md font-bold" onClick={() => setMobileMenuOpen(false)}>Education</Link>
                            <div className="px-3 py-2">
                                <SignedOut>
                                    <Link href="/sign-in" onClick={() => setMobileMenuOpen(false)}>
                                        <Button className="w-full bg-blue-600 hover:bg-blue-700">Sign In</Button>
                                    </Link>
                                </SignedOut>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </header>
    )
}