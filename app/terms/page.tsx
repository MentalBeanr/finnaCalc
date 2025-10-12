"use client"

import { useRouter } from "next/navigation"
import { FileText, AlertTriangle, Scale, Shield, Users, Gavel, ArrowLeft } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function TermsOfService() {
    const router = useRouter()

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-4">
                    <Button variant="outline" onClick={() => router.back()} className="flex items-center gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Button>
                </div>

                <div className="space-y-8">
                    {/* Header */}
                    <div className="text-center space-y-2">
                        <h1 className="text-4xl font-bold text-gray-900">Terms of Service</h1>
                    </div>

                    {/* Agreement */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-6 w-6 text-blue-600" />
                                Agreement to Terms
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-gray-600">
                                These Terms of Service ("Terms") govern your use of FinnaCalc's website and services. By accessing or
                                using the services, you agree to be bound by these Terms. If you disagree with any part of these terms,
                                then you may not access the services.
                            </p>
                            <p className="text-gray-600">
                                The right to update these Terms at any time is reserved. Changes will be effective immediately upon
                                posting. Your continued use of the services after changes are posted constitutes acceptance of the new
                                Terms.
                            </p>
                        </CardContent>
                    </Card>

                    {/* Description of Service */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-6 w-6 text-green-600" />
                                Description of Service
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-gray-600">
                                FinnaCalc provides free financial calculators and planning tools for personal and business use. The
                                services include but are not limited to:
                            </p>
                            <ul className="space-y-2 text-gray-600">
                                <li>• Business financial calculators (startup costs, break-even analysis, ROI, etc.)</li>
                                <li>• Personal finance tools (tax calculators, loan analyzers, etc.)</li>
                                <li>• Educational content and financial planning resources</li>
                                <li>• Data export and sharing capabilities</li>
                            </ul>
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <p className="text-sm text-blue-800">
                                    <strong>Important:</strong> The calculators provide estimates for planning purposes only. Results
                                    should not be considered as professional financial, tax, or legal advice.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* User Responsibilities */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-6 w-6 text-purple-600" />
                                User Responsibilities
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-600 mb-4">By using the services, you agree to:</p>
                            <ul className="space-y-2 text-gray-600">
                                <li>• Use the service only for lawful purposes and in accordance with these Terms</li>
                                <li>• Provide accurate information when using the calculators</li>
                                <li>• Not attempt to interfere with or disrupt the services</li>
                                <li>• Not use automated systems to access the services without permission</li>
                                <li>• Respect intellectual property rights</li>
                                <li>• Not share or distribute malicious content</li>
                                <li>• Comply with all applicable laws and regulations</li>
                            </ul>
                        </CardContent>
                    </Card>

                    {/* Disclaimers */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-6 w-6 text-yellow-600" />
                                Important Disclaimers
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">Financial Advice Disclaimer</h3>
                                <p className="text-gray-600">
                                    FinnaCalc does not provide financial, investment, tax, or legal advice. The calculators and tools are
                                    for informational and educational purposes only. Results are estimates based on the information you
                                    provide and should not be relied upon for making financial decisions without consulting qualified
                                    professionals.
                                </p>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">Accuracy Disclaimer</h3>
                                <p className="text-gray-600">
                                    While efforts are made for accuracy, no warranties are made about the completeness, reliability, or accuracy
                                    of the calculators or information. Financial regulations, tax laws, and market conditions change
                                    frequently, and the tools may not reflect the most current information.
                                </p>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">No Warranty</h3>
                                <p className="text-gray-600">
                                    The services are provided "as is" without any warranty of any kind, either express or implied,
                                    including but not limited to warranties of merchantability, fitness for a particular purpose, or
                                    non-infringement.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Limitation of Liability */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Gavel className="h-6 w-6 text-red-600" />
                                Limitation of Liability
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-gray-600">
                                To the fullest extent permitted by law, FinnaCalc shall not be liable for any indirect, incidental,
                                special, consequential, or punitive damages, including but not limited to:
                            </p>
                            <ul className="space-y-2 text-gray-600">
                                <li>• Financial losses resulting from use of the calculators</li>
                                <li>• Business interruption or loss of profits</li>
                                <li>• Data loss or corruption</li>
                                <li>• Third-party claims or damages</li>
                            </ul>
                            <p className="text-gray-600">
                                Total liability for any claims arising from your use of the services shall not exceed the amount
                                paid for the services (which is $0 for free services).
                            </p>
                        </CardContent>
                    </Card>

                    {/* Intellectual Property */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Intellectual Property Rights</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-gray-600">
                                The FinnaCalc website, including its content, features, and functionality, is owned by FinnaCalc and is
                                protected by copyright, trademark, and other intellectual property laws.
                            </p>
                            <p className="text-gray-600">
                                You may use the services for personal and business purposes, but you may not:
                            </p>
                            <ul className="space-y-2 text-gray-600">
                                <li>• Copy, modify, or distribute content without permission</li>
                                <li>• Use trademarks or branding without authorization</li>
                                <li>• Create derivative works based on the services</li>
                                <li>• Reverse engineer or attempt to extract source code</li>
                            </ul>
                        </CardContent>
                    </Card>

                    {/* Privacy */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Privacy and Data Protection</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-600">
                                Your privacy is important. The collection and use of personal information is governed by the{" "}
                                <Link href="/privacy" className="text-blue-600 hover:underline">
                                    Privacy Policy
                                </Link>
                                , which is incorporated into these Terms by reference. By using the services, you consent to the
                                collection and use of information as described in the Privacy Policy.
                            </p>
                        </CardContent>
                    </Card>

                    {/* Termination */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Termination</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-600">
                                Access to the services may be terminated or suspended immediately, without prior notice or liability,
                                for any reason, including breach of these Terms. Upon termination, your right to use the services will
                                cease immediately.
                            </p>
                        </CardContent>
                    </Card>

                    {/* Governing Law */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Governing Law and Jurisdiction</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-600">
                                These Terms shall be governed by and construed in accordance with the laws of the United States, without
                                regard to conflict of law principles. Any disputes arising from these Terms or your use of the services
                                shall be resolved through binding arbitration or in the courts of competent jurisdiction.
                            </p>
                        </CardContent>
                    </Card>

                    {/* Severability */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Severability and Entire Agreement</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-gray-600">
                                If any provision of these Terms is held to be invalid or unenforceable, the remaining provisions will
                                remain in full force and effect.
                            </p>
                            <p className="text-gray-600">
                                These Terms, together with the Privacy Policy, constitute the entire agreement between you and FinnaCalc
                                regarding your use of the services.
                            </p>
                        </CardContent>
                    </Card>

                    {/* Contact Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Contact Information</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-600 mb-4">
                                If you have any questions about these Terms of Service, please make contact:
                            </p>
                            <div className="space-y-2 text-gray-600">
                                <p>
                                    <strong>Help & Assistance:</strong> helpfinnacalc@gmail.com
                                </p>
                                <p>
                                    <strong>Inquiries:</strong> finnacalc@gmail.com
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}