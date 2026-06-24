import type { Metadata } from "next"
import { Libre_Caslon_Text, Hanken_Grotesk } from "next/font/google"
import Script from "next/script"
import "./globals.css"
import { AuthProvider } from "@/lib/auth"
import { Toaster } from "@/components/ui/sonner"
import { SiteHeader } from "@/components/ds/site-header"
import { SiteFooter } from "@/components/ds/site-footer"
import ChatBot from "@/components/Chatbot"

const libreCaslon = Libre_Caslon_Text({
    variable: "--font-libre-caslon",
    subsets: ["latin"],
    weight: ["400", "700"],
    style: ["normal", "italic"],
    display: "swap",
})

const hanken = Hanken_Grotesk({
    variable: "--font-hanken",
    subsets: ["latin"],
    display: "swap",
})

export const metadata: Metadata = {
    title: "FinnaCalc — Financial Clarity, Without Complexity",
    description:
        "Editorial-grade financial calculators and planning tools. Loans, taxes, investing, and business — calculated with the precision investors and operators expect.",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="en" className={`${libreCaslon.variable} ${hanken.variable}`}>
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
                <link
                    rel="stylesheet"
                    href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,300,0,0&display=swap"
                />
            </head>
            <body className="flex flex-col min-h-screen bg-surface text-on-background">
                <AuthProvider>
                    <SiteHeader />
                    <main className="flex-grow">{children}</main>
                    <SiteFooter />
                    <ChatBot />
                    <Toaster />
                </AuthProvider>
                <Script src="/animations.js" strategy="afterInteractive" />
            </body>
        </html>
    )
}
