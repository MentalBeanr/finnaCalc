import { D, Decimal, ONE, ZERO } from "@/lib/money/decimal"
import type {
    AmortizationPeriod,
    AprInput,
    AprResult,
    LoanAmountInput,
    LoanAmountResult,
    PaymentInput,
    PaymentResult,
    PERIODS_PER_YEAR as _,
    RemainingBalanceInput,
    RemainingBalanceResult,
} from "@/lib/types/loan"
import { PERIODS_PER_YEAR } from "@/lib/types/loan"

/**
 * Compute the per-period payment for an amortizing loan.
 *
 * Standard PMT formula:
 *     PMT = P * r * (1 + r)^n / ((1 + r)^n - 1)
 *
 * Where:
 *     P = principal (loan amount minus down payment)
 *     r = periodic interest rate (annual rate / periods per year)
 *     n = total number of periods
 *
 * Edge case: r = 0 → PMT = P / n (interest-free amortization).
 */
export function calculatePayment(input: PaymentInput): PaymentResult {
    const principal = input.loanAmount.minus(input.downPayment)
    const periodsPerYear = D(PERIODS_PER_YEAR[input.frequency])
    const periodicRate = input.interestRate.div(100).div(periodsPerYear)
    const periods = input.termMonths.times(periodsPerYear).div(12)

    let paymentPerPeriod: Decimal
    if (periodicRate.isZero()) {
        paymentPerPeriod = principal.div(periods)
    } else {
        const growth = ONE.plus(periodicRate).pow(periods)
        paymentPerPeriod = principal
            .times(periodicRate)
            .times(growth)
            .div(growth.minus(ONE))
    }

    const totalPayment = paymentPerPeriod.times(periods)
    const totalInterest = totalPayment.minus(principal)

    return {
        kind: "payment",
        paymentPerPeriod,
        totalPayment,
        totalInterest,
        principal,
        downPayment: input.downPayment,
        frequency: input.frequency,
        periods,
    }
}

/**
 * Approximate APR using the simple-interest formula:
 *     APR ≈ ((interest + fees) / principal / years) * 100
 *
 * This is the "nominal APR" approximation widely used for consumer
 * comparison. It is not the actuarial APR (which would require solving
 * for the rate that discounts all cash flows to the loan amount).
 */
export function calculateApr(input: AprInput): AprResult {
    const totalCost = input.totalInterest.plus(input.fees)
    const apr = totalCost.div(input.loanAmount).div(input.termYears).times(100)

    return {
        kind: "apr",
        apr,
        totalCost,
        principal: input.loanAmount,
        termYears: input.termYears,
    }
}

/**
 * Solve the PMT formula for principal to find the maximum loan amount
 * for a given monthly payment, annual rate, and term in months.
 *
 *     P = PMT * (1 - (1 + r)^-n) / r
 *
 * Edge case: r = 0 → P = PMT * n.
 */
export function calculateMaxLoanAmount(input: LoanAmountInput): LoanAmountResult {
    const monthlyRate = input.interestRate.div(100).div(12)
    const n = input.termMonths

    let maxLoanAmount: Decimal
    if (monthlyRate.isZero()) {
        maxLoanAmount = input.monthlyPayment.times(n)
    } else {
        const annuityFactor = ONE.minus(ONE.plus(monthlyRate).pow(n.negated())).div(monthlyRate)
        maxLoanAmount = input.monthlyPayment.times(annuityFactor)
    }

    return {
        kind: "loanAmount",
        maxLoanAmount,
        monthlyPayment: input.monthlyPayment,
        interestRate: input.interestRate,
        termMonths: input.termMonths,
    }
}

/**
 * Remaining balance on an amortizing loan after k payments:
 *
 *     B_k = P * (1 + r)^k - PMT * ((1 + r)^k - 1) / r
 *
 * Where PMT is the contractual monthly payment derived from the
 * original loan terms. Clamped at 0 to avoid negative residuals from
 * rounding when the loan is fully paid.
 */
export function calculateRemainingBalance(
    input: RemainingBalanceInput,
): RemainingBalanceResult {
    const monthlyRate = input.interestRate.div(100).div(12)
    const n = input.termMonths
    const k = input.paymentsMade

    let monthlyPayment: Decimal
    if (monthlyRate.isZero()) {
        monthlyPayment = input.originalAmount.div(n)
    } else {
        const growthFull = ONE.plus(monthlyRate).pow(n)
        monthlyPayment = input.originalAmount
            .times(monthlyRate)
            .times(growthFull)
            .div(growthFull.minus(ONE))
    }

    let remainingBalance: Decimal
    if (monthlyRate.isZero()) {
        remainingBalance = input.originalAmount.minus(monthlyPayment.times(k))
    } else {
        const growthK = ONE.plus(monthlyRate).pow(k)
        remainingBalance = input.originalAmount
            .times(growthK)
            .minus(monthlyPayment.times(growthK.minus(ONE)).div(monthlyRate))
    }

    if (remainingBalance.lt(ZERO)) remainingBalance = ZERO

    const remainingPayments = n.minus(k)
    const totalPaid = monthlyPayment.times(k)

    return {
        kind: "remaining",
        remainingBalance,
        remainingPayments,
        monthlyPayment,
        totalPaid,
    }
}

/**
 * Build a per-period amortization schedule for an amortizing loan.
 *
 * Each period:
 *   interest_t = balance_{t-1} * r
 *   principal_t = payment - interest_t
 *   balance_t = balance_{t-1} - principal_t
 *
 * The final period's principal is adjusted so balance lands exactly at 0
 * (absorbs any sub-cent residue from periodic rounding so the schedule
 * closes cleanly). Zero-rate loans amortize as straight-line.
 */
export function buildAmortizationSchedule(input: PaymentInput): AmortizationPeriod[] {
    const result = calculatePayment(input)
    const totalPeriods = result.periods.toNumber()
    if (totalPeriods <= 0) return []

    const periodsPerYear = D(PERIODS_PER_YEAR[input.frequency])
    const periodicRate = input.interestRate.div(100).div(periodsPerYear)

    const schedule: AmortizationPeriod[] = []
    let balance = result.principal
    let cumulativeInterest = ZERO
    let cumulativePrincipal = ZERO

    for (let t = 1; t <= totalPeriods; t++) {
        const interest = periodicRate.isZero() ? ZERO : balance.times(periodicRate)
        let principal =
            t === totalPeriods ? balance : result.paymentPerPeriod.minus(interest)
        if (principal.lt(ZERO)) principal = ZERO

        const periodPayment = principal.plus(interest)
        balance = balance.minus(principal)
        if (balance.lt(ZERO)) balance = ZERO
        cumulativeInterest = cumulativeInterest.plus(interest)
        cumulativePrincipal = cumulativePrincipal.plus(principal)

        schedule.push({
            period: t,
            payment: periodPayment,
            interest,
            principal,
            balance,
            cumulativeInterest,
            cumulativePrincipal,
        })
    }

    return schedule
}
