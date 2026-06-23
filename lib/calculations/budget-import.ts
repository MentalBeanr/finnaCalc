import type {
    ImportFileKind,
    ParsedTransaction,
} from "@/lib/types/budget-import"
import type { BudgetType } from "@/lib/types/budget"

/** Strip noisy bank-statement boilerplate and return a Title Case description. */
export function cleanDescription(raw: string): string {
    if (!raw) return "Unknown Transaction"
    let cleaned = raw.trim()
    cleaned = cleaned.replace(/\b\d{8,}\b/g, "")
    cleaned = cleaned.replace(/\b[A-Z0-9]{10,}\b/g, "")
    cleaned = cleaned.replace(
        /(?:\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2})/g,
        "",
    )
    cleaned = cleaned.replace(
        /(?:DEBIT|CREDIT|WITHDRAWAL|DEPOSIT)\s*(CARD|FASTER PAYMENTS)?\s*(\*|\s-)?/i,
        "",
    )
    cleaned = cleaned.replace(/ZEL\*/i, "")
    cleaned = cleaned.replace(/PAYMENT - THANK YOU/i, "")
    cleaned = cleaned.replace(
        /Annual Percentage Yield Earned/i,
        "Interest Earned",
    )

    const patterns = [
        /(?:SQ|SQUARE)\s*\*?\s*([A-Z\s\d&'-]+)/i,
        /([A-Z\s&'-]+?)(?:\s*#\d+|\s*\d{5,}|LLC|INC|CORP)/i,
    ]
    for (const pattern of patterns) {
        const match = cleaned.match(pattern)
        if (match && match[1]) {
            cleaned = match[1]
            break
        }
    }

    cleaned = cleaned.replace(/[^\w\s&'-]/g, " ").replace(/\s+/g, " ").trim()
    if (!cleaned) return "Unknown Transaction"
    return cleaned
        .toLowerCase()
        .split(" ")
        .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
        .join(" ")
}

const PERSONAL_RULES: ReadonlyArray<{ pattern: RegExp; category: string }> = [
    { pattern: /salary|payroll|direct deposit|wages/i, category: "Salary" },
    { pattern: /interest earned/i, category: "Investments" },
    { pattern: /dividend|brokerage/i, category: "Investments" },
    { pattern: /rent|mortgage|landlord|lease/i, category: "Housing" },
    { pattern: /electric|water|gas bill|internet|comcast|verizon|att|t-mobile|sprint|utility/i, category: "Utilities" },
    { pattern: /grocer|whole foods|trader joe|safeway|kroger|publix|aldi|costco|walmart/i, category: "Food" },
    { pattern: /restaurant|cafe|coffee|starbucks|chipotle|mcdonald|doordash|uber eats|grubhub/i, category: "Food" },
    { pattern: /uber|lyft|gas station|shell|chevron|exxon|bp |parking|toll|transit|metro/i, category: "Transportation" },
    { pattern: /netflix|spotify|hulu|disney|hbo|cinema|movie|amc/i, category: "Entertainment" },
    { pattern: /pharmacy|cvs|walgreens|hospital|clinic|dental|doctor|medical/i, category: "Healthcare" },
    { pattern: /insurance/i, category: "Insurance" },
    { pattern: /loan|credit card payment|amex payment|chase payment|debt/i, category: "Debt Payments" },
    { pattern: /savings|transfer to|wealthfront|betterment|vanguard|fidelity/i, category: "Savings" },
]

const BUSINESS_RULES: ReadonlyArray<{ pattern: RegExp; category: string }> = [
    { pattern: /sales|revenue|stripe|square|invoice/i, category: "Sales Revenue" },
    { pattern: /service fee|consulting/i, category: "Service Revenue" },
    { pattern: /subscription/i, category: "Subscriptions" },
    { pattern: /interest earned|dividend/i, category: "Interest Earned" },
    { pattern: /cogs|inventory|wholesale/i, category: "Cost of Goods Sold" },
    { pattern: /payroll|salary|wages|gusto|adp/i, category: "Salaries / Wages" },
    { pattern: /facebook ads|google ads|marketing|ad spend|promo/i, category: "Marketing" },
    { pattern: /rent|lease|wework/i, category: "Rent / Lease" },
    { pattern: /electric|water|gas bill|internet|utility/i, category: "Utilities" },
    { pattern: /aws|stripe fee|github|figma|notion|slack|software|saas|subscription/i, category: "Software" },
    { pattern: /supplies|staples|office depot/i, category: "Supplies" },
    { pattern: /insurance/i, category: "Insurance" },
    { pattern: /legal|accountant|professional|attorney/i, category: "Professional Fees" },
    { pattern: /irs|tax/i, category: "Taxes" },
    { pattern: /airline|hotel|airbnb|travel|uber|lyft/i, category: "Travel" },
    { pattern: /loan|debt|credit card payment/i, category: "Loan Payments" },
]

/** Heuristic category mapping from a transaction description, scoped to budget type and income/expense. */
export function categorizeTransaction(
    description: string,
    budgetType: BudgetType,
    isIncome: boolean,
): string {
    const rules = budgetType === "personal" ? PERSONAL_RULES : BUSINESS_RULES
    for (const { pattern, category } of rules) {
        if (pattern.test(description)) return category
    }
    if (isIncome) return budgetType === "personal" ? "Other" : "Other Revenue"
    return "Other"
}

const ROW_KEY_DATE = ["Date", "date", "Transaction Date", "transaction date", "Posted Date", "posted date"]
const ROW_KEY_DESC = ["Description", "description", "Payee", "payee", "Memo", "memo", "Details", "details"]
const ROW_KEY_AMOUNT = ["Amount", "amount", "Transaction Amount", "transaction amount"]
const ROW_KEY_DEBIT = ["Debit", "debit", "Withdrawal", "withdrawal"]
const ROW_KEY_CREDIT = ["Credit", "credit", "Deposit", "deposit"]

function pick(row: Record<string, string>, keys: ReadonlyArray<string>): string | undefined {
    for (const k of keys) {
        const v = row[k]
        if (v !== undefined && v !== null && String(v).trim() !== "") return String(v)
    }
    return undefined
}

function toIsoDate(raw: string): string {
    if (!raw) return ""
    const trimmed = raw.trim()
    const d = new Date(trimmed)
    if (Number.isNaN(d.getTime())) return ""
    return d.toISOString().slice(0, 10)
}

function parseAmountString(s: string): number | null {
    const cleaned = s.replace(/[^0-9.\-()]/g, "").replace(/^\((.+)\)$/, "-$1")
    const n = parseFloat(cleaned)
    return Number.isFinite(n) ? n : null
}

/** Parse CSV row objects (output of papaparse) into transactions. Pure: takes plain data, no I/O. */
export function parseCsvRows(
    rows: ReadonlyArray<Record<string, string>>,
    budgetType: BudgetType,
): ParsedTransaction[] {
    const out: ParsedTransaction[] = []
    for (const row of rows) {
        const dateRaw = pick(row, ROW_KEY_DATE)
        const descRaw = pick(row, ROW_KEY_DESC)
        let amountRaw = pick(row, ROW_KEY_AMOUNT)
        if (!amountRaw) {
            const debit = pick(row, ROW_KEY_DEBIT)
            const credit = pick(row, ROW_KEY_CREDIT)
            if (debit) amountRaw = `-${debit}`
            else if (credit) amountRaw = credit
        }
        if (!descRaw || !amountRaw) continue
        const signed = parseAmountString(amountRaw)
        if (signed === null) continue
        const description = cleanDescription(descRaw)
        const isIncome = signed >= 0
        out.push({
            date: dateRaw ? toIsoDate(dateRaw) : "",
            description,
            amount: Math.abs(signed),
            type: isIncome ? "income" : "expense",
            category: categorizeTransaction(description, budgetType, isIncome),
        })
    }
    return out
}

const TXT_REGEX =
    /((\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})|([A-Za-z]{3}\s\d{1,2}))\s+(.*?)\s+(-?\$?\d{1,3}(?:,?\d{3})*\.\d{2})/

/** Parse plain text statements (one transaction per line). Pure. */
export function parseTxtText(
    text: string,
    budgetType: BudgetType,
): ParsedTransaction[] {
    const out: ParsedTransaction[] = []
    for (const line of text.split("\n")) {
        const match = line.match(TXT_REGEX)
        if (!match) continue
        const dateRaw = match[1]
        const description = cleanDescription(match[4])
        const signed = parseAmountString(match[5])
        if (signed === null) continue
        const isIncome = signed > 0
        out.push({
            date: toIsoDate(dateRaw),
            description,
            amount: Math.abs(signed),
            type: isIncome ? "income" : "expense",
            category: categorizeTransaction(description, budgetType, isIncome),
        })
    }
    return out
}

const PDF_REGEX =
    /((\d{1,2}[\/-]\d{1,2}(\/\d{2,4})?))\s+(.*?)\s+(-?\$?\d{1,3}(?:,?\d{3})*\.\d{2})/g

/** Parse text extracted from a PDF into transactions. Pure. */
export function parsePdfText(
    text: string,
    budgetType: BudgetType,
): ParsedTransaction[] {
    const out: ParsedTransaction[] = []
    const re = new RegExp(PDF_REGEX.source, "g")
    let match: RegExpExecArray | null
    while ((match = re.exec(text)) !== null) {
        const dateRaw = match[1]
        const description = cleanDescription(match[4])
        const signed = parseAmountString(match[5])
        if (signed === null) continue
        const isIncome = signed > 0
        out.push({
            date: toIsoDate(dateRaw),
            description,
            amount: Math.abs(signed),
            type: isIncome ? "income" : "expense",
            category: categorizeTransaction(description, budgetType, isIncome),
        })
    }
    return out
}

/** Determine the file kind from its name. Returns null for unsupported extensions. */
export function detectFileKind(fileName: string): ImportFileKind | null {
    const lower = fileName.toLowerCase()
    if (lower.endsWith(".csv")) return "csv"
    if (lower.endsWith(".pdf")) return "pdf"
    if (lower.endsWith(".txt")) return "txt"
    return null
}
