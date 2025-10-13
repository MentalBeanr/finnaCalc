import { type Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import ChatBot from '@/components/Chatbot'
import Header from "@/components/header";
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner' // Import the Toaster

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
})

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
})

export const metadata: Metadata = {
    title: 'FinnaCalc - Financial Calculators and Planning Tools',
    description: 'Free financial calculators and planning tools for small business owners and entrepreneurs.',
}

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <ClerkProvider>
            <html lang="en" suppressHydrationWarning>
            <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
                <div className="flex flex-col min-h-screen">
                    <Header />
                    <main className="flex-grow">
                        {children}
                    </main>
                    <ChatBot />
                    <Toaster /> {/* Add the Toaster component here */}
                </div>
            </ThemeProvider>
            </body>
            </html>
        </ClerkProvider>
    )
}