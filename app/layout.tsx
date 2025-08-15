import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Financial Calculators and Planning Tools - Free Business & Personal Finance Tools | FinnaCalc",
  description:
    "Free financial calculators and planning tools for small business owners and entrepreneurs. Calculate loans, ROI, break-even points, startup costs, emergency funds, and more. Professional tools to help grow your business.",
  keywords:
    "financial calculator, planning tools, business calculator, loan calculator, ROI calculator, break-even calculator, startup cost calculator, emergency fund calculator, tax calculator, profit margin calculator",
  openGraph: {
    title: "Financial Calculators and Planning Tools - Free Business & Personal Finance Tools",
    description:
      "Professional financial calculators and planning tools for business planning, loans, investments, and more.",
    type: "website",
  },
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
