"use client"


import type React from "react"


import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    ArrowLeft,
    ArrowRight,
    Upload,
    FileText,
    DollarSign,
    Briefcase,
    Users,
    CheckCircle,
    ExternalLink,
    Shield,
    Banknote,
    AlertCircle,
    X,
} from "lucide-react"


interface TaxFilingInterfaceProps {
    onBack: () => void
}


interface UploadedFile {
    name: string
    size: number
    type: string
}


// List of US states for the dropdown
const usStates = [
    "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
    "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
    "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
    "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
    "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY", "DC" // Added DC
];


export default function TaxFilingInterface({ onBack }: TaxFilingInterfaceProps) {
    const [currentStep, setCurrentStep] = useState(0)
    const [filingType, setFilingType] = useState("")
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
    const [formData, setFormData] = useState({
        // Personal Info
        firstName: "",
        lastName: "",
        ssn: "",
        dateOfBirth: "",
        address: "",
        city: "",
        state: "", // State field for selection
        zip: "",
        filingStatus: "",


        // Income
        w2Income: "",
        w2Withheld: "",
        income1099: "",
        interestIncome: "",
        dividendIncome: "",
        capitalGains: "",
        businessIncome: "",
        rentalIncome: "",
        retirementIncome: "",


        // Deductions & Credits
        mortgageInterest: "",
        propertyTaxes: "",
        charitableDonations: "",
        studentLoanInterest: "",
        medicalExpenses: "",
        stateLocalTaxes: "",


        // Credits
        numChildren: "",
        childcareExpenses: "",
        educationExpenses: "",


        // Flags - Keep these if needed for conditional logic, otherwise remove
        hasW2: false,
        has1099: false,
        hasInvestments: false,
        hasBusiness: false,
        hasRental: false,
        hasDeductions: false,
        hasChildren: false,
        hasChildcare: false,
        hasEducation: false,
    })


    const [taxCalculation, setTaxCalculation] = useState<any>(null)


    const steps = [
        "Choose Filing Type",
        "Personal Information",
        "Income Sources",
        "Deductions & Credits",
        "Review & File",
    ]


    const filingTypes = [
        {
            id: "simple",
            title: "Simple File",
            description: "For W-2 employees with straightforward tax situations.",
            icon: <Users className="h-8 w-8" />,
            price: "$1", // Example price
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
            icon: <Briefcase className="h-8 w-8" />,
            price: "$10", // Example price
            features: [
                "All simple features",
                "Self-employment income (1099-NEC, Schedule C)",
                "Stocks, crypto, rental property",
                "Itemized deductions (mortgage, donations)",
                "Business expenses & home office",
            ],
        },
    ]


    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files
        if (files) {
            const newFiles: UploadedFile[] = Array.from(files).map((file) => ({
                name: file.name,
                size: file.size,
                type: file.type,
            }))
            setUploadedFiles([...uploadedFiles, ...newFiles])
        }
    }


    const removeFile = (index: number) => {
        setUploadedFiles(uploadedFiles.filter((_, i) => i !== index))
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
            setUploadedFiles([...uploadedFiles, ...newFiles])
        }
    }


    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + " B"
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
        return (bytes / (1024 * 1024)).toFixed(1) + " MB"
    }


    const calculateTaxes = () => {
        // Federal calculation only - State logic would go here if implemented
        const grossIncome = (
            (Number.parseFloat(formData.w2Income) || 0) +
            (Number.parseFloat(formData.income1099) || 0) +
            (Number.parseFloat(formData.interestIncome) || 0) +
            (Number.parseFloat(formData.dividendIncome) || 0) +
            (Number.parseFloat(formData.capitalGains) || 0) +
            (Number.parseFloat(formData.businessIncome) || 0) +
            (Number.parseFloat(formData.rentalIncome) || 0) +
            (Number.parseFloat(formData.retirementIncome) || 0)
        );


        const studentLoanInterest = Math.min(Number.parseFloat(formData.studentLoanInterest) || 0, 2500); // 2024 limit
        const agi = grossIncome - studentLoanInterest;


        // 2024 Standard Deductions
        let standardDeduction = 14600; // Single
        if (formData.filingStatus === "Married Filing Jointly") standardDeduction = 29200;
        if (formData.filingStatus === "Head of Household") standardDeduction = 21900;
        // Add logic for Married Filing Separately if needed


        // Itemized Deductions (Federal Limits)
        const mortgageInterest = Number.parseFloat(formData.mortgageInterest) || 0;
        const propertyTaxes = Number.parseFloat(formData.propertyTaxes) || 0;
        const charitable = Number.parseFloat(formData.charitableDonations) || 0;
        const medical = Math.max(0, (Number.parseFloat(formData.medicalExpenses) || 0) - agi * 0.075);
        const saltCap = Math.min((Number.parseFloat(formData.stateLocalTaxes) || 0) + propertyTaxes, 10000); // Combine state/local income/sales tax with property tax for SALT cap


        const itemizedTotal = mortgageInterest + charitable + medical + saltCap;
        const deduction = Math.max(standardDeduction, itemizedTotal);
        const usingItemized = itemizedTotal > standardDeduction;
        const taxableIncome = Math.max(0, agi - deduction);


        // Federal Tax Calculation (2024 Brackets)
        let tax = 0;
        let marginalRate = 0;
        if (formData.filingStatus === "Single") {
            if (taxableIncome <= 11600) { tax = taxableIncome * 0.10; marginalRate = 10; }
            else if (taxableIncome <= 47150) { tax = 1160 + (taxableIncome - 11600) * 0.12; marginalRate = 12; }
            else if (taxableIncome <= 100525) { tax = 5426 + (taxableIncome - 47150) * 0.22; marginalRate = 22; }
            else if (taxableIncome <= 191950) { tax = 17168.50 + (taxableIncome - 100525) * 0.24; marginalRate = 24; }
            else if (taxableIncome <= 243725) { tax = 39110.50 + (taxableIncome - 191950) * 0.32; marginalRate = 32; }
            else if (taxableIncome <= 609350) { tax = 55678.50 + (taxableIncome - 243725) * 0.35; marginalRate = 35; }
            else { tax = 183647.25 + (taxableIncome - 609350) * 0.37; marginalRate = 37; }
        } else if (formData.filingStatus === "Married Filing Jointly") {
            if (taxableIncome <= 23200) { tax = taxableIncome * 0.10; marginalRate = 10; }
            else if (taxableIncome <= 94300) { tax = 2320 + (taxableIncome - 23200) * 0.12; marginalRate = 12; }
            else if (taxableIncome <= 201050) { tax = 10852 + (taxableIncome - 94300) * 0.22; marginalRate = 22; }
            else if (taxableIncome <= 383900) { tax = 34337 + (taxableIncome - 201050) * 0.24; marginalRate = 24; }
            else if (taxableIncome <= 487450) { tax = 78221 + (taxableIncome - 383900) * 0.32; marginalRate = 32; }
            else if (taxableIncome <= 731200) { tax = 111357 + (taxableIncome - 487450) * 0.35; marginalRate = 35; }
            else { tax = 196669.50 + (taxableIncome - 731200) * 0.37; marginalRate = 37; }
        } else { // Head of Household
            if (taxableIncome <= 16550) { tax = taxableIncome * 0.10; marginalRate = 10; }
            else if (taxableIncome <= 63100) { tax = 1655 + (taxableIncome - 16550) * 0.12; marginalRate = 12; }
            else if (taxableIncome <= 100500) { tax = 7241 + (taxableIncome - 63100) * 0.22; marginalRate = 22; }
            else if (taxableIncome <= 191950) { tax = 15469 + (taxableIncome - 100500) * 0.24; marginalRate = 24; }
            else if (taxableIncome <= 243700) { tax = 37417 + (taxableIncome - 191950) * 0.32; marginalRate = 32; }
            else if (taxableIncome <= 609350) { tax = 53977 + (taxableIncome - 243700) * 0.35; marginalRate = 35; }
            else { tax = 181954.50 + (taxableIncome - 609350) * 0.37; marginalRate = 37; }
        }




        // Federal Credits
        let credits = 0;
        const numChildren = Number.parseInt(formData.numChildren) || 0;
        if (numChildren > 0) {
            // Simplified CTC - Actual calculation has phaseouts and refundable portions
            credits += numChildren * 2000;
        }
        const childcareExpenses = Number.parseFloat(formData.childcareExpenses) || 0;
        if (childcareExpenses > 0) {
            // Simplified Child and Dependent Care Credit
            const maxExpenses = numChildren === 1 ? 3000 : (numChildren >= 2 ? 6000 : 0);
            const eligibleExpenses = Math.min(childcareExpenses, maxExpenses);
            let creditRate = 0.20; // Base rate, actual rate depends on AGI
            credits += eligibleExpenses * creditRate;
        }
        const educationExpenses = Number.parseFloat(formData.educationExpenses) || 0;
        if (educationExpenses > 0) {
            // Simplified AOTC calculation
            const aotc = Math.min(2500, Math.min(educationExpenses, 2000) * 1 + Math.max(0, Math.min(educationExpenses - 2000, 2000)) * 0.25);
            // Add phaseout logic based on AGI if needed
            credits += aotc;
        }
        // Add EITC calculation here if needed (complex)


        const taxAfterCredits = Math.max(0, tax - credits);
        const withheld = Number.parseFloat(formData.w2Withheld) || 0;
        const refundOrOwed = withheld - taxAfterCredits;


        // Placeholder for State Tax - would require state-specific logic
        const estimatedStateTax = 0; // Replace with actual state calculation if implemented


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
            taxAfterCredits, // This is Federal Tax Liability
            withheld,
            refundOrOwed, // This is Federal Refund/Owed
            owes: refundOrOwed < 0,
            marginalRate, // Added marginal rate to results
            state: formData.state, // Pass the selected state
            estimatedStateTax, // Placeholder
        });
    }


    const nextStep = () => {
        if (currentStep < steps.length - 1) {
            if (currentStep === 3) { // After Deductions step
                calculateTaxes() // Calculate before moving to Review
            }
            setCurrentStep(currentStep + 1)
        }
    }


    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1)
        }
    }


    const progress = ((currentStep + 1) / steps.length) * 100


    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" onClick={onBack}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                </Button>
                <div>
                    <h1 className="text-3xl font-bold">Easy Tax Filing</h1>
                    <p className="text-muted-foreground">Simple, step-by-step tax preparation</p>
                </div>
            </div>


            {/* Progress Bar */}
            <Card>
                <CardContent className="p-6">
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="font-semibold">Filing Progress</h3>
                            <span className="text-sm text-muted-foreground">
                               Step {currentStep + 1} of {steps.length}
                           </span>
                        </div>
                        <Progress value={progress} className="w-full" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                            {steps.map((step, index) => (
                                <span key={index} className={index <= currentStep ? "text-primary font-medium" : ""}>
                                   {step}
                               </span>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>


            {/* Step Content */}
            <Card>
                <CardContent className="p-6">
                    {/* Step 0: Choose Filing Type */}
                    {currentStep === 0 && (
                        <div className="space-y-6">
                            <div className="text-center">
                                <h2 className="text-2xl font-bold mb-2">Choose Your Filing Type</h2>
                                <p className="text-muted-foreground">Select the option that best describes your tax situation</p>
                            </div>


                            <div className="grid md:grid-cols-2 gap-4">
                                {filingTypes.map((type) => (
                                    <Card
                                        key={type.id}
                                        className={`cursor-pointer transition-all hover:shadow-lg ${
                                            filingType === type.id ? "ring-2 ring-primary" : ""
                                        }`}
                                        onClick={() => setFilingType(type.id)}
                                    >
                                        <CardHeader className="text-center">
                                            <div className="flex justify-center mb-2 text-primary">{type.icon}</div>
                                            <CardTitle className="text-lg">{type.title}</CardTitle>
                                            <CardDescription>{type.description}</CardDescription>
                                            <div className="text-2xl font-bold">{type.price}</div>
                                        </CardHeader>
                                        <CardContent>
                                            <ul className="space-y-2 text-sm">
                                                {type.features.map((feature, index) => (
                                                    <li key={index} className="flex items-center gap-2">
                                                        <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                                                        {feature}
                                                    </li>
                                                ))}
                                            </ul>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}


                    {/* Step 1: Personal Information */}
                    {currentStep === 1 && (
                        <div className="space-y-6">
                            <div className="text-center">
                                <h2 className="text-2xl font-bold mb-2">Personal Information</h2>
                                <p className="text-muted-foreground">Tell us about yourself and your filing status</p>
                            </div>


                            <div className="max-w-2xl mx-auto space-y-6">
                                {/* Name Fields */}
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="firstName">First Name</Label>
                                        <Input id="firstName" placeholder="John" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="lastName">Last Name</Label>
                                        <Input id="lastName" placeholder="Doe" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} />
                                    </div>
                                </div>
                                {/* SSN and DOB */}
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="ssn">Social Security Number</Label>
                                        <Input id="ssn" placeholder="XXX-XX-XXXX" type="password" value={formData.ssn} onChange={(e) => setFormData({ ...formData, ssn: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="dateOfBirth">Date of Birth</Label>
                                        <Input id="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })} />
                                    </div>
                                </div>
                                {/* Address */}
                                <div className="space-y-2">
                                    <Label htmlFor="address">Street Address</Label>
                                    <Input id="address" placeholder="123 Main St" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
                                </div>
                                {/* City, State, Zip */}
                                <div className="grid md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="city">City</Label>
                                        <Input id="city" placeholder="Anytown" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="state">State</Label>
                                        <Select value={formData.state} onValueChange={(value) => setFormData({...formData, state: value})}>
                                            <SelectTrigger id="state">
                                                <SelectValue placeholder="Select State" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {usStates.map(state => (
                                                    <SelectItem key={state} value={state}>{state}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="zip">ZIP Code</Label>
                                        <Input id="zip" placeholder="12345" value={formData.zip} onChange={(e) => setFormData({ ...formData, zip: e.target.value })} />
                                    </div>
                                </div>
                                {/* Filing Status */}
                                <div className="space-y-3">
                                    <Label>Filing Status</Label>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {["Single", "Married Filing Jointly", "Married Filing Separately", "Head of Household"].map(
                                            (status) => (
                                                <Card
                                                    key={status}
                                                    className={`cursor-pointer transition-all hover:shadow-md ${
                                                        formData.filingStatus === status ? "ring-2 ring-primary" : ""
                                                    }`}
                                                    onClick={() => setFormData({ ...formData, filingStatus: status })}
                                                >
                                                    <CardContent className="p-3 text-center">
                                                        <span className="font-medium text-sm">{status}</span>
                                                    </CardContent>
                                                </Card>
                                            ),
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}


                    {/* Step 2: Income Sources */}
                    {currentStep === 2 && (
                        <div className="space-y-6">
                            <div className="text-center">
                                <h2 className="text-2xl font-bold mb-2">Income Sources</h2>
                                <p className="text-muted-foreground">Let's gather information about your income</p>
                            </div>


                            <div className="max-w-2xl mx-auto space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Upload className="h-5 w-5" />
                                            Upload Tax Documents (Optional)
                                        </CardTitle>
                                        <CardDescription>
                                            Upload your W-2s, 1099s, and other tax documents. We'll extract the information automatically.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div
                                            className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors"
                                            onDragOver={handleDragOver}
                                            onDrop={handleDrop}
                                        >
                                            <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                            <p className="text-sm text-muted-foreground mb-4">
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
                                            <Button variant="outline" onClick={() => document.getElementById("fileUpload")?.click()}>
                                                Choose Files
                                            </Button>
                                            <p className="text-xs text-muted-foreground mt-2">Accepts PDF, JPG, PNG (max 10MB each)</p>
                                        </div>


                                        {uploadedFiles.length > 0 && (
                                            <div className="space-y-2">
                                                <Label>Uploaded Documents ({uploadedFiles.length})</Label>
                                                <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                                                    {uploadedFiles.map((file, index) => (
                                                        <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                                            <div className="flex items-center gap-3">
                                                                <FileText className="h-5 w-5 text-primary" />
                                                                <div>
                                                                    <p className="text-sm font-medium truncate max-w-[200px]">{file.name}</p>
                                                                    <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                                                                </div>
                                                            </div>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => removeFile(index)}
                                                                className="h-8 w-8 p-0"
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>


                                <Separator />


                                <div className="space-y-4">
                                    <h3 className="font-semibold">Enter income manually:</h3>


                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="w2Income">W-2 Wages</Label>
                                            <Input
                                                id="w2Income"
                                                placeholder="$0"
                                                type="number"
                                                value={formData.w2Income}
                                                onChange={(e) => setFormData({ ...formData, w2Income: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="w2Withheld">Federal Tax Withheld (from W-2)</Label>
                                            <Input
                                                id="w2Withheld"
                                                placeholder="$0"
                                                type="number"
                                                value={formData.w2Withheld}
                                                onChange={(e) => setFormData({ ...formData, w2Withheld: e.target.value })}
                                            />
                                        </div>
                                    </div>


                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="income1099">1099 Income (Freelance/Contract)</Label>
                                            <Input
                                                id="income1099"
                                                placeholder="$0"
                                                type="number"
                                                value={formData.income1099}
                                                onChange={(e) => setFormData({ ...formData, income1099: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="interestIncome">Interest Income</Label>
                                            <Input
                                                id="interestIncome"
                                                placeholder="$0"
                                                type="number"
                                                value={formData.interestIncome}
                                                onChange={(e) => setFormData({ ...formData, interestIncome: e.target.value })}
                                            />
                                        </div>
                                    </div>


                                    {filingType === "complex" && (
                                        <>
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="dividendIncome">Dividend Income</Label>
                                                    <Input
                                                        id="dividendIncome"
                                                        placeholder="$0"
                                                        type="number"
                                                        value={formData.dividendIncome}
                                                        onChange={(e) => setFormData({ ...formData, dividendIncome: e.target.value })}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="capitalGains">Capital Gains</Label>
                                                    <Input
                                                        id="capitalGains"
                                                        placeholder="$0"
                                                        type="number"
                                                        value={formData.capitalGains}
                                                        onChange={(e) => setFormData({ ...formData, capitalGains: e.target.value })}
                                                    />
                                                </div>
                                            </div>


                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="businessIncome">Business Income (Schedule C)</Label>
                                                    <Input
                                                        id="businessIncome"
                                                        placeholder="$0"
                                                        type="number"
                                                        value={formData.businessIncome}
                                                        onChange={(e) => setFormData({ ...formData, businessIncome: e.target.value })}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="rentalIncome">Rental Property Income</Label>
                                                    <Input
                                                        id="rentalIncome"
                                                        placeholder="$0"
                                                        type="number"
                                                        value={formData.rentalIncome}
                                                        onChange={(e) => setFormData({ ...formData, rentalIncome: e.target.value })}
                                                    />
                                                </div>
                                            </div>


                                            <div className="space-y-2">
                                                <Label htmlFor="retirementIncome">Retirement Income (IRA, 401k)</Label>
                                                <Input
                                                    id="retirementIncome"
                                                    placeholder="$0"
                                                    type="number"
                                                    value={formData.retirementIncome}
                                                    onChange={(e) => setFormData({ ...formData, retirementIncome: e.target.value })}
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}


                    {/* Step 3: Deductions & Credits */}
                    {currentStep === 3 && (
                        <div className="space-y-6">
                            <div className="text-center">
                                <h2 className="text-2xl font-bold mb-2">Deductions & Credits</h2>
                                <p className="text-muted-foreground">Maximize your refund with available deductions and credits</p>
                            </div>


                            <div className="max-w-2xl mx-auto space-y-6">
                                <Card className="bg-blue-50 border-blue-200">
                                    <CardContent className="p-4">
                                        <div className="flex items-start gap-3">
                                            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                                            <div>
                                                <h4 className="font-semibold text-blue-900">Standard vs Itemized</h4>
                                                <p className="text-sm text-blue-800">
                                                    We'll automatically choose whichever saves you more money based on the expenses you enter below.
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>


                                <div className="space-y-4">
                                    <h3 className="font-semibold">Common Deductions</h3>


                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="mortgageInterest">Mortgage Interest Paid</Label>
                                            <Input
                                                id="mortgageInterest"
                                                placeholder="$0"
                                                type="number"
                                                value={formData.mortgageInterest}
                                                onChange={(e) => setFormData({ ...formData, mortgageInterest: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="propertyTaxes">Property Taxes Paid</Label>
                                            <Input
                                                id="propertyTaxes"
                                                placeholder="$0"
                                                type="number"
                                                value={formData.propertyTaxes}
                                                onChange={(e) => setFormData({ ...formData, propertyTaxes: e.target.value })}
                                            />
                                        </div>
                                    </div>


                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="charitableDonations">Charitable Donations</Label>
                                            <Input
                                                id="charitableDonations"
                                                placeholder="$0"
                                                type="number"
                                                value={formData.charitableDonations}
                                                onChange={(e) => setFormData({ ...formData, charitableDonations: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="stateLocalTaxes">State & Local Taxes (SALT)</Label>
                                            <Input
                                                id="stateLocalTaxes"
                                                placeholder="$0 (max $10,000)"
                                                type="number"
                                                value={formData.stateLocalTaxes}
                                                onChange={(e) => setFormData({ ...formData, stateLocalTaxes: e.target.value })}
                                            />
                                            <p className="text-xs text-muted-foreground">Include state income/sales tax. Capped at $10k with property tax.</p>
                                        </div>
                                    </div>


                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="medicalExpenses">Medical Expenses</Label>
                                            <Input
                                                id="medicalExpenses"
                                                placeholder="$0 (over 7.5% AGI)"
                                                type="number"
                                                value={formData.medicalExpenses}
                                                onChange={(e) => setFormData({ ...formData, medicalExpenses: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="studentLoanInterest">Student Loan Interest Paid</Label>
                                            <Input
                                                id="studentLoanInterest"
                                                placeholder="$0 (max $2,500)"
                                                type="number"
                                                value={formData.studentLoanInterest}
                                                onChange={(e) => setFormData({ ...formData, studentLoanInterest: e.target.value })}
                                            />
                                            <p className="text-xs text-muted-foreground">Above-the-line deduction.</p>
                                        </div>
                                    </div>
                                </div>


                                <Separator />


                                <div className="space-y-4">
                                    <h3 className="font-semibold">Common Tax Credits</h3>


                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="numChildren">Number of Qualifying Children (under 17)</Label>
                                            <Input
                                                id="numChildren"
                                                type="number"
                                                placeholder="0"
                                                value={formData.numChildren}
                                                onChange={(e) => setFormData({ ...formData, numChildren: e.target.value })}
                                            />
                                            <p className="text-xs text-muted-foreground">For Child Tax Credit (up to $2,000 each)</p>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="childcareExpenses">Childcare Expenses Paid</Label>
                                            <Input
                                                id="childcareExpenses"
                                                placeholder="$0"
                                                type="number"
                                                value={formData.childcareExpenses}
                                                onChange={(e) => setFormData({ ...formData, childcareExpenses: e.target.value })}
                                            />
                                            <p className="text-xs text-muted-foreground">For Child & Dependent Care Credit</p>
                                        </div>
                                    </div>


                                    <div className="space-y-2">
                                        <Label htmlFor="educationExpenses">Qualified Education Expenses (College)</Label>
                                        <Input
                                            id="educationExpenses"
                                            placeholder="$0"
                                            type="number"
                                            value={formData.educationExpenses}
                                            onChange={(e) => setFormData({ ...formData, educationExpenses: e.target.value })}
                                        />
                                        <p className="text-xs text-muted-foreground">For American Opportunity or Lifetime Learning Credits</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}


                    {/* Step 4: Review & File */}
                    {currentStep === 4 && taxCalculation && (
                        <div className="space-y-6">
                            <div className="text-center">
                                <h2 className="text-2xl font-bold mb-2">Review & File</h2>
                                <p className="text-muted-foreground">Review your federal tax return summary {taxCalculation.state && `(${taxCalculation.state})`} before filing</p>
                            </div>


                            <div className="max-w-2xl mx-auto space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <DollarSign className="h-5 w-5 text-green-600" />
                                            Federal Tax Summary
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {/* ... Federal Tax Summary Details ... */}
                                            <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                                                <span>Total Income</span>
                                                <span className="font-semibold">${taxCalculation.totalIncome.toFixed(0).toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                                                <span>Adjusted Gross Income (AGI)</span>
                                                <span className="font-semibold">${taxCalculation.agi.toFixed(0).toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                                                <span>{taxCalculation.usingItemized ? "Itemized" : "Standard"} Deduction</span>
                                                <span className="font-semibold">${taxCalculation.deduction.toFixed(0).toLocaleString()}</span>
                                            </div>
                                            {taxCalculation.usingItemized && (
                                                <div className="text-xs text-green-600 text-center">
                                                    Itemizing saves you $
                                                    {(taxCalculation.itemizedTotal - taxCalculation.standardDeduction)
                                                        .toFixed(0)
                                                        .toLocaleString()}{" "}
                                                    more!
                                                </div>
                                            )}
                                            <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                                                <span>Taxable Income</span>
                                                <span className="font-semibold">
                                                   ${taxCalculation.taxableIncome.toFixed(0).toLocaleString()}
                                               </span>
                                            </div>
                                            <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                                                <span>Federal Tax Before Credits</span>
                                                <span className="font-semibold">
                                                   ${taxCalculation.taxBeforeCredits.toFixed(0).toLocaleString()}
                                               </span>
                                            </div>
                                            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                                                <span>Tax Credits Applied</span>
                                                <span className="font-semibold text-green-600">
                                                   -${taxCalculation.credits.toFixed(0).toLocaleString()}
                                               </span>
                                            </div>
                                            <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                                                <span>Total Federal Tax Liability</span>
                                                <span className="font-semibold">
                                                   ${taxCalculation.taxAfterCredits.toFixed(0).toLocaleString()}
                                               </span>
                                            </div>
                                            <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                                                <span>Federal Tax Withheld</span>
                                                <span className="font-semibold">${taxCalculation.withheld.toFixed(0).toLocaleString()}</span>
                                            </div>
                                            <Separator />
                                            <div
                                                className={`flex justify-between items-center p-3 rounded-lg ${taxCalculation.owes ? "bg-red-50" : "bg-green-50"}`}
                                            >
                                               <span className="font-semibold">
                                                   {taxCalculation.owes ? "Amount Owed (Federal)" : "Estimated Refund (Federal)"}
                                               </span>
                                                <span
                                                    className={`text-2xl font-bold ${taxCalculation.owes ? "text-red-600" : "text-green-600"}`}
                                                >
                                                   ${Math.abs(taxCalculation.refundOrOwed).toFixed(0).toLocaleString()}
                                               </span>
                                            </div>
                                        </div>
                                        <p className="text-xs text-muted-foreground text-center mt-4">
                                            *This is an estimate for federal taxes only. State taxes are not included in this calculation. Consult state resources or a tax professional for state tax liability.
                                        </p>
                                    </CardContent>
                                </Card>
                                {/* Placeholder for State Tax Summary */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <FileText className="h-5 w-5 text-gray-500"/>
                                            State Tax Summary ({taxCalculation.state || 'N/A'})
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground text-center py-4">
                                            State tax calculation is not yet implemented. Please consult your state's tax resources or a professional for state tax estimates and filing.
                                        </p>
                                    </CardContent>
                                </Card>


                                <Card>
                                    <CardHeader>
                                        <CardTitle>Payment & Refund</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <p className="text-sm text-muted-foreground">
                                            Securely connect your bank account to {taxCalculation.owes ? "pay your federal taxes" : "receive your federal refund"}.
                                        </p>
                                        <Button className="w-full" disabled>
                                            <Banknote className="h-4 w-4 mr-2" />
                                            Connect Bank Account with Plaid (Coming Soon)
                                        </Button>
                                    </CardContent>
                                </Card>


                                <Card>
                                    <CardHeader>
                                        <CardTitle>Filing Options</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <Card className="cursor-pointer hover:shadow-md ring-2 ring-primary">
                                                <CardContent className="p-4 text-center">
                                                    <FileText className="h-8 w-8 text-primary mx-auto mb-2" />
                                                    <h4 className="font-medium mb-1">E-File Federal Return</h4>
                                                    <p className="text-sm text-muted-foreground">Fast, secure electronic filing</p>
                                                    <Badge className="mt-2">Recommended</Badge>
                                                </CardContent>
                                            </Card>
                                            <Card className="cursor-pointer hover:shadow-md">
                                                <CardContent className="p-4 text-center">
                                                    <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                                                    <h4 className="font-medium mb-1">Print & Mail Federal Return</h4>
                                                    <p className="text-sm text-muted-foreground">Traditional paper filing</p>
                                                </CardContent>
                                            </Card>
                                        </div>


                                        <div className="text-center pt-4">
                                            <Button size="lg" className="bg-primary hover:bg-primary/90" disabled>
                                                File My Federal Tax Return (Coming Soon)
                                            </Button>
                                            <p className="text-xs text-muted-foreground mt-2">
                                                State filing options will be available soon.
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    )}


                    {/* Navigation */}
                    <div className="flex justify-between items-center pt-6 border-t mt-6">
                        <Button variant="outline" onClick={prevStep} disabled={currentStep === 0}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Previous
                        </Button>


                        <div className="text-sm text-muted-foreground">
                            Step {currentStep + 1} of {steps.length}
                        </div>


                        <Button
                            onClick={nextStep}
                            disabled={
                                (currentStep === 0 && !filingType) || // Need filing type to proceed from step 0
                                (currentStep === 1 && (!formData.filingStatus || !formData.state)) || // Need status and state for step 1
                                (currentStep === steps.length - 1) // Disabled on last step
                            }
                        >
                            {currentStep === steps.length - 2 ? "Review" : "Next"}
                            <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

