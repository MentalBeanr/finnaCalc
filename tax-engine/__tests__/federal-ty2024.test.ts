import { describe, it, expect } from "vitest"
import { computeFederalReturn } from "@/tax-engine/federal"

const C = (d: number) => d * 100

describe("federal TY2024 — golden fixtures", () => {
    // ── Original fixtures (unchanged) ─────────────────────────────────────────

    it("single, $80k wages, $9k withheld → owes $441", () => {
        const r = computeFederalReturn({
            filingStatus: "single",
            wagesCents: C(80_000),
            withholdingCents: C(9_000),
        })
        expect(r.converged).toBe(true)
        expect(r.agiCents).toBe(C(80_000))
        expect(r.deductionCents).toBe(C(14_600))
        expect(r.taxableIncomeCents).toBe(C(65_400))
        expect(r.taxBeforeCreditsCents).toBe(C(9_441))
        expect(r.creditsCents).toBe(0)
        expect(r.taxAfterCreditsCents).toBe(C(9_441))
        expect(r.refundOrDueCents).toBe(-C(441))
        expect(r.marginalRateBp).toBe(2200)
        // No SE, no EITC when only wages present.
        expect(r.selfEmploymentTaxCents).toBe(0)
        expect(r.earnedIncomeCreditCents).toBe(0)
        expect(r.usingItemizedDeduction).toBe(false)
    })

    it("MFJ, $120k wages, 2 children, $12k withheld → refund $5,568", () => {
        const r = computeFederalReturn({
            filingStatus: "mfj",
            wagesCents: C(120_000),
            numChildren: 2,
            withholdingCents: C(12_000),
        })
        expect(r.agiCents).toBe(C(120_000))
        expect(r.deductionCents).toBe(C(29_200))
        expect(r.taxableIncomeCents).toBe(C(90_800))
        expect(r.taxBeforeCreditsCents).toBe(C(10_432))
        expect(r.creditsCents).toBe(C(4_000))
        expect(r.taxAfterCreditsCents).toBe(C(6_432))
        expect(r.refundOrDueCents).toBe(C(5_568))
        expect(r.marginalRateBp).toBe(1200)
    })

    it("single, $20k wages + $20k Social Security → $2,500 of SS is taxable", () => {
        const r = computeFederalReturn({
            filingStatus: "single",
            wagesCents: C(20_000),
            socialSecurityCents: C(20_000),
        })
        expect(r.taxableSocialSecurityCents).toBe(C(2_500))
        expect(r.agiCents).toBe(C(22_500))
        expect(r.taxableIncomeCents).toBe(C(7_900))
        expect(r.taxBeforeCreditsCents).toBe(C(790))
        expect(r.refundOrDueCents).toBe(-C(790))
    })

    it("exposes form-line values and a non-empty trace", () => {
        const r = computeFederalReturn({ filingStatus: "single", wagesCents: C(50_000) })
        expect(r.formLineValues["F1040.L16"]).toBe(r.taxBeforeCreditsCents)
        expect(r.formLineValues["F1040.L11"]).toBe(r.agiCents)
        expect(r.trace.length).toBeGreaterThan(0)
        expect(r.iterations).toBeLessThanOrEqual(3)
    })

    // ── Schedule C / self-employment tax ──────────────────────────────────────

    it("single, $50k wages + $30k Schedule C net profit → correct SE tax and AGI deduction", () => {
        // SE net earnings = applyBp(C(30_000), 9235) = $27,705.00
        // SE tax = applyBp(L3, 1240) + applyBp(L3, 290) = $3,435.42 + $803.45 = $4,238.87 → 423887 cents
        // SE deduction = applyBp(423887, 5000) = 211944 cents
        // AGI = C(50_000) + C(30_000) − 211944 = 7,788,056 cents = $77,880.56
        const r = computeFederalReturn({
            filingStatus: "single",
            wagesCents: C(50_000),
            schedCNetProfitCents: C(30_000),
        })
        expect(r.selfEmploymentTaxCents).toBe(423887)
        expect(r.agiCents).toBe(7_788_056)
        expect(r.usingItemizedDeduction).toBe(false)
        expect(r.converged).toBe(true)
    })

    it("self-employment only: $40k 1099-NEC, no wages → SE tax applies", () => {
        // SE net earnings = applyBp(C(40_000), 9235) = 3,694,000 cents
        // SE tax = applyBp(3694000, 1240) + applyBp(3694000, 290) = 458056 + 107126 = 565182 cents
        // SE deduction = applyBp(565182, 5000) = 282591 cents
        // AGI = C(40_000) − 282591 = 3,717,409 cents
        const r = computeFederalReturn({
            filingStatus: "single",
            wagesCents: 0,
            schedCNetProfitCents: C(40_000),
        })
        expect(r.selfEmploymentTaxCents).toBe(565182)
        expect(r.agiCents).toBe(3_717_409)
    })

    // ── Itemized deductions ────────────────────────────────────────────────────

    it("single homeowner: $12k mortgage interest + $8k SALT → itemized beats standard", () => {
        // Itemized = $12,000 + min($8,000, $10,000) = $20,000 > $14,600 standard
        const r = computeFederalReturn({
            filingStatus: "single",
            wagesCents: C(100_000),
            mortgageInterestCents: C(12_000),
            saltPaidCents: C(8_000),
        })
        expect(r.usingItemizedDeduction).toBe(true)
        expect(r.deductionCents).toBe(C(20_000))
        expect(r.taxableIncomeCents).toBe(C(80_000))
    })

    it("SALT cap: $15k SALT paid is capped at $10k", () => {
        const r = computeFederalReturn({
            filingStatus: "single",
            wagesCents: C(100_000),
            saltPaidCents: C(15_000),
        })
        // Itemized = $10,000 (capped) < $14,600 standard → use standard
        expect(r.usingItemizedDeduction).toBe(false)
        expect(r.deductionCents).toBe(C(14_600))
    })

    it("MFS: SALT cap is $5,000", () => {
        const r = computeFederalReturn({
            filingStatus: "mfs",
            wagesCents: C(80_000),
            saltPaidCents: C(10_000),
            mortgageInterestCents: C(5_000),
        })
        // Itemized = min($10,000, $5,000) + $5,000 = $10,000 < $14,600 standard
        expect(r.usingItemizedDeduction).toBe(false)
    })

    // ── Capital gains / Schedule D ─────────────────────────────────────────────

    it("long-term capital gain taxed at 0% for low-income single filer", () => {
        // Single: 0% LTCG threshold = $47,025
        // Wages $20k + LTCG $15k = taxable income $20,400 (after standard deduction)
        // All LTCG fits within the 0% band → LTCG tax = $0, only ordinary on $5,400
        const r = computeFederalReturn({
            filingStatus: "single",
            wagesCents: C(20_000),
            longTermGainCents: C(15_000),
        })
        expect(r.agiCents).toBe(C(35_000))
        expect(r.taxableIncomeCents).toBe(C(35_000) - C(14_600)) // $20,400
        // Ordinary taxable income = $20,400 - $15,000 LTCG = $5,400 → bracket tax
        // Tax on $5,400 at 10% = $540 → 54,000 cents
        expect(r.taxBeforeCreditsCents).toBe(54_000)
    })

    it("capital loss limited to $3,000 for single filer", () => {
        // Net loss = $8,000 short-term + $0 = −$8,000 → capped at −$3,000
        const r = computeFederalReturn({
            filingStatus: "single",
            wagesCents: C(60_000),
            shortTermGainCents: -C(8_000),
        })
        // AGI = $60,000 + (−$3,000) = $57,000
        expect(r.agiCents).toBe(C(57_000))
    })

    it("qualified dividends taxed at 0% for low-income single filer", () => {
        const r = computeFederalReturn({
            filingStatus: "single",
            wagesCents: C(30_000),
            ordinaryDividendsCents: C(5_000),
            qualifiedDividendsCents: C(5_000),
        })
        // AGI = $35,000; taxable = $20,400 after $14,600 standard deduction
        // Ordinary = $20,400 - $5,000 qualified = $15,400 taxed at ordinary rates
        // Qualified $5,000 fits within 0% band ($47,025 threshold)
        // Tax on $15,400 at 10% up to $11,600 = $1,160; 12% on $3,800 = $456 → $1,616
        expect(r.agiCents).toBe(C(35_000))
        expect(r.taxableIncomeCents).toBe(C(20_400))
        // Qualified divs taxed at 0% so tax < all-ordinary bracket tax
        const allOrdinaryTax = computeFederalReturn({
            filingStatus: "single",
            wagesCents: C(35_000),
        }).taxBeforeCreditsCents
        expect(r.taxBeforeCreditsCents).toBeLessThan(allOrdinaryTax)
    })

    // ── Earned Income Tax Credit ───────────────────────────────────────────────

    it("EITC: single, $20k earned income, 1 child → receives EITC", () => {
        // Phase-in: 34% × $20,000 = $6,800 > max $4,213 → capped at $4,213
        // Phase-out start (single, 1 child): $23,083 → earned income is below, no phase-out
        // Credit = $4,213
        const r = computeFederalReturn({
            filingStatus: "single",
            wagesCents: C(20_000),
            numChildren: 1,
            withholdingCents: C(1_500),
        })
        expect(r.earnedIncomeCreditCents).toBe(C(4_213))
        // EITC is refundable — adds to total payments
        expect(r.withholdingCents).toBe(C(1_500) + C(4_213))
    })

    it("EITC: MFS filer receives no EITC", () => {
        const r = computeFederalReturn({
            filingStatus: "mfs",
            wagesCents: C(20_000),
            numChildren: 1,
        })
        expect(r.earnedIncomeCreditCents).toBe(0)
    })

    it("EITC: high investment income disqualifies the credit", () => {
        const r = computeFederalReturn({
            filingStatus: "single",
            wagesCents: C(20_000),
            numChildren: 1,
            ordinaryDividendsCents: C(12_000), // exceeds $11,600 investment income limit
        })
        expect(r.earnedIncomeCreditCents).toBe(0)
    })

    it("EITC: 0 children, single, $8,000 earned income → partial credit", () => {
        // Phase-in: applyBp(C(8_000), 765) = $612.00 → 61,200 cents < max C(632)=63,200 cents
        const r = computeFederalReturn({
            filingStatus: "single",
            wagesCents: C(8_000),
            numChildren: 0,
        })
        expect(r.earnedIncomeCreditCents).toBe(61_200)
    })

    it("EITC phases out: single, 1 child, $40k wages → credit reduced to $0", () => {
        // AGI = $40,000 > phase-out end $49,084 for single 1 child → some credit remaining
        // But $40k > phase-out start $23,083 → partially phased out
        // Phase-out: ($40,000 − $23,083) × 15.98% = $16,917 × 15.98% = $2,703
        // Credit = $4,213 − $2,703 = $1,510
        const r = computeFederalReturn({
            filingStatus: "single",
            wagesCents: C(40_000),
            numChildren: 1,
        })
        expect(r.earnedIncomeCreditCents).toBeGreaterThan(0)
        expect(r.earnedIncomeCreditCents).toBeLessThan(C(4_213))
    })

    // ── Combined scenarios ─────────────────────────────────────────────────────

    it("freelancer + homeowner: Schedule C + mortgage + SALT → itemized + SE tax", () => {
        const r = computeFederalReturn({
            filingStatus: "single",
            wagesCents: 0,
            schedCNetProfitCents: C(80_000),
            mortgageInterestCents: C(15_000),
            saltPaidCents: C(10_000),
            withholdingCents: C(15_000),
        })
        expect(r.selfEmploymentTaxCents).toBeGreaterThan(0)
        expect(r.usingItemizedDeduction).toBe(true)
        // Itemized = $15,000 + $10,000 (SALT capped) = $25,000 > $14,600 standard
        expect(r.deductionCents).toBe(C(25_000))
        expect(r.converged).toBe(true)
    })

    // ── Student Loan Interest Deduction ────────────────────────────────────────

    it("SLI: single, $60k wages, $2,000 interest paid → full deduction (below phase-out)", () => {
        // AGI threshold start = $75,000 — below it so full $2,000 is deductible.
        const r = computeFederalReturn({
            filingStatus: "single",
            wagesCents: C(60_000),
            studentLoanInterestCents: C(2_000),
        })
        expect(r.studentLoanInterestDeductionCents).toBe(C(2_000))
        expect(r.agiCents).toBe(C(58_000))
        expect(r.converged).toBe(true)
    })

    it("SLI: single, $80k wages, $2,500 interest → partially phased out", () => {
        // AGI (before SLI deduction) ≈ $80k; phase-out range $75k–$90k, width $15k.
        // Solve iteratively:
        //   iter 0: agi=0 → sli=2500; iter 1: agi=80k-2500=$77,500 → fraction=(90k-77.5k)/15k=0.8333 → sli=2083
        //   iter 2: agi=80k-2083=$77,917 → fraction=(90k-77.917k)/15k=0.8056 → sli=2014
        //   converges to ~$2,019 ± rounding
        const r = computeFederalReturn({
            filingStatus: "single",
            wagesCents: C(80_000),
            studentLoanInterestCents: C(2_500),
        })
        expect(r.studentLoanInterestDeductionCents).toBeGreaterThan(0)
        expect(r.studentLoanInterestDeductionCents).toBeLessThan(C(2_500))
        expect(r.agiCents).toBeLessThan(C(80_000))
        expect(r.converged).toBe(true)
    })

    it("SLI: MFS filer receives no student loan interest deduction", () => {
        const r = computeFederalReturn({
            filingStatus: "mfs",
            wagesCents: C(40_000),
            studentLoanInterestCents: C(2_500),
        })
        expect(r.studentLoanInterestDeductionCents).toBe(0)
        expect(r.agiCents).toBe(C(40_000))
    })

    it("SLI: $3,000 paid is capped at $2,500", () => {
        const r = computeFederalReturn({
            filingStatus: "single",
            wagesCents: C(50_000),
            studentLoanInterestCents: C(3_000),
        })
        expect(r.studentLoanInterestDeductionCents).toBe(C(2_500))
        expect(r.agiCents).toBe(C(47_500))
    })

    // ── American Opportunity Tax Credit (AOTC) ─────────────────────────────────

    it("AOTC: 1 student, $4,000 expenses → max $2,500 credit", () => {
        // 100% × $2,000 + 25% × $2,000 = $2,500; AGI $50k < $80k threshold → no phase-out.
        // Non-refundable: 60% × $2,500 = $1,500; Refundable: 40% × $2,500 = $1,000.
        const r = computeFederalReturn({
            filingStatus: "single",
            wagesCents: C(50_000),
            qualifiedEducationExpensesCents: C(4_000),
            numEligibleStudents: 1,
        })
        expect(r.aotcCreditCents).toBe(C(2_500))
        expect(r.aotcRefundableCents).toBe(C(1_000))
        // Non-refundable reduces tax; refundable added to payments.
        expect(r.converged).toBe(true)
    })

    it("AOTC: 1 student, $2,000 expenses → $2,000 credit (tier 1 only)", () => {
        // 100% × $2,000 = $2,000; tier 2 is $0.
        const r = computeFederalReturn({
            filingStatus: "single",
            wagesCents: C(50_000),
            qualifiedEducationExpensesCents: C(2_000),
            numEligibleStudents: 1,
        })
        expect(r.aotcCreditCents).toBe(C(2_000))
        expect(r.aotcRefundableCents).toBe(C(800)) // 40% × $2,000
    })

    it("AOTC: 2 students, $8,000 total expenses → $5,000 credit", () => {
        // Per-student cap ×2: tier1Cap=$4k, tier2Cap=$4k.
        // tier1=min($8k,$4k)=$4k; tier2=min($4k,$4k)=$4k; credit=$4k + 25%×$4k=$5k.
        const r = computeFederalReturn({
            filingStatus: "mfj",
            wagesCents: C(100_000),
            qualifiedEducationExpensesCents: C(8_000),
            numEligibleStudents: 2,
        })
        expect(r.aotcCreditCents).toBe(C(5_000))
        expect(r.aotcRefundableCents).toBe(C(2_000)) // 40% × $5,000
    })

    it("AOTC: phased out for high-income single filer ($88k AGI)", () => {
        // Phase-out: $80k–$90k. At $88k: fraction = (90k−88k)/10k = 20%.
        // Raw credit (1 student, $4k expenses) = $2,500.
        // After phase-out: $2,500 × 20% = $500.
        const r = computeFederalReturn({
            filingStatus: "single",
            wagesCents: C(88_000),
            qualifiedEducationExpensesCents: C(4_000),
            numEligibleStudents: 1,
        })
        expect(r.aotcCreditCents).toBe(C(500))
        expect(r.aotcRefundableCents).toBe(C(200)) // 40% × $500
    })

    it("AOTC: MFS filer receives no AOTC", () => {
        const r = computeFederalReturn({
            filingStatus: "mfs",
            wagesCents: C(40_000),
            qualifiedEducationExpensesCents: C(4_000),
            numEligibleStudents: 1,
        })
        expect(r.aotcCreditCents).toBe(0)
        expect(r.aotcRefundableCents).toBe(0)
    })

    it("AOTC: fully phased out above $90k single → $0 credit", () => {
        const r = computeFederalReturn({
            filingStatus: "single",
            wagesCents: C(95_000),
            qualifiedEducationExpensesCents: C(4_000),
            numEligibleStudents: 1,
        })
        expect(r.aotcCreditCents).toBe(0)
    })

    // ── Child & Dependent Care Credit (Form 2441) ──────────────────────────────

    it("CDCC: 1 qualifying person, $3k expenses, AGI $50k → 20% rate → $600 credit", () => {
        // AGI $50k > $43k → rate is 20% (floor). Credit = 20% × min($3k, $3k cap) = $600.
        const r = computeFederalReturn({
            filingStatus: "single",
            wagesCents: C(50_000),
            dependentCareExpensesCents: C(3_000),
            numDependentCarePersons: 1,
        })
        expect(r.cdccCreditCents).toBe(C(600))
        expect(r.converged).toBe(true)
    })

    it("CDCC: 1 qualifying person, $5k expenses, AGI $50k → capped at $3k → $600 credit", () => {
        // Expenses > $3k one-person cap; capped. Rate 20%. Credit = $600.
        const r = computeFederalReturn({
            filingStatus: "single",
            wagesCents: C(50_000),
            dependentCareExpensesCents: C(5_000),
            numDependentCarePersons: 1,
        })
        expect(r.cdccCreditCents).toBe(C(600))
    })

    it("CDCC: 2 qualifying persons, $6k expenses, AGI $20k → 32% rate → $1,920 credit", () => {
        // AGI $20k: bracket [$19k, $21k) → rate 32%. Two-person cap $6k. 32% × $6k = $1,920.
        const r = computeFederalReturn({
            filingStatus: "mfj",
            wagesCents: C(20_000),
            dependentCareExpensesCents: C(6_000),
            numDependentCarePersons: 2,
        })
        expect(r.cdccCreditCents).toBe(C(1_920))
    })

    it("CDCC: low AGI ($10k) → max rate 35% → $2,100 credit (2 persons, $6k cap)", () => {
        // AGI $10k < $15k → rate 35% (floor of table). Credit = 35% × $6k = $2,100.
        const r = computeFederalReturn({
            filingStatus: "mfj",
            wagesCents: C(10_000),
            dependentCareExpensesCents: C(6_000),
            numDependentCarePersons: 2,
        })
        expect(r.cdccCreditCents).toBe(C(2_100))
    })

    it("CDCC: MFS filer receives no credit", () => {
        const r = computeFederalReturn({
            filingStatus: "mfs",
            wagesCents: C(40_000),
            dependentCareExpensesCents: C(3_000),
            numDependentCarePersons: 1,
        })
        expect(r.cdccCreditCents).toBe(0)
    })

    it("CDCC: $0 expenses → $0 credit", () => {
        const r = computeFederalReturn({
            filingStatus: "single",
            wagesCents: C(60_000),
            dependentCareExpensesCents: 0,
            numDependentCarePersons: 1,
        })
        expect(r.cdccCreditCents).toBe(0)
    })
})
