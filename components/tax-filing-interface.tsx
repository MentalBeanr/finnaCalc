"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
    ArrowLeft,
    ArrowRight,
    Upload,
    FileText,
    DollarSign,
    Home,
    Briefcase,
    Users,
    CheckCircle,
    ExternalLink,
    Shield,
    Banknote,
} from "lucide-react"

interface TaxFilingInterfaceProps {
    onBack: () => void
}

export default function TaxFilingInterface({ onBack }: TaxFilingInterfaceProps) {
    const [currentStep, setCurrentStep] = useState(0)
    const [filingType, setFilingType] = useState("")
    const [formData, setFormData] = useState({
        filingStatus: "",
        income: "",
        hasW2: false,
        has1099: false,
        hasDeductions: false,
        hasChildren: false,
    })

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
            description: "For W-2 employees with standard deductions.",
            icon: <Users className="h-8 w-8" />,
            price: "$1",
            features: ["W-2 and 1099-INT/DIV", "Standard deduction", "Basic credits (EITC)", "Direct deposit"],
        },
        {
            id: "complex",
            title: "Complex File",
            description: "For self-employed, investors, and homeowners.",
            icon: <Briefcase className="h-8 w-8" />,
            price: "$10",
            features: ["All simple features", "Self-employment (Schedule C)", "Investments & rental property", "Itemized deductions"],
        },
    ]

    const nextStep = () => {
        if (currentStep < steps.length - 1) {
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

            {/* Advertisement Space */}
            <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200 hidden">
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Shield className="h-8 w-8 text-green-600" />
                            <div>
                                <h3 className="font-semibold">Maximum Refund Guarantee</h3>
                                <p className="text-sm text-muted-foreground">Get every deduction you deserve</p>
                            </div>
                        </div>
                        <Button size="sm" variant="outline">
                            Learn More <ExternalLink className="h-3 w-3 ml-1" />
                        </Button>
                    </div>
                </CardContent>
            </Card>

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
                                                        <CheckCircle className="h-4 w-4 text-green-600" />
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
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="firstName">First Name</Label>
                                        <Input id="firstName" placeholder="Enter your first name" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="lastName">Last Name</Label>
                                        <Input id="lastName" placeholder="Enter your last name" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="ssn">Social Security Number</Label>
                                    <Input id="ssn" placeholder="XXX-XX-XXXX" type="password" />
                                </div>

                                <div className="space-y-3">
                                    <Label>Filing Status</Label>
                                    <div className="grid md:grid-cols-2 gap-3">
                                        {["Single", "Married Filing Jointly", "Married Filing Separately", "Head of Household"].map(
                                            (status) => (
                                                <Card
                                                    key={status}
                                                    className={`cursor-pointer transition-all hover:shadow-md ${
                                                        formData.filingStatus === status ? "ring-2 ring-primary" : ""
                                                    }`}
                                                    onClick={() => setFormData({ ...formData, filingStatus: status })}
                                                >
                                                    <CardContent className="p-4 text-center">
                                                        <span className="font-medium">{status}</span>
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
                                            Upload Tax Documents
                                        </CardTitle>
                                        <CardDescription>
                                            Upload your W-2s, 1099s, and other tax documents. We'll extract the information automatically.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                                            <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                            <p className="text-sm text-muted-foreground mb-4">
                                                Drag and drop your tax documents here, or click to browse
                                            </p>
                                            <Button variant="outline">Choose Files</Button>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Separator />

                                <div className="space-y-4">
                                    <h3 className="font-semibold">Or enter manually:</h3>

                                    <div className="space-y-2">
                                        <Label htmlFor="totalIncome">Total Income (W-2, 1099, etc.)</Label>
                                        <Input
                                            id="totalIncome"
                                            placeholder="$0"
                                            value={formData.income}
                                            onChange={(e) => setFormData({ ...formData, income: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <Label>Income Types (check all that apply)</Label>
                                        <div className="space-y-2">
                                            <div className="flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    id="hasW2"
                                                    checked={formData.hasW2}
                                                    onChange={(e) => setFormData({ ...formData, hasW2: e.target.checked })}
                                                />
                                                <Label htmlFor="hasW2">W-2 (Employee wages)</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    id="has1099"
                                                    checked={formData.has1099}
                                                    onChange={(e) => setFormData({ ...formData, has1099: e.target.checked })}
                                                />
                                                <Label htmlFor="has1099">1099 (Freelance/Contract work)</Label>
                                            </div>
                                        </div>
                                    </div>
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
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Standard vs Itemized Deduction</CardTitle>
                                        <CardDescription>
                                            We'll automatically choose the option that saves you the most money
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div className="p-4 border rounded-lg">
                                                <h4 className="font-medium mb-2">Standard Deduction</h4>
                                                <p className="text-2xl font-bold text-accent mb-2">$13,850</p>
                                                <p className="text-sm text-muted-foreground">Fixed amount that most taxpayers can claim</p>
                                            </div>
                                            <div className="p-4 border rounded-lg">
                                                <h4 className="font-medium mb-2">Itemized Deduction</h4>
                                                <p className="text-2xl font-bold text-muted-foreground mb-2">$0</p>
                                                <p className="text-sm text-muted-foreground">
                                                    Add up specific expenses like mortgage interest, donations
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <div className="space-y-4">
                                    <h3 className="font-semibold">Common Deductions & Credits</h3>

                                    <div className="space-y-3">
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                id="hasChildren"
                                                checked={formData.hasChildren}
                                                onChange={(e) => setFormData({ ...formData, hasChildren: e.target.checked })}
                                            />
                                            <Label htmlFor="hasChildren">Child Tax Credit (up to $2,000 per child)</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <input type="checkbox" id="hasStudentLoan" />
                                            <Label htmlFor="hasStudentLoan">Student Loan Interest Deduction</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <input type="checkbox" id="hasCharitable" />
                                            <Label htmlFor="hasCharitable">Charitable Donations</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <input type="checkbox" id="hasMortgage" />
                                            <Label htmlFor="hasMortgage">Mortgage Interest</Label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Review & File */}
                    {currentStep === 4 && (
                        <div className="space-y-6">
                            <div className="text-center">
                                <h2 className="text-2xl font-bold mb-2">Review & File</h2>
                                <p className="text-muted-foreground">Review your tax return before filing</p>
                            </div>

                            <div className="max-w-2xl mx-auto space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <DollarSign className="h-5 w-5 text-green-600" />
                                            Your Tax Summary
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                                                <span>Total Income</span>
                                                <span className="font-semibold">{formData.income || "$0"}</span>
                                            </div>
                                            <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                                                <span>Standard Deduction</span>
                                                <span className="font-semibold">$13,850</span>
                                            </div>
                                            <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                                                <span>Taxable Income</span>
                                                <span className="font-semibold">$0</span>
                                            </div>
                                            <Separator />
                                            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                                                <span className="font-semibold">Estimated Refund</span>
                                                <span className="text-2xl font-bold text-green-600">$1,200</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Payment & Refund</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <p className="text-sm text-muted-foreground">
                                            Securely connect your bank account to receive your refund or pay your taxes due. We use Plaid to protect your financial data.
                                        </p>
                                        <Button className="w-full">
                                            <Banknote className="h-4 w-4 mr-2" />
                                            Connect Bank Account with Plaid
                                        </Button>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Filing Options</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <Card className="cursor-pointer hover:shadow-md">
                                                <CardContent className="p-4 text-center">
                                                    <FileText className="h-8 w-8 text-primary mx-auto mb-2" />
                                                    <h4 className="font-medium mb-1">E-File</h4>
                                                    <p className="text-sm text-muted-foreground">Fast, secure electronic filing</p>
                                                    <Badge className="mt-2">Recommended</Badge>
                                                </CardContent>
                                            </Card>
                                            <Card className="cursor-pointer hover:shadow-md">
                                                <CardContent className="p-4 text-center">
                                                    <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                                                    <h4 className="font-medium mb-1">Print & Mail</h4>
                                                    <p className="text-sm text-muted-foreground">Traditional paper filing</p>
                                                </CardContent>
                                            </Card>
                                        </div>

                                        <div className="text-center pt-4">
                                            <Button size="lg" className="bg-primary hover:bg-primary/90">
                                                File My Tax Return
                                            </Button>
                                            <p className="text-xs text-muted-foreground mt-2">Your return will be reviewed before filing</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    )}

                    {/* Navigation */}
                    <div className="flex justify-between items-center pt-6 border-t">
                        <Button variant="outline" onClick={prevStep} disabled={currentStep === 0}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Previous
                        </Button>

                        <div className="text-sm text-muted-foreground">
                            Step {currentStep + 1} of {steps.length}
                        </div>

                        <Button
                            onClick={nextStep}
                            disabled={currentStep === steps.length - 1 || (currentStep === 0 && !filingType)}
                        >
                            Next
                            <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}