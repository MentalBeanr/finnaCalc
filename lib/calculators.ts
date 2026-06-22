export type CalculatorCategory =
    | "Personal Finance"
    | "Loans"
    | "Business"
    | "Investing"
    | "Taxes"

export interface CalculatorMeta {
    slug: string
    title: string
    description: string
    href: string
    category: CalculatorCategory
    icon: string
    estimatedMinutes: number
    featured?: boolean
    popular?: boolean
}

export const CALCULATORS: ReadonlyArray<CalculatorMeta> = [
    {
        slug: "loan-calculator",
        title: "Loan Calculator",
        description:
            "Solve for payment, APR, maximum loan amount, or remaining balance with deterministic, decimal-safe math.",
        href: "/loan-calculator",
        category: "Loans",
        icon: "account_balance",
        estimatedMinutes: 2,
        featured: true,
        popular: true,
    },
    {
        slug: "roi-calculator",
        title: "ROI Calculator",
        description:
            "Measure the return on any investment with annualized, total, and inflation-adjusted views.",
        href: "/roi-calculator",
        category: "Investing",
        icon: "trending_up",
        estimatedMinutes: 2,
        featured: true,
        popular: true,
    },
    {
        slug: "tax-calculator",
        title: "Tax Savings Calculator",
        description:
            "Estimate the impact of deductions, credits, and contribution strategies on your tax bill.",
        href: "/tax-calculator",
        category: "Taxes",
        icon: "receipt_long",
        estimatedMinutes: 3,
        featured: true,
        popular: true,
    },
    {
        slug: "emergency-fund-calculator",
        title: "Emergency Fund",
        description:
            "Size your reserve against fixed expenses, income volatility, and household risk tolerance.",
        href: "/emergency-fund-calculator",
        category: "Personal Finance",
        icon: "savings",
        estimatedMinutes: 2,
        featured: true,
        popular: true,
    },
    {
        slug: "break-even-calculator",
        title: "Break-Even Point",
        description:
            "Find the unit volume and revenue threshold where your business becomes profitable.",
        href: "/break-even-calculator",
        category: "Business",
        icon: "query_stats",
        estimatedMinutes: 2,
        featured: true,
    },
    {
        slug: "cash-flow-calculator",
        title: "Cash Flow Projector",
        description:
            "Model inflows, outflows, and runway across a rolling horizon with scenario inputs.",
        href: "/cash-flow-calculator",
        category: "Business",
        icon: "monitoring",
        estimatedMinutes: 3,
        featured: true,
    },
    {
        slug: "budgeting",
        title: "Personal Budget",
        description:
            "Allocate income across needs, wants, and savings with a category-aware planner.",
        href: "/budgeting",
        category: "Personal Finance",
        icon: "payments",
        estimatedMinutes: 4,
        popular: true,
    },
    {
        slug: "profit-margin-calculator",
        title: "Profit Margin",
        description:
            "Compute gross, operating, and net margins on any unit or product line.",
        href: "/profit-margin-calculator",
        category: "Business",
        icon: "analytics",
        estimatedMinutes: 1,
    },
    {
        slug: "pricing-calculator",
        title: "Pricing",
        description:
            "Set price points that protect margin while reflecting positioning and willingness-to-pay.",
        href: "/pricing-calculator",
        category: "Business",
        icon: "sell",
        estimatedMinutes: 2,
    },
    {
        slug: "startup-cost-calculator",
        title: "Startup Cost",
        description:
            "Estimate one-time and recurring costs to launch with confidence in your runway.",
        href: "/startup-cost-calculator",
        category: "Business",
        icon: "rocket_launch",
        estimatedMinutes: 3,
    },
    {
        slug: "employee-contractor-calculator",
        title: "Employee vs Contractor",
        description:
            "Compare fully-loaded costs of W-2 and 1099 engagements over a defined horizon.",
        href: "/employee-contractor-calculator",
        category: "Business",
        icon: "groups",
        estimatedMinutes: 2,
    },
] as const

export const FEATURED_CALCULATORS = CALCULATORS.filter((c) => c.featured)
export const POPULAR_CALCULATORS = CALCULATORS.filter((c) => c.popular)

export interface CalculatorCategoryGroup {
    id: string
    title: string
    description: string
    icon: string
    categories: ReadonlyArray<CalculatorCategory>
    href: string
}

export const CATEGORY_GROUPS: ReadonlyArray<CalculatorCategoryGroup> = [
    {
        id: "personal",
        title: "Personal Finance",
        description:
            "Plan emergency reserves, debt payoff, and household budgets with deterministic precision.",
        icon: "savings",
        categories: ["Personal Finance", "Loans"],
        href: "/#featured",
    },
    {
        id: "business",
        title: "Business Operations",
        description:
            "Model break-even, runway, margin, and pricing for the decisions that move the P&L.",
        icon: "account_balance",
        categories: ["Business"],
        href: "/#featured",
    },
    {
        id: "wealth",
        title: "Investing & Taxes",
        description:
            "Quantify returns, contribution strategies, and tax outcomes with editorial clarity.",
        icon: "monitoring",
        categories: ["Investing", "Taxes"],
        href: "/#featured",
    },
] as const
