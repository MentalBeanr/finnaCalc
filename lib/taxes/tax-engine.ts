// ── Comprehensive 2024 Federal Tax Calculation Engine ─────────────────────────
// Covers: Form 1040, Schedules A/B/C/D/E/SE, AMT, NIIT, major credits

import type { TaxData, TaxResult } from "./types"
import { calculateStateTax } from "./state-taxes"

// ── 2024 Constants ─────────────────────────────────────────────────────────────

const MILEAGE_RATE = 0.67          // IRS standard mileage rate 2024
const SE_SS_WAGE_BASE = 168_600    // Social Security wage base 2024

const STANDARD_DEDUCTION: Record<string, number> = {
    single:             14_600,
    married_jointly:    29_200,
    married_separately: 14_600,
    head_of_household:  21_900,
    qualifying_widow:   29_200,
}

const ADDITIONAL_DEDUCTION_SINGLE_HOH = 1_950    // 65+ or blind
const ADDITIONAL_DEDUCTION_MFJ_MFS    = 1_550    // 65+ or blind per person

// ── Federal income tax brackets ───────────────────────────────────────────────

interface Bracket { rate: number; min: number; max: number }

function makeBrackets(thresholds: [number, number][]): Bracket[] {
    return thresholds.map(([rate, max], i) => ({
        rate,
        min: i === 0 ? 0 : thresholds[i - 1][1],
        max,
    }))
}

const BRACKETS: Record<string, Bracket[]> = {
    single: makeBrackets([
        [0.10,  11_600],
        [0.12,  47_150],
        [0.22, 100_525],
        [0.24, 191_950],
        [0.32, 243_725],
        [0.35, 609_350],
        [0.37, Infinity],
    ]),
    married_jointly: makeBrackets([
        [0.10,  23_200],
        [0.12,  94_300],
        [0.22, 201_050],
        [0.24, 383_900],
        [0.32, 487_450],
        [0.35, 731_200],
        [0.37, Infinity],
    ]),
    married_separately: makeBrackets([
        [0.10,  11_600],
        [0.12,  47_150],
        [0.22, 100_525],
        [0.24, 191_950],
        [0.32, 243_725],
        [0.35, 365_600],
        [0.37, Infinity],
    ]),
    head_of_household: makeBrackets([
        [0.10,  16_550],
        [0.12,  63_100],
        [0.22, 100_500],
        [0.24, 191_950],
        [0.32, 243_700],
        [0.35, 609_350],
        [0.37, Infinity],
    ]),
    qualifying_widow: makeBrackets([
        [0.10,  23_200],
        [0.12,  94_300],
        [0.22, 201_050],
        [0.24, 383_900],
        [0.32, 487_450],
        [0.35, 731_200],
        [0.37, Infinity],
    ]),
}

// ── LTCG / Qualified dividend rate thresholds ─────────────────────────────────

const LTCG_THRESHOLDS: Record<string, [number, number]> = {
    single:             [47_025, 518_900],
    married_jointly:    [94_050, 583_750],
    married_separately: [47_025, 291_850],
    head_of_household:  [63_000, 551_350],
    qualifying_widow:   [94_050, 583_750],
}

// ── AMT ────────────────────────────────────────────────────────────────────────

const AMT_EXEMPTION: Record<string, number> = {
    single: 85_700, married_jointly: 133_300, married_separately: 66_650,
    head_of_household: 85_700, qualifying_widow: 133_300,
}
const AMT_PHASE_OUT_START: Record<string, number> = {
    single: 609_350, married_jointly: 1_218_700, married_separately: 609_350,
    head_of_household: 609_350, qualifying_widow: 1_218_700,
}

// ── Credit phase-out thresholds ────────────────────────────────────────────────

const CTC_PHASEOUT: Record<string, number> = {
    single: 200_000, married_jointly: 400_000, married_separately: 200_000,
    head_of_household: 200_000, qualifying_widow: 400_000,
}

const LLC_PHASEOUT: Record<string, [number, number]> = {
    single: [80_000, 90_000], married_jointly: [160_000, 180_000],
    married_separately: [0, 0],  // MFS: ineligible
    head_of_household: [80_000, 90_000], qualifying_widow: [80_000, 90_000],
}

const EITC_LIMITS_2024: { children: number; maxCredit: number; phaseOutStart: number; phaseOutEnd: number }[] = [
    { children: 0, maxCredit:    632, phaseOutStart:  9_520, phaseOutEnd: 18_591 },
    { children: 1, maxCredit:  4_213, phaseOutStart: 21_560, phaseOutEnd: 49_084 },
    { children: 2, maxCredit:  6_960, phaseOutStart: 21_560, phaseOutEnd: 55_768 },
    { children: 3, maxCredit:  7_830, phaseOutStart: 21_560, phaseOutEnd: 59_899 },
]
const EITC_MFJ_BONUS = 6_000    // MFJ phase-out ends ~$6k higher

// ── Helpers ────────────────────────────────────────────────────────────────────

function bracketTax(income: number, status: string): number {
    const brackets = BRACKETS[status] ?? BRACKETS.single
    let tax = 0
    for (const b of brackets) {
        if (income <= b.min) break
        tax += (Math.min(income, b.max) - b.min) * b.rate
    }
    return Math.max(0, tax)
}

function marginalRate(taxableIncome: number, status: string): number {
    const brackets = BRACKETS[status] ?? BRACKETS.single
    for (const b of [...brackets].reverse()) {
        if (taxableIncome > b.min) return b.rate
    }
    return 0.10
}

function clamp(val: number, min = 0, max = Infinity): number {
    return Math.min(Math.max(val, min), max)
}

// ── Main engine ────────────────────────────────────────────────────────────────

export function computeTax(d: TaxData): TaxResult {
    const status = d.filingStatus || "single"
    const isMFJ  = status === "married_jointly" || status === "qualifying_widow"
    const isMFS  = status === "married_separately"

    // ── 1. W-2 wages ──────────────────────────────────────────────────────────
    const totalWages = (d.w2Wages1 || 0)
        + (d.hasSecondW2 ? (d.w2Wages2 || 0) : 0)
        + (d.hasThirdW2  ? (d.w2Wages3 || 0) : 0)
        + (d.income1099NEC || 0)   // treated as wages if not SE (rare; if SE handled below)

    // ── 2. Self-employment (Schedule C) ───────────────────────────────────────
    let netSEIncome = 0
    if (d.isSelfEmployed) {
        const carExpense = d.seUseMileage
            ? (d.seMileage || 0) * MILEAGE_RATE
            : (d.seCarTruck || 0)

        // Home office deduction
        let homeOfficeDeduction = 0
        if (d.seHomeOfficeArea > 0 && d.seTotalHomeArea > 0) {
            homeOfficeDeduction = d.useSimplifiedHomeOffice
                ? Math.min(d.seHomeOfficeArea, 300) * 5   // $5/sq ft, max 300 sq ft
                : 0   // "actual" home office needs full home expense allocation — simplified here
        }

        const totalSEExpenses =
            (d.seAdvertising    || 0) +
            carExpense           +
            (d.seCommissions    || 0) +
            (d.seContractLabor  || 0) +
            (d.seDepreciation   || 0) +
            (d.seSection179     || 0) +
            (d.seEmployeeBenefits||0) +
            (d.seInsurance      || 0) +
            (d.seInterest       || 0) +
            (d.seLegal          || 0) +
            (d.seOffice         || 0) +
            (d.sePension        || 0) +
            (d.seRentLease      || 0) +
            (d.seRepairs        || 0) +
            (d.seSupplies       || 0) +
            (d.seTaxes          || 0) +
            (d.seTravel         || 0) +
            (d.seMeals || 0) * 0.50  +  // 50% deductible
            (d.seUtilities      || 0) +
            (d.seWages          || 0) +
            (d.seOther          || 0) +
            homeOfficeDeduction

        const grossProfit = (d.grossReceipts || 0) - (d.returnsAllowances || 0) - (d.costOfGoodsSold || 0)
        netSEIncome = Math.max(0, grossProfit - totalSEExpenses)
    }

    // ── 3. Self-employment tax (Schedule SE) ─────────────────────────────────
    // SE tax base = 92.35% of net SE income (per IRS)
    const seTaxableBase = netSEIncome * 0.9235
    const ssTax = Math.min(seTaxableBase, SE_SS_WAGE_BASE) * 0.124
    const medTax = seTaxableBase * 0.029
    const seTax = ssTax + medTax
    const seDeduction = seTax / 2   // above-the-line deduction

    // ── 4. Rental income (Schedule E) ────────────────────────────────────────
    let netRentalIncome = 0
    if (d.hasRentalProperty) {
        const rentalExpenses1 =
            (d.rentalMortgageInterest1 || 0) +
            (d.rentalTaxes1     || 0) +
            (d.rentalInsurance1 || 0) +
            (d.rentalRepairs1   || 0) +
            (d.rentalDepreciation1||0) +
            (d.rentalManagement1|| 0) +
            (d.rentalOther1     || 0)
        // Passive activity loss limitation simplified: cap at $25k (phase-out above $100k AGI)
        const rawRental1 = (d.rentalIncome1 || 0) - rentalExpenses1
        netRentalIncome += rawRental1
        if (d.hasSecondRental) {
            netRentalIncome += (d.rentalIncome2 || 0) - (d.rentalExpenses2 || 0)
        }
    }
    // Rental losses capped at $25k (simplified passive loss rule; phases out $100k-$150k AGI)
    const rentalLossLimit = -25_000
    netRentalIncome = Math.max(netRentalIncome, rentalLossLimit)

    // ── 5. Capital gains / losses ─────────────────────────────────────────────
    const totalSTCapGains = (d.stCapGains || 0) + (d.cryptoGainsST || 0)
    const totalLTCapGains = (d.ltCapGains || 0) + (d.cryptoGainsLT || 0)
    const rawCapNet = totalSTCapGains + totalLTCapGains
    const netCapLoss = Math.max(0, -rawCapNet)
    const capLossDeduction = Math.min(netCapLoss, 3_000)   // $3k annual limit

    // ── 6. Social Security taxability ─────────────────────────────────────────
    const ssBenefits = d.socialSecurityBenefits || 0
    // Provisional income = AGI + tax-exempt interest + 50% of SS benefits
    // We approximate AGI before SS here to avoid circular reference
    const provisionalIncomeApprox =
        totalWages + netSEIncome + (d.ordinaryDividends || 0) + (d.interestIncome || 0) +
        (d.taxExemptInterest || 0) + totalSTCapGains + totalLTCapGains + netRentalIncome + ssBenefits * 0.5

    let taxableSS = 0
    if (isMFJ) {
        if (provisionalIncomeApprox > 44_000) taxableSS = Math.min(ssBenefits * 0.85, ssBenefits)
        else if (provisionalIncomeApprox > 32_000) taxableSS = Math.min(ssBenefits * 0.50, ssBenefits)
    } else {
        if (provisionalIncomeApprox > 34_000) taxableSS = Math.min(ssBenefits * 0.85, ssBenefits)
        else if (provisionalIncomeApprox > 25_000) taxableSS = Math.min(ssBenefits * 0.50, ssBenefits)
    }

    // ── 7. Gross income ───────────────────────────────────────────────────────
    const alimonyRec = (d.alimonyReceived || 0) && (d.alimonyDivorceYear || 0) < 2019
        ? (d.alimonyReceived || 0) : 0

    const totalGrossIncome =
        totalWages +
        netSEIncome +
        (d.ordinaryDividends   || 0) +
        (d.interestIncome      || 0) +
        totalSTCapGains +
        totalLTCapGains +
        - capLossDeduction +
        netRentalIncome +
        (d.ira401kTaxable      || 0) +
        (d.pensionIncome       || 0) +
        taxableSS +
        alimonyRec +
        (d.gamblingWinnings    || 0) +
        (d.unemploymentComp    || 0) +
        (d.stateLocalRefund    || 0) +
        (d.foreignIncome       || 0) +
        (d.income1099MISC      || 0) +
        (d.otherIncome         || 0) +
        (d.rothConversion      || 0)

    // ── 8. Above-the-line adjustments (Form 1040 Schedule 1) ─────────────────
    const educatorCap = isMFJ ? 600 : 300
    const hsaContribLimit = d.hsaCoverageType === "family" ? 8_300 : 4_150
    const hsaTotalContrib = (d.hsaContributions || 0) + (d.hsaEmployerContrib || 0)
    const hsaDeductible = Math.max(0, Math.min(d.hsaContributions || 0, hsaContribLimit - (d.hsaEmployerContrib || 0)))

    // IRA deductibility phase-out (traditional IRA when covered by workplace plan, 2024)
    let iraDeductible = d.traIraContrib || 0
    if (d.iraType === "traditional" && d.coveredByWorkplacePlan) {
        const [phaseStart, phaseEnd] = isMFJ
            ? [123_000, 143_000]
            : isMFS ? [0, 10_000] : [77_000, 87_000]
        if (totalGrossIncome > phaseEnd) iraDeductible = 0
        else if (totalGrossIncome > phaseStart) {
            iraDeductible *= (phaseEnd - totalGrossIncome) / (phaseEnd - phaseStart)
        }
    }
    if (d.iraType === "roth") iraDeductible = 0   // Roth is never deductible

    const studentLoanCap = 2_500
    const studentLoanDeduct = Math.min(d.studentLoanInterest || 0, studentLoanCap)

    const totalAdjustments =
        seDeduction +
        clamp(d.educatorExpenses || 0, 0, educatorCap) +
        hsaDeductible +
        iraDeductible +
        studentLoanDeduct +
        (d.isSelfEmployed ? (d.seHealthInsurance || 0) : 0) +
        (d.isSelfEmployed ? Math.min(d.seSepIraContrib || 0, netSEIncome * 0.25) : 0) +
        (d.isSelfEmployed ? (d.seSimpleContrib || 0) : 0) +
        (d.alimonyPaid || 0) * (((d.alimonyDivorceYear || 0) < 2019 && d.alimonyDivorceYear > 0) ? 1 : 0) +
        (d.earlyWithdrawalPenalty || 0)

    const agi = Math.max(0, totalGrossIncome - totalAdjustments)

    // ── 9. Standard deduction (with 65+ / blind additions) ──────────────────
    const baseStd = STANDARD_DEDUCTION[status] ?? 14_600
    let addl = 0
    if (d.over65Self)   addl += status === "single" || status === "head_of_household" ? ADDITIONAL_DEDUCTION_SINGLE_HOH : ADDITIONAL_DEDUCTION_MFJ_MFS
    if (d.blindSelf)    addl += status === "single" || status === "head_of_household" ? ADDITIONAL_DEDUCTION_SINGLE_HOH : ADDITIONAL_DEDUCTION_MFJ_MFS
    if (d.over65Spouse && isMFJ) addl += ADDITIONAL_DEDUCTION_MFJ_MFS
    if (d.blindSpouse  && isMFJ) addl += ADDITIONAL_DEDUCTION_MFJ_MFS
    const standardDeduction = baseStd + addl

    // ── 10. Itemized deductions (Schedule A) ──────────────────────────────────
    const saltCap = isMFS ? 5_000 : 10_000
    const saltDeduction = Math.min(
        (d.propertyTaxes || 0) + (d.saltIncomeTaxes || 0),
        saltCap
    )
    const charitableMileageValue = (d.charitableMileage || 0) * 0.14   // IRS 2024 rate
    const medFloor = agi * 0.075
    const medDeduction = Math.max(0, (d.medicalExpenses || 0) - medFloor)

    const itemizedDeductions =
        (d.mortgageInterest  || 0) +
        (d.mortgagePoints    || 0) +
        (d.homeEquityInterest|| 0) +
        saltDeduction +
        (d.charitableCash    || 0) +
        (d.charitableNonCash || 0) +
        charitableMileageValue +
        medDeduction +
        (d.investmentInterest|| 0) +
        (d.casualtyLoss      || 0) +
        (d.gamblingLosses    || 0)   // gambling losses deductible up to winnings

    const usingItemized = itemizedDeductions > standardDeduction
    const deduction = Math.max(standardDeduction, itemizedDeductions)

    // ── 11. QBI Deduction (Section 199A) ─────────────────────────────────────
    // 20% of qualified business income; phase-out above $191,950 single / $383,900 MFJ
    let qbiDeduction = 0
    if (d.isSelfEmployed && netSEIncome > 0) {
        const qbiBase = netSEIncome * 0.20
        const [qbiPhaseStart, qbiPhaseEnd] = isMFJ ? [383_900, 483_900] : [191_950, 241_950]
        if (agi <= qbiPhaseStart) {
            qbiDeduction = Math.min(qbiBase, (agi - deduction) * 0.20)
        } else if (agi < qbiPhaseEnd) {
            const ratio = (qbiPhaseEnd - agi) / (qbiPhaseEnd - qbiPhaseStart)
            qbiDeduction = Math.min(qbiBase * ratio, (agi - deduction) * 0.20)
        }
        qbiDeduction = Math.max(0, qbiDeduction)
    }

    // ── 12. Taxable income ───────────────────────────────────────────────────
    const taxableIncome = Math.max(0, agi - deduction - qbiDeduction)

    // ── 13. Regular income tax ───────────────────────────────────────────────
    // For LTCG / qualified dividends, we carve out the preferential rate portion
    const qualDivAndLTCG = (d.qualifiedDividends || 0) + Math.max(0, totalLTCapGains) + (d.collectiblesGains || 0)
    const [ltcg0pct, ltcg15pct] = LTCG_THRESHOLDS[status] ?? [47_025, 518_900]

    const ordinaryTaxableIncome = Math.max(0, taxableIncome - Math.min(qualDivAndLTCG, taxableIncome))
    const regularTax = bracketTax(ordinaryTaxableIncome, status)

    // LTCG / QD tax at 0%, 15%, 20%
    let qualifiedDivLtcgTax = 0
    const ltcgIncome = Math.min(qualDivAndLTCG, taxableIncome)
    if (ltcgIncome > 0) {
        const ltcgBase = ordinaryTaxableIncome   // LTCG stacks on top
        const zeroEnd   = Math.max(0, ltcg0pct   - ltcgBase)
        const fifteenEnd= Math.max(0, ltcg15pct  - ltcgBase)
        const zeroAmt   = Math.min(ltcgIncome, zeroEnd)
        const fifteenAmt= Math.min(ltcgIncome - zeroAmt, fifteenEnd - zeroEnd)
        const twentyAmt = Math.max(0, ltcgIncome - zeroAmt - fifteenAmt)
        // Collectibles taxed at 28%
        const collectAmt = Math.min(d.collectiblesGains || 0, ltcgIncome)
        qualifiedDivLtcgTax = fifteenAmt * 0.15 + twentyAmt * 0.20 + collectAmt * 0.28
    }

    // ── 14. AMT (simplified Form 6251) ───────────────────────────────────────
    let amt = 0
    {
        const amtIncome = taxableIncome
            + (usingItemized ? ((d.saltIncomeTaxes || 0) + (d.propertyTaxes || 0)) : 0) // add back SALT
            + (usingItemized ? medDeduction * 0.0 : 0) // most medical already deducted
        const exemption = AMT_EXEMPTION[status] ?? 85_700
        const phaseStart= AMT_PHASE_OUT_START[status] ?? 609_350
        const reducedExemption = Math.max(0, exemption - Math.max(0, amtIncome - phaseStart) * 0.25)
        const amtBase = Math.max(0, amtIncome - reducedExemption)
        const amtTax  = amtBase <= 220_700
            ? amtBase * 0.26
            : 220_700 * 0.26 + (amtBase - 220_700) * 0.28
        amt = Math.max(0, amtTax - regularTax - qualifiedDivLtcgTax)
    }

    // ── 15. NIIT (Net Investment Income Tax) — 3.8% ───────────────────────────
    const niitThreshold = isMFJ ? 250_000 : isMFS ? 125_000 : 200_000
    const netInvestmentIncome = Math.max(0,
        (d.ordinaryDividends || 0) +
        (d.interestIncome    || 0) +
        Math.max(0, totalSTCapGains + totalLTCapGains) +
        Math.max(0, netRentalIncome)
    )
    const niit = agi > niitThreshold
        ? Math.min(netInvestmentIncome, agi - niitThreshold) * 0.038
        : 0

    // ── 16. Additional Medicare Tax — 0.9% ────────────────────────────────────
    const additionalMedicareThreshold = isMFJ ? 250_000 : isMFS ? 125_000 : 200_000
    const higherEarnings = totalWages + netSEIncome
    const additionalMedicareTax = Math.max(0, higherEarnings - additionalMedicareThreshold) * 0.009

    // ── 17. Early withdrawal penalty — 10% ────────────────────────────────────
    const withdrawalPenalty = d.isEarlyWithdrawal && !d.earlyWithdrawalException
        ? (d.ira401kTaxable || 0) * 0.10
        : 0

    const totalTaxBeforeCredits = regularTax + qualifiedDivLtcgTax + amt + niit + additionalMedicareTax + withdrawalPenalty

    // ── 18. Child Tax Credit / Additional CTC ────────────────────────────────
    const qualChildren = Math.max(0, d.numQualifyingChildren || 0)
    const otherDeps    = Math.max(0, d.numOtherDependents    || 0)
    const ctcPhaseout  = CTC_PHASEOUT[status] ?? 200_000
    const ctcRaw = qualChildren * 2_000 + otherDeps * 500
    const ctcReduction = Math.ceil(Math.max(0, agi - ctcPhaseout) / 1_000) * 50
    const ctcNonRefundable = Math.max(0, ctcRaw - ctcReduction)
    const ctc  = Math.min(ctcNonRefundable, totalTaxBeforeCredits)
    // Additional CTC — up to $1,700 refundable (2024)
    const actcMax = Math.min(1_700 * qualChildren, Math.max(0, ctcNonRefundable - ctc))
    const actc = actcMax

    // ── 19. Child & Dependent Care Credit (Form 2441) ─────────────────────────
    // Rate: 35% at low income, 20% at higher income; earned income limit
    let cdcc = 0
    if ((d.childcareExpenses || 0) > 0 && qualChildren + (d.numOtherDependents || 0) > 0) {
        const capExpenses = qualChildren > 1 ? 6_000 : 3_000
        const qualExp = Math.min(d.childcareExpenses || 0, capExpenses)
        const earnedIncome = totalWages + netSEIncome
        const qualExpFinal = Math.min(qualExp, earnedIncome)
        let rate = 0.20
        if (agi <= 15_000) rate = 0.35
        else if (agi <= 43_000) rate = 0.35 - (agi - 15_000) / 28_000 * 0.15
        cdcc = Math.min(qualExpFinal * rate, totalTaxBeforeCredits - ctc)
    }

    // ── 20. Education Credits (Form 8863) ─────────────────────────────────────
    let aoc = 0
    let llc = 0
    if (d.educationType === "aoc" && d.studentIsFirstFourYears) {
        // Phase-out: $80k-$90k (single), $160k-$180k (MFJ)
        const [aoPhaseS, aoPhaseE] = isMFJ ? [160_000, 180_000] : [80_000, 90_000]
        let aoFactor = 1
        if (agi > aoPhaseE) aoFactor = 0
        else if (agi > aoPhaseS) aoFactor = (aoPhaseE - agi) / (aoPhaseE - aoPhaseS)
        const qualTuition = Math.min(d.educationExpenses || 0, 4_000)
        const aocFull = Math.min(qualTuition, 2_000) + Math.min(Math.max(0, qualTuition - 2_000), 2_000) * 0.25
        aoc = aocFull * aoFactor    // 40% is refundable (handled below)
    } else if (d.educationType === "llc") {
        const [llPhaseS, llPhaseE] = LLC_PHASEOUT[status] ?? [80_000, 90_000]
        if (!isMFS && agi < llPhaseE) {
            let llFactor = 1
            if (agi > llPhaseS) llFactor = (llPhaseE - agi) / (llPhaseE - llPhaseS)
            llc = Math.min((d.educationExpenses || 0) * 0.20, 2_000) * llFactor
        }
    }

    // ── 21. EITC (Earned Income Tax Credit) ───────────────────────────────────
    let eitc = 0
    if (!isMFS) {   // MFS is disqualified
        const children = Math.min(qualChildren, 3)
        const earned = totalWages + netSEIncome
        const agiForEITC = Math.max(earned, agi)   // investment income can disqualify
        const investmentIncomeLimit = 11_600
        const hasExcessInvestment = netInvestmentIncome > investmentIncomeLimit
        if (!hasExcessInvestment && earned > 0) {
            const table = EITC_LIMITS_2024[children]
            const phaseOutEnd = isMFJ ? table.phaseOutEnd + EITC_MFJ_BONUS : table.phaseOutEnd
            if (agiForEITC < phaseOutEnd && earned < phaseOutEnd) {
                // Build-up phase (approximate — IRS uses precise tables)
                const buildUpRate = [0.0765, 0.34, 0.40, 0.45][children]
                const phaseOutRate= [0.0765, 0.1598, 0.2106, 0.2106][children]
                const builtUp = Math.min(earned * buildUpRate, table.maxCredit)
                const phaseOutStart = isMFJ ? table.phaseOutStart + EITC_MFJ_BONUS : table.phaseOutStart
                const phaseOff = Math.max(0, agiForEITC - phaseOutStart) * phaseOutRate
                eitc = Math.max(0, builtUp - phaseOff)
            }
        }
    }

    // ── 22. Retirement Savings Credit (Form 8880) ─────────────────────────────
    let saverCredit = 0
    {
        const saverAgi = agi
        const [s50, s20, s10] = isMFJ
            ? [46_500, 50_750, 76_500]
            : status === "head_of_household"
            ? [34_875, 38_063, 57_375]
            : [23_250, 25_375, 38_250]
        const contribs = (d.retirementContribForSaver || 0)
        const rate = saverAgi <= s50 ? 0.50 : saverAgi <= s20 ? 0.20 : saverAgi <= s10 ? 0.10 : 0
        saverCredit = Math.min(contribs, isMFJ ? 4_000 : 2_000) * rate
    }

    // ── 23. Premium Tax Credit (Form 8962, reconciled) ───────────────────────
    // If user has marketplace insurance, net credit = computed PTC - advance PTC
    const ptc = Math.max(0, (d.premiumTaxCredit || 0) - (d.advancePTC || 0))

    // ── 24. EV Credit (Form 8936) ─────────────────────────────────────────────
    const evCredit = Math.min(d.evCreditAmount || 0, 7_500)

    // ── 25. Residential Clean Energy Credit (Form 5695) — 30% ────────────────
    const energyCredit = (d.solarCreditCost || 0) * 0.30

    // ── 26. Foreign Tax Credit (Form 1116) ────────────────────────────────────
    const foreignTaxCredit = d.foreignTaxPaid || 0

    // ── Sum all non-refundable credits (limited to tax liability) ─────────────
    const taxAfterCTC = Math.max(0, totalTaxBeforeCredits - ctc)
    const taxAfterCDCC = Math.max(0, taxAfterCTC - cdcc)
    const aocNonRefundable = aoc * 0.60    // 60% non-refundable
    const taxAfterAOC = Math.max(0, taxAfterCDCC - aocNonRefundable)
    const taxAfterLLC = Math.max(0, taxAfterAOC - llc)
    const taxAfterSaver = Math.max(0, taxAfterLLC - saverCredit)
    const taxAfterEV = Math.max(0, taxAfterSaver - evCredit)
    const taxAfterEnergy = Math.max(0, taxAfterEV - energyCredit)
    const taxAfterForeign = Math.max(0, taxAfterEnergy - foreignTaxCredit)

    // Refundable credits (reduce amount owed even below zero)
    const aocRefundable = Math.min(aoc * 0.40, 1_000)    // 40% of AOC is refundable, max $1k

    const taxAfterCredits = Math.max(0, taxAfterForeign)
    const totalCredits = totalTaxBeforeCredits - taxAfterCredits

    // ── 27. Payments ──────────────────────────────────────────────────────────
    const totalWithheld =
        (d.w2Withheld1 || 0) +
        (d.hasSecondW2 ? (d.w2Withheld2 || 0) : 0) +
        (d.hasThirdW2  ? (d.w2Withheld3 || 0) : 0)
    const estimatedTaxPaid =
        (d.estimatedTaxQ1 || 0) + (d.estimatedTaxQ2 || 0) +
        (d.estimatedTaxQ3 || 0) + (d.estimatedTaxQ4 || 0)
    const totalPayments = totalWithheld + estimatedTaxPaid

    // ── 28. Final result ──────────────────────────────────────────────────────
    const netTaxDue = taxAfterCredits - actc - aocRefundable - eitc - ptc
    const refundOrOwed = totalPayments - netTaxDue
    const owes = refundOrOwed < 0

    const mRate = marginalRate(taxableIncome, status)
    const effectiveRate = taxableIncome > 0 ? taxAfterCredits / taxableIncome : 0
    const effectiveTotalRate = totalGrossIncome > 0 ? (taxAfterCredits + niit + amt + additionalMedicareTax) / totalGrossIncome : 0

    // ── 29. State taxes ───────────────────────────────────────────────────────
    const stateResult = d.residenceState
        ? calculateStateTax(agi, d.residenceState, status)
        : undefined

    return {
        totalGrossIncome,
        netSEIncome,
        seTax,
        seDeduction,
        agi,
        standardDeduction,
        itemizedDeductions,
        usingItemized,
        deduction,
        qbiDeduction,
        taxableIncome,
        regularTax,
        qualifiedDivLtcgTax,
        amt,
        niit,
        additionalMedicareTax,
        earlyWithdrawalPenalty: withdrawalPenalty,
        totalTaxBeforeCredits,
        ctc,
        actc,
        cdcc,
        aoc,
        llc,
        eitc,
        saverCredit,
        ptc,
        evCredit,
        energyCredit,
        foreignTaxCredit,
        totalCredits,
        totalWithheld,
        estimatedTaxPaid,
        totalPayments,
        taxAfterCredits: Math.max(0, netTaxDue),
        refundOrOwed,
        owes,
        marginalRate: mRate,
        effectiveRate,
        effectiveTotalRate,
        stateResult,
    }
}
