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
