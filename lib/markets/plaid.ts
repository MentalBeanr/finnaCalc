/**
 * Plaid Investments API client — server-side only.
 * Required env: PLAID_CLIENT_ID, PLAID_SECRET
 * Optional env: PLAID_ENV (sandbox | development | production) — defaults to sandbox
 */

const ENV   = (process.env.PLAID_ENV ?? "sandbox") as "sandbox" | "development" | "production"
const BASES = {
    sandbox:     "https://sandbox.plaid.com",
    development: "https://development.plaid.com",
    production:  "https://production.plaid.com",
} as const
const BASE  = BASES[ENV] ?? BASES.sandbox

async function post<T>(endpoint: string, body: Record<string, unknown>): Promise<T> {
    const res = await fetch(`${BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
            client_id: process.env.PLAID_CLIENT_ID,
            secret:    process.env.PLAID_SECRET,
            ...body,
        }),
    })
    return res.json()
}

// ── Types ──────────────────────────────────────────────────────────────────────

export interface PlaidSecurity {
    security_id:        string
    ticker_symbol:      string | null
    name:               string | null
    type:               string | null      // equity | etf | mutual fund | cash | ...
    close_price:        number | null
    close_price_as_of:  string | null
    iso_currency_code:  string | null
    isin:               string | null
    cusip:              string | null
}

export interface PlaidHolding {
    account_id:               string
    security_id:              string
    quantity:                 number
    institution_price:        number | null
    institution_value:        number | null
    institution_price_as_of:  string | null
    cost_basis:               number | null   // total cost basis (not per share)
    iso_currency_code:        string | null
    unofficial_currency_code: string | null
}

export interface PlaidAccount {
    account_id: string
    name:       string
    mask:       string | null
    type:       string
    subtype:    string | null
    balances: {
        current:            number | null
        available:          number | null
        iso_currency_code:  string | null
    }
}

export interface PlaidInvestmentTransaction {
    investment_transaction_id: string
    account_id:  string
    security_id: string | null
    date:        string
    name:        string
    quantity:    number
    amount:      number
    price:       number
    type:        string      // buy | sell | dividend | transfer | ...
    subtype:     string
    fees:        number | null
    iso_currency_code: string | null
}

// ── API calls ──────────────────────────────────────────────────────────────────

export function createLinkToken() {
    return post<{
        link_token: string; expiration: string
        error_code?: string; error_message?: string
    }>("/link/token/create", {
        user: { client_user_id: "portfolio-user" },
        client_name: "finnaCalc",
        products: ["investments"],
        country_codes: ["US"],
        language: "en",
    })
}

export function exchangePublicToken(public_token: string) {
    return post<{
        access_token: string; item_id: string
        error_code?: string; error_message?: string
    }>("/item/public_token/exchange", { public_token })
}

export function getHoldings(access_token: string) {
    return post<{
        accounts:   PlaidAccount[]
        holdings:   PlaidHolding[]
        securities: PlaidSecurity[]
        item:       Record<string, unknown>
        error_code?: string; error_message?: string
    }>("/investments/holdings/get", { access_token })
}

export function getInvestmentTransactions(
    access_token: string,
    start_date: string,
    end_date: string,
    offset = 0,
) {
    return post<{
        investment_transactions: PlaidInvestmentTransaction[]
        securities:              PlaidSecurity[]
        total_investment_transactions: number
        error_code?: string; error_message?: string
    }>("/investments/transactions/get", { access_token, start_date, end_date, options: { offset } })
}
