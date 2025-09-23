"use client"

import { Shield, Eye, Lock, Database, Users, FileText, ArrowLeft } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function PrivacyPolicy() {
    const router = useRouter();

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
                    <div className="text-center space-y-4">
                        <h1 className="text-4xl font-bold text-gray-900">Privacy Policy</h1>
                        <p className="text-lg text-gray-600 invisible">
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
                                FinnaCalc is committed to protecting your privacy. This Privacy Policy explains
                                how information is collected, used, disclosed, and safeguarded when you visit the website and use the
                                financial calculators and tools.
                            </p>
                            <p className="text-gray-600">
                                By using FinnaCalc, you agree to the collection and use of information in accordance with this policy.
                                If you do not agree with the policies and practices outlined, please do not use the services.
                            </p>
                        </CardContent>
                    </Card>

                    {/* Information We Collect */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Database className="h-6 w-6 text-green-600" />
                                Information Collected
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">Information You Provide</h3>
                                <ul className="space-y-2 text-gray-600">
                                    <li>• Calculator inputs and financial data (processed locally, not stored)</li>
                                    <li>• Contact information when you reach out</li>
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
                                    <strong>Important:</strong> All financial calculations are performed locally in your browser.
                                    Your personal financial data entered into the calculators is not stored, transmitted, or accessed.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* How We Use Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-6 w-6 text-purple-600" />
                                How Information Is Used
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-3 text-gray-600">
                                <li>
                                    • <strong>Service Provision:</strong> To provide and maintain financial calculators and tools
                                </li>
                                <li>
                                    • <strong>Improvement:</strong> To analyze usage patterns and improve services
                                </li>
                                <li>
                                    • <strong>Communication:</strong> To respond to inquiries and provide customer support
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
                                Personal information is not sold, traded, or otherwise transferred to third parties except in the
                                following circumstances:
                            </p>
                            <ul className="space-y-2 text-gray-600">
                                <li>
                                    • <strong>Service Providers:</strong> Trusted third parties who assist in operating the website and
                                    conducting business
                                </li>
                                <li>
                                    • <strong>Legal Requirements:</strong> When required by law or to protect rights and safety
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
                                Appropriate technical and organizational security measures are implemented to protect your information
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
                                    <strong>Note:</strong> While efforts are made to protect your information, no method of transmission over the
                                    internet or electronic storage is 100% secure. Absolute security cannot be guaranteed.
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
                                Cookies and similar tracking technologies are used to enhance your experience on the website:
                            </p>
                            <ul className="space-y-2 text-gray-600">
                                <li>
                                    • <strong>Essential Cookies:</strong> Required for basic website functionality
                                </li>
                                <li>
                                    • <strong>Analytics Cookies:</strong> To understand how visitors use the site
                                </li>
                                <li>
                                    • <strong>Preference Cookies:</strong> To remember your settings and preferences
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
                                    • <strong>Access:</strong> Request information about the personal data held about you
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
                                The services are not intended for children under 13 years of age. Personal
                                information from children under 13 is not knowingly collected. If you are a parent or guardian and believe your child has provided
                                personal information, please make contact immediately.
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
                                This Privacy Policy may be updated from time to time. You will be notified of any changes by posting the
                                new Privacy Policy on this page. You are advised to review this
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
                                If you have any questions about this Privacy Policy or privacy practices, please make contact:
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