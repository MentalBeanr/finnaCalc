import { Users, Calculator, Shield, Award, Target, Heart } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function AboutUs() {
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <nav className="mb-8">
                    <ol className="flex items-center space-x-2 text-sm text-gray-500">
                        <li>
                            <Link href="/" className="hover:text-blue-600">
                                Home
                            </Link>
                        </li>
                        <li>/</li>
                        <li className="text-gray-900">About Us</li>
                    </ol>
                </nav>

                <div className="space-y-12">
                    {/* Hero Section */}
                    <div className="text-center space-y-4">
                        <h1 className="text-4xl font-bold text-gray-900 text-balance">Empowering Smart Financial Decisions</h1>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto text-pretty">
                            FinnaCalc is your trusted partner in financial planning, providing professional-grade calculators and
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
                                <p className="text-gray-600">
                                    To democratize financial planning by providing free, accurate, and easy-to-use financial calculators
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
                                <p className="text-gray-600">
                                    To become the world's most trusted platform for financial calculations and planning tools, helping
                                    millions of people achieve their financial goals through informed decision-making.
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* What We Offer */}
                    <div className="space-y-8">
                        <div className="text-center">
                            <h2 className="text-3xl font-bold text-gray-900 mb-4">What We Offer</h2>
                            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
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
                                    <p className="text-gray-600">
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
                                    <p className="text-gray-600">
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
                                    <p className="text-gray-600">
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
                            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Core Values</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="text-center space-y-3">
                                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                                    <Shield className="h-8 w-8 text-blue-600" />
                                </div>
                                <h3 className="font-semibold text-gray-900">Accuracy</h3>
                                <p className="text-sm text-gray-600">
                                    Every calculation is thoroughly tested and based on current financial standards and regulations.
                                </p>
                            </div>

                            <div className="text-center space-y-3">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                                    <Heart className="h-8 w-8 text-green-600" />
                                </div>
                                <h3 className="font-semibold text-gray-900">Accessibility</h3>
                                <p className="text-sm text-gray-600">
                                    Financial planning tools should be available to everyone, regardless of their economic background.
                                </p>
                            </div>

                            <div className="text-center space-y-3">
                                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                                    <Users className="h-8 w-8 text-purple-600" />
                                </div>
                                <h3 className="font-semibold text-gray-900">Simplicity</h3>
                                <p className="text-sm text-gray-600">
                                    Complex financial concepts made simple and understandable for users of all experience levels.
                                </p>
                            </div>

                            <div className="text-center space-y-3">
                                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                                    <Award className="h-8 w-8 text-orange-600" />
                                </div>
                                <h3 className="font-semibold text-gray-900">Excellence</h3>
                                <p className="text-sm text-gray-600">
                                    Continuous improvement and innovation to provide the best possible user experience.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Why Choose FinnaCalc */}
                    <div className="bg-white rounded-lg p-8 shadow-sm">
                        <div className="text-center space-y-4 mb-8">
                            <h2 className="text-3xl font-bold text-gray-900">Why Choose FinnaCalc?</h2>
                            <p className="text-lg text-gray-600">
                                We're committed to providing the most reliable and user-friendly financial tools available
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <h3 className="text-xl font-semibold text-gray-900">Free & Accessible</h3>
                                <p className="text-gray-600">
                                    All basic calculations and personal finance tools are completely free to use. No hidden fees, no
                                    subscriptions, no barriers to financial planning.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-xl font-semibold text-gray-900">Professional Quality</h3>
                                <p className="text-gray-600">
                                    Our calculators use the same formulas and methodologies employed by financial professionals and
                                    institutions worldwide.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-xl font-semibold text-gray-900">User-Friendly Design</h3>
                                <p className="text-gray-600">
                                    Clean, intuitive interfaces that make complex financial calculations simple and straightforward for
                                    everyone to use.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-xl font-semibold text-gray-900">Constantly Updated</h3>
                                <p className="text-gray-600">
                                    We regularly update our calculators to reflect current tax rates, interest rates, and financial
                                    regulations.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Contact Information */}
                    <div className="text-center space-y-4">
                        <h2 className="text-2xl font-bold text-gray-900">Get in Touch</h2>
                        <p className="text-gray-600 max-w-2xl mx-auto">
                            Have questions, suggestions, or feedback? We'd love to hear from you. Our team is committed to
                            continuously improving FinnaCalc based on user needs and feedback.
                        </p>
                        <div className="space-y-2">
                            <p className="text-gray-600">
                                <strong>Email:</strong> support@finnacalc.com
                            </p>
                            <p className="text-gray-600">
                                <strong>Business Inquiries:</strong> business@finnacalc.com
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}