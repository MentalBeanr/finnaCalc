/**
 * 2024 state income tax data for all 50 states + DC.
 * Brackets are for single filers; married brackets are approximated at 2×.
 * Sources: Tax Foundation, state revenue department publications.
 */

export interface StateBracket {
    rate: number   // decimal (0.05 = 5%)
    upTo: number   // income up to this threshold (Infinity for top bracket)
}

export interface StateData {
    name: string
    noIncomeTax?: true
    flatRate?: number
    brackets?: StateBracket[]        // single-filer progressive brackets
    stdDeductSingle?: number         // state standard deduction, single
    stdDeductMarried?: number        // state standard deduction, married
    personalExemptSingle?: number
    personalExemptMarried?: number
}

// ── State tax table ─────────────────────────────────────────────────────────────

export const STATE_TAXES: Record<string, StateData> = {
    // ── No income tax ──────────────────────────────────────────────────────────
    AK: { name: "Alaska",        noIncomeTax: true },
    FL: { name: "Florida",       noIncomeTax: true },
    NV: { name: "Nevada",        noIncomeTax: true },
    NH: { name: "New Hampshire", noIncomeTax: true }, // wages exempt
    SD: { name: "South Dakota",  noIncomeTax: true },
    TN: { name: "Tennessee",     noIncomeTax: true }, // wages exempt
    TX: { name: "Texas",         noIncomeTax: true },
    WA: { name: "Washington",    noIncomeTax: true },
    WY: { name: "Wyoming",       noIncomeTax: true },

    // ── Flat rate states ──────────────────────────────────────────────────────
    AZ: { name: "Arizona",        flatRate: 0.025,  stdDeductSingle: 13_850, stdDeductMarried: 27_700 },
    CO: { name: "Colorado",       flatRate: 0.044,  stdDeductSingle: 13_850, stdDeductMarried: 27_700 },
    GA: { name: "Georgia",        flatRate: 0.0549, stdDeductSingle: 5_400,  stdDeductMarried: 7_100  },
    IL: { name: "Illinois",       flatRate: 0.0495, personalExemptSingle: 2_425, personalExemptMarried: 4_850 },
    IN: { name: "Indiana",        flatRate: 0.0305, personalExemptSingle: 1_000, personalExemptMarried: 2_000 },
    KY: { name: "Kentucky",       flatRate: 0.04,   stdDeductSingle: 2_980,  stdDeductMarried: 2_980  },
    MA: { name: "Massachusetts",  flatRate: 0.05,   personalExemptSingle: 4_400, personalExemptMarried: 8_800 },
    MI: { name: "Michigan",       flatRate: 0.0425, personalExemptSingle: 5_400, personalExemptMarried: 10_800 },
    MS: { name: "Mississippi",    flatRate: 0.047,  stdDeductSingle: 2_300,  stdDeductMarried: 4_600  },
    NC: { name: "North Carolina", flatRate: 0.045,  stdDeductSingle: 12_750, stdDeductMarried: 25_500 },
    PA: { name: "Pennsylvania",   flatRate: 0.0307 },
    UT: { name: "Utah",           flatRate: 0.0455, personalExemptSingle: 1_750, personalExemptMarried: 3_500 },
    ID: { name: "Idaho",          flatRate: 0.058,  stdDeductSingle: 13_850, stdDeductMarried: 27_700 },

    // ── Progressive states ────────────────────────────────────────────────────
    AL: { name: "Alabama",
        brackets: [{ rate:0.02, upTo:500 },{ rate:0.04, upTo:3_000 },{ rate:0.05, upTo:Infinity }],
        stdDeductSingle: 3_000, stdDeductMarried: 8_500,
        personalExemptSingle: 1_500, personalExemptMarried: 3_000 },

    AR: { name: "Arkansas",
        brackets: [{ rate:0.02, upTo:4_300 },{ rate:0.04, upTo:8_500 },{ rate:0.044, upTo:Infinity }],
        stdDeductSingle: 2_270, stdDeductMarried: 4_540 },

    CA: { name: "California",
        brackets: [{ rate:0.01, upTo:10_099 },{ rate:0.02, upTo:23_942 },{ rate:0.04, upTo:37_788 },
                   { rate:0.06, upTo:52_455 },{ rate:0.08, upTo:66_295 },{ rate:0.093, upTo:338_639 },
                   { rate:0.103, upTo:406_364 },{ rate:0.113, upTo:677_275 },{ rate:0.123, upTo:Infinity }],
        stdDeductSingle: 5_202, stdDeductMarried: 10_404,
        personalExemptSingle: 144, personalExemptMarried: 288 },

    CT: { name: "Connecticut",
        brackets: [{ rate:0.03, upTo:10_000 },{ rate:0.05, upTo:50_000 },{ rate:0.055, upTo:100_000 },
                   { rate:0.06, upTo:200_000 },{ rate:0.065, upTo:250_000 },{ rate:0.069, upTo:500_000 },
                   { rate:0.0699, upTo:Infinity }] },

    DE: { name: "Delaware",
        brackets: [{ rate:0.022, upTo:5_000 },{ rate:0.039, upTo:10_000 },{ rate:0.048, upTo:20_000 },
                   { rate:0.052, upTo:25_000 },{ rate:0.0555, upTo:60_000 },{ rate:0.066, upTo:Infinity }],
        stdDeductSingle: 3_250, stdDeductMarried: 6_500,
        personalExemptSingle: 110, personalExemptMarried: 220 },

    HI: { name: "Hawaii",
        brackets: [{ rate:0.014, upTo:2_400 },{ rate:0.032, upTo:4_800 },{ rate:0.055, upTo:9_600 },
                   { rate:0.064, upTo:14_400 },{ rate:0.068, upTo:19_200 },{ rate:0.072, upTo:24_000 },
                   { rate:0.076, upTo:36_000 },{ rate:0.079, upTo:48_000 },{ rate:0.0825, upTo:150_000 },
                   { rate:0.09, upTo:175_000 },{ rate:0.10, upTo:200_000 },{ rate:0.11, upTo:Infinity }],
        stdDeductSingle: 2_200, stdDeductMarried: 4_400,
        personalExemptSingle: 1_144, personalExemptMarried: 2_288 },

    IA: { name: "Iowa",
        brackets: [{ rate:0.044, upTo:6_210 },{ rate:0.0482, upTo:31_050 },{ rate:0.057, upTo:Infinity }],
        stdDeductSingle: 2_210, stdDeductMarried: 5_450 },

    KS: { name: "Kansas",
        brackets: [{ rate:0.031, upTo:15_000 },{ rate:0.0525, upTo:30_000 },{ rate:0.057, upTo:Infinity }],
        stdDeductSingle: 3_500, stdDeductMarried: 8_000,
        personalExemptSingle: 2_250, personalExemptMarried: 4_500 },

    LA: { name: "Louisiana",
        brackets: [{ rate:0.0185, upTo:12_500 },{ rate:0.035, upTo:50_000 },{ rate:0.0425, upTo:Infinity }],
        stdDeductSingle: 4_500, stdDeductMarried: 9_000,
        personalExemptSingle: 4_500, personalExemptMarried: 9_000 },

    ME: { name: "Maine",
        brackets: [{ rate:0.058, upTo:26_050 },{ rate:0.0675, upTo:61_600 },{ rate:0.0715, upTo:Infinity }],
        stdDeductSingle: 14_600, stdDeductMarried: 29_200 },

    MD: { name: "Maryland",
        brackets: [{ rate:0.02, upTo:1_000 },{ rate:0.03, upTo:2_000 },{ rate:0.04, upTo:3_000 },
                   { rate:0.0475, upTo:100_000 },{ rate:0.05, upTo:125_000 },{ rate:0.0525, upTo:150_000 },
                   { rate:0.055, upTo:250_000 },{ rate:0.0575, upTo:Infinity }],
        stdDeductSingle: 2_400, stdDeductMarried: 4_800,
        personalExemptSingle: 3_200, personalExemptMarried: 6_400 },

    MN: { name: "Minnesota",
        brackets: [{ rate:0.0535, upTo:31_690 },{ rate:0.068, upTo:104_090 },{ rate:0.0785, upTo:193_240 },{ rate:0.0985, upTo:Infinity }],
        stdDeductSingle: 14_575, stdDeductMarried: 29_150 },

    MO: { name: "Missouri",
        brackets: [{ rate:0.015, upTo:1_207 },{ rate:0.02, upTo:2_414 },{ rate:0.025, upTo:3_621 },
                   { rate:0.03, upTo:4_828 },{ rate:0.035, upTo:6_035 },{ rate:0.04, upTo:7_242 },
                   { rate:0.045, upTo:8_449 },{ rate:0.048, upTo:Infinity }],
        stdDeductSingle: 13_850, stdDeductMarried: 27_700,
        personalExemptSingle: 2_100, personalExemptMarried: 4_200 },

    MT: { name: "Montana",
        brackets: [{ rate:0.047, upTo:20_500 },{ rate:0.059, upTo:Infinity }],
        stdDeductSingle: 5_540, stdDeductMarried: 11_080 },

    NE: { name: "Nebraska",
        brackets: [{ rate:0.0246, upTo:3_700 },{ rate:0.0351, upTo:22_170 },{ rate:0.0501, upTo:35_730 },{ rate:0.0584, upTo:Infinity }],
        stdDeductSingle: 7_900, stdDeductMarried: 15_800 },

    NJ: { name: "New Jersey",
        brackets: [{ rate:0.014, upTo:20_000 },{ rate:0.0175, upTo:35_000 },{ rate:0.035, upTo:40_000 },
                   { rate:0.05525, upTo:75_000 },{ rate:0.0637, upTo:500_000 },{ rate:0.0897, upTo:1_000_000 },
                   { rate:0.1075, upTo:Infinity }] },

    NM: { name: "New Mexico",
        brackets: [{ rate:0.015, upTo:5_500 },{ rate:0.032, upTo:11_000 },{ rate:0.047, upTo:16_000 },
                   { rate:0.049, upTo:210_000 },{ rate:0.059, upTo:Infinity }],
        stdDeductSingle: 13_850, stdDeductMarried: 27_700 },

    NY: { name: "New York",
        brackets: [{ rate:0.04, upTo:17_150 },{ rate:0.045, upTo:23_600 },{ rate:0.0525, upTo:27_900 },
                   { rate:0.055, upTo:161_550 },{ rate:0.06, upTo:323_200 },{ rate:0.0685, upTo:2_155_350 },
                   { rate:0.0965, upTo:5_000_000 },{ rate:0.103, upTo:25_000_000 },{ rate:0.109, upTo:Infinity }],
        stdDeductSingle: 8_000, stdDeductMarried: 16_050 },

    ND: { name: "North Dakota",
        brackets: [{ rate:0.0195, upTo:44_725 },{ rate:0.0295, upTo:Infinity }] },

    OH: { name: "Ohio",
        brackets: [{ rate:0.02765, upTo:26_050 },{ rate:0.03226, upTo:100_000 },{ rate:0.03688, upTo:Infinity }] },

    OK: { name: "Oklahoma",
        brackets: [{ rate:0.0025, upTo:1_000 },{ rate:0.0075, upTo:2_500 },{ rate:0.0175, upTo:3_750 },
                   { rate:0.0275, upTo:4_900 },{ rate:0.0375, upTo:7_200 },{ rate:0.0475, upTo:Infinity }],
        stdDeductSingle: 6_350, stdDeductMarried: 12_700 },

    OR: { name: "Oregon",
        brackets: [{ rate:0.0475, upTo:18_400 },{ rate:0.0675, upTo:46_200 },{ rate:0.0875, upTo:250_000 },{ rate:0.099, upTo:Infinity }],
        stdDeductSingle: 2_420, stdDeductMarried: 4_840,
        personalExemptSingle: 236, personalExemptMarried: 472 },

    RI: { name: "Rhode Island",
        brackets: [{ rate:0.0375, upTo:73_450 },{ rate:0.0475, upTo:166_950 },{ rate:0.0599, upTo:Infinity }],
        stdDeductSingle: 9_550, stdDeductMarried: 19_100 },

    SC: { name: "South Carolina",
        brackets: [{ rate:0.03, upTo:3_460 },{ rate:0.04, upTo:17_330 },{ rate:0.05, upTo:Infinity }],
        stdDeductSingle: 13_850, stdDeductMarried: 27_700 },

    VT: { name: "Vermont",
        brackets: [{ rate:0.0335, upTo:45_400 },{ rate:0.066, upTo:110_050 },{ rate:0.076, upTo:229_550 },{ rate:0.0875, upTo:Infinity }],
        stdDeductSingle: 6_350, stdDeductMarried: 12_700 },

    VA: { name: "Virginia",
        brackets: [{ rate:0.02, upTo:3_000 },{ rate:0.03, upTo:5_000 },{ rate:0.05, upTo:17_000 },{ rate:0.0575, upTo:Infinity }],
        stdDeductSingle: 8_000, stdDeductMarried: 16_000,
        personalExemptSingle: 930, personalExemptMarried: 1_860 },

    WV: { name: "West Virginia",
        brackets: [{ rate:0.0236, upTo:10_000 },{ rate:0.032, upTo:25_000 },{ rate:0.0454, upTo:40_000 },
                   { rate:0.06, upTo:60_000 },{ rate:0.065, upTo:Infinity }],
        stdDeductSingle: 2_000, stdDeductMarried: 4_000 },

    WI: { name: "Wisconsin",
        brackets: [{ rate:0.035, upTo:13_810 },{ rate:0.044, upTo:27_630 },{ rate:0.053, upTo:304_170 },{ rate:0.0765, upTo:Infinity }],
        stdDeductSingle: 13_850, stdDeductMarried: 27_700 },

    DC: { name: "District of Columbia",
        brackets: [{ rate:0.04, upTo:10_000 },{ rate:0.06, upTo:40_000 },{ rate:0.065, upTo:60_000 },
                   { rate:0.085, upTo:250_000 },{ rate:0.0925, upTo:500_000 },{ rate:0.0975, upTo:1_000_000 },
                   { rate:0.1075, upTo:Infinity }],
        stdDeductSingle: 13_850, stdDeductMarried: 27_700 },
}

// ── Calculation ─────────────────────────────────────────────────────────────────

export interface StateTaxResult {
    state: string
    stateName: string
    noIncomeTax: boolean
    taxableIncome: number
    stateTax: number
    effectiveRate: number
}

export function calculateStateTax(
    federalAGI: number,
    stateCode: string,
    filingStatus: "single" | "married_jointly" | "married_separately" | "head_of_household" | string,
): StateTaxResult {
    const data = STATE_TAXES[stateCode]
    const isMarried = filingStatus === "married_jointly" || filingStatus === "married_separately"

    const empty: StateTaxResult = {
        state: stateCode, stateName: data?.name ?? stateCode,
        noIncomeTax: false, taxableIncome: 0, stateTax: 0, effectiveRate: 0,
    }

    if (!data) return empty

    if (data.noIncomeTax) {
        return { ...empty, stateName: data.name, noIncomeTax: true }
    }

    // State deductions / exemptions
    const stdDeduct  = isMarried ? (data.stdDeductMarried ?? 0) : (data.stdDeductSingle ?? 0)
    const personalEx = isMarried ? (data.personalExemptMarried ?? 0) : (data.personalExemptSingle ?? 0)
    const taxableIncome = Math.max(0, federalAGI - stdDeduct - personalEx)

    let stateTax = 0

    if (data.flatRate != null) {
        stateTax = taxableIncome * data.flatRate
    } else if (data.brackets) {
        // Married filers get ~2× the bracket thresholds (approximation)
        const multiplier = isMarried ? 2 : 1
        let prev = 0
        for (const b of data.brackets) {
            const threshold = b.upTo === Infinity ? Infinity : b.upTo * multiplier
            if (taxableIncome <= threshold) {
                stateTax += (taxableIncome - prev) * b.rate
                break
            }
            stateTax += (threshold - prev) * b.rate
            prev = threshold
        }
    }

    stateTax = Math.max(0, Math.round(stateTax * 100) / 100)
    const effectiveRate = taxableIncome > 0 ? stateTax / taxableIncome : 0

    return { state: stateCode, stateName: data.name, noIncomeTax: false, taxableIncome, stateTax, effectiveRate }
}

// IRS Direct File eligible states (2025 filing season)
export const DIRECT_FILE_STATES = new Set([
    "AK","AZ","CA","CT","FL","ID","IL","KS","MA","MD","ME","MN","MT",
    "NC","NH","NJ","NM","NV","NY","OH","OR","PA","SD","TN","TX","WA","WI","WY","DC",
])

export function isDirectFileEligible(agi: number, state: string): boolean {
    return agi <= 200_000 && DIRECT_FILE_STATES.has(state)
}
