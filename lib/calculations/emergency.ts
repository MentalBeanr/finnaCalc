import { D, Decimal, ONE, ZERO } from "@/lib/money/decimal"
import type { EmergencyInput, EmergencyResult } from "@/lib/types/emergency"

/**
 * Emergency fund sizing + time-to-goal projection.
 *
 * Models the future-value relationship between an existing balance and a
 * stream of monthly contributions, both compounding at the same monthly rate:
 *
 *     T = S * (1 + r)^n + PMT * ((1 + r)^n − 1) / r
 *
 * Solving for n:
 *
 *     n = log( (T + PMT/r) / (S + PMT/r) ) / log(1 + r)
 *
 * Zero-rate edge case (r = 0):
 *
 *     n = (T − S) / PMT
 *
 * Returns timeToGoalMonths = null when the goal is unreachable with the
 * provided inputs (no contributions and the existing balance can't compound
 * up to the target — including the no-rate, no-contribution case).
 */
export function calculateEmergency(input: EmergencyInput): EmergencyResult {
    const {
        monthlyExpenses,
        currentSavings,
        targetType,
        targetValue,
        monthlyContribution,
        annualRatePercent,
    } = input

    const targetAmount =
        targetType === "months" ? monthlyExpenses.times(targetValue) : targetValue

    const stillNeeded = Decimal.max(ZERO, targetAmount.minus(currentSavings))
    const monthsCovered = monthlyExpenses.gt(0)
        ? currentSavings.div(monthlyExpenses)
        : ZERO
    const percentComplete = targetAmount.gt(0)
        ? Decimal.min(D(100), currentSavings.div(targetAmount).times(100))
        : D(100)

    const monthlyRate = annualRatePercent.div(100).div(12)

    let timeToGoalMonths: Decimal | null
    if (stillNeeded.isZero()) {
        timeToGoalMonths = ZERO
    } else if (monthlyContribution.isZero() && monthlyRate.isZero()) {
        timeToGoalMonths = null
    } else if (monthlyContribution.isZero()) {
        // Pure compounding on existing balance.
        // T = S * (1+r)^n → n = log(T/S) / log(1+r)
        if (currentSavings.lte(0)) {
            timeToGoalMonths = null
        } else {
            const ratio = targetAmount.div(currentSavings).toNumber()
            const n = Math.log(ratio) / Math.log(ONE.plus(monthlyRate).toNumber())
            timeToGoalMonths = D(Math.ceil(n))
        }
    } else if (monthlyRate.isZero()) {
        const n = stillNeeded.div(monthlyContribution)
        timeToGoalMonths = D(Math.ceil(n.toNumber()))
    } else {
        // n = log( (T + PMT/r) / (S + PMT/r) ) / log(1+r)
        const pmtOverR = monthlyContribution.div(monthlyRate)
        const numerator = targetAmount.plus(pmtOverR).toNumber()
        const denominator = currentSavings.plus(pmtOverR).toNumber()
        const n =
            Math.log(numerator / denominator) /
            Math.log(ONE.plus(monthlyRate).toNumber())
        timeToGoalMonths = D(Math.ceil(n))
    }

    const principalContributed =
        timeToGoalMonths === null
            ? ZERO
            : monthlyContribution.times(timeToGoalMonths)

    const interestEarned =
        timeToGoalMonths === null
            ? ZERO
            : Decimal.max(
                  ZERO,
                  targetAmount.minus(currentSavings).minus(principalContributed),
              )

    return {
        targetAmount,
        stillNeeded,
        percentComplete,
        monthsCovered,
        timeToGoalMonths,
        principalContributed,
        interestEarned,
    }
}
