// ── Shared types for the tax interview engine ─────────────────────────────────

export type FieldType =
    | "number"      // dollar / numeric input
    | "text"        // freeform string
    | "boolean"     // yes / no radio
    | "select"      // single-choice dropdown
    | "date"        // date input
    | "percent"     // percentage (0-100)

export interface SelectOption { value: string; label: string }

export interface Question {
    id:        string
    label:     string
    helpText?: string
    type:      FieldType
    options?:  SelectOption[]      // for "select"
    prefix?:   string              // e.g. "$" or "%"
    suffix?:   string
    max?:      number
    condition?: (d: TaxData) => boolean   // hide when false
    subLabel?: string              // small grey text below the input
}

export interface SubSection {
    title:      string
    condition?: (d: TaxData) => boolean
    questions:  Question[]
}

export interface Section {
    id:         string
    title:      string
    icon:       string
    condition?: (d: TaxData) => boolean
    subsections: SubSection[]
}

// ── Flat interview data object (all answers live here) ────────────────────────
export interface TaxData {
    // ── Filing info ───────────────────────────────────────────────────────────
    filingStatus:           string   // single | married_jointly | married_separately | hoh | widow
    over65Self:             boolean
    over65Spouse:           boolean
    blindSelf:              boolean
    blindSpouse:            boolean

    // ── Dependents ────────────────────────────────────────────────────────────
    numDependents:          number
    numQualifyingChildren:  number   // age < 17 for CTC
    numOtherDependents:     number   // age 17+ for $500 credit

    // ── W-2 income (up to 3 employers; more common case) ──────────────────────
    w2Wages1:               number
    w2Withheld1:            number
    w2SocialSecurityWages1: number
    w2MedicareWages1:       number
    w2SocialSecurityTax1:   number
    w2MedicareTax1:         number
    w2Box12Code1:           string   // 401k code
    w2Box12Amount1:         number
    w2StateWages1:          number
    w2StateWithheld1:       number
    w2State1:               string
    hasSecondW2:            boolean
    w2Wages2:               number
    w2Withheld2:            number
    w2StateWages2:          number
    w2StateWithheld2:       number
    hasThirdW2:             boolean
    w2Wages3:               number
    w2Withheld3:            number

    // ── Self-employment (Schedule C) ──────────────────────────────────────────
    isSelfEmployed:         boolean
    businessName:           string
    businessType:           string
    ein:                    string
    grossReceipts:          number
    returnsAllowances:      number
    costOfGoodsSold:        number
    seAdvertising:          number
    seCarTruck:             number       // actual expenses
    seMileage:              number       // miles driven for business
    seUseMileage:           boolean      // use mileage rate vs actual
    seCommissions:          number
    seContractLabor:        number
    seDepreciation:         number
    seSection179:           number
    seEmployeeBenefits:     number
    seInsurance:            number
    seInterest:             number
    seLegal:                number
    seOffice:               number
    sePension:              number
    seRentLease:            number
    seRepairs:              number
    seSupplies:             number
    seTaxes:                number
    seTravel:               number
    seMeals:                number       // total (50% deductible)
    seUtilities:            number
    seWages:                number
    seOther:                number
    seHomeOfficeArea:       number       // sq ft for home office
    seTotalHomeArea:        number
    useSimplifiedHomeOffice: boolean     // $5/sq ft method

    // ── Investment income ─────────────────────────────────────────────────────
    ordinaryDividends:      number       // 1099-DIV box 1a
    qualifiedDividends:     number       // 1099-DIV box 1b
    interestIncome:         number       // 1099-INT box 1
    taxExemptInterest:      number       // 1099-INT box 8
    stCapGains:             number       // short-term capital gains
    ltCapGains:             number       // long-term capital gains
    capLossCarryforward:    number       // from prior year
    hasCrypto:              boolean
    cryptoGainsST:          number
    cryptoGainsLT:          number
    collectiblesGains:      number       // taxed at 28%

    // ── Retirement income ─────────────────────────────────────────────────────
    ira401kDistribution:    number       // 1099-R box 1
    ira401kTaxable:         number       // 1099-R box 2a
    pensionIncome:          number
    isEarlyWithdrawal:      boolean      // age < 59½
    earlyWithdrawalException: string     // exception code
    socialSecurityBenefits: number       // SSA-1099 box 5
    rothConversion:         number

    // ── Other income ─────────────────────────────────────────────────────────
    income1099NEC:          number       // 1099-NEC
    income1099MISC:         number       // 1099-MISC (not SE)
    alimonyReceived:        number       // pre-2019 divorce only
    alimonyDivorceYear:     number
    gamblingWinnings:       number
    gamblingLosses:         number
    unemploymentComp:       number       // 1099-G
    stateLocalRefund:       number       // taxable if you itemized last yr
    foreignIncome:          number
    otherIncome:            number
    otherIncomeDesc:        string

    // ── Rental income (Schedule E) ────────────────────────────────────────────
    hasRentalProperty:      boolean
    rentalIncome1:          number
    rentalDaysRented1:      number
    rentalDaysPersonal1:    number
    rentalMortgageInterest1: number
    rentalTaxes1:           number
    rentalInsurance1:       number
    rentalRepairs1:         number
    rentalDepreciation1:    number
    rentalManagement1:      number
    rentalOther1:           number
    hasSecondRental:        boolean
    rentalIncome2:          number
    rentalExpenses2:        number       // simplified

    // ── Adjustments to income ─────────────────────────────────────────────────
    studentLoanInterest:    number       // capped at $2,500
    educatorExpenses:       number       // capped at $300/$600 MFJ
    hsaContributions:       number       // employee contributions (not payroll)
    hsaEmployerContrib:     number       // Box 12 Code W on W-2
    hsaDistributions:       number
    hsaQualifiedExpenses:   number
    hsaCoverageType:        string       // self | family
    traIraContrib:          number       // traditional IRA
    iraType:                string       // traditional | roth
    coveredByWorkplacePlan: boolean
    spouseCoveredByPlan:    boolean
    seHealthInsurance:      number       // self-employed health insurance
    seSepIraContrib:        number       // SEP-IRA contributions
    seSimpleContrib:        number
    alimonyPaid:            number       // pre-2019 divorce
    alimonyRecipientSSN:    string
    earlyWithdrawalPenalty: number       // penalty paid on CD etc.

    // ── Deductions (Schedule A) ────────────────────────────────────────────────
    mortgageInterest:       number
    mortgagePoints:         number
    homeEquityInterest:     number
    propertyTaxes:          number
    saltIncomeTaxes:        number       // state & local income taxes paid
    charitableCash:         number
    charitableNonCash:      number       // FMV (Form 8283 if > $500)
    charitableMileage:      number
    medicalExpenses:        number       // pre-7.5%-AGI-floor amount
    investmentInterest:     number
    casualtyLoss:           number       // federally declared disaster only
    miscItemized:           number       // job expenses etc (limited)

    // ── Credits ───────────────────────────────────────────────────────────────
    childcareExpenses:      number
    childcareProviderEIN:   string
    educationExpenses:      number       // qualified tuition
    educationType:          string       // aoc | llc
    studentIsFirstFourYears: boolean
    retirementSaverCredit:  boolean      // income-based eligibility
    retirementContribForSaver: number
    premiumTaxCredit:       number       // from Form 8962
    advancePTC:             number       // already received
    evCreditAmount:         number
    solarCreditCost:        number       // 30% nonrefundable
    foreignTaxPaid:         number
    adoptionExpenses:       number
    adoptionCredit:         number

    // ── Health coverage ───────────────────────────────────────────────────────
    hadMarketplaceInsurance: boolean
    form1095A_premiums:     number
    form1095A_slcsp:        number
    form1095A_advCredit:    number
    wholeYearCoverage:      boolean

    // ── Estimated taxes ───────────────────────────────────────────────────────
    estimatedTaxQ1:         number
    estimatedTaxQ2:         number
    estimatedTaxQ3:         number
    estimatedTaxQ4:         number

    // ── State ─────────────────────────────────────────────────────────────────
    residenceState:         string
    workedInAnotherState:   boolean
    otherWorkState:         string
}

export const DEFAULT_TAX_DATA: TaxData = {
    filingStatus: "single",
    over65Self: false, over65Spouse: false, blindSelf: false, blindSpouse: false,
    numDependents: 0, numQualifyingChildren: 0, numOtherDependents: 0,
    w2Wages1: 0, w2Withheld1: 0, w2SocialSecurityWages1: 0, w2MedicareWages1: 0,
    w2SocialSecurityTax1: 0, w2MedicareTax1: 0, w2Box12Code1: "", w2Box12Amount1: 0,
    w2StateWages1: 0, w2StateWithheld1: 0, w2State1: "",
    hasSecondW2: false, w2Wages2: 0, w2Withheld2: 0, w2StateWages2: 0, w2StateWithheld2: 0,
    hasThirdW2: false, w2Wages3: 0, w2Withheld3: 0,
    isSelfEmployed: false, businessName: "", businessType: "", ein: "", grossReceipts: 0,
    returnsAllowances: 0, costOfGoodsSold: 0, seAdvertising: 0, seCarTruck: 0, seMileage: 0,
    seUseMileage: true, seCommissions: 0, seContractLabor: 0, seDepreciation: 0, seSection179: 0,
    seEmployeeBenefits: 0, seInsurance: 0, seInterest: 0, seLegal: 0, seOffice: 0,
    sePension: 0, seRentLease: 0, seRepairs: 0, seSupplies: 0, seTaxes: 0, seTravel: 0,
    seMeals: 0, seUtilities: 0, seWages: 0, seOther: 0,
    seHomeOfficeArea: 0, seTotalHomeArea: 0, useSimplifiedHomeOffice: true,
    ordinaryDividends: 0, qualifiedDividends: 0, interestIncome: 0, taxExemptInterest: 0,
    stCapGains: 0, ltCapGains: 0, capLossCarryforward: 0, hasCrypto: false,
    cryptoGainsST: 0, cryptoGainsLT: 0, collectiblesGains: 0,
    ira401kDistribution: 0, ira401kTaxable: 0, pensionIncome: 0,
    isEarlyWithdrawal: false, earlyWithdrawalException: "", socialSecurityBenefits: 0, rothConversion: 0,
    income1099NEC: 0, income1099MISC: 0, alimonyReceived: 0, alimonyDivorceYear: 0,
    gamblingWinnings: 0, gamblingLosses: 0, unemploymentComp: 0, stateLocalRefund: 0,
    foreignIncome: 0, otherIncome: 0, otherIncomeDesc: "",
    hasRentalProperty: false,
    rentalIncome1: 0, rentalDaysRented1: 0, rentalDaysPersonal1: 0,
    rentalMortgageInterest1: 0, rentalTaxes1: 0, rentalInsurance1: 0,
    rentalRepairs1: 0, rentalDepreciation1: 0, rentalManagement1: 0, rentalOther1: 0,
    hasSecondRental: false, rentalIncome2: 0, rentalExpenses2: 0,
    studentLoanInterest: 0, educatorExpenses: 0,
    hsaContributions: 0, hsaEmployerContrib: 0, hsaDistributions: 0,
    hsaQualifiedExpenses: 0, hsaCoverageType: "self",
    traIraContrib: 0, iraType: "traditional", coveredByWorkplacePlan: false, spouseCoveredByPlan: false,
    seHealthInsurance: 0, seSepIraContrib: 0, seSimpleContrib: 0,
    alimonyPaid: 0, alimonyRecipientSSN: "", earlyWithdrawalPenalty: 0,
    mortgageInterest: 0, mortgagePoints: 0, homeEquityInterest: 0, propertyTaxes: 0,
    saltIncomeTaxes: 0, charitableCash: 0, charitableNonCash: 0, charitableMileage: 0,
    medicalExpenses: 0, investmentInterest: 0, casualtyLoss: 0, miscItemized: 0,
    childcareExpenses: 0, childcareProviderEIN: "",
    educationExpenses: 0, educationType: "aoc", studentIsFirstFourYears: true,
    retirementSaverCredit: false, retirementContribForSaver: 0,
    premiumTaxCredit: 0, advancePTC: 0, evCreditAmount: 0, solarCreditCost: 0,
    foreignTaxPaid: 0, adoptionExpenses: 0, adoptionCredit: 0,
    hadMarketplaceInsurance: false, form1095A_premiums: 0, form1095A_slcsp: 0,
    form1095A_advCredit: 0, wholeYearCoverage: true,
    estimatedTaxQ1: 0, estimatedTaxQ2: 0, estimatedTaxQ3: 0, estimatedTaxQ4: 0,
    residenceState: "", workedInAnotherState: false, otherWorkState: "",
}

// ── Comprehensive tax result ──────────────────────────────────────────────────
export interface TaxResult {
    // Income
    totalGrossIncome:       number
    netSEIncome:            number
    seTax:                  number
    seDeduction:            number      // half of SE tax
    agi:                    number
    // Deductions
    standardDeduction:      number
    itemizedDeductions:     number
    usingItemized:          boolean
    deduction:              number
    qbiDeduction:           number      // Section 199A (20% of qualified income)
    // Tax
    taxableIncome:          number
    regularTax:             number
    qualifiedDivLtcgTax:    number
    amt:                    number
    niit:                   number      // Net Investment Income Tax 3.8%
    additionalMedicareTax:  number      // 0.9%
    earlyWithdrawalPenalty: number
    totalTaxBeforeCredits:  number
    // Credits
    ctc:                    number      // Child Tax Credit
    actc:                   number      // Additional CTC (refundable)
    cdcc:                   number      // Child & Dependent Care Credit
    aoc:                    number      // American Opportunity Credit
    llc:                    number      // Lifetime Learning Credit
    eitc:                   number      // Earned Income Tax Credit
    saverCredit:            number
    ptc:                    number      // Premium Tax Credit
    evCredit:               number
    energyCredit:           number      // Residential clean energy (solar)
    foreignTaxCredit:       number
    totalCredits:           number
    // Payments
    totalWithheld:          number
    estimatedTaxPaid:       number
    totalPayments:          number
    // Result
    taxAfterCredits:        number
    refundOrOwed:           number
    owes:                   boolean
    // Rates
    marginalRate:           number
    effectiveRate:          number
    effectiveTotalRate:     number    // including NIIT, AMT, etc.
    // State
    stateResult?:           import("./state-taxes").StateTaxResult
}
