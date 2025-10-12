"use client"

import Link from "next/link"
import Image from "next/image"
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { usePathname } from 'next/navigation'
import { ThemeToggle } from "@/components/theme-toggle"

export default function Header() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [mounted, setMounted] = useState(false)
    const pathname = usePathname()

    useEffect(() => {
        setMounted(true)
    }, [])

    const navLinks = [
        { href: "/", label: "Home" },
        { href: "/budgeting", label: "Budgeting" },
        { href: "/investing", label: "Investing" },
        { href: "/taxes", label: "Taxes" },
        { href: "/education", label: "Education" },
    ]

    return (
        <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center">
                        <Link href="/" className="flex items-center">
                            <Image
                                src="/fc new right white logo.png"
                                alt="FinnaCalc Logo"
                                width={32}
                                height={32}
                                className="flex-shrink-0"
                            />
                            <span className="ml-2 text-xl font-bold text-gray-900">
                                Finna<span className="text-blue-600">Calc</span>
                            </span>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex space-x-8">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`font-bold ${
                                    pathname === link.href
                                        ? 'text-blue-600'
                                        : 'text-gray-700 hover:text-blue-600'
                                }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>

                    {/* Auth and Mobile Menu Button */}
                    <div className="flex items-center gap-4">
                        {mounted ? <ThemeToggle /> : <div className="h-10 w-10" />}
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
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`block px-3 py-2 rounded-md font-bold ${
                                        pathname === link.href
                                            ? 'bg-blue-50 text-blue-600'
                                            : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                                    }`}
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    {link.label}
                                </Link>
                            ))}
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