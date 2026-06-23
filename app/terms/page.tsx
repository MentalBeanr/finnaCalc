import Link from "next/link"
import { Container } from "@/components/ds/container"
import { Section } from "@/components/ds/section"
import { Eyebrow } from "@/components/ds/eyebrow"

function PolicySection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-stack-md pt-stack-lg border-t border-outline-variant/20 first:border-t-0 first:pt-0">
            <h2 className="font-headline-md text-headline-md text-primary">{title}</h2>
            <div className="flex flex-col gap-stack-sm font-body-md text-body-md text-on-surface-variant">
                {children}
            </div>
        </div>
    )
}

export default function TermsPage() {
    return (
        <div className="flex flex-col">
            <Section spacing="loose" className="pt-section-gap-sm">
                <Container className="max-w-3xl flex flex-col gap-stack-md">
                    <Eyebrow>Legal</Eyebrow>
                    <h1 className="font-headline-display text-[56px] leading-[1.1] tracking-[-0.02em] text-primary">
                        Terms of Service
                    </h1>
                    <p className="font-body-md text-body-md text-on-surface-variant">
                        These Terms govern your use of FinnaCalc&apos;s website and services.
                        By accessing or using the services, you agree to be bound by these Terms.
                    </p>
                </Container>
            </Section>

            <Section spacing="default">
                <Container className="max-w-3xl flex flex-col gap-stack-lg">
                    <PolicySection title="Agreement">
                        <p>
                            If you disagree with any part of these Terms, you should not access
                            or use the services. The right to update these Terms at any time is
                            reserved; changes take effect immediately upon posting. Continued use
                            constitutes acceptance of the revised Terms.
                        </p>
                    </PolicySection>

                    <PolicySection title="Description of service">
                        <p>
                            FinnaCalc provides free financial calculators and planning tools for
                            personal and business use, including:
                        </p>
                        <ul className="flex flex-col gap-1 pl-4">
                            <li>Business financial calculators (startup costs, break-even, ROI, cash flow, pricing)</li>
                            <li>Personal finance tools (loan amortization, tax estimation, budgeting, emergency fund sizing)</li>
                            <li>Educational content and financial planning resources</li>
                        </ul>
                        <div className="border-l-2 border-primary pl-4 py-2 bg-surface-container-lowest rounded-r-lg">
                            <p>
                                <strong className="text-on-background">Important:</strong> Calculators provide
                                estimates for planning purposes only. Results are not professional financial,
                                tax, or legal advice.
                            </p>
                        </div>
                    </PolicySection>

                    <PolicySection title="User responsibilities">
                        <p>By using the services, you agree to:</p>
                        <ul className="flex flex-col gap-1 pl-4">
                            <li>Use the service only for lawful purposes in accordance with these Terms</li>
                            <li>Provide accurate information when using the calculators</li>
                            <li>Not attempt to interfere with or disrupt the services</li>
                            <li>Not use automated systems to access the services without permission</li>
                            <li>Respect intellectual property rights</li>
                            <li>Not share or distribute malicious content</li>
                            <li>Comply with all applicable laws and regulations</li>
                        </ul>
                    </PolicySection>

                    <PolicySection title="Important disclaimers">
                        <p className="font-medium text-on-background">Financial advice disclaimer</p>
                        <p>
                            FinnaCalc does not provide financial, investment, tax, or legal advice.
                            The calculators and tools are for informational and educational purposes
                            only. Results are estimates based on your inputs and should not be relied
                            upon for material decisions without consulting qualified professionals.
                        </p>
                        <p className="font-medium text-on-background">Accuracy disclaimer</p>
                        <p>
                            While accuracy is a priority, no warranties are made about the
                            completeness or reliability of the calculators or information. Financial
                            regulations, tax laws, and market conditions change frequently and the
                            tools may not reflect the most current state.
                        </p>
                        <p className="font-medium text-on-background">No warranty</p>
                        <p>
                            The services are provided &ldquo;as is&rdquo; without any warranty of any kind,
                            either express or implied, including but not limited to warranties of
                            merchantability, fitness for a particular purpose, or non-infringement.
                        </p>
                    </PolicySection>

                    <PolicySection title="Limitation of liability">
                        <p>
                            To the fullest extent permitted by law, FinnaCalc shall not be liable
                            for any indirect, incidental, special, consequential, or punitive
                            damages, including but not limited to:
                        </p>
                        <ul className="flex flex-col gap-1 pl-4">
                            <li>Financial losses resulting from use of the calculators</li>
                            <li>Business interruption or loss of profits</li>
                            <li>Data loss or corruption</li>
                            <li>Third-party claims or damages</li>
                        </ul>
                        <p>
                            Total liability for any claims arising from your use shall not exceed
                            the amount paid for the services (which is $0 for free services).
                        </p>
                    </PolicySection>

                    <PolicySection title="Intellectual property">
                        <p>
                            The FinnaCalc website — including content, features, and functionality —
                            is owned by FinnaCalc and protected by copyright, trademark, and other
                            intellectual property laws. You may use the services for personal and
                            business purposes but may not copy, modify, distribute, or create
                            derivative works without permission.
                        </p>
                    </PolicySection>

                    <PolicySection title="Privacy and data protection">
                        <p>
                            Your privacy matters. The collection and use of personal information is
                            governed by the{" "}
                            <Link href="/privacy" className="text-primary underline-offset-2 hover:underline">
                                Privacy Policy
                            </Link>
                            , incorporated into these Terms by reference.
                        </p>
                    </PolicySection>

                    <PolicySection title="Termination">
                        <p>
                            Access to the services may be terminated or suspended immediately,
                            without prior notice, for any reason — including breach of these Terms.
                            Upon termination, your right to use the services ceases immediately.
                        </p>
                    </PolicySection>

                    <PolicySection title="Governing law">
                        <p>
                            These Terms shall be governed by the laws of the United States. Any
                            disputes arising from these Terms or your use of the services shall be
                            resolved through binding arbitration or in courts of competent
                            jurisdiction.
                        </p>
                    </PolicySection>

                    <PolicySection title="Severability">
                        <p>
                            If any provision of these Terms is held to be invalid or unenforceable,
                            the remaining provisions remain in full force and effect. These Terms,
                            together with the Privacy Policy, constitute the entire agreement
                            between you and FinnaCalc.
                        </p>
                    </PolicySection>

                    <PolicySection title="Contact">
                        <p>Questions about these Terms?</p>
                        <div className="flex flex-col gap-1">
                            <span>
                                Help &amp; Assistance:{" "}
                                <a href="mailto:helpfinnacalc@gmail.com" className="text-primary underline-offset-2 hover:underline">
                                    helpfinnacalc@gmail.com
                                </a>
                            </span>
                            <span>
                                Inquiries:{" "}
                                <a href="mailto:finnacalc@gmail.com" className="text-primary underline-offset-2 hover:underline">
                                    finnacalc@gmail.com
                                </a>
                            </span>
                        </div>
                    </PolicySection>
                </Container>
            </Section>
        </div>
    )
}
