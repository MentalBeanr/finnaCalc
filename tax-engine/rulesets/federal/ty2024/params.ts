/**
 * Federal TY2024 parameters (the declarative "numbers" layer,
 * tax-engine-specification.md §2.3). Pure data, cited. Most annual updates are
 * edits to this file. All money in integer cents.
 */
import type { Bracket } from "@/tax-engine/core/primitives"

/** Numeric filing-status codes used by the engine's numeric graph. */
export const STATUS = {
    single: 0,
    mfj: 1,
    mfs: 2,
    hoh: 3,
    qss: 4,
} as const

export type StatusCode = (typeof STATUS)[keyof typeof STATUS]

const C = (dollars: number): number => dollars * 100

/** 2024 standard deduction by status code (IRS Rev. Proc. 2023-34). */
export const STANDARD_DEDUCTION_CENTS: Record<StatusCode, number> = {
    [STATUS.single]: C(14_600),
    [STATUS.mfj]: C(29_200),
    [STATUS.mfs]: C(14_600),
    [STATUS.hoh]: C(21_900),
    [STATUS.qss]: C(29_200),
}

const SINGLE_BRACKETS: Bracket[] = [
    { lowerCents: C(0), rateBp: 1000 },
    { lowerCents: C(11_600), rateBp: 1200 },
    { lowerCents: C(47_150), rateBp: 2200 },
    { lowerCents: C(100_525), rateBp: 2400 },
    { lowerCents: C(191_950), rateBp: 3200 },
    { lowerCents: C(243_725), rateBp: 3500 },
    { lowerCents: C(609_350), rateBp: 3700 },
]

const MFJ_BRACKETS: Bracket[] = [
    { lowerCents: C(0), rateBp: 1000 },
    { lowerCents: C(23_200), rateBp: 1200 },
    { lowerCents: C(94_300), rateBp: 2200 },
    { lowerCents: C(201_050), rateBp: 2400 },
    { lowerCents: C(383_900), rateBp: 3200 },
    { lowerCents: C(487_450), rateBp: 3500 },
    { lowerCents: C(731_200), rateBp: 3700 },
]

const MFS_BRACKETS: Bracket[] = [
    { lowerCents: C(0), rateBp: 1000 },
    { lowerCents: C(11_600), rateBp: 1200 },
    { lowerCents: C(47_150), rateBp: 2200 },
    { lowerCents: C(100_525), rateBp: 2400 },
    { lowerCents: C(191_950), rateBp: 3200 },
    { lowerCents: C(243_725), rateBp: 3500 },
    { lowerCents: C(365_600), rateBp: 3700 },
]

const HOH_BRACKETS: Bracket[] = [
    { lowerCents: C(0), rateBp: 1000 },
    { lowerCents: C(16_550), rateBp: 1200 },
    { lowerCents: C(63_100), rateBp: 2200 },
    { lowerCents: C(100_500), rateBp: 2400 },
    { lowerCents: C(191_950), rateBp: 3200 },
    { lowerCents: C(243_700), rateBp: 3500 },
    { lowerCents: C(609_350), rateBp: 3700 },
]

/** 2024 ordinary-income brackets by status code (IRS Rev. Proc. 2023-34). */
export const BRACKETS: Record<StatusCode, Bracket[]> = {
    [STATUS.single]: SINGLE_BRACKETS,
    [STATUS.mfj]: MFJ_BRACKETS,
    [STATUS.mfs]: MFS_BRACKETS,
    [STATUS.hoh]: HOH_BRACKETS,
    [STATUS.qss]: MFJ_BRACKETS, // qualifying surviving spouse uses MFJ brackets
}

/** Social Security taxability thresholds (base/additional) by status, IRC §86. */
export const SS_THRESHOLDS_CENTS: Record<StatusCode, { base: number; additional: number }> = {
    [STATUS.single]: { base: C(25_000), additional: C(34_000) },
    [STATUS.mfs]: { base: C(25_000), additional: C(34_000) },
    [STATUS.hoh]: { base: C(25_000), additional: C(34_000) },
    [STATUS.qss]: { base: C(25_000), additional: C(34_000) },
    [STATUS.mfj]: { base: C(32_000), additional: C(44_000) },
}

/** Child Tax Credit per qualifying child (simplified — no phase-out yet). */
export const CTC_PER_CHILD_CENTS = C(2_000)

/** Deductible IRA contribution cap (simplified — no MAGI phase-out yet). */
export const IRA_CONTRIBUTION_CAP_CENTS = C(7_000)

// ── Self-employment tax (IRC §1401, Rev. Proc. 2023-34) ───────────────────────

/** Net earnings from SE = 92.35% of Schedule C net profit (before SE deduction). */
export const SE_NET_EARNINGS_BP = 9235

/** SS portion of SE tax: 12.4% on net earnings up to the wage base. */
export const SE_SS_RATE_BP = 1240

/** Medicare portion of SE tax: 2.9% on all net earnings. */
export const SE_MEDICARE_RATE_BP = 290

/** 2024 Social Security wage base for SE tax (Rev. Proc. 2023-34). */
export const SE_SS_WAGE_BASE_CENTS = C(168_600)

/** AGI deduction for self-employment tax = 50% of total SE tax (IRC §164(f)). */
export const SE_AGI_DEDUCTION_BP = 5000

// ── Qualified dividends & capital gains (QDCG) rate thresholds ───────────────
// IRS Rev. Proc. 2023-34 §3.01 — 0% and 15% breakpoints by filing status.
// Income above the 15% breakpoint is taxed at 20%.

export const QDCG_0_PCT_THRESHOLD_CENTS: Record<StatusCode, number> = {
    [STATUS.single]: C(47_025),
    [STATUS.mfj]: C(94_050),
    [STATUS.mfs]: C(47_025),
    [STATUS.hoh]: C(63_000),
    [STATUS.qss]: C(94_050),
}

export const QDCG_15_PCT_THRESHOLD_CENTS: Record<StatusCode, number> = {
    [STATUS.single]: C(518_900),
    [STATUS.mfj]: C(583_750),
    [STATUS.mfs]: C(291_850),
    [STATUS.hoh]: C(551_350),
    [STATUS.qss]: C(583_750),
}

// ── Capital loss deduction limit (IRC §1211(b)) ───────────────────────────────
export const CAP_LOSS_LIMIT_CENTS: Record<StatusCode, number> = {
    [STATUS.single]: C(3_000),
    [STATUS.mfj]: C(3_000),
    [STATUS.mfs]: C(1_500),
    [STATUS.hoh]: C(3_000),
    [STATUS.qss]: C(3_000),
}

// ── Itemized deductions ───────────────────────────────────────────────────────

/** SALT cap per TCJA §164(b)(6) — $5k for MFS, $10k for all others. */
export const SALT_CAP_CENTS: Record<StatusCode, number> = {
    [STATUS.single]: C(10_000),
    [STATUS.mfj]: C(10_000),
    [STATUS.mfs]: C(5_000),
    [STATUS.hoh]: C(10_000),
    [STATUS.qss]: C(10_000),
}

/** Medical expense AGI floor: 7.5% = 750 bp (IRC §213(a)). */
export const MEDICAL_FLOOR_BP = 750

// ── Student Loan Interest Deduction (IRC §221) ────────────────────────────────

/** Maximum deductible student loan interest (2024). */
export const STUDENT_LOAN_INTEREST_MAX_CENTS = C(2_500)

export interface PhaseOutRange {
    start: number
    end: number
}

/**
 * AGI phase-out thresholds for student loan interest deduction (IRS Rev. Proc. 2023-34).
 * null = filing status is not eligible (MFS).
 */
export const SLI_PHASE_OUT: Record<StatusCode, PhaseOutRange | null> = {
    [STATUS.single]: { start: C(75_000), end: C(90_000) },
    [STATUS.mfj]: { start: C(155_000), end: C(185_000) },
    [STATUS.mfs]: null,
    [STATUS.hoh]: { start: C(75_000), end: C(90_000) },
    [STATUS.qss]: { start: C(75_000), end: C(90_000) },
}

// ── American Opportunity Tax Credit (IRC §25A(b)) ────────────────────────────

/** Per-student tier caps and rates for AOTC (2024 — no inflation adjustment). */
export const AOTC_TIER1_CAP_CENTS = C(2_000)   // 100% rate on first $2k per student
export const AOTC_TIER2_CAP_CENTS = C(2_000)   // 25% rate on next $2k per student
export const AOTC_TIER2_RATE_BP = 2_500        // 25%
export const AOTC_REFUNDABLE_BP = 4_000        // 40% of credit is refundable (IRC §25A(i))

/**
 * AGI phase-out thresholds for AOTC (IRS Rev. Proc. 2023-34).
 * null = not eligible (MFS).
 */
export const AOTC_PHASE_OUT: Record<StatusCode, PhaseOutRange | null> = {
    [STATUS.single]: { start: C(80_000), end: C(90_000) },
    [STATUS.mfj]: { start: C(160_000), end: C(180_000) },
    [STATUS.mfs]: null,
    [STATUS.hoh]: { start: C(80_000), end: C(90_000) },
    [STATUS.qss]: { start: C(80_000), end: C(90_000) },
}

// ── Earned Income Tax Credit (EITC) — TY2024 ─────────────────────────────────
// IRS Rev. Proc. 2023-34, §3.06. All money in cents.

/** Investment income disqualification limit for EITC (IRC §32(i)). */
export const EITC_MAX_INVESTMENT_INCOME_CENTS = C(11_600)

export interface EitcBand {
    maxCreditCents: number
    phaseInBp: number
    phaseInCapCents: number
    phaseOutStartSingleCents: number
    phaseOutStartMfjCents: number
    phaseOutBp: number
}

/**
 * EITC parameters by qualifying-child count (index 3 covers 3+ children).
 * Phase-in and phase-out rates from IRS Rev. Proc. 2023-34, Table 6.
 */
export const EITC_BANDS: readonly EitcBand[] = [
    // 0 children
    {
        maxCreditCents: C(632),
        phaseInBp: 765,
        phaseInCapCents: C(8_260),
        phaseOutStartSingleCents: C(10_330),
        phaseOutStartMfjCents: C(17_250),
        phaseOutBp: 765,
    },
    // 1 child
    {
        maxCreditCents: C(4_213),
        phaseInBp: 3400,
        phaseInCapCents: C(12_390),
        phaseOutStartSingleCents: C(23_083),
        phaseOutStartMfjCents: C(30_000),
        phaseOutBp: 1598,
    },
    // 2 children
    {
        maxCreditCents: C(6_960),
        phaseInBp: 4000,
        phaseInCapCents: C(17_400),
        phaseOutStartSingleCents: C(23_083),
        phaseOutStartMfjCents: C(30_000),
        phaseOutBp: 2106,
    },
    // 3+ children
    {
        maxCreditCents: C(7_830),
        phaseInBp: 4500,
        phaseInCapCents: C(17_400),
        phaseOutStartSingleCents: C(23_083),
        phaseOutStartMfjCents: C(30_000),
        phaseOutBp: 2106,
    },
] as const
