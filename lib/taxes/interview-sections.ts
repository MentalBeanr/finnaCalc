// ── Tax Interview: all sections and questions ─────────────────────────────────
import type { Section, TaxData } from "./types"

const STATES = [
    "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
    "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
    "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
    "VA","WA","WV","WI","WY","DC",
].map(s => ({ value: s, label: s }))

const FILING_OPTIONS = [
    { value: "single",             label: "Single" },
    { value: "married_jointly",    label: "Married Filing Jointly" },
    { value: "married_separately", label: "Married Filing Separately" },
    { value: "head_of_household",  label: "Head of Household" },
    { value: "qualifying_widow",   label: "Qualifying Surviving Spouse" },
]

const isMFJ = (d: TaxData) => d.filingStatus === "married_jointly" || d.filingStatus === "qualifying_widow"

export const TAX_SECTIONS: Section[] = [

    // ── SECTION 1: Personal Information ──────────────────────────────────────
    {
        id: "personal",
        title: "Personal Info",
        icon: "person",
        subsections: [
            {
                title: "About You",
                questions: [
                    {
                        id:      "filingStatus",
                        label:   "What is your filing status?",
                        helpText:"Your status on December 31, 2024 determines your brackets and deductions.",
                        type:    "select",
                        options: FILING_OPTIONS,
                    },
                    {
                        id:    "residenceState",
                        label: "Which state did you live in for most of 2024?",
                        type:  "select",
                        options: STATES,
                    },
                    {
                        id:      "workedInAnotherState",
                        label:   "Did you work in a different state than you lived in?",
                        type:    "boolean",
                        helpText:"You may need to file a non-resident return in the work state.",
                    },
                    {
                        id:        "otherWorkState",
                        label:     "Which state did you work in?",
                        type:      "select",
                        options:   STATES,
                        condition: (d) => d.workedInAnotherState,
                    },
                ],
            },
            {
                title: "Age & Vision",
                questions: [
                    {
                        id:      "over65Self",
                        label:   "Were you age 65 or older on December 31, 2024?",
                        type:    "boolean",
                        helpText:"You qualify for a larger standard deduction.",
                    },
                    {
                        id:        "over65Spouse",
                        label:     "Was your spouse age 65 or older on December 31, 2024?",
                        type:      "boolean",
                        condition: isMFJ,
                    },
                    {
                        id:      "blindSelf",
                        label:   "Are you legally blind?",
                        type:    "boolean",
                        helpText:"Legal blindness adds to your standard deduction (same amount as age 65+).",
                    },
                    {
                        id:        "blindSpouse",
                        label:     "Is your spouse legally blind?",
                        type:      "boolean",
                        condition: isMFJ,
                    },
                ],
            },
            {
                title: "Dependents",
                questions: [
                    {
                        id:      "numQualifyingChildren",
                        label:   "How many qualifying children under age 17 do you have?",
                        helpText:"Qualifying children must live with you more than half the year and be under 17 at year-end. Each qualifies for up to $2,000 Child Tax Credit.",
                        type:    "number",
                        max:     10,
                    },
                    {
                        id:      "numOtherDependents",
                        label:   "How many other dependents do you have (age 17+, parents, etc.)?",
                        helpText:"Each qualifies for a $500 Other Dependent Credit (e.g., college-age children, elderly parents you support).",
                        type:    "number",
                        max:     10,
                    },
                ],
            },
        ],
    },

    // ── SECTION 2: W-2 Income ─────────────────────────────────────────────────
    {
        id: "w2",
        title: "W-2 Wages",
        icon: "badge",
        subsections: [
            {
                title: "Employer 1",
                questions: [
                    {
                        id:      "w2Wages1",
                        label:   "Box 1 — Wages, tips, other compensation",
                        helpText:"From your first W-2, Box 1.",
                        type:    "number",
                        prefix:  "$",
                    },
                    {
                        id:      "w2Withheld1",
                        label:   "Box 2 — Federal income tax withheld",
                        helpText:"From your first W-2, Box 2.",
                        type:    "number",
                        prefix:  "$",
                    },
                    {
                        id:      "w2SocialSecurityWages1",
                        label:   "Box 3 — Social Security wages",
                        type:    "number",
                        prefix:  "$",
                    },
                    {
                        id:      "w2SocialSecurityTax1",
                        label:   "Box 4 — Social Security tax withheld",
                        type:    "number",
                        prefix:  "$",
                    },
                    {
                        id:      "w2MedicareWages1",
                        label:   "Box 5 — Medicare wages and tips",
                        type:    "number",
                        prefix:  "$",
                    },
                    {
                        id:      "w2MedicareTax1",
                        label:   "Box 6 — Medicare tax withheld",
                        type:    "number",
                        prefix:  "$",
                    },
                    {
                        id:      "w2Box12Code1",
                        label:   "Box 12 — Code (e.g., D for 401k)",
                        helpText:"Common codes: D = Traditional 401k, AA = Roth 401k, W = HSA employer contrib, C = Employer-paid group life over $50k.",
                        type:    "text",
                    },
                    {
                        id:        "w2Box12Amount1",
                        label:     "Box 12 — Amount",
                        type:      "number",
                        prefix:    "$",
                        condition: (d) => !!d.w2Box12Code1,
                    },
                    {
                        id:      "w2State1",
                        label:   "Box 15 — State",
                        type:    "select",
                        options: STATES,
                    },
                    {
                        id:      "w2StateWages1",
                        label:   "Box 16 — State wages",
                        type:    "number",
                        prefix:  "$",
                    },
                    {
                        id:      "w2StateWithheld1",
                        label:   "Box 17 — State income tax withheld",
                        type:    "number",
                        prefix:  "$",
                    },
                ],
            },
            {
                title: "Additional Employers",
                questions: [
                    {
                        id:    "hasSecondW2",
                        label: "Did you work for a second employer in 2024?",
                        type:  "boolean",
                    },
                    {
                        id:        "w2Wages2",
                        label:     "Employer 2 — Box 1 Wages",
                        type:      "number",
                        prefix:    "$",
                        condition: (d) => d.hasSecondW2,
                    },
                    {
                        id:        "w2Withheld2",
                        label:     "Employer 2 — Box 2 Federal tax withheld",
                        type:      "number",
                        prefix:    "$",
                        condition: (d) => d.hasSecondW2,
                    },
                    {
                        id:        "w2StateWages2",
                        label:     "Employer 2 — Box 16 State wages",
                        type:      "number",
                        prefix:    "$",
                        condition: (d) => d.hasSecondW2,
                    },
                    {
                        id:        "w2StateWithheld2",
                        label:     "Employer 2 — Box 17 State tax withheld",
                        type:      "number",
                        prefix:    "$",
                        condition: (d) => d.hasSecondW2,
                    },
                    {
                        id:        "hasThirdW2",
                        label:     "Did you work for a third employer in 2024?",
                        type:      "boolean",
                        condition: (d) => d.hasSecondW2,
                    },
                    {
                        id:        "w2Wages3",
                        label:     "Employer 3 — Box 1 Wages",
                        type:      "number",
                        prefix:    "$",
                        condition: (d) => d.hasThirdW2,
                    },
                    {
                        id:        "w2Withheld3",
                        label:     "Employer 3 — Box 2 Federal tax withheld",
                        type:      "number",
                        prefix:    "$",
                        condition: (d) => d.hasThirdW2,
                    },
                ],
            },
        ],
    },

    // ── SECTION 3: Self-Employment (Schedule C) ───────────────────────────────
    {
        id: "self_employment",
        title: "Self-Employment",
        icon: "storefront",
        subsections: [
            {
                title: "Business Overview",
                questions: [
                    {
                        id:      "isSelfEmployed",
                        label:   "Did you have self-employment income or freelance work in 2024?",
                        helpText:"This includes 1099-NEC income, Uber/DoorDash, freelancing, side businesses, and any other self-employed activity.",
                        type:    "boolean",
                    },
                    {
                        id:        "businessName",
                        label:     "Business name (or your name if sole proprietor)",
                        type:      "text",
                        condition: (d) => d.isSelfEmployed,
                    },
                    {
                        id:        "businessType",
                        label:     "Type of business / trade",
                        type:      "text",
                        condition: (d) => d.isSelfEmployed,
                        subLabel:  "e.g., Software Consultant, Uber Driver, Photography",
                    },
                    {
                        id:        "ein",
                        label:     "EIN (optional — leave blank if none)",
                        type:      "text",
                        condition: (d) => d.isSelfEmployed,
                    },
                ],
            },
            {
                title: "Income",
                condition: (d) => d.isSelfEmployed,
                questions: [
                    {
                        id:      "grossReceipts",
                        label:   "Gross receipts or sales",
                        helpText:"Total revenue before any deductions. Include all 1099-NEC amounts plus any cash income.",
                        type:    "number",
                        prefix:  "$",
                    },
                    {
                        id:      "returnsAllowances",
                        label:   "Returns and allowances",
                        helpText:"Refunds or credits issued to customers.",
                        type:    "number",
                        prefix:  "$",
                    },
                    {
                        id:      "costOfGoodsSold",
                        label:   "Cost of goods sold",
                        helpText:"Materials, inventory, manufacturing costs directly tied to what you sold.",
                        type:    "number",
                        prefix:  "$",
                    },
                ],
            },
            {
                title: "Business Expenses (Schedule C)",
                condition: (d) => d.isSelfEmployed,
                questions: [
                    { id: "seAdvertising",    label: "Advertising",                                    type: "number", prefix: "$", helpText: "Online ads, print, business cards, etc." },
                    {
                        id:      "seUseMileage",
                        label:   "Use IRS standard mileage rate for vehicle expenses?",
                        type:    "boolean",
                        helpText:"Standard rate = $0.67/mile for 2024. The alternative is tracking actual gas, insurance, depreciation.",
                    },
                    {
                        id:        "seMileage",
                        label:     "Business miles driven in 2024",
                        type:      "number",
                        suffix:    "miles",
                        condition: (d) => d.isSelfEmployed && d.seUseMileage,
                        subLabel:  "Deduction = miles × $0.67",
                    },
                    {
                        id:        "seCarTruck",
                        label:     "Actual vehicle expenses (gas, insurance, repairs, depreciation)",
                        type:      "number",
                        prefix:    "$",
                        condition: (d) => d.isSelfEmployed && !d.seUseMileage,
                    },
                    { id: "seCommissions",    label: "Commissions and fees paid",                       type: "number", prefix: "$" },
                    { id: "seContractLabor",  label: "Contract labor (1099s issued to sub-contractors)",type: "number", prefix: "$" },
                    {
                        id:      "seDepreciation",
                        label:   "Depreciation (Form 4562)",
                        type:    "number",
                        prefix:  "$",
                        helpText:"Multi-year depreciation of business assets.",
                    },
                    {
                        id:      "seSection179",
                        label:   "Section 179 expense deduction",
                        type:    "number",
                        prefix:  "$",
                        helpText:"First-year deduction for qualifying equipment or software (up to $1.22M in 2024).",
                    },
                    { id: "seEmployeeBenefits", label: "Employee benefit programs (health insurance, etc.)", type: "number", prefix: "$" },
                    { id: "seInsurance",      label: "Insurance (not health — property, liability)",    type: "number", prefix: "$" },
                    { id: "seInterest",       label: "Interest on business loans",                      type: "number", prefix: "$" },
                    { id: "seLegal",          label: "Legal and professional services",                 type: "number", prefix: "$" },
                    { id: "seOffice",         label: "Office expenses (paper, postage, supplies for office)", type: "number", prefix: "$" },
                    { id: "sePension",        label: "Pension / profit-sharing plans for employees",   type: "number", prefix: "$" },
                    { id: "seRentLease",      label: "Rent or lease (equipment, vehicles, property)",  type: "number", prefix: "$" },
                    { id: "seRepairs",        label: "Repairs and maintenance",                         type: "number", prefix: "$" },
                    { id: "seSupplies",       label: "Supplies (tools, materials for business)",        type: "number", prefix: "$" },
                    { id: "seTaxes",          label: "Taxes and licenses (business taxes, professional licenses)", type: "number", prefix: "$" },
                    { id: "seTravel",         label: "Travel (airfare, lodging — 100% business trips)", type: "number", prefix: "$" },
                    {
                        id:      "seMeals",
                        label:   "Business meals (enter full amount — 50% is deductible)",
                        type:    "number",
                        prefix:  "$",
                        helpText:"IRS allows 50% of bona-fide business meal expenses.",
                    },
                    { id: "seUtilities",      label: "Utilities for business property",                type: "number", prefix: "$" },
                    { id: "seWages",          label: "Wages paid to employees (W-2s you issued)",      type: "number", prefix: "$" },
                    { id: "seOther",          label: "Other business expenses not listed above",        type: "number", prefix: "$" },
                ],
            },
            {
                title: "Home Office (Form 8829)",
                condition: (d) => d.isSelfEmployed,
                questions: [
                    {
                        id:      "useSimplifiedHomeOffice",
                        label:   "Use simplified home office method ($5/sq ft, max 300 sq ft)?",
                        type:    "boolean",
                        helpText:"The simplified method is easier and avoids depreciation recapture. Most small businesses use this.",
                    },
                    {
                        id:      "seHomeOfficeArea",
                        label:   "Area used exclusively for business (sq ft)",
                        type:    "number",
                        suffix:  "sq ft",
                        helpText:"Must be a dedicated, exclusive space — not a corner of the kitchen.",
                    },
                    {
                        id:        "seTotalHomeArea",
                        label:     "Total home area (sq ft)",
                        type:      "number",
                        suffix:    "sq ft",
                        condition: (d) => d.isSelfEmployed && !d.useSimplifiedHomeOffice,
                    },
                ],
            },
        ],
    },

    // ── SECTION 4: Investment Income (Schedule B / D) ─────────────────────────
    {
        id: "investments",
        title: "Investments",
        icon: "candlestick_chart",
        subsections: [
            {
                title: "Interest & Dividends (Schedule B)",
                questions: [
                    {
                        id:      "interestIncome",
                        label:   "Taxable interest income (1099-INT Box 1)",
                        helpText:"Bank savings interest, CD interest, bond interest. Combine all 1099-INT Box 1 amounts.",
                        type:    "number",
                        prefix:  "$",
                    },
                    {
                        id:      "taxExemptInterest",
                        label:   "Tax-exempt interest (1099-INT Box 8)",
                        helpText:"Municipal bond interest — not taxed federally but counts toward provisional income for Social Security taxability.",
                        type:    "number",
                        prefix:  "$",
                    },
                    {
                        id:      "ordinaryDividends",
                        label:   "Ordinary dividends (1099-DIV Box 1a)",
                        helpText:"Total dividends from all 1099-DIV forms.",
                        type:    "number",
                        prefix:  "$",
                    },
                    {
                        id:      "qualifiedDividends",
                        label:   "Qualified dividends (1099-DIV Box 1b)",
                        helpText:"Must be a subset of ordinary dividends. Taxed at lower long-term capital gains rates.",
                        type:    "number",
                        prefix:  "$",
                    },
                ],
            },
            {
                title: "Capital Gains & Losses (Schedule D / Form 8949)",
                questions: [
                    {
                        id:      "stCapGains",
                        label:   "Net short-term capital gains or losses",
                        helpText:"Assets held ≤ 1 year. Enter gains as positive, losses as negative. Combine all 1099-B Box 1a columns.",
                        type:    "number",
                        prefix:  "$",
                        subLabel:"From stocks, bonds, ETFs held 1 year or less",
                    },
                    {
                        id:      "ltCapGains",
                        label:   "Net long-term capital gains or losses",
                        helpText:"Assets held > 1 year. Taxed at 0%, 15%, or 20% depending on your income.",
                        type:    "number",
                        prefix:  "$",
                        subLabel:"From stocks, bonds, ETFs held more than 1 year",
                    },
                    {
                        id:      "collectiblesGains",
                        label:   "Long-term gains on collectibles (coins, art, antiques)",
                        helpText:"Taxed at special 28% rate instead of the 15%/20% LTCG rate.",
                        type:    "number",
                        prefix:  "$",
                    },
                    {
                        id:      "capLossCarryforward",
                        label:   "Capital loss carryforward from prior years",
                        helpText:"From Schedule D of your 2023 return (Line 16 if negative).",
                        type:    "number",
                        prefix:  "$",
                    },
                    {
                        id:    "hasCrypto",
                        label: "Did you sell, exchange, or dispose of cryptocurrency in 2024?",
                        type:  "boolean",
                        helpText:"Crypto is treated as property. Every sale, swap, or payment is a taxable event.",
                    },
                    {
                        id:        "cryptoGainsST",
                        label:     "Net cryptocurrency short-term gains/losses (held ≤ 1 year)",
                        type:      "number",
                        prefix:    "$",
                        condition: (d) => d.hasCrypto,
                    },
                    {
                        id:        "cryptoGainsLT",
                        label:     "Net cryptocurrency long-term gains/losses (held > 1 year)",
                        type:      "number",
                        prefix:    "$",
                        condition: (d) => d.hasCrypto,
                    },
                ],
            },
        ],
    },

    // ── SECTION 5: Retirement Income ──────────────────────────────────────────
    {
        id: "retirement",
        title: "Retirement Income",
        icon: "savings",
        subsections: [
            {
                title: "IRA / 401(k) / Pension Distributions (1099-R)",
                questions: [
                    {
                        id:      "ira401kDistribution",
                        label:   "Gross distribution (1099-R Box 1)",
                        helpText:"Total distribution received from IRA, 401k, pension, or annuity.",
                        type:    "number",
                        prefix:  "$",
                    },
                    {
                        id:        "ira401kTaxable",
                        label:     "Taxable amount (1099-R Box 2a)",
                        helpText: "If Box 2a is blank, the full Box 1 amount is typically taxable unless you made non-deductible contributions.",
                        type:      "number",
                        prefix:    "$",
                        condition: (d) => (d.ira401kDistribution || 0) > 0,
                    },
                    {
                        id:        "isEarlyWithdrawal",
                        label:     "Were you under age 59½ when you received this distribution?",
                        type:      "boolean",
                        helpText: "Early withdrawals are typically subject to an additional 10% penalty tax.",
                        condition: (d) => (d.ira401kDistribution || 0) > 0,
                    },
                    {
                        id:        "earlyWithdrawalException",
                        label:     "Exception to early withdrawal penalty (enter exception code or leave blank)",
                        type:      "select",
                        options: [
                            { value: "", label: "No exception — penalty applies" },
                            { value: "01", label: "01 — Substantially equal periodic payments (72(t))" },
                            { value: "02", label: "02 — Separation from service at age 55+" },
                            { value: "03", label: "03 — Disability" },
                            { value: "04", label: "04 — Death of account owner" },
                            { value: "05", label: "05 — Qualified domestic relations order (QDRO)" },
                            { value: "06", label: "06 — Medical expenses exceeding 7.5% AGI" },
                            { value: "07", label: "07 — Health insurance premiums while unemployed" },
                            { value: "08", label: "08 — Higher education expenses" },
                            { value: "09", label: "09 — First-time homebuyer (up to $10,000 lifetime)" },
                            { value: "10", label: "10 — IRS levy" },
                            { value: "11", label: "11 — Qualified reservist distribution" },
                            { value: "12", label: "12 — Roth IRA — qualified distribution" },
                        ],
                        condition: (d) => d.isEarlyWithdrawal,
                    },
                    {
                        id:      "pensionIncome",
                        label:   "Pension income not on a 1099-R",
                        type:    "number",
                        prefix:  "$",
                    },
                    {
                        id:      "rothConversion",
                        label:   "Roth IRA conversion amount (taxable portion)",
                        helpText:"If you converted traditional IRA funds to Roth, the converted amount is taxable in 2024.",
                        type:    "number",
                        prefix:  "$",
                    },
                ],
            },
            {
                title: "Social Security Benefits (SSA-1099)",
                questions: [
                    {
                        id:      "socialSecurityBenefits",
                        label:   "Net Social Security / Railroad Retirement benefits received",
                        helpText:"From SSA-1099 Box 5 (Benefits paid minus Medicare premiums deducted). Up to 85% may be taxable depending on your combined income.",
                        type:    "number",
                        prefix:  "$",
                    },
                ],
            },
        ],
    },

    // ── SECTION 6: Rental Income (Schedule E) ─────────────────────────────────
    {
        id: "rental",
        title: "Rental Property",
        icon: "home_work",
        subsections: [
            {
                title: "Do You Have Rental Income?",
                questions: [
                    {
                        id:      "hasRentalProperty",
                        label:   "Did you receive rental income from a property in 2024?",
                        helpText:"Includes traditional rentals, Airbnb, Vrbo, etc. You must report rental income and can deduct rental expenses.",
                        type:    "boolean",
                    },
                ],
            },
            {
                title: "Property 1",
                condition: (d) => d.hasRentalProperty,
                questions: [
                    { id: "rentalIncome1",           label: "Gross rents received",                          type: "number", prefix: "$" },
                    { id: "rentalDaysRented1",        label: "Days rented at fair market price",             type: "number", suffix: "days" },
                    {
                        id:      "rentalDaysPersonal1",
                        label:   "Days used for personal purposes",
                        type:    "number",
                        suffix:  "days",
                        helpText:"If personal use exceeds 14 days or 10% of rental days, it's a vacation home with limited deductions.",
                    },
                    { id: "rentalMortgageInterest1",  label: "Mortgage interest paid (Form 1098)",           type: "number", prefix: "$" },
                    { id: "rentalTaxes1",             label: "Property taxes",                               type: "number", prefix: "$" },
                    { id: "rentalInsurance1",         label: "Insurance (landlord policy)",                  type: "number", prefix: "$" },
                    { id: "rentalRepairs1",           label: "Repairs and maintenance",                      type: "number", prefix: "$" },
                    {
                        id:      "rentalDepreciation1",
                        label:   "Depreciation (Form 4562)",
                        type:    "number",
                        prefix:  "$",
                        helpText:"Residential rental property depreciates over 27.5 years. Cost basis ÷ 27.5 = annual depreciation. Enter $0 if you're unsure.",
                    },
                    { id: "rentalManagement1",        label: "Property management fees",                     type: "number", prefix: "$" },
                    { id: "rentalOther1",             label: "Other rental expenses (advertising, utilities, HOA)", type: "number", prefix: "$" },
                ],
            },
            {
                title: "Property 2",
                condition: (d) => d.hasRentalProperty,
                questions: [
                    {
                        id:    "hasSecondRental",
                        label: "Do you have a second rental property?",
                        type:  "boolean",
                    },
                    {
                        id:        "rentalIncome2",
                        label:     "Property 2 — Gross rents",
                        type:      "number",
                        prefix:    "$",
                        condition: (d) => d.hasSecondRental,
                    },
                    {
                        id:        "rentalExpenses2",
                        label:     "Property 2 — Total deductible expenses",
                        type:      "number",
                        prefix:    "$",
                        condition: (d) => d.hasSecondRental,
                    },
                ],
            },
        ],
    },

    // ── SECTION 7: Other Income ────────────────────────────────────────────────
    {
        id: "other_income",
        title: "Other Income",
        icon: "attach_money",
        subsections: [
            {
                title: "1099s & Miscellaneous",
                questions: [
                    {
                        id:      "income1099MISC",
                        label:   "Other 1099-MISC income (prizes, awards, rents not Schedule E)",
                        helpText:"Box 3 (other income) or Box 1 (rents if not on Schedule E). Does not include Box 7 (use self-employment section for that).",
                        type:    "number",
                        prefix:  "$",
                    },
                    {
                        id:      "alimonyReceived",
                        label:   "Alimony received (only if divorce agreement was signed before Jan 1, 2019)",
                        helpText:"Post-2018 divorce agreements — alimony is not taxable to recipient.",
                        type:    "number",
                        prefix:  "$",
                    },
                    {
                        id:        "alimonyDivorceYear",
                        label:     "Year of divorce decree",
                        type:      "number",
                        condition: (d) => (d.alimonyReceived || 0) > 0,
                        max:       2018,
                    },
                    {
                        id:      "gamblingWinnings",
                        label:   "Gambling winnings (W-2G or cash)",
                        helpText:"All winnings including lottery, casino, sports betting, fantasy sports.",
                        type:    "number",
                        prefix:  "$",
                    },
                    {
                        id:        "gamblingLosses",
                        label:     "Gambling losses (deductible only if you itemize, up to your winnings)",
                        type:      "number",
                        prefix:    "$",
                        condition: (d) => (d.gamblingWinnings || 0) > 0,
                    },
                    {
                        id:      "unemploymentComp",
                        label:   "Unemployment compensation (1099-G Box 1)",
                        helpText:"Fully taxable federally in 2024 (no exclusion as in 2020). Some states exempt it.",
                        type:    "number",
                        prefix:  "$",
                    },
                    {
                        id:      "stateLocalRefund",
                        label:   "State or local tax refund (1099-G Box 2)",
                        helpText:"Taxable only if you itemized deductions in the year you received it.",
                        type:    "number",
                        prefix:  "$",
                    },
                    {
                        id:      "foreignIncome",
                        label:   "Foreign earned income (not excluded via Form 2555)",
                        helpText:"Income earned while working abroad that you cannot exclude. The foreign earned income exclusion is $126,500 for 2024.",
                        type:    "number",
                        prefix:  "$",
                    },
                    {
                        id:      "otherIncome",
                        label:   "Other income not listed above",
                        type:    "number",
                        prefix:  "$",
                    },
                    {
                        id:        "otherIncomeDesc",
                        label:     "Describe the other income",
                        type:      "text",
                        condition: (d) => (d.otherIncome || 0) > 0,
                    },
                ],
            },
        ],
    },

    // ── SECTION 8: Adjustments to Income ─────────────────────────────────────
    {
        id: "adjustments",
        title: "Adjustments to Income",
        icon: "tune",
        subsections: [
            {
                title: "Common Above-the-Line Deductions",
                questions: [
                    {
                        id:      "studentLoanInterest",
                        label:   "Student loan interest paid (Form 1098-E)",
                        helpText:"Up to $2,500 deductible. Phases out: $80k-$95k (single), $165k-$195k (MFJ). Cannot claim if MFS.",
                        type:    "number",
                        prefix:  "$",
                        max:     2500,
                    },
                    {
                        id:      "educatorExpenses",
                        label:   "Educator expenses (K-12 teachers only)",
                        helpText:"Up to $300 ($600 if MFJ and both spouses are eligible educators) for unreimbursed classroom supplies.",
                        type:    "number",
                        prefix:  "$",
                        max:     600,
                    },
                    {
                        id:      "earlyWithdrawalPenalty",
                        label:   "Early withdrawal penalty on CDs or savings (1099-INT Box 2)",
                        helpText:"Penalty you paid for early withdrawal from a time deposit (not IRA/401k).",
                        type:    "number",
                        prefix:  "$",
                    },
                    {
                        id:      "alimonyPaid",
                        label:   "Alimony paid (pre-2019 divorce only)",
                        helpText:"Deductible only for divorce/separation instruments signed before January 1, 2019.",
                        type:    "number",
                        prefix:  "$",
                    },
                ],
            },
            {
                title: "HSA (Health Savings Account)",
                questions: [
                    {
                        id:      "hsaCoverageType",
                        label:   "HSA coverage type",
                        type:    "select",
                        options: [
                            { value: "self",   label: "Self-only (individual HDHP)" },
                            { value: "family", label: "Family HDHP" },
                        ],
                        helpText:"2024 limits: $4,150 (self-only), $8,300 (family), plus $1,000 catch-up if 55+.",
                    },
                    {
                        id:      "hsaContributions",
                        label:   "Your HSA contributions (not through payroll)",
                        helpText:"Only out-of-pocket contributions you made directly. Payroll contributions (Box 12 Code W) are already excluded from Box 1 wages.",
                        type:    "number",
                        prefix:  "$",
                    },
                    {
                        id:      "hsaEmployerContrib",
                        label:   "Employer HSA contributions (W-2 Box 12 Code W)",
                        type:    "number",
                        prefix:  "$",
                    },
                    {
                        id:      "hsaDistributions",
                        label:   "Total HSA distributions (Form 1099-SA Box 1)",
                        type:    "number",
                        prefix:  "$",
                    },
                    {
                        id:        "hsaQualifiedExpenses",
                        label:     "HSA distributions used for qualified medical expenses",
                        type:      "number",
                        prefix:    "$",
                        condition: (d) => (d.hsaDistributions || 0) > 0,
                        helpText:  "Distributions used for non-medical purposes are taxable + 20% penalty.",
                    },
                ],
            },
            {
                title: "IRA Contributions",
                questions: [
                    {
                        id:      "iraType",
                        label:   "Type of IRA contribution",
                        type:    "select",
                        options: [
                            { value: "traditional", label: "Traditional IRA (may be deductible)" },
                            { value: "roth",        label: "Roth IRA (never deductible)" },
                            { value: "none",        label: "No IRA contribution in 2024" },
                        ],
                    },
                    {
                        id:        "traIraContrib",
                        label:     "IRA contribution amount",
                        helpText: "2024 limit: $7,000 ($8,000 if age 50+). Total across all IRA accounts.",
                        type:      "number",
                        prefix:    "$",
                        max:       8000,
                        condition: (d) => d.iraType !== "none",
                    },
                    {
                        id:        "coveredByWorkplacePlan",
                        label:     "Were you covered by a 401(k) or other workplace retirement plan in 2024?",
                        type:      "boolean",
                        helpText: "If yes, your traditional IRA deductibility phases out at higher income levels.",
                        condition: (d) => d.iraType === "traditional",
                    },
                    {
                        id:        "spouseCoveredByPlan",
                        label:     "Was your spouse covered by a workplace plan in 2024?",
                        type:      "boolean",
                        condition: (d) => d.iraType === "traditional" && isMFJ(d),
                    },
                ],
            },
            {
                title: "Self-Employed Adjustments",
                condition: (d) => d.isSelfEmployed,
                questions: [
                    {
                        id:      "seHealthInsurance",
                        label:   "Self-employed health insurance premiums paid",
                        helpText:"Premiums you paid for yourself and your family — deductible 100%. Cannot exceed net SE income. Cannot claim if eligible for employer plan through a job.",
                        type:    "number",
                        prefix:  "$",
                    },
                    {
                        id:      "seSepIraContrib",
                        label:   "SEP-IRA contribution",
                        helpText:"Up to 25% of net self-employment income, max $69,000 in 2024.",
                        type:    "number",
                        prefix:  "$",
                    },
                    {
                        id:      "seSimpleContrib",
                        label:   "SIMPLE IRA contribution (self-employed with employees)",
                        type:    "number",
                        prefix:  "$",
                    },
                ],
            },
        ],
    },

    // ── SECTION 9: Deductions (Schedule A) ───────────────────────────────────
    {
        id: "deductions",
        title: "Deductions",
        icon: "receipt_long",
        subsections: [
            {
                title: "Home & Mortgage (Schedule A Lines 8-9)",
                questions: [
                    {
                        id:      "mortgageInterest",
                        label:   "Home mortgage interest (Form 1098 Box 1)",
                        helpText:"Deductible on loans up to $750,000 (post-Dec 2017 loans) or $1M (pre-Dec 2017 loans).",
                        type:    "number",
                        prefix:  "$",
                    },
                    {
                        id:      "mortgagePoints",
                        label:   "Points paid on loan origination or refinance (Form 1098 Box 6)",
                        type:    "number",
                        prefix:  "$",
                    },
                    {
                        id:      "homeEquityInterest",
                        label:   "Home equity loan / HELOC interest",
                        helpText:"Deductible only if the loan was used to buy, build, or substantially improve the home.",
                        type:    "number",
                        prefix:  "$",
                    },
                ],
            },
            {
                title: "State & Local Taxes (SALT — Schedule A Lines 5-6)",
                questions: [
                    {
                        id:      "propertyTaxes",
                        label:   "State and local real property taxes paid",
                        helpText:"Combined with state income taxes, SALT deduction is capped at $10,000 ($5,000 MFS).",
                        type:    "number",
                        prefix:  "$",
                    },
                    {
                        id:      "saltIncomeTaxes",
                        label:   "State and local income taxes paid (from W-2 + any extra payments)",
                        helpText:"Or sales taxes if you elect that option — use whichever is larger.",
                        type:    "number",
                        prefix:  "$",
                    },
                ],
            },
            {
                title: "Charitable Contributions (Schedule A Lines 11-12)",
                questions: [
                    {
                        id:      "charitableCash",
                        label:   "Cash donations to qualifying organizations",
                        helpText:"Requires bank record or written acknowledgment from charity. Check/credit card gifts over $250 need written receipt.",
                        type:    "number",
                        prefix:  "$",
                    },
                    {
                        id:      "charitableNonCash",
                        label:   "Non-cash donations (FMV of donated property)",
                        helpText:"Clothing, household goods, furniture, art. Need Form 8283 if FMV > $500. Professional appraisal required if FMV > $5,000.",
                        type:    "number",
                        prefix:  "$",
                    },
                    {
                        id:      "charitableMileage",
                        label:   "Miles driven for volunteer charity work",
                        helpText:"IRS charity mileage rate: $0.14/mile. Deductible for driving to volunteer activities.",
                        type:    "number",
                        suffix:  "miles",
                    },
                ],
            },
            {
                title: "Medical & Dental Expenses (Schedule A Lines 1-4)",
                questions: [
                    {
                        id:      "medicalExpenses",
                        label:   "Unreimbursed medical and dental expenses paid in 2024",
                        helpText:"Only the amount exceeding 7.5% of your AGI is deductible. Include premiums paid after-tax, doctor/hospital/dental bills, prescriptions, qualifying medical equipment.",
                        type:    "number",
                        prefix:  "$",
                    },
                ],
            },
            {
                title: "Investment & Other Itemized Deductions",
                questions: [
                    {
                        id:      "investmentInterest",
                        label:   "Investment interest expense",
                        helpText:"Interest you paid on money borrowed to invest. Limited to net investment income.",
                        type:    "number",
                        prefix:  "$",
                    },
                    {
                        id:      "casualtyLoss",
                        label:   "Casualty or theft losses (federally declared disaster areas only)",
                        helpText:"Personal casualty losses are only deductible if in a federally declared disaster area. Subject to $100 floor and 10% AGI floor.",
                        type:    "number",
                        prefix:  "$",
                    },
                ],
            },
        ],
    },

    // ── SECTION 10: Tax Credits ────────────────────────────────────────────────
    {
        id: "credits",
        title: "Tax Credits",
        icon: "star",
        subsections: [
            {
                title: "Child & Dependent Care Credit (Form 2441)",
                questions: [
                    {
                        id:      "childcareExpenses",
                        label:   "Childcare / dependent care expenses paid in 2024",
                        helpText:"Daycare, after-school programs, summer day camp. NOT overnight camp or tuition. Must have earned income. 2024 limit: $3,000 (1 child) or $6,000 (2+ children).",
                        type:    "number",
                        prefix:  "$",
                        condition:(d) => (d.numQualifyingChildren + d.numOtherDependents) > 0,
                    },
                    {
                        id:        "childcareProviderEIN",
                        label:     "Care provider's EIN or SSN",
                        type:      "text",
                        helpText: "Required on Form 2441.",
                        condition: (d) => (d.childcareExpenses || 0) > 0,
                    },
                ],
            },
            {
                title: "Education Credits (Form 8863)",
                questions: [
                    {
                        id:      "educationType",
                        label:   "Which education credit applies?",
                        type:    "select",
                        options: [
                            { value: "none", label: "No education credit" },
                            { value: "aoc",  label: "American Opportunity Credit (AOC) — first 4 years of college" },
                            { value: "llc",  label: "Lifetime Learning Credit (LLC) — any year of education" },
                        ],
                        helpText:"AOC: Max $2,500/year, 40% refundable, only for first 4 years. LLC: Max $2,000/year, never refundable, any year.",
                    },
                    {
                        id:        "studentIsFirstFourYears",
                        label:     "Is the student in their first four years of higher education?",
                        type:      "boolean",
                        condition: (d) => d.educationType === "aoc",
                    },
                    {
                        id:        "educationExpenses",
                        label:     "Qualified tuition and fees paid (Form 1098-T Box 1)",
                        type:      "number",
                        prefix:    "$",
                        helpText: "Tuition, required fees, books required for enrollment. NOT room & board.",
                        condition: (d) => d.educationType !== "none",
                    },
                ],
            },
            {
                title: "Retirement Savings Contributions Credit — Saver's Credit (Form 8880)",
                questions: [
                    {
                        id:      "retirementContribForSaver",
                        label:   "Your retirement contributions for Saver's Credit (IRA + 401k + other)",
                        helpText:"Eligible if AGI ≤ $38,250 (single), ≤ $57,375 (HoH), ≤ $76,500 (MFJ). Credit rate: 50%, 20%, or 10% of up to $2,000 ($4,000 MFJ).",
                        type:    "number",
                        prefix:  "$",
                    },
                ],
            },
            {
                title: "Clean Energy & Electric Vehicle Credits",
                questions: [
                    {
                        id:      "evCreditAmount",
                        label:   "Electric vehicle tax credit amount (Form 8936)",
                        helpText:"Up to $7,500 for new qualifying EVs; up to $4,000 for used. Income phase-outs apply. The credit is non-refundable.",
                        type:    "number",
                        prefix:  "$",
                        max:     7500,
                    },
                    {
                        id:      "solarCreditCost",
                        label:   "Cost of qualifying solar panels, batteries, or geothermal systems installed in 2024",
                        helpText:"30% Residential Clean Energy Credit (Form 5695). Includes solar electric, solar water heating, wind turbines, fuel cells, battery storage.",
                        type:    "number",
                        prefix:  "$",
                        subLabel:"Credit = 30% of this amount",
                    },
                ],
            },
            {
                title: "Other Credits",
                questions: [
                    {
                        id:      "foreignTaxPaid",
                        label:   "Foreign taxes paid (Form 1099-DIV Box 7 or Form 1116)",
                        helpText:"Dollar-for-dollar credit for foreign taxes paid on investment income. Claim directly if ≤ $300 (single) or $600 (MFJ) without Form 1116.",
                        type:    "number",
                        prefix:  "$",
                    },
                    {
                        id:      "adoptionExpenses",
                        label:   "Qualified adoption expenses (Form 8839)",
                        helpText:"Up to $16,810 per child for 2024. Phases out at $252,150-$292,150 MAGI.",
                        type:    "number",
                        prefix:  "$",
                    },
                ],
            },
        ],
    },

    // ── SECTION 11: Health Coverage ────────────────────────────────────────────
    {
        id: "health",
        title: "Health Coverage",
        icon: "health_and_safety",
        subsections: [
            {
                title: "ACA Marketplace Insurance (Form 1095-A)",
                questions: [
                    {
                        id:      "hadMarketplaceInsurance",
                        label:   "Did you have health insurance from the ACA Marketplace (healthcare.gov) in 2024?",
                        helpText:"If yes, you received a Form 1095-A. You must reconcile advance premium tax credits on Form 8962.",
                        type:    "boolean",
                    },
                    {
                        id:        "form1095A_premiums",
                        label:     "Form 1095-A — Column A total: Annual premiums paid",
                        type:      "number",
                        prefix:    "$",
                        condition: (d) => d.hadMarketplaceInsurance,
                    },
                    {
                        id:        "form1095A_slcsp",
                        label:     "Form 1095-A — Column B total: Annual SLCSP premiums",
                        type:      "number",
                        prefix:    "$",
                        helpText: "Second Lowest Cost Silver Plan — provided on Form 1095-A.",
                        condition: (d) => d.hadMarketplaceInsurance,
                    },
                    {
                        id:        "form1095A_advCredit",
                        label:     "Form 1095-A — Column C total: Advance PTC received",
                        type:      "number",
                        prefix:    "$",
                        helpText: "Amount the government already paid to your insurer on your behalf.",
                        condition: (d) => d.hadMarketplaceInsurance,
                    },
                ],
            },
            {
                title: "Health Coverage Status",
                questions: [
                    {
                        id:      "wholeYearCoverage",
                        label:   "Were you and all dependents covered by health insurance for all 12 months of 2024?",
                        type:    "boolean",
                        helpText:"Since 2019, there is no federal penalty for lacking coverage — this is informational only.",
                    },
                ],
            },
        ],
    },

    // ── SECTION 12: Estimated Tax Payments ────────────────────────────────────
    {
        id: "estimated",
        title: "Estimated Payments",
        icon: "payments",
        subsections: [
            {
                title: "Quarterly Estimated Tax Payments (Form 1040-ES)",
                questions: [
                    {
                        id:      "estimatedTaxQ1",
                        label:   "Q1 payment (due April 15, 2024)",
                        type:    "number",
                        prefix:  "$",
                        helpText:"Direct payments to IRS via EFTPS, check, or IRS Direct Pay — not W-2 withholding.",
                    },
                    {
                        id:      "estimatedTaxQ2",
                        label:   "Q2 payment (due June 17, 2024)",
                        type:    "number",
                        prefix:  "$",
                    },
                    {
                        id:      "estimatedTaxQ3",
                        label:   "Q3 payment (due September 16, 2024)",
                        type:    "number",
                        prefix:  "$",
                    },
                    {
                        id:      "estimatedTaxQ4",
                        label:   "Q4 payment (due January 15, 2025)",
                        type:    "number",
                        prefix:  "$",
                    },
                ],
            },
        ],
    },
]
