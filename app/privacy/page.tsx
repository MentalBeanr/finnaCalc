import { Shield, Eye, Lock, Database, Users, FileText } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <nav className="mb-8">
                    <ol className="flex items-center space-x-2 text-sm text-gray-500">
                        <li>
                            <Link href="/" className="hover:text-blue-600">
                                Home
                            </Link>
                        </li>
                        <li>/</li>
                        <li className="text-gray-900">Privacy Policy</li>
                    </ol>
                </nav>

                <div className="space-y-8">
                    {/* Header */}
                    <div className="text-center space-y-4">
                        <h1 className="text-4xl font-bold text-gray-900">Privacy Policy</h1>
                        <p className="text-lg text-gray-600">
                            Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                        </p>
                        <div className="flex items-center justify-center gap-2 text-blue-600">
                            <Shield className="h-5 w-5" />
                            <span className="text-sm font-medium">Your privacy is our priority</span>
                        </div>
                    </div>

                    {/* Introduction */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Eye className="h-6 w-6 text-blue-600" />
                                Introduction
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-gray-600">
                                FinnaCalc ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains
                                how we collect, use, disclose, and safeguard your information when you visit our website and use our
                                financial calculators and tools.
                            </p>
                            <p className="text-gray-600">
                                By using FinnaCalc, you agree to the collection and use of information in accordance with this policy.
                                If you do not agree with our policies and practices, please do not use our services.
                            </p>
                        </CardContent>
                    </Card>

                    {/* Information We Collect */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Database className="h-6 w-6 text-green-600" />
                                Information We Collect
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">Information You Provide</h3>
                                <ul className="space-y-2 text-gray-600">
                                    <li>• Calculator inputs and financial data (processed locally, not stored)</li>
                                    <li>• Contact information when you reach out to us</li>
                                    <li>• Feedback and suggestions you provide</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">Automatically Collected Information</h3>
                                <ul className="space-y-2 text-gray-600">
                                    <li>• Usage data and analytics (page views, time spent, features used)</li>
                                    <li>• Device information (browser type, operating system, screen resolution)</li>
                                    <li>• IP address and general location information</li>
                                    <li>• Cookies and similar tracking technologies</li>
                                </ul>
                            </div>

                            <div className="bg-blue-50 p-4 rounded-lg">
                                <p className="text-sm text-blue-800">
                                    <strong>Important:</strong> All financial calculations are performed locally in your browser. We do
                                    not store, transmit, or have access to your personal financial data entered into our calculators.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* How We Use Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-6 w-6 text-purple-600" />
                                How We Use Your Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-3 text-gray-600">
                                <li>
                                    • <strong>Service Provision:</strong> To provide and maintain our financial calculators and tools
                                </li>
                                <li>
                                    • <strong>Improvement:</strong> To analyze usage patterns and improve our services
                                </li>
                                <li>
                                    • <strong>Communication:</strong> To respond to your inquiries and provide customer support
                                </li>
                                <li>
                                    • <strong>Security:</strong> To detect, prevent, and address technical issues and security threats
                                </li>
                                <li>
                                    • <strong>Legal Compliance:</strong> To comply with applicable laws and regulations
                                </li>
                            </ul>
                        </CardContent>
                    </Card>

                    {/* Information Sharing */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Lock className="h-6 w-6 text-red-600" />
                                Information Sharing and Disclosure
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-gray-600">
                                We do not sell, trade, or otherwise transfer your personal information to third parties except in the
                                following circumstances:
                            </p>
                            <ul className="space-y-2 text-gray-600">
                                <li>
                                    • <strong>Service Providers:</strong> Trusted third parties who assist in operating our website and
                                    conducting our business
                                </li>
                                <li>
                                    • <strong>Legal Requirements:</strong> When required by law or to protect our rights and safety
                                </li>
                                <li>
                                    • <strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets
                                </li>
                                <li>
                                    • <strong>Consent:</strong> When you have given explicit consent for sharing
                                </li>
                            </ul>
                        </CardContent>
                    </Card>

                    {/* Data Security */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-6 w-6 text-orange-600" />
                                Data Security
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-gray-600">
                                We implement appropriate technical and organizational security measures to protect your information
                                against unauthorized access, alteration, disclosure, or destruction.
                            </p>
                            <ul className="space-y-2 text-gray-600">
                                <li>• SSL encryption for data transmission</li>
                                <li>• Regular security assessments and updates</li>
                                <li>• Limited access to personal information on a need-to-know basis</li>
                                <li>• Secure hosting infrastructure</li>
                            </ul>
                            <div className="bg-yellow-50 p-4 rounded-lg">
                                <p className="text-sm text-yellow-800">
                                    <strong>Note:</strong> While we strive to protect your information, no method of transmission over the
                                    internet or electronic storage is 100% secure. We cannot guarantee absolute security.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Cookies and Tracking */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Cookies and Tracking Technologies</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-gray-600">
                                We use cookies and similar tracking technologies to enhance your experience on our website:
                            </p>
                            <ul className="space-y-2 text-gray-600">
                                <li>
                                    • <strong>Essential Cookies:</strong> Required for basic website functionality
                                </li>
                                <li>
                                    • <strong>Analytics Cookies:</strong> Help us understand how visitors use our site
                                </li>
                                <li>
                                    • <strong>Preference Cookies:</strong> Remember your settings and preferences
                                </li>
                            </ul>
                            <p className="text-gray-600">
                                You can control cookies through your browser settings. However, disabling certain cookies may affect
                                website functionality.
                            </p>
                        </CardContent>
                    </Card>

                    {/* Your Rights */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Your Privacy Rights</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-600 mb-4">Depending on your location, you may have the following rights:</p>
                            <ul className="space-y-2 text-gray-600">
                                <li>
                                    • <strong>Access:</strong> Request information about the personal data we hold about you
                                </li>
                                <li>
                                    • <strong>Correction:</strong> Request correction of inaccurate or incomplete information
                                </li>
                                <li>
                                    • <strong>Deletion:</strong> Request deletion of your personal information
                                </li>
                                <li>
                                    • <strong>Portability:</strong> Request a copy of your data in a structured format
                                </li>
                                <li>
                                    • <strong>Objection:</strong> Object to certain processing of your information
                                </li>
                            </ul>
                        </CardContent>
                    </Card>

                    {/* Children's Privacy */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Children's Privacy</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-600">
                                Our services are not intended for children under 13 years of age. We do not knowingly collect personal
                                information from children under 13. If you are a parent or guardian and believe your child has provided
                                us with personal information, please contact us immediately.
                            </p>
                        </CardContent>
                    </Card>

                    {/* Changes to Policy */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-6 w-6 text-blue-600" />
                                Changes to This Privacy Policy
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-600">
                                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the
                                new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this
                                Privacy Policy periodically for any changes.
                            </p>
                        </CardContent>
                    </Card>

                    {/* Contact Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Contact Us</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-600 mb-4">
                                If you have any questions about this Privacy Policy or our privacy practices, please contact us:
                            </p>
                            <div className="space-y-2 text-gray-600">
                                <p>
                                    <strong>Email:</strong> privacy@finnacalc.com
                                </p>
                                <p>
                                    <strong>Subject Line:</strong> Privacy Policy Inquiry
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
