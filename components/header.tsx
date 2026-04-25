"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/lib/auth"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function Header() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [mounted, setMounted] = useState(false)
    const pathname = usePathname()
    const router = useRouter()
    const { user, signOut } = useAuth()

    useEffect(() => { setMounted(true) }, [])

    const navLinks = [
        { href: "/", label: "Home" },
        { href: "/budgeting", label: "Budgeting" },
        { href: "/investing", label: "Investing" },
        { href: "/taxes", label: "Taxes" },
        { href: "/education", label: "Education" },
    ]

    const handleSignOut = () => {
        signOut()
        router.push("/")
    }

    return (
        <header className="border-b border-border bg-background sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <Link href="/" className="flex items-center">
                        <Image src="/fc new right white logo.png" alt="FinnaCalc Logo" width={32} height={32} className="flex-shrink-0" />
                        <span className="ml-2 text-xl font-bold text-foreground">Finna<span className="text-blue-600 dark:text-blue-400">Calc</span></span>
                    </Link>
                    <nav className="hidden md:flex space-x-8">
                        {navLinks.map((link) => (
                            <Link key={link.href} href={link.href}
                                className={`font-bold ${pathname === link.href ? 'text-blue-600 dark:text-blue-400' : 'text-foreground/80 hover:text-blue-600 dark:hover:text-blue-400'}`}>
                                {link.label}
                            </Link>
                        ))}
                    </nav>
                    <div className="flex items-center gap-3">
                        {mounted ? <ThemeToggle /> : <div className="h-10 w-10" />}
                        {mounted && (
                            user ? (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm" className="rounded-full font-semibold">
                                            {user.name || user.email}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56">
                                        <DropdownMenuLabel className="font-normal">
                                            <div className="flex flex-col">
                                                <span className="font-semibold">{user.name}</span>
                                                <span className="text-xs text-muted-foreground">{user.email}</span>
                                            </div>
                                        </DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={handleSignOut}>
                                            Sign out
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            ) : (
                                <div className="hidden sm:flex items-center gap-2">
                                    <Link href="/sign-in">
                                        <Button variant="ghost" size="sm" className="rounded-full font-semibold">
                                            Sign in
                                        </Button>
                                    </Link>
                                    <Link href="/sign-up">
                                        <Button size="sm" className="rounded-full font-semibold bg-foreground text-background hover:bg-foreground/90">
                                            Sign up
                                        </Button>
                                    </Link>
                                </div>
                            )
                        )}
                        <div className="md:hidden">
                            <Button variant="ghost" size="sm" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </Button>
                        </div>
                    </div>
                </div>
                {mobileMenuOpen && (
                    <div className="md:hidden border-t border-border bg-background">
                        <div className="px-2 pt-2 pb-3 space-y-1">
                            {navLinks.map((link) => (
                                <Link key={link.href} href={link.href}
                                    className={`block px-3 py-2 rounded-md font-bold ${pathname === link.href ? 'bg-accent text-blue-600 dark:text-blue-400' : 'text-foreground/80 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-accent'}`}
                                    onClick={() => setMobileMenuOpen(false)}>
                                    {link.label}
                                </Link>
                            ))}
                            {mounted && !user && (
                                <div className="border-t border-border mt-2 pt-2 space-y-1">
                                    <Link href="/sign-in" onClick={() => setMobileMenuOpen(false)}
                                        className="block px-3 py-2 rounded-md font-bold text-foreground/80 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-accent">
                                        Sign in
                                    </Link>
                                    <Link href="/sign-up" onClick={() => setMobileMenuOpen(false)}
                                        className="block px-3 py-2 rounded-md font-bold text-foreground/80 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-accent">
                                        Sign up
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </header>
    )
}
