"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth"
import { Container } from "@/components/ds/container"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const NAV_LINKS = [
    { href: "/", label: "Calculators" },
    { href: "/budgeting", label: "Budgeting" },
    { href: "/investing", label: "Investing" },
    { href: "/taxes", label: "Taxes" },
    { href: "/education", label: "Learn" },
] as const

export function SiteHeader() {
    const [mounted, setMounted] = React.useState(false)
    const pathname = usePathname()
    const router = useRouter()
    const { user, signOut } = useAuth()

    React.useEffect(() => {
        setMounted(true)
    }, [])

    const handleSignOut = () => {
        signOut()
        router.push("/")
    }

    return (
        <header className="sticky top-0 z-50 w-full bg-surface/95 backdrop-blur-sm border-b border-outline-variant/20">
            <Container className="flex items-center justify-between h-20">
                <Link
                    href="/"
                    className="font-headline-md text-[28px] leading-none tracking-tight text-primary"
                >
                    FinnaCalc
                </Link>

                <nav className="flex items-center gap-stack-lg">
                    {NAV_LINKS.map((link) => {
                        const isActive =
                            link.href === "/"
                                ? pathname === "/"
                                : pathname?.startsWith(link.href)
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={cn(
                                    "font-ui-button text-ui-button uppercase tracking-[0.05em] transition-colors duration-200",
                                    isActive
                                        ? "text-primary"
                                        : "text-on-surface-variant hover:text-primary",
                                )}
                            >
                                {link.label}
                            </Link>
                        )
                    })}
                </nav>

                <div className="flex items-center gap-stack-md">
                    {mounted && user ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                    {user.name || user.email}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col">
                                        <span className="font-ui-button text-ui-button text-primary normal-case tracking-normal">
                                            {user.name}
                                        </span>
                                        <span className="font-body-md text-xs text-on-surface-variant">
                                            {user.email}
                                        </span>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link href="/account">Account</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleSignOut}>
                                    Sign out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <>
                            <Button asChild variant="outline" size="sm">
                                <Link href="/sign-in">Sign In</Link>
                            </Button>
                            <Button asChild size="sm">
                                <Link href="/sign-up">Get Started</Link>
                            </Button>
                        </>
                    )}
                </div>
            </Container>
        </header>
    )
}
