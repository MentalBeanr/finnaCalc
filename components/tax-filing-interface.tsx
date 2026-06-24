"use client"

import type React from "react"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Container } from "@/components/ds/container"
import { Section } from "@/components/ds/section"
import { MaterialIcon } from "@/components/ds/material-icon"
import { calculateStateTax, isDirectFileEligible, STATE_TAXES } from "@/lib/taxes/state-taxes"
import { openTaxSummaryPDF } from "@/lib/taxes/generate-pdf"

interface TaxFilingInterfaceProps {
    onBack: () => void
}

interface UploadedFile {
    name: string
    size: number
    type: string
}

interface TaxCalculation {
    totalIncome: number
    agi: number
    deduction: number
    usingItemized: boolean
    itemizedTotal: number
    standardDeduction: number
    taxableIncome: number
    taxBeforeCredits: number
    credits: number
    taxAfterCredits: number
    withheld: number
    refundOrOwed: number
    owes: boolean
    marginalRate: number
    state: string
}

const US_STATES = [
    "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
    "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
    "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
    "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
    "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY", "DC",
]

const STEPS = [
    "Choose Filing Type",
    "Personal Information",
    "Income Sources",
    "Deductions & Credits",
    "Review & File",
]

const FILING_TYPES = [
    {
        id: "simple",
        title: "Simple File",
        description: "For W-2 employees with straightforward tax situations.",
        icon: "group",
        price: "$1",
        features: [
            "W-2 income only",
            "Interest & dividend income under $1,500",
            "Standard deduction",
            "Basic credits (EITC, Child Tax Credit)",
            "Direct deposit",
        ],
    },
    {
        id: "complex",
        title: "Complex File",
        description: "For self-employed, investors, homeowners, and itemizers.",
        icon: "business_center",
        price: "$10",
        features: [
            "All simple features",
            "Self-employment income (1099-NEC, Schedule C)",
            "Stocks, crypto, rental property",
            "Itemized deductions (mortgage, donations)",
            "Business expenses & home office",
        ],
    },
]

const FILING_STATUSES = [
    "Single",
    "Married Filing Jointly",
    "Married Filing Separately",
    "Head of Household",
]

export default function TaxFilingInterface({ onBack }: TaxFilingInterfaceProps) {
    const [currentStep, setCurrentStep] = useState(0)
    const [filingType, setFilingType] = useState("")
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        ssn: "",
        dateOfBirth: "",
        address: "",
        city: "",
        state: "",
        zip: "",
        filingStatus: "",
        w2Income: "",
        w2Withheld: "",
        income1099: "",
        interestIncome: "",
        dividendIncome: "",
        capitalGains: "",
        businessIncome: "",
        rentalIncome: "",
        retirementIncome: "",
        mortgageInterest: "",
        propertyTaxes: "",
        charitableDonations: "",
        studentLoanInterest: "",
        medicalExpenses: "",
        stateLocalTaxes: "",
        numChildren: "",
        childcareExpenses: "",
        educationExpenses: "",
        stateWithheld: "",
        routingNumber: "",
        accountNumber: "",
        accountType: "checking",
    })
    const [taxCalculation, setTaxCalculation] = useState<TaxCalculation | null>(null)
    const [stateTaxResult, setStateTaxResult] = useState<ReturnType<typeof calculateStateTax> | null>(null)

    const updateForm = (field: keyof typeof formData, value: string) =>
        setFormData((prev) => ({ ...prev, [field]: value }))

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files
        if (files) {
            const newFiles: UploadedFile[] = Array.from(files).map((file) => ({
                name: file.name,
                size: file.size,
                type: file.type,
            }))
            setUploadedFiles((prev) => [...prev, ...newFiles])
        }
    }

    const removeFile = (index: number) => {
        setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        const files = e.dataTransfer.files
        if (files) {
            const newFiles: UploadedFile[] = Array.from(files).map((file) => ({
                name: file.name,
                size: file.size,
                type: file.type,
            }))
            setUploadedFiles((prev) => [...prev, ...newFiles])
        }
    }

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + " B"
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
        return (bytes / (1024 * 1024)).toFixed(1) + " MB"
    }

    const calculateTaxes = () => {
        const totalIncome =
            (Number.parseFloat(formData.w2Income) || 0) +
            (Number.parseFloat(formData.income1099) || 0) +
            (Number.parseFloat(formData.interestIncome) || 0) +
            (Number.parseFloat(formData.dividendIncome) || 0) +
            (Number.parseFloat(formData.capitalGains) || 0) +
            (Number.parseFloat(formData.businessIncome) || 0) +
            (Number.parseFloat(formData.rentalIncome) || 0) +
            (Number.parseFloat(formData.retirementIncome) || 0)

        const studentLoanInterest = Math.min(Number.parseFloat(formData.studentLoanInterest) || 0, 2500)
        const agi = totalIncome - studentLoanInterest

        let standardDeduction = 14600
        if (formData.filingStatus === "Married Filing Jointly") standardDeduction = 29200
        if (formData.filingStatus === "Head of Household") standardDeduction = 21900

        const mortgageInterest = Number.parseFloat(formData.mortgageInterest) || 0
        const propertyTaxes = Number.parseFloat(formData.propertyTaxes) || 0
        const charitable = Number.parseFloat(formData.charitableDonations) || 0
        const medical = Math.max(0, (Number.parseFloat(formData.medicalExpenses) || 0) - agi * 0.075)
        const saltCap = Math.min((Number.parseFloat(formData.stateLocalTaxes) || 0) + propertyTaxes, 10000)

        const itemizedTotal = mortgageInterest + charitable + medical + saltCap
        const deduction = Math.max(standardDeduction, itemizedTotal)
        const usingItemized = itemizedTotal > standardDeduction
        const taxableIncome = Math.max(0, agi - deduction)

        let tax = 0
        let marginalRate = 0
        if (formData.filingStatus === "Married Filing Jointly") {
            if (taxableIncome <= 23200) { tax = taxableIncome * 0.10; marginalRate = 10 }
            else if (taxableIncome <= 94300) { tax = 2320 + (taxableIncome - 23200) * 0.12; marginalRate = 12 }
            else if (taxableIncome <= 201050) { tax = 10852 + (taxableIncome - 94300) * 0.22; marginalRate = 22 }
            else if (taxableIncome <= 383900) { tax = 34337 + (taxableIncome - 201050) * 0.24; marginalRate = 24 }
            else if (taxableIncome <= 487450) { tax = 78221 + (taxableIncome - 383900) * 0.32; marginalRate = 32 }
            else if (taxableIncome <= 731200) { tax = 111357 + (taxableIncome - 487450) * 0.35; marginalRate = 35 }
            else { tax = 196669.50 + (taxableIncome - 731200) * 0.37; marginalRate = 37 }
        } else if (formData.filingStatus === "Head of Household") {
            if (taxableIncome <= 16550) { tax = taxableIncome * 0.10; marginalRate = 10 }
            else if (taxableIncome <= 63100) { tax = 1655 + (taxableIncome - 16550) * 0.12; marginalRate = 12 }
            else if (taxableIncome <= 100500) { tax = 7241 + (taxableIncome - 63100) * 0.22; marginalRate = 22 }
            else if (taxableIncome <= 191950) { tax = 15469 + (taxableIncome - 100500) * 0.24; marginalRate = 24 }
            else if (taxableIncome <= 243700) { tax = 37417 + (taxableIncome - 191950) * 0.32; marginalRate = 32 }
            else if (taxableIncome <= 609350) { tax = 53977 + (taxableIncome - 243700) * 0.35; marginalRate = 35 }
            else { tax = 181954.50 + (taxableIncome - 609350) * 0.37; marginalRate = 37 }
        } else {
            if (taxableIncome <= 11600) { tax = taxableIncome * 0.10; marginalRate = 10 }
            else if (taxableIncome <= 47150) { tax = 1160 + (taxableIncome - 11600) * 0.12; marginalRate = 12 }
            else if (taxableIncome <= 100525) { tax = 5426 + (taxableIncome - 47150) * 0.22; marginalRate = 22 }
            else if (taxableIncome <= 191950) { tax = 17168.50 + (taxableIncome - 100525) * 0.24; marginalRate = 24 }
            else if (taxableIncome <= 243725) { tax = 39110.50 + (taxableIncome - 191950) * 0.32; marginalRate = 32 }
            else if (taxableIncome <= 609350) { tax = 55678.50 + (taxableIncome - 243725) * 0.35; marginalRate = 35 }
            else { tax = 183647.25 + (taxableIncome - 609350) * 0.37; marginalRate = 37 }
        }

        let credits = 0
        const numChildren = Number.parseInt(formData.numChildren) || 0
        if (numChildren > 0) credits += numChildren * 2000
        const childcareExpenses = Number.parseFloat(formData.childcareExpenses) || 0
        if (childcareExpenses > 0) {
            const maxExpenses = numChildren === 1 ? 3000 : numChildren >= 2 ? 6000 : 0
            credits += Math.min(childcareExpenses, maxExpenses) * 0.20
        }
        const educationExpenses = Number.parseFloat(formData.educationExpenses) || 0
        if (educationExpenses > 0) {
            credits += Math.min(
                2500,
                Math.min(educationExpenses, 2000) + Math.max(0, Math.min(educationExpenses - 2000, 2000)) * 0.25,
            )
        }

        const taxAfterCredits = Math.max(0, tax - credits)
        const withheld = Number.parseFloat(formData.w2Withheld) || 0
        const refundOrOwed = withheld - taxAfterCredits

        const filingStatusKey =
            formData.filingStatus === "Married Filing Jointly"   ? "married_jointly"    :
            formData.filingStatus === "Married Filing Separately" ? "married_separately" :
            formData.filingStatus === "Head of Household"         ? "head_of_household"  :
            "single"

        const stateResult = calculateStateTax(agi, formData.state, filingStatusKey)
        setStateTaxResult(stateResult)

        setTaxCalculation({
            totalIncome,
            agi,
            deduction,
            usingItemized,
            itemizedTotal,
            standardDeduction,
            taxableIncome,
            taxBeforeCredits: tax,
            credits,
            taxAfterCredits,
            withheld,
            refundOrOwed,
            owes: refundOrOwed < 0,
            marginalRate,
            state: formData.state,
        })
    }

    const nextStep = () => {
        if (currentStep < STEPS.length - 1) {
            if (currentStep === 3) calculateTaxes()
            setCurrentStep(currentStep + 1)
        }
    }

    const prevStep = () => {
        if (currentStep > 0) setCurrentStep(currentStep - 1)
    }

    const progress = ((currentStep + 1) / STEPS.length) * 100

    const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 0 })

    return (
        <div className="flex flex-col">
            <Section spacing="default" className="pt-section-gap-sm pb-0">
                <Container className="flex flex-col gap-stack-lg">
                    <button
                        onClick={onBack}
                        className="inline-flex items-center gap-stack-sm self-start font-ui-button text-ui-button uppercase tracking-[0.05em] text-on-surface-variant hover:text-primary transition-colors"
                    >
                        <MaterialIcon name="arrow_back" size={16} />
                        Back
                    </button>
                    <h1 className="font-headline-display text-[56px] leading-[1.1] tracking-[-0.02em] text-primary">
                        Easy Tax Filing
                    </h1>
                    <p className="font-body-lg text-body-lg text-on-surface-variant max-w-prose">
                        Simple, step-by-step tax preparation.
                    </p>
                </Container>
            </Section>

            <Section spacing="default">
                <Container className="flex flex-col gap-gutter">
                    {/* Progress */}
                    <div className="border border-outline-variant/30 rounded-lg bg-surface-container-lowest p-6 flex flex-col gap-stack-md">
                        <div className="flex justify-between items-center">
                            <p className="font-body-md text-body-md text-on-surface font-semibold">
                                Filing Progress
                            </p>
                            <p className="font-label-caps text-label-caps uppercase tracking-[0.15em] text-on-surface-variant">
                                Step {currentStep + 1} of {STEPS.length}
                            </p>
                        </div>
                        <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary rounded-full transition-all"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <div className="flex justify-between">
                            {STEPS.map((step, index) => (
                                <span
                                    key={index}
                                    className={`font-label-caps uppercase tracking-[0.15em] text-[10px] ${
                                        index <= currentStep ? "text-primary" : "text-on-surface-variant"
                                    }`}
                                >
                                    {step}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Step 0: Choose Filing Type */}
                    {currentStep === 0 && (
                        <div className="border border-outline-variant/30 rounded-lg bg-surface-container-lowest p-10 flex flex-col gap-stack-lg">
                            <div className="text-center">
                                <h2 className="font-headline-md text-headline-md text-primary mb-stack-sm">
                                    Choose Your Filing Type
                                </h2>
                                <p className="font-body-md text-body-md text-on-surface-variant">
                                    Select the option that best describes your tax situation.
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-gutter">
                                {FILING_TYPES.map((type) => (
                                    <button
                                        key={type.id}
                                        onClick={() => setFilingType(type.id)}
                                        className={`flex flex-col items-center p-8 rounded-lg border transition-colors text-left ${
                                            filingType === type.id
                                                ? "border-primary bg-primary/5"
                                                : "border-outline-variant/30 hover:border-primary/40"
                                        }`}
                                    >
                                        <MaterialIcon name={type.icon} size={32} className="text-primary mb-stack-md" />
                                        <p className="font-headline-md text-headline-md text-primary mb-stack-sm">
                                            {type.title}
                                        </p>
                                        <p className="font-body-md text-body-md text-on-surface-variant mb-stack-md text-center">
                                            {type.description}
                                        </p>
                                        <p className="font-headline-md text-[32px] text-primary mb-stack-lg">
                                            {type.price}
                                        </p>
                                        <ul className="flex flex-col gap-stack-sm w-full">
                                            {type.features.map((feature, i) => (
                                                <li
                                                    key={i}
                                                    className="flex items-center gap-stack-sm font-body-md text-body-md text-on-surface-variant"
                                                >
                                                    <MaterialIcon name="check_circle" size={16} className="text-success flex-shrink-0" />
                                                    {feature}
                                                </li>
                                            ))}
                                        </ul>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 1: Personal Information */}
                    {currentStep === 1 && (
                        <div className="border border-outline-variant/30 rounded-lg bg-surface-container-lowest p-10 flex flex-col gap-stack-lg">
                            <div className="text-center">
                                <h2 className="font-headline-md text-headline-md text-primary mb-stack-sm">
                                    Personal Information
                                </h2>
                                <p className="font-body-md text-body-md text-on-surface-variant">
                                    Tell us about yourself and your filing status.
                                </p>
                            </div>

                            <div className="max-w-2xl mx-auto flex flex-col gap-stack-lg w-full">
                                <div className="grid grid-cols-2 gap-stack-md">
                                    <div className="flex flex-col gap-stack-sm">
                                        <Label htmlFor="firstName">First Name</Label>
                                        <Input id="firstName" placeholder="John" value={formData.firstName} onChange={(e) => updateForm("firstName", e.target.value)} />
                                    </div>
                                    <div className="flex flex-col gap-stack-sm">
                                        <Label htmlFor="lastName">Last Name</Label>
                                        <Input id="lastName" placeholder="Doe" value={formData.lastName} onChange={(e) => updateForm("lastName", e.target.value)} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-stack-md">
                                    <div className="flex flex-col gap-stack-sm">
                                        <Label htmlFor="ssn">Social Security Number</Label>
                                        <Input id="ssn" placeholder="XXX-XX-XXXX" type="password" value={formData.ssn} onChange={(e) => updateForm("ssn", e.target.value)} />
                                    </div>
                                    <div className="flex flex-col gap-stack-sm">
                                        <Label htmlFor="dateOfBirth">Date of Birth</Label>
                                        <Input id="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={(e) => updateForm("dateOfBirth", e.target.value)} />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-stack-sm">
                                    <Label htmlFor="address">Street Address</Label>
                                    <Input id="address" placeholder="123 Main St" value={formData.address} onChange={(e) => updateForm("address", e.target.value)} />
                                </div>

                                <div className="grid grid-cols-3 gap-stack-md">
                                    <div className="flex flex-col gap-stack-sm">
                                        <Label htmlFor="city">City</Label>
                                        <Input id="city" placeholder="Anytown" value={formData.city} onChange={(e) => updateForm("city", e.target.value)} />
                                    </div>
                                    <div className="flex flex-col gap-stack-sm">
                                        <Label htmlFor="state">State</Label>
                                        <Select value={formData.state} onValueChange={(value) => updateForm("state", value)}>
                                            <SelectTrigger id="state">
                                                <SelectValue placeholder="Select State" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {US_STATES.map((state) => (
                                                    <SelectItem key={state} value={state}>{state}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex flex-col gap-stack-sm">
                                        <Label htmlFor="zip">ZIP Code</Label>
                                        <Input id="zip" placeholder="12345" value={formData.zip} onChange={(e) => updateForm("zip", e.target.value)} />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-stack-sm">
                                    <Label>Filing Status</Label>
                                    <div className="grid grid-cols-4 gap-stack-sm">
                                        {FILING_STATUSES.map((status) => (
                                            <button
                                                key={status}
                                                onClick={() => updateForm("filingStatus", status)}
                                                className={`p-3 rounded-lg border font-body-md text-body-md text-center transition-colors ${
                                                    formData.filingStatus === status
                                                        ? "border-primary bg-primary/5 text-primary"
                                                        : "border-outline-variant/30 text-on-surface-variant hover:border-primary/40"
                                                }`}
                                            >
                                                {status}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Income Sources */}
                    {currentStep === 2 && (
                        <div className="border border-outline-variant/30 rounded-lg bg-surface-container-lowest p-10 flex flex-col gap-stack-lg">
                            <div className="text-center">
                                <h2 className="font-headline-md text-headline-md text-primary mb-stack-sm">
                                    Income Sources
                                </h2>
                                <p className="font-body-md text-body-md text-on-surface-variant">
                                    Let&apos;s gather information about your income.
                                </p>
                            </div>

                            <div className="max-w-2xl mx-auto flex flex-col gap-stack-lg w-full">
                                <div className="border border-outline-variant/30 rounded-lg p-6 flex flex-col gap-stack-md">
                                    <div>
                                        <p className="font-body-md text-body-md text-on-surface font-semibold mb-stack-sm">
                                            Upload Tax Documents (Optional)
                                        </p>
                                        <p className="font-body-md text-body-md text-on-surface-variant">
                                            Upload your W-2s, 1099s, and other tax documents.
                                        </p>
                                    </div>
                                    <div
                                        className="border-2 border-dashed border-outline-variant/40 rounded-lg p-8 text-center hover:border-primary/40 transition-colors"
                                        onDragOver={handleDragOver}
                                        onDrop={handleDrop}
                                    >
                                        <MaterialIcon name="upload" size={48} className="text-on-surface-variant mx-auto mb-stack-md" />
                                        <p className="font-body-md text-body-md text-on-surface-variant mb-stack-md">
                                            Drag and drop your tax documents here, or click to browse
                                        </p>
                                        <input
                                            type="file"
                                            id="fileUpload"
                                            multiple
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            className="hidden"
                                            onChange={handleFileUpload}
                                        />
                                        <button
                                            onClick={() => document.getElementById("fileUpload")?.click()}
                                            className="inline-flex items-center gap-stack-sm px-4 py-2 rounded-lg border border-outline-variant/40 font-ui-button text-ui-button uppercase tracking-[0.05em] text-on-surface-variant hover:border-primary/40 hover:text-primary transition-colors"
                                        >
                                            Choose Files
                                        </button>
                                        <p className="font-label-caps uppercase tracking-[0.15em] text-[10px] text-on-surface-variant mt-stack-sm">
                                            Accepts PDF, JPG, PNG (max 10MB each)
                                        </p>
                                    </div>

                                    {uploadedFiles.length > 0 && (
                                        <div className="flex flex-col gap-stack-sm">
                                            <p className="font-ui-button text-ui-button uppercase tracking-[0.05em] text-on-surface-variant">
                                                Uploaded Documents ({uploadedFiles.length})
                                            </p>
                                            <div className="flex flex-col gap-stack-sm max-h-40 overflow-y-auto">
                                                {uploadedFiles.map((file, index) => (
                                                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-surface-container">
                                                        <div className="flex items-center gap-stack-sm">
                                                            <MaterialIcon name="description" size={20} className="text-primary" />
                                                            <div>
                                                                <p className="font-body-md text-body-md text-on-surface truncate max-w-[200px]">
                                                                    {file.name}
                                                                </p>
                                                                <p className="font-label-caps uppercase tracking-[0.15em] text-[10px] text-on-surface-variant">
                                                                    {formatFileSize(file.size)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => removeFile(index)}
                                                            className="p-1 rounded text-on-surface-variant hover:text-error transition-colors"
                                                        >
                                                            <MaterialIcon name="close" size={16} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="w-full h-px bg-outline-variant/30" />

                                <div className="flex flex-col gap-stack-md">
                                    <p className="font-body-md text-body-md text-on-surface font-semibold">
                                        Enter income manually:
                                    </p>

                                    <div className="grid grid-cols-2 gap-stack-md">
                                        <div className="flex flex-col gap-stack-sm">
                                            <Label htmlFor="w2Income">W-2 Wages</Label>
                                            <Input id="w2Income" placeholder="$0" type="number" value={formData.w2Income} onChange={(e) => updateForm("w2Income", e.target.value)} />
                                        </div>
                                        <div className="flex flex-col gap-stack-sm">
                                            <Label htmlFor="w2Withheld">Federal Tax Withheld (from W-2)</Label>
                                            <Input id="w2Withheld" placeholder="$0" type="number" value={formData.w2Withheld} onChange={(e) => updateForm("w2Withheld", e.target.value)} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-stack-md">
                                        <div className="flex flex-col gap-stack-sm">
                                            <Label htmlFor="income1099">1099 Income (Freelance/Contract)</Label>
                                            <Input id="income1099" placeholder="$0" type="number" value={formData.income1099} onChange={(e) => updateForm("income1099", e.target.value)} />
                                        </div>
                                        <div className="flex flex-col gap-stack-sm">
                                            <Label htmlFor="interestIncome">Interest Income</Label>
                                            <Input id="interestIncome" placeholder="$0" type="number" value={formData.interestIncome} onChange={(e) => updateForm("interestIncome", e.target.value)} />
                                        </div>
                                    </div>

                                    {filingType === "complex" && (
                                        <>
                                            <div className="grid grid-cols-2 gap-stack-md">
                                                <div className="flex flex-col gap-stack-sm">
                                                    <Label htmlFor="dividendIncome">Dividend Income</Label>
                                                    <Input id="dividendIncome" placeholder="$0" type="number" value={formData.dividendIncome} onChange={(e) => updateForm("dividendIncome", e.target.value)} />
                                                </div>
                                                <div className="flex flex-col gap-stack-sm">
                                                    <Label htmlFor="capitalGains">Capital Gains</Label>
                                                    <Input id="capitalGains" placeholder="$0" type="number" value={formData.capitalGains} onChange={(e) => updateForm("capitalGains", e.target.value)} />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-stack-md">
                                                <div className="flex flex-col gap-stack-sm">
                                                    <Label htmlFor="businessIncome">Business Income (Schedule C)</Label>
                                                    <Input id="businessIncome" placeholder="$0" type="number" value={formData.businessIncome} onChange={(e) => updateForm("businessIncome", e.target.value)} />
                                                </div>
                                                <div className="flex flex-col gap-stack-sm">
                                                    <Label htmlFor="rentalIncome">Rental Property Income</Label>
                                                    <Input id="rentalIncome" placeholder="$0" type="number" value={formData.rentalIncome} onChange={(e) => updateForm("rentalIncome", e.target.value)} />
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-stack-sm">
                                                <Label htmlFor="retirementIncome">Retirement Income (IRA, 401k)</Label>
                                                <Input id="retirementIncome" placeholder="$0" type="number" value={formData.retirementIncome} onChange={(e) => updateForm("retirementIncome", e.target.value)} />
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Deductions & Credits */}
                    {currentStep === 3 && (
                        <div className="border border-outline-variant/30 rounded-lg bg-surface-container-lowest p-10 flex flex-col gap-stack-lg">
                            <div className="text-center">
                                <h2 className="font-headline-md text-headline-md text-primary mb-stack-sm">
                                    Deductions &amp; Credits
                                </h2>
                                <p className="font-body-md text-body-md text-on-surface-variant">
                                    Maximize your refund with available deductions and credits.
                                </p>
                            </div>

                            <div className="max-w-2xl mx-auto flex flex-col gap-stack-lg w-full">
                                <div className="flex items-start gap-stack-md p-4 rounded-lg border border-outline-variant/30 bg-surface-container">
                                    <MaterialIcon name="info" size={20} className="text-primary mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="font-body-md text-body-md text-on-surface font-semibold mb-1">
                                            Standard vs Itemized
                                        </p>
                                        <p className="font-body-md text-body-md text-on-surface-variant">
                                            We&apos;ll automatically choose whichever saves you more money based on the expenses you enter below.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-stack-md">
                                    <p className="font-body-md text-body-md text-on-surface font-semibold">
                                        Common Deductions
                                    </p>

                                    <div className="grid grid-cols-2 gap-stack-md">
                                        <div className="flex flex-col gap-stack-sm">
                                            <Label htmlFor="mortgageInterest">Mortgage Interest Paid</Label>
                                            <Input id="mortgageInterest" placeholder="$0" type="number" value={formData.mortgageInterest} onChange={(e) => updateForm("mortgageInterest", e.target.value)} />
                                        </div>
                                        <div className="flex flex-col gap-stack-sm">
                                            <Label htmlFor="propertyTaxes">Property Taxes Paid</Label>
                                            <Input id="propertyTaxes" placeholder="$0" type="number" value={formData.propertyTaxes} onChange={(e) => updateForm("propertyTaxes", e.target.value)} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-stack-md">
                                        <div className="flex flex-col gap-stack-sm">
                                            <Label htmlFor="charitableDonations">Charitable Donations</Label>
                                            <Input id="charitableDonations" placeholder="$0" type="number" value={formData.charitableDonations} onChange={(e) => updateForm("charitableDonations", e.target.value)} />
                                        </div>
                                        <div className="flex flex-col gap-stack-sm">
                                            <Label htmlFor="stateLocalTaxes">State &amp; Local Taxes (SALT)</Label>
                                            <Input id="stateLocalTaxes" placeholder="$0 (max $10,000)" type="number" value={formData.stateLocalTaxes} onChange={(e) => updateForm("stateLocalTaxes", e.target.value)} />
                                            <p className="font-label-caps uppercase tracking-[0.15em] text-[10px] text-on-surface-variant">
                                                Include state income/sales tax. Capped at $10k with property tax.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-stack-md">
                                        <div className="flex flex-col gap-stack-sm">
                                            <Label htmlFor="medicalExpenses">Medical Expenses</Label>
                                            <Input id="medicalExpenses" placeholder="$0 (over 7.5% AGI)" type="number" value={formData.medicalExpenses} onChange={(e) => updateForm("medicalExpenses", e.target.value)} />
                                        </div>
                                        <div className="flex flex-col gap-stack-sm">
                                            <Label htmlFor="studentLoanInterest">Student Loan Interest Paid</Label>
                                            <Input id="studentLoanInterest" placeholder="$0 (max $2,500)" type="number" value={formData.studentLoanInterest} onChange={(e) => updateForm("studentLoanInterest", e.target.value)} />
                                            <p className="font-label-caps uppercase tracking-[0.15em] text-[10px] text-on-surface-variant">
                                                Above-the-line deduction.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="w-full h-px bg-outline-variant/30" />

                                <div className="flex flex-col gap-stack-md">
                                    <p className="font-body-md text-body-md text-on-surface font-semibold">
                                        Common Tax Credits
                                    </p>

                                    <div className="grid grid-cols-2 gap-stack-md">
                                        <div className="flex flex-col gap-stack-sm">
                                            <Label htmlFor="numChildren">Number of Qualifying Children (under 17)</Label>
                                            <Input id="numChildren" type="number" placeholder="0" value={formData.numChildren} onChange={(e) => updateForm("numChildren", e.target.value)} />
                                            <p className="font-label-caps uppercase tracking-[0.15em] text-[10px] text-on-surface-variant">
                                                For Child Tax Credit (up to $2,000 each)
                                            </p>
                                        </div>
                                        <div className="flex flex-col gap-stack-sm">
                                            <Label htmlFor="childcareExpenses">Childcare Expenses Paid</Label>
                                            <Input id="childcareExpenses" placeholder="$0" type="number" value={formData.childcareExpenses} onChange={(e) => updateForm("childcareExpenses", e.target.value)} />
                                            <p className="font-label-caps uppercase tracking-[0.15em] text-[10px] text-on-surface-variant">
                                                For Child &amp; Dependent Care Credit
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-stack-sm">
                                        <Label htmlFor="educationExpenses">Qualified Education Expenses (College)</Label>
                                        <Input id="educationExpenses" placeholder="$0" type="number" value={formData.educationExpenses} onChange={(e) => updateForm("educationExpenses", e.target.value)} />
                                        <p className="font-label-caps uppercase tracking-[0.15em] text-[10px] text-on-surface-variant">
                                            For American Opportunity or Lifetime Learning Credits
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Review & File */}
                    {currentStep === 4 && taxCalculation && (
                        <div className="flex flex-col gap-gutter">
                            {/* Federal Tax Summary */}
                            <div className="border border-outline-variant/30 rounded-lg bg-surface-container-lowest p-10 flex flex-col gap-stack-lg">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h2 className="font-headline-md text-headline-md text-primary mb-stack-sm">
                                            Review &amp; File
                                        </h2>
                                        <p className="font-body-md text-body-md text-on-surface-variant">
                                            Review your federal tax return summary
                                            {taxCalculation.state ? ` (${taxCalculation.state})` : ""} before filing.
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => openTaxSummaryPDF({
                                            filingStatus: formData.filingStatus === "Married Filing Jointly" ? "married_jointly" :
                                                          formData.filingStatus === "Married Filing Separately" ? "married_separately" :
                                                          formData.filingStatus === "Head of Household" ? "head_of_household" : "single",
                                            state: taxCalculation.state,
                                            taxYear: 2024,
                                            totalIncome: taxCalculation.totalIncome,
                                            agi: taxCalculation.agi,
                                            deduction: taxCalculation.deduction,
                                            usingItemized: taxCalculation.usingItemized,
                                            taxableIncome: taxCalculation.taxableIncome,
                                            taxBeforeCredits: taxCalculation.taxBeforeCredits,
                                            credits: taxCalculation.credits,
                                            taxAfterCredits: taxCalculation.taxAfterCredits,
                                            withheld: taxCalculation.withheld,
                                            refundOrOwed: taxCalculation.refundOrOwed,
                                            owes: taxCalculation.owes,
                                            marginalRate: taxCalculation.marginalRate / 100,
                                            effectiveFederalRate: taxCalculation.taxableIncome > 0 ? taxCalculation.taxAfterCredits / taxCalculation.taxableIncome : 0,
                                            stateName: stateTaxResult?.stateName ?? taxCalculation.state,
                                            stateNoIncomeTax: stateTaxResult?.noIncomeTax ?? false,
                                            stateTaxableIncome: stateTaxResult?.taxableIncome ?? 0,
                                            stateTax: stateTaxResult?.stateTax ?? 0,
                                            stateEffectiveRate: stateTaxResult?.effectiveRate ?? 0,
                                            stateWithheld: formData.stateWithheld ? Number(formData.stateWithheld) : undefined,
                                            firstName: formData.firstName,
                                            lastName: formData.lastName,
                                        })}
                                        className="inline-flex items-center gap-stack-sm px-4 py-2 rounded-lg border border-outline-variant/40 font-ui-button text-ui-button uppercase tracking-[0.05em] text-on-surface-variant hover:border-primary/40 hover:text-primary transition-colors flex-shrink-0"
                                    >
                                        <MaterialIcon name="download" size={16} />
                                        Export PDF
                                    </button>
                                </div>

                                <div className="max-w-2xl mx-auto flex flex-col gap-stack-md w-full">
                                    <p className="font-ui-button text-ui-button uppercase tracking-[0.05em] text-on-surface-variant flex items-center gap-stack-sm">
                                        <MaterialIcon name="attach_money" size={16} className="text-success" />
                                        Federal Tax Summary
                                    </p>

                                    <div className="flex justify-between items-center p-3 rounded-lg bg-surface-container">
                                        <span className="font-body-md text-body-md text-on-surface-variant">Total Income</span>
                                        <span className="font-body-md text-body-md text-on-surface font-semibold">${fmt(taxCalculation.totalIncome)}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 rounded-lg bg-surface-container">
                                        <span className="font-body-md text-body-md text-on-surface-variant">Adjusted Gross Income (AGI)</span>
                                        <span className="font-body-md text-body-md text-on-surface font-semibold">${fmt(taxCalculation.agi)}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 rounded-lg bg-surface-container">
                                        <span className="font-body-md text-body-md text-on-surface-variant">
                                            {taxCalculation.usingItemized ? "Itemized" : "Standard"} Deduction
                                        </span>
                                        <span className="font-body-md text-body-md text-on-surface font-semibold">${fmt(taxCalculation.deduction)}</span>
                                    </div>
                                    {taxCalculation.usingItemized && (
                                        <p className="font-body-md text-body-md text-success text-center">
                                            Itemizing saves you ${fmt(taxCalculation.itemizedTotal - taxCalculation.standardDeduction)} more!
                                        </p>
                                    )}
                                    <div className="flex justify-between items-center p-3 rounded-lg bg-surface-container">
                                        <span className="font-body-md text-body-md text-on-surface-variant">Taxable Income</span>
                                        <span className="font-body-md text-body-md text-on-surface font-semibold">${fmt(taxCalculation.taxableIncome)}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 rounded-lg bg-surface-container">
                                        <span className="font-body-md text-body-md text-on-surface-variant">Federal Tax Before Credits</span>
                                        <span className="font-body-md text-body-md text-on-surface font-semibold">${fmt(taxCalculation.taxBeforeCredits)}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 rounded-lg bg-success/10">
                                        <span className="font-body-md text-body-md text-on-surface-variant">Tax Credits Applied</span>
                                        <span className="font-body-md text-body-md text-success font-semibold">-${fmt(taxCalculation.credits)}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 rounded-lg bg-surface-container">
                                        <span className="font-body-md text-body-md text-on-surface-variant">Total Federal Tax Liability</span>
                                        <span className="font-body-md text-body-md text-on-surface font-semibold">${fmt(taxCalculation.taxAfterCredits)}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 rounded-lg bg-surface-container">
                                        <span className="font-body-md text-body-md text-on-surface-variant">Federal Tax Withheld</span>
                                        <span className="font-body-md text-body-md text-on-surface font-semibold">${fmt(taxCalculation.withheld)}</span>
                                    </div>

                                    <div className="w-full h-px bg-outline-variant/30" />

                                    <div
                                        className={`flex justify-between items-center p-4 rounded-lg ${
                                            taxCalculation.owes ? "bg-error/10" : "bg-success/10"
                                        }`}
                                    >
                                        <span className="font-body-md text-body-md text-on-surface font-semibold">
                                            {taxCalculation.owes ? "Amount Owed (Federal)" : "Estimated Refund (Federal)"}
                                        </span>
                                        <span className={`font-headline-md text-[28px] font-bold ${taxCalculation.owes ? "text-error" : "text-success"}`}>
                                            ${fmt(Math.abs(taxCalculation.refundOrOwed))}
                                        </span>
                                    </div>

                                    <p className="font-label-caps uppercase tracking-[0.15em] text-[10px] text-on-surface-variant text-center">
                                        *This is an estimate for federal taxes only. State taxes are not included. Consult a tax professional for state tax liability.
                                    </p>
                                </div>
                            </div>

                            {/* State Tax Summary */}
                            <div className="border border-outline-variant/30 rounded-lg bg-surface-container-lowest p-10 flex flex-col gap-stack-lg">
                                <p className="font-ui-button text-ui-button uppercase tracking-[0.05em] text-on-surface-variant flex items-center gap-stack-sm">
                                    <MaterialIcon name="description" size={16} />
                                    State Tax Summary — {stateTaxResult?.stateName ?? (taxCalculation.state || "N/A")}
                                </p>
                                {stateTaxResult?.noIncomeTax ? (
                                    <div className="flex items-center gap-stack-md p-4 rounded-lg bg-success/10">
                                        <MaterialIcon name="check_circle" size={20} className="text-success flex-shrink-0" />
                                        <p className="font-body-md text-body-md text-on-surface">
                                            <strong>{stateTaxResult.stateName}</strong> has no state income tax. $0 owed.
                                        </p>
                                    </div>
                                ) : stateTaxResult ? (
                                    <div className="max-w-2xl mx-auto flex flex-col gap-stack-md w-full">
                                        {[
                                            ["State Taxable Income", `$${(stateTaxResult.taxableIncome).toLocaleString("en-US",{maximumFractionDigits:0})}`],
                                            ["State Tax Liability", `$${(stateTaxResult.stateTax).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}`],
                                            ["Effective State Rate", `${(stateTaxResult.effectiveRate*100).toFixed(2)}%`],
                                        ].map(([label, val]) => (
                                            <div key={label} className="flex justify-between items-center p-3 rounded-lg bg-surface-container">
                                                <span className="font-body-md text-body-md text-on-surface-variant">{label}</span>
                                                <span className="font-body-md text-body-md text-on-surface font-semibold">{val}</span>
                                            </div>
                                        ))}
                                        <div className="flex flex-col gap-stack-sm">
                                            <Label htmlFor="stateWithheld">State Tax Withheld (from W-2 Box 17)</Label>
                                            <Input id="stateWithheld" placeholder="$0" type="number" value={formData.stateWithheld} onChange={e => updateForm("stateWithheld", e.target.value)} />
                                        </div>
                                        {formData.stateWithheld && (
                                            (() => {
                                                const stateOwed = stateTaxResult.stateTax - Number(formData.stateWithheld)
                                                return (
                                                    <div className={`flex justify-between items-center p-4 rounded-lg ${stateOwed > 0 ? "bg-error/10" : "bg-success/10"}`}>
                                                        <span className="font-body-md text-body-md text-on-surface font-semibold">
                                                            {stateOwed > 0 ? "State Tax Owed" : "Estimated State Refund"}
                                                        </span>
                                                        <span className={`font-headline-md text-[24px] font-bold ${stateOwed > 0 ? "text-error" : "text-success"}`}>
                                                            ${Math.abs(stateOwed).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}
                                                        </span>
                                                    </div>
                                                )
                                            })()
                                        )}
                                        <p className="font-label-caps uppercase tracking-[0.15em] text-[10px] text-on-surface-variant text-center">
                                            *State tax estimated using published 2024 {stateTaxResult.stateName} income tax brackets. Consult a professional for exact liability.
                                        </p>
                                    </div>
                                ) : null}
                            </div>

                            {/* Direct Deposit / Payment */}
                            <div className="border border-outline-variant/30 rounded-lg bg-surface-container-lowest p-10 flex flex-col gap-stack-lg">
                                <div>
                                    <p className="font-headline-md text-headline-md text-primary mb-stack-sm">
                                        {taxCalculation.owes ? "Payment Information" : "Direct Deposit"}
                                    </p>
                                    <p className="font-body-md text-body-md text-on-surface-variant">
                                        {taxCalculation.owes
                                            ? "Enter your bank details to pay federal taxes owed electronically."
                                            : "Enter your bank details to receive your federal refund by direct deposit — the fastest option."}
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-gutter max-w-2xl">
                                    <div className="flex flex-col gap-stack-sm">
                                        <Label htmlFor="routingNumber">Routing Number (9 digits)</Label>
                                        <Input id="routingNumber" placeholder="021000021" maxLength={9} value={formData.routingNumber} onChange={e => updateForm("routingNumber", e.target.value.replace(/\D/g,""))} />
                                    </div>
                                    <div className="flex flex-col gap-stack-sm">
                                        <Label htmlFor="accountNumber">Account Number</Label>
                                        <Input id="accountNumber" placeholder="••••••••••" value={formData.accountNumber} onChange={e => updateForm("accountNumber", e.target.value.replace(/\D/g,""))} />
                                    </div>
                                    <div className="flex flex-col gap-stack-sm col-span-2">
                                        <Label>Account Type</Label>
                                        <div className="flex gap-gutter">
                                            {["checking","savings"].map(t => (
                                                <button key={t} onClick={() => updateForm("accountType", t)}
                                                    className={`flex-1 py-2 rounded-lg border font-ui-button text-ui-button uppercase tracking-[0.05em] transition-colors ${formData.accountType===t ? "border-primary bg-primary/5 text-primary" : "border-outline-variant/40 text-on-surface-variant hover:border-primary/40"}`}>
                                                    {t.charAt(0).toUpperCase()+t.slice(1)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                {formData.routingNumber.length===9 && formData.accountNumber.length>=4 && (
                                    <div className="flex items-center gap-stack-sm p-3 rounded-lg bg-success/10 max-w-2xl">
                                        <MaterialIcon name="check_circle" size={16} className="text-success flex-shrink-0" />
                                        <p className="font-body-md text-body-md text-on-surface">Bank account confirmed. Your routing and account numbers look valid.</p>
                                    </div>
                                )}
                                <p className="font-label-caps uppercase tracking-[0.15em] text-[10px] text-on-surface-variant max-w-2xl">
                                    Your banking information is used solely to facilitate direct deposit or tax payment. It is not stored on our servers.
                                </p>
                            </div>

                            {/* Filing Options */}
                            <div className="border border-outline-variant/30 rounded-lg bg-surface-container-lowest p-10 flex flex-col gap-stack-lg">
                                <p className="font-headline-md text-headline-md text-primary">
                                    How to File Your Return
                                </p>
                                <div className="grid grid-cols-2 gap-gutter">
                                    {/* IRS Direct File */}
                                    {isDirectFileEligible(taxCalculation.agi, taxCalculation.state) ? (
                                        <div className="flex flex-col items-center p-8 rounded-lg border border-primary bg-primary/5 text-center gap-stack-md">
                                            <MaterialIcon name="verified" size={32} className="text-primary" />
                                            <div>
                                                <p className="font-body-md text-body-md text-on-surface font-semibold mb-stack-sm">IRS Direct File</p>
                                                <p className="font-body-md text-body-md text-on-surface-variant mb-stack-md">Free, official IRS e-filing — you're eligible based on your income and state.</p>
                                                <span className="font-label-caps text-label-caps uppercase tracking-[0.15em] text-primary border border-primary rounded-full px-3 py-1">
                                                    Free &amp; Recommended
                                                </span>
                                            </div>
                                            <a
                                                href="https://directfile.irs.gov"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-stack-sm px-6 py-3 rounded-lg bg-primary text-on-primary font-ui-button text-ui-button uppercase tracking-[0.05em] hover:opacity-90 transition-opacity w-full justify-center"
                                            >
                                                <MaterialIcon name="open_in_new" size={16} />
                                                File with IRS Direct File
                                            </a>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center p-8 rounded-lg border border-outline-variant/30 text-center gap-stack-md">
                                            <MaterialIcon name="description" size={32} className="text-on-surface-variant" />
                                            <div>
                                                <p className="font-body-md text-body-md text-on-surface font-semibold mb-stack-sm">IRS Free File</p>
                                                <p className="font-body-md text-body-md text-on-surface-variant mb-stack-md">
                                                    {!STATE_TAXES[taxCalculation.state] || taxCalculation.agi > 200_000
                                                        ? `IRS Direct File is not available for ${taxCalculation.state || "your state"} or your income level — use IRS Free File instead.`
                                                        : "Use IRS Free File for guided federal e-filing through partner software."}
                                                </p>
                                            </div>
                                            <a
                                                href="https://www.irs.gov/filing/free-file-do-your-federal-taxes-for-free"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-stack-sm px-6 py-3 rounded-lg border border-primary text-primary font-ui-button text-ui-button uppercase tracking-[0.05em] hover:bg-primary hover:text-on-primary transition-colors w-full justify-center"
                                            >
                                                <MaterialIcon name="open_in_new" size={16} />
                                                IRS Free File
                                            </a>
                                        </div>
                                    )}
                                    {/* Print & Mail */}
                                    <div className="flex flex-col items-center p-8 rounded-lg border border-outline-variant/30 text-center gap-stack-md">
                                        <MaterialIcon name="print" size={32} className="text-on-surface-variant" />
                                        <div>
                                            <p className="font-body-md text-body-md text-on-surface font-semibold mb-stack-sm">Print &amp; Mail</p>
                                            <p className="font-body-md text-body-md text-on-surface-variant mb-stack-md">
                                                Download your tax summary PDF, then complete a paper 1040 and mail to the IRS.
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => openTaxSummaryPDF({
                                                filingStatus: formData.filingStatus === "Married Filing Jointly" ? "married_jointly" :
                                                              formData.filingStatus === "Married Filing Separately" ? "married_separately" :
                                                              formData.filingStatus === "Head of Household" ? "head_of_household" : "single",
                                                state: taxCalculation.state,
                                                taxYear: 2024,
                                                totalIncome: taxCalculation.totalIncome,
                                                agi: taxCalculation.agi,
                                                deduction: taxCalculation.deduction,
                                                usingItemized: taxCalculation.usingItemized,
                                                taxableIncome: taxCalculation.taxableIncome,
                                                taxBeforeCredits: taxCalculation.taxBeforeCredits,
                                                credits: taxCalculation.credits,
                                                taxAfterCredits: taxCalculation.taxAfterCredits,
                                                withheld: taxCalculation.withheld,
                                                refundOrOwed: taxCalculation.refundOrOwed,
                                                owes: taxCalculation.owes,
                                                marginalRate: taxCalculation.marginalRate / 100,
                                                effectiveFederalRate: taxCalculation.taxableIncome > 0 ? taxCalculation.taxAfterCredits / taxCalculation.taxableIncome : 0,
                                                stateName: stateTaxResult?.stateName ?? taxCalculation.state,
                                                stateNoIncomeTax: stateTaxResult?.noIncomeTax ?? false,
                                                stateTaxableIncome: stateTaxResult?.taxableIncome ?? 0,
                                                stateTax: stateTaxResult?.stateTax ?? 0,
                                                stateEffectiveRate: stateTaxResult?.effectiveRate ?? 0,
                                                stateWithheld: formData.stateWithheld ? Number(formData.stateWithheld) : undefined,
                                                firstName: formData.firstName,
                                                lastName: formData.lastName,
                                            })}
                                            className="inline-flex items-center gap-stack-sm px-6 py-3 rounded-lg border border-outline-variant/40 text-on-surface-variant font-ui-button text-ui-button uppercase tracking-[0.05em] hover:border-primary/40 hover:text-primary transition-colors w-full justify-center"
                                        >
                                            <MaterialIcon name="download" size={16} />
                                            Export PDF Summary
                                        </button>
                                    </div>
                                </div>
                                <p className="font-label-caps uppercase tracking-[0.15em] text-[10px] text-on-surface-variant text-center">
                                    IRS filing deadline: April 15, 2025. For extensions use Form 4868 at irs.gov.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Navigation */}
                    <div className="flex justify-between items-center pt-stack-lg border-t border-outline-variant/30">
                        <button
                            onClick={prevStep}
                            disabled={currentStep === 0}
                            className="inline-flex items-center gap-stack-sm px-4 py-2 rounded-lg border border-outline-variant/40 font-ui-button text-ui-button uppercase tracking-[0.05em] text-on-surface-variant hover:border-primary/40 hover:text-primary transition-colors disabled:opacity-40 disabled:pointer-events-none"
                        >
                            <MaterialIcon name="arrow_back" size={16} />
                            Previous
                        </button>

                        <span className="font-label-caps text-label-caps uppercase tracking-[0.15em] text-on-surface-variant">
                            Step {currentStep + 1} of {STEPS.length}
                        </span>

                        <button
                            onClick={nextStep}
                            disabled={
                                (currentStep === 0 && !filingType) ||
                                (currentStep === 1 && (!formData.filingStatus || !formData.state)) ||
                                currentStep === STEPS.length - 1
                            }
                            className="inline-flex items-center gap-stack-sm px-4 py-2 rounded-lg bg-primary text-on-primary font-ui-button text-ui-button uppercase tracking-[0.05em] hover:opacity-90 transition-opacity disabled:opacity-40 disabled:pointer-events-none"
                        >
                            {currentStep === STEPS.length - 2 ? "Review" : "Next"}
                            <MaterialIcon name="arrow_forward" size={16} />
                        </button>
                    </div>
                </Container>
            </Section>
        </div>
    )
}
