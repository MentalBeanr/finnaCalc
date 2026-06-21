"use client"

import { useRouter } from "next/navigation"
import { Users, Calculator, Shield, Award, Target, Heart, ArrowLeft } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function AboutUs() {
    const router = useRouter()

    return (
        <div className="min-h-screen bg-muted/40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-4">
                    <Button variant="outline" onClick={() => router.back()} className="flex items-center gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Button>
                </div>

                <div className="space-y-12">
                    {/* Hero Section */}
                    <div className="text-center space-y-4">
                        <h1 className="text-4xl font-bold text-foreground text-balance">Empowering Smart Financial Decisions</h1>
                        <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-pretty">
                            FinnaCalc is your trusted partner in financial planning, providing professional-grade calculators and planning
                            tools to help individuals and businesses make informed financial decisions.
                        </p>
                    </div>

                    {/* Mission & Vision */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Target className="h-6 w-6 text-blue-600" />
                                    Our Mission
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">
                                    To democratize financial planning by providing free, accurate, and easy-to-use financial calculators and personal finance tools
                                    that empower everyone to make better financial decisions, regardless of their background or experience
                                    level.
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Heart className="h-6 w-6 text-red-600" />
                                    Our Vision
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">
                                    To become the world's most trusted platform for financial calculations and personal finance planning tools, helping
                                    millions of people achieve their financial goals through informed decision-making.
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* What We Offer */}
                    <div className="space-y-8">
                        <div className="text-center">
                            <h2 className="text-3xl font-bold text-foreground mb-4">What We Offer</h2>
                            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                                Comprehensive financial tools designed for real-world applications
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Calculator className="h-6 w-6 text-green-600" />
                                        Business Calculators
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">
                                        Startup costs, break-even analysis, ROI calculations, cash flow projections, and pricing strategies
                                        to help businesses plan and grow.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Users className="h-6 w-6 text-purple-600" />
                                        Personal Finance
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">
                                        Tax calculators, loan analyzers, investment tools, and budgeting calculators designed for
                                        individuals and families.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Shield className="h-6 w-6 text-blue-600" />
                                        Professional Grade
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">
                                        All calculations are based on current financial formulas and regulations, ensuring accuracy and
                                        reliability for professional use.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Our Values */}
                    <div className="space-y-8">
                        <div className="text-center">
                            <h2 className="text-3xl font-bold text-foreground mb-4">Our Core Values</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="text-center space-y-3">
                                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                                    <Shield className="h-8 w-8 text-blue-600" />
                                </div>
                                <h3 className="font-semibold text-foreground">Accuracy</h3>
                                <p className="text-sm text-muted-foreground">
                                    Every calculation is thoroughly tested and based on current financial standards and regulations.
                                </p>
                            </div>

                            <div className="text-center space-y-3">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                                    <Heart className="h-8 w-8 text-green-600" />
                                </div>
                                <h3 className="font-semibold text-foreground">Accessibility</h3>
                                <p className="text-sm text-muted-foreground">
                                    Financial planning tools should be available to everyone, regardless of their economic background.
                                </p>
                            </div>

                            <div className="text-center space-y-3">
                                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                                    <Users className="h-8 w-8 text-purple-600" />
                                </div>
                                <h3 className="font-semibold text-foreground">Simplicity</h3>
                                <p className="text-sm text-muted-foreground">
                                    Complex financial concepts made simple and understandable for users of all experience levels.
                                </p>
                            </div>

                            <div className="text-center space-y-3">
                                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                                    <Award className="h-8 w-8 text-orange-600" />
                                </div>
                                <h3 className="font-semibold text-foreground">Excellence</h3>
                                <p className="text-sm text-muted-foreground">
                                    Continuous improvement and innovation to provide the best possible user experience.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Why Choose FinnaCalc */}
                    <div className="bg-background rounded-lg p-8 shadow-sm">
                        <div className="text-center space-y-4 mb-8">
                            <h2 className="text-3xl font-bold text-foreground">Why Choose FinnaCalc?</h2>
                            <p className="text-lg text-muted-foreground">
                                We're committed to providing the most reliable and user-friendly financial tools available
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <h3 className="text-xl font-semibold text-foreground">Free & Accessible</h3>
                                <p className="text-muted-foreground">
                                    All basic calculations and personal finance tools are completely free to use. No hidden fees, no
                                    subscriptions, no barriers to financial planning.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-xl font-semibold text-foreground">Professional Quality</h3>
                                <p className="text-muted-foreground">
                                    Our calculators use the same formulas and methodologies employed by financial professionals and
                                    institutions worldwide.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-xl font-semibold text-foreground">User-Friendly Design</h3>
                                <p className="text-muted-foreground">
                                    Clean, intuitive interfaces that make complex financial calculations simple and straightforward for
                                    everyone to use.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-xl font-semibold text-foreground">Constantly Updated</h3>
                                <p className="text-muted-foreground">
                                    We regularly update our calculators to reflect current tax rates, interest rates, and financial
                                    regulations.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Contact Information */}
                    <div className="text-center space-y-4">
                        <h2 className="text-2xl font-bold text-foreground">Get in Touch</h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            Have questions, suggestions, or feedback? We'd love to hear from you. Our team is committed to
                            continuously improving FinnaCalc based on user needs and feedback.
                        </p>
                        <div className="space-y-2">
                            <p className="text-muted-foreground">
                                <strong>Help & Assistance:</strong> helpfinnacalc@gmail.com
                            </p>
                            <p className="text-muted-foreground">
                                <strong>Business Inquiries:</strong> finnacalc@gmail.com
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
