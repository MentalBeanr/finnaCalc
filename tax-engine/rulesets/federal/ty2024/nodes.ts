/**
 * Federal TY2024 node graph (the imperative "rule logic" layer,
 * tax-engine-specification.md §2). Nodes are form-line addressable; formulas are
 * pure functions of their dependencies and the cited parameters.
 *
 * Scope: wages, interest, ordinary/qualified dividends, Social Security,
 * Schedule C self-employment income + SE tax, capital gains/losses (Schedule D),
 * standard vs. itemized deduction (SALT, mortgage interest, charitable, medical),
 * Child Tax Credit, Earned Income Tax Credit, withholding, refund/amount-owed.
 */
import { applyBp, nonNegative } from "@/tax-engine/core/money"
import { bracketTax, marginalRateBp } from "@/tax-engine/core/primitives"
import type { Read, RuleNode } from "@/tax-engine/core/types"
import {
    AOTC_PHASE_OUT,
    AOTC_REFUNDABLE_BP,
    AOTC_TIER1_CAP_CENTS,
    AOTC_TIER2_CAP_CENTS,
    AOTC_TIER2_RATE_BP,
    BRACKETS,
    CAP_LOSS_LIMIT_CENTS,
    CTC_PER_CHILD_CENTS,
    EITC_BANDS,
    EITC_MAX_INVESTMENT_INCOME_CENTS,
    IRA_CONTRIBUTION_CAP_CENTS,
    MEDICAL_FLOOR_BP,
    QDCG_0_PCT_THRESHOLD_CENTS,
    QDCG_15_PCT_THRESHOLD_CENTS,
    SALT_CAP_CENTS,
    SE_AGI_DEDUCTION_BP,
    SE_MEDICARE_RATE_BP,
    SE_NET_EARNINGS_BP,
    SE_SS_RATE_BP,
    SE_SS_WAGE_BASE_CENTS,
    SLI_PHASE_OUT,
    SS_THRESHOLDS_CENTS,
    STANDARD_DEDUCTION_CENTS,
    STATUS,
    STUDENT_LOAN_INTEREST_MAX_CENTS,
    type StatusCode,
} from "./params"

function statusOf(read: Read): StatusCode {
    const code = Math.round(read("in.filingStatus"))
    return (code >= 0 && code <= 4 ? code : STATUS.single) as StatusCode
}

/** Social Security taxability (IRC §86 two-tier formula). */
function taxableSocialSecurity(
    provisional: number,
    ssBenefits: number,
    t: { base: number; additional: number },
): number {
    if (provisional <= t.base) return 0
    const halfSS = applyBp(ssBenefits, 5000)
    if (provisional <= t.additional) {
        return Math.min(applyBp(provisional - t.base, 5000), halfSS)
    }
    const lowerTier = Math.min(applyBp(t.additional - t.base, 5000), halfSS)
    return Math.min(applyBp(ssBenefits, 8500), applyBp(provisional - t.additional, 8500) + lowerTier)
}

/**
 * Qualified Dividends and Capital Gain Tax Worksheet (1040 instructions).
 * Returns the lesser of worksheet tax and regular bracket tax on all taxable income,
 * ensuring preferential income is never taxed above ordinary rates.
 */
function qdcgTax(
    taxableIncome: number,
    ordinaryTaxable: number,
    prefIncome: number,
    status: StatusCode,
): number {
    const t0 = QDCG_0_PCT_THRESHOLD_CENTS[status]
    const t15 = QDCG_15_PCT_THRESHOLD_CENTS[status]

    const roomAt0 = nonNegative(t0 - ordinaryTaxable)
    const at0 = Math.min(prefIncome, roomAt0)

    const roomAt15 = nonNegative(t15 - ordinaryTaxable - at0)
    const at15 = Math.min(nonNegative(prefIncome - at0), roomAt15)

    const at20 = nonNegative(prefIncome - at0 - at15)

    const ordTax = bracketTax(ordinaryTaxable, BRACKETS[status])
    const prefTax = applyBp(at15, 1500) + applyBp(at20, 2000)
    const regularTax = bracketTax(taxableIncome, BRACKETS[status])

    return Math.min(ordTax + prefTax, regularTax)
}

/**
 * Earned Income Tax Credit computation (IRC §32).
 * Returns $0 if MFS, if investment income exceeds the limit, or if the
 * phase-out eliminates the credit.
 */
function computeEitc(
    status: StatusCode,
    earnedIncome: number,
    agi: number,
    investmentIncome: number,
    numChildren: number,
): number {
    if (status === STATUS.mfs) return 0
    if (investmentIncome > EITC_MAX_INVESTMENT_INCOME_CENTS) return 0

    const childIdx = Math.min(Math.max(0, Math.round(numChildren)), 3)
    const band = EITC_BANDS[childIdx]

    const phaseIn = Math.min(band.maxCreditCents, applyBp(nonNegative(earnedIncome), band.phaseInBp))

    const phaseOutBase = Math.max(agi, earnedIncome)
    const phaseOutStart =
        status === STATUS.mfj ? band.phaseOutStartMfjCents : band.phaseOutStartSingleCents
    const phaseOut = applyBp(nonNegative(phaseOutBase - phaseOutStart), band.phaseOutBp)

    return nonNegative(phaseIn - phaseOut)
}

const input = (id: string, dataType: RuleNode["dataType"], citation: string): RuleNode => ({
    id,
    kind: "input",
    dataType,
    dependsOn: [],
    citation,
})

const computed = (
    id: string,
    dataType: RuleNode["dataType"],
    dependsOn: string[],
    formula: (read: Read) => number,
    citation: string,
): RuleNode => ({ id, kind: "computed", dataType, dependsOn, formula, citation })

export const FEDERAL_TY2024_NODES: RuleNode[] = [
    // ── Inputs ────────────────────────────────────────────────────────────────
    input("in.filingStatus", "count", "Filing status (0=single,1=mfj,2=mfs,3=hoh,4=qss)"),
    input("F1040.L1a", "money", "Form 1040 line 1a — wages"),
    input("F1040.L2b", "money", "Form 1040 line 2b — taxable interest"),
    input("F1040.L6a", "money", "Form 1040 line 6a — Social Security benefits"),
    input("in.iraContribution", "money", "Deductible IRA contribution"),
    input("in.numChildren", "count", "Qualifying children under 17"),
    input("in.withholding", "money", "Federal income tax withheld"),

    // Schedule C / self-employment
    input("in.schedCNet", "money", "Schedule C net profit (1099-NEC / self-employment)"),

    // Capital gains (Schedule D)
    input("in.shortTermGain", "money", "Net short-term capital gain or loss (Schedule D line 7)"),
    input("in.longTermGain", "money", "Net long-term capital gain or loss (Schedule D line 15)"),

    // Dividends (1099-DIV)
    input("in.ordinaryDivs", "money", "Form 1040 line 3b — ordinary dividends (1099-DIV box 1a)"),
    input("in.qualifiedDivs", "money", "Form 1040 line 3a — qualified dividends (1099-DIV box 1b)"),

    // Itemized deductions
    input("in.mortgageInt", "money", "Mortgage interest paid (Form 1098 box 1), Schedule A line 8a"),
    input("in.saltPaid", "money", "State and local taxes paid (Schedule A line 5d — before SALT cap)"),
    input("in.charitableContr", "money", "Charitable contributions (Schedule A line 16)"),
    input("in.medicalExpenses", "money", "Total medical expenses (Schedule A line 1 — before AGI floor)"),

    // Education — above-the-line deduction + AOTC credit
    input("in.studentLoanInterest", "money", "Student loan interest paid (Form 1098-E), Schedule 1 line 21"),
    input("in.qualifiedEdExp", "money", "Qualified education expenses for AOTC (Form 8863)"),
    input("in.numStudents", "count", "Number of eligible students for AOTC (Form 8863)"),

    // ── Dividends ─────────────────────────────────────────────────────────────
    computed(
        "F1040.L3b",
        "money",
        ["in.ordinaryDivs"],
        (r) => r("in.ordinaryDivs"),
        "Form 1040 line 3b — ordinary dividends",
    ),
    computed(
        "F1040.L3a",
        "money",
        ["in.qualifiedDivs", "in.ordinaryDivs"],
        (r) => Math.min(r("in.qualifiedDivs"), r("in.ordinaryDivs")),
        "Form 1040 line 3a — qualified dividends (clamped to ordinary divs)",
    ),

    // ── Schedule D (capital gains/losses) ────────────────────────────────────
    computed(
        "F1040.L7",
        "money",
        ["in.filingStatus", "in.shortTermGain", "in.longTermGain"],
        (r) => {
            const net = r("in.shortTermGain") + r("in.longTermGain")
            // Net losses are deductible up to the annual limit; excess carries over.
            if (net < 0) return Math.max(-CAP_LOSS_LIMIT_CENTS[statusOf(r)], net)
            return net
        },
        "Form 1040 line 7 — capital gain or loss (Schedule D; net loss limited to $3k)",
    ),

    // ── Schedule C / Schedule SE ──────────────────────────────────────────────
    computed(
        "SchedSE.L3",
        "money",
        ["in.schedCNet"],
        (r) => nonNegative(applyBp(r("in.schedCNet"), SE_NET_EARNINGS_BP)),
        "Schedule SE line 3 — net earnings from self-employment (92.35% of Schedule C profit)",
    ),
    computed(
        "SchedSE.L10",
        "money",
        ["SchedSE.L3"],
        (r) => {
            const netEarnings = r("SchedSE.L3")
            if (netEarnings <= 0) return 0
            // SS portion applies only up to the wage base; Medicare applies to all.
            const ssBase = Math.min(netEarnings, SE_SS_WAGE_BASE_CENTS)
            return applyBp(ssBase, SE_SS_RATE_BP) + applyBp(netEarnings, SE_MEDICARE_RATE_BP)
        },
        "Schedule SE line 10 — self-employment tax (12.4% SS + 2.9% Medicare)",
    ),
    computed(
        "Sch1.L15",
        "money",
        ["SchedSE.L10"],
        (r) => applyBp(r("SchedSE.L10"), SE_AGI_DEDUCTION_BP),
        "Schedule 1 line 15 — deductible part of self-employment tax (50% of SE tax, IRC §164(f))",
    ),

    // ── Social Security taxability ─────────────────────────────────────────────
    computed(
        "WS.provisionalIncome",
        "money",
        ["F1040.L1a", "F1040.L2b", "F1040.L3b", "in.schedCNet", "F1040.L7", "F1040.L6a"],
        (r) =>
            r("F1040.L1a") +
            r("F1040.L2b") +
            r("F1040.L3b") +
            r("in.schedCNet") +
            // Only gains increase provisional income (losses don't reduce it for SS purposes).
            nonNegative(r("F1040.L7")) +
            applyBp(r("F1040.L6a"), 5000),
        "Social Security Benefits Worksheet — provisional income (all income + 50% SS)",
    ),
    computed(
        "F1040.L6b",
        "money",
        ["in.filingStatus", "WS.provisionalIncome", "F1040.L6a"],
        (r) =>
            taxableSocialSecurity(
                r("WS.provisionalIncome"),
                r("F1040.L6a"),
                SS_THRESHOLDS_CENTS[statusOf(r)],
            ),
        "Form 1040 line 6b — taxable Social Security",
    ),

    // ── Schedule 1 above-the-line adjustments ─────────────────────────────────
    computed(
        "Sch1.L20",
        "money",
        ["in.iraContribution"],
        (r) => Math.min(r("in.iraContribution"), IRA_CONTRIBUTION_CAP_CENTS),
        "Schedule 1 line 20 — IRA deduction (capped at $7,000 for 2024)",
    ),

    // Student loan interest deduction (IRC §221) — phases out based on AGI,
    // creating a circular dependency with F1040.L11 that the fixed-point solver resolves.
    computed(
        "Sch1.L21",
        "money",
        ["in.filingStatus", "in.studentLoanInterest", "F1040.L11"],
        (r) => {
            const raw = r("in.studentLoanInterest")
            if (raw <= 0) return 0
            const range = SLI_PHASE_OUT[statusOf(r)]
            if (!range) return 0
            const capped = Math.min(raw, STUDENT_LOAN_INTEREST_MAX_CENTS)
            const agi = r("F1040.L11")
            if (agi >= range.end) return 0
            if (agi <= range.start) return capped
            return Math.round(capped * (range.end - agi) / (range.end - range.start))
        },
        "Schedule 1 line 21 — student loan interest deduction (IRC §221; phases out $75k-$90k single, $155k-$185k MFJ)",
    ),

    // ── AGI (Form 1040 line 11) ────────────────────────────────────────────────
    computed(
        "F1040.L11",
        "money",
        [
            "F1040.L1a",
            "F1040.L2b",
            "F1040.L3b",
            "F1040.L6b",
            "F1040.L7",
            "in.schedCNet",
            "Sch1.L15",
            "Sch1.L20",
            "Sch1.L21",
        ],
        (r) =>
            r("F1040.L1a") +
            r("F1040.L2b") +
            r("F1040.L3b") +
            r("F1040.L6b") +
            r("F1040.L7") +
            r("in.schedCNet") -
            r("Sch1.L15") -
            r("Sch1.L20") -
            r("Sch1.L21"),
        "Form 1040 line 11 — adjusted gross income",
    ),

    // ── Itemized deductions (Schedule A) ──────────────────────────────────────
    computed(
        "WS.saltDeduction",
        "money",
        ["in.filingStatus", "in.saltPaid"],
        (r) => Math.min(r("in.saltPaid"), SALT_CAP_CENTS[statusOf(r)]),
        "Schedule A — SALT deduction (capped at $10k/$5k MFS, TCJA §164(b)(6))",
    ),
    computed(
        "WS.medicalDeduction",
        "money",
        ["F1040.L11", "in.medicalExpenses"],
        (r) => nonNegative(r("in.medicalExpenses") - applyBp(r("F1040.L11"), MEDICAL_FLOOR_BP)),
        "Schedule A — deductible medical expenses above 7.5% AGI floor (IRC §213(a))",
    ),
    computed(
        "WS.totalItemized",
        "money",
        ["WS.saltDeduction", "in.mortgageInt", "in.charitableContr", "WS.medicalDeduction"],
        (r) =>
            r("WS.saltDeduction") +
            r("in.mortgageInt") +
            r("in.charitableContr") +
            r("WS.medicalDeduction"),
        "Schedule A line 17 — total itemized deductions",
    ),

    // ── Deduction (standard or itemized) ──────────────────────────────────────
    computed(
        "F1040.L12",
        "money",
        ["in.filingStatus", "WS.totalItemized"],
        (r) => Math.max(STANDARD_DEDUCTION_CENTS[statusOf(r)], r("WS.totalItemized")),
        "Form 1040 line 12 — greater of standard deduction or itemized deductions",
    ),
    computed(
        "WS.usingItemized",
        "boolean",
        ["in.filingStatus", "WS.totalItemized"],
        (r) => (r("WS.totalItemized") > STANDARD_DEDUCTION_CENTS[statusOf(r)] ? 1 : 0),
        "Worksheet — 1 if itemized exceeds standard deduction",
    ),

    // ── Taxable income ─────────────────────────────────────────────────────────
    computed(
        "F1040.L15",
        "money",
        ["F1040.L11", "F1040.L12"],
        (r) => nonNegative(r("F1040.L11") - r("F1040.L12")),
        "Form 1040 line 15 — taxable income",
    ),

    // ── QDCG worksheet — preferential income ──────────────────────────────────
    computed(
        "WS.prefIncome",
        "money",
        ["F1040.L3a", "in.longTermGain"],
        // Qualified divs + net LTCG (only positive LTCG earns the preferential rate).
        (r) => nonNegative(r("F1040.L3a") + nonNegative(r("in.longTermGain"))),
        "QDCG Worksheet — preferential income (qualified dividends + net long-term capital gain)",
    ),

    // ── Income tax (Form 1040 line 16) ────────────────────────────────────────
    computed(
        "F1040.L16",
        "money",
        ["in.filingStatus", "F1040.L15", "WS.prefIncome"],
        (r) => {
            const ti = r("F1040.L15")
            const pref = r("WS.prefIncome")
            if (pref <= 0) return bracketTax(ti, BRACKETS[statusOf(r)])
            const ordinary = nonNegative(ti - pref)
            return qdcgTax(ti, ordinary, pref, statusOf(r))
        },
        "Form 1040 line 16 — income tax (QDCG worksheet when qualified divs / LTCG present)",
    ),
    computed(
        "WS.marginalRateBp",
        "rate_bp",
        ["in.filingStatus", "F1040.L15"],
        (r) => marginalRateBp(r("F1040.L15"), BRACKETS[statusOf(r)]),
        "Marginal ordinary-income rate (basis points)",
    ),

    // ── Non-refundable credits ─────────────────────────────────────────────────
    computed(
        "F1040.L19",
        "money",
        ["in.numChildren"],
        (r) => Math.max(0, Math.round(r("in.numChildren"))) * CTC_PER_CHILD_CENTS,
        "Form 1040 line 19 — Child Tax Credit (simplified; $2,000 per qualifying child)",
    ),

    // AOTC raw (before phase-out): 100% of first $2k + 25% of next $2k, per eligible student.
    computed(
        "WS.aotcRaw",
        "money",
        ["in.qualifiedEdExp", "in.numStudents"],
        (r) => {
            const expenses = r("in.qualifiedEdExp")
            const n = Math.max(1, Math.round(r("in.numStudents")))
            if (expenses <= 0) return 0
            const tier1Cap = AOTC_TIER1_CAP_CENTS * n
            const tier2Cap = AOTC_TIER2_CAP_CENTS * n
            const tier1 = Math.min(expenses, tier1Cap)
            const tier2 = Math.min(nonNegative(expenses - tier1Cap), tier2Cap)
            return tier1 + applyBp(tier2, AOTC_TIER2_RATE_BP)
        },
        "Form 8863 — AOTC raw credit (100% of first $2k + 25% of next $2k per student, IRC §25A(b))",
    ),
    // AOTC after AGI phase-out. MFS not eligible.
    computed(
        "WS.aotcCredit",
        "money",
        ["in.filingStatus", "WS.aotcRaw", "F1040.L11"],
        (r) => {
            const raw = r("WS.aotcRaw")
            if (raw <= 0) return 0
            const range = AOTC_PHASE_OUT[statusOf(r)]
            if (!range) return 0
            const agi = r("F1040.L11")
            if (agi >= range.end) return 0
            if (agi <= range.start) return raw
            return Math.round(raw * (range.end - agi) / (range.end - range.start))
        },
        "Form 8863 — AOTC after AGI phase-out ($80k-$90k single, $160k-$180k MFJ)",
    ),
    // Non-refundable 60% of AOTC (reduces tax at line 22).
    computed(
        "F1040.L28",
        "money",
        ["WS.aotcCredit"],
        (r) => applyBp(r("WS.aotcCredit"), 6_000),
        "Form 1040 line 28 — non-refundable AOTC (60% of credit, IRC §25A(i))",
    ),
    computed(
        "F1040.L22",
        "money",
        ["F1040.L16", "F1040.L19", "F1040.L28"],
        (r) => nonNegative(r("F1040.L16") - r("F1040.L19") - r("F1040.L28")),
        "Form 1040 line 22 — tax after non-refundable credits (CTC + AOTC non-refundable)",
    ),

    // ── Refundable credits (EITC, AOTC refundable) ────────────────────────────
    computed(
        "WS.eitcEarnedIncome",
        "money",
        ["F1040.L1a", "in.schedCNet"],
        // Earned income = wages + Schedule C net (losses reduce earned income, floored at $0 for phase-in).
        (r) => r("F1040.L1a") + r("in.schedCNet"),
        "EITC Worksheet — earned income (wages + self-employment)",
    ),
    computed(
        "WS.eitcInvestmentIncome",
        "money",
        ["F1040.L2b", "F1040.L3b", "in.longTermGain", "in.shortTermGain"],
        (r) =>
            r("F1040.L2b") +
            r("F1040.L3b") +
            nonNegative(r("in.longTermGain")) +
            nonNegative(r("in.shortTermGain")),
        "EITC Worksheet — investment income (interest + dividends + capital gains)",
    ),
    computed(
        "F1040.L27a",
        "money",
        [
            "in.filingStatus",
            "WS.eitcEarnedIncome",
            "F1040.L11",
            "WS.eitcInvestmentIncome",
            "in.numChildren",
        ],
        (r) =>
            computeEitc(
                statusOf(r),
                r("WS.eitcEarnedIncome"),
                r("F1040.L11"),
                r("WS.eitcInvestmentIncome"),
                r("in.numChildren"),
            ),
        "Form 1040 line 27a — Earned Income Credit (IRC §32)",
    ),

    // Refundable 40% of AOTC (treated as a payment like EITC).
    computed(
        "F1040.L29",
        "money",
        ["WS.aotcCredit"],
        (r) => applyBp(r("WS.aotcCredit"), AOTC_REFUNDABLE_BP),
        "Form 1040 line 29 — refundable AOTC (40% of credit, IRC §25A(i))",
    ),

    // ── Total payments (withholding + refundable credits) ─────────────────────
    computed(
        "F1040.L33",
        "money",
        ["in.withholding", "F1040.L27a", "F1040.L29"],
        (r) => r("in.withholding") + r("F1040.L27a") + r("F1040.L29"),
        "Form 1040 line 33 — total payments (withholding + EITC + refundable AOTC)",
    ),

    // ── Refund / amount owed ───────────────────────────────────────────────────
    computed(
        "F1040.L34",
        "money",
        ["F1040.L33", "F1040.L22"],
        (r) => nonNegative(r("F1040.L33") - r("F1040.L22")),
        "Form 1040 line 34 — overpayment (refund)",
    ),
    computed(
        "F1040.L37",
        "money",
        ["F1040.L22", "F1040.L33"],
        (r) => nonNegative(r("F1040.L22") - r("F1040.L33")),
        "Form 1040 line 37 — amount you owe",
    ),
]
