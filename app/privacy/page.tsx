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

export default function PrivacyPage() {
    return (
        <div className="flex flex-col">
            <Section spacing="loose" className="pt-section-gap-sm">
                <Container className="max-w-3xl flex flex-col gap-stack-md">
                    <Eyebrow>Legal</Eyebrow>
                    <h1 className="font-headline-display text-[56px] leading-[1.1] tracking-[-0.02em] text-primary">
                        Privacy Policy
                    </h1>
                    <p className="font-body-md text-body-md text-on-surface-variant">
                        FinnaCalc is committed to protecting your privacy. This policy explains
                        how information is collected, used, and safeguarded when you use the site.
                    </p>
                </Container>
            </Section>

            <Section spacing="default">
                <Container className="max-w-3xl flex flex-col gap-stack-lg">
                    <PolicySection title="Introduction">
                        <p>
                            By using FinnaCalc, you agree to the collection and use of information
                            in accordance with this policy. If you do not agree, please do not use
                            the services.
                        </p>
                        <p>
                            FinnaCalc may update this policy from time to time. Continued use of
                            the service after changes are posted constitutes acceptance of the
                            revised policy.
                        </p>
                    </PolicySection>

                    <PolicySection title="Information collected">
                        <p className="font-medium text-on-background">Information you provide</p>
                        <ul className="flex flex-col gap-1 pl-4">
                            <li>Calculator inputs and financial data (processed locally in your browser — not transmitted or stored)</li>
                            <li>Contact information if you reach out directly</li>
                            <li>Feedback and suggestions you provide</li>
                        </ul>
                        <p className="font-medium text-on-background">Automatically collected</p>
                        <ul className="flex flex-col gap-1 pl-4">
                            <li>Usage analytics (page views, features used, time on page)</li>
                            <li>Device information (browser type, operating system)</li>
                            <li>IP address and general location</li>
                            <li>Cookies and similar tracking technologies</li>
                        </ul>
                        <div className="border-l-2 border-primary pl-4 py-2 bg-surface-container-lowest rounded-r-lg">
                            <p>
                                <strong className="text-on-background">Important:</strong> All financial
                                calculations run locally in your browser. Your personal financial data
                                is never transmitted to or stored on our servers.
                            </p>
                        </div>
                    </PolicySection>

                    <PolicySection title="How information is used">
                        <ul className="flex flex-col gap-2 pl-4">
                            <li><strong className="text-on-background">Service provision</strong> — to provide and maintain the calculators and tools</li>
                            <li><strong className="text-on-background">Improvement</strong> — to analyze usage patterns and improve the service</li>
                            <li><strong className="text-on-background">Communication</strong> — to respond to inquiries and provide support</li>
                            <li><strong className="text-on-background">Security</strong> — to detect and address technical issues and threats</li>
                            <li><strong className="text-on-background">Legal compliance</strong> — to comply with applicable laws and regulations</li>
                        </ul>
                    </PolicySection>

                    <PolicySection title="Information sharing and disclosure">
                        <p>
                            Personal information is not sold, traded, or transferred to third
                            parties except in the following circumstances:
                        </p>
                        <ul className="flex flex-col gap-2 pl-4">
                            <li><strong className="text-on-background">Service providers</strong> — trusted partners who assist in operating the site</li>
                            <li><strong className="text-on-background">Legal requirements</strong> — when required by law or to protect rights and safety</li>
                            <li><strong className="text-on-background">Business transfers</strong> — in connection with a merger, acquisition, or asset sale</li>
                            <li><strong className="text-on-background">Consent</strong> — when you have given explicit consent</li>
                        </ul>
                    </PolicySection>

                    <PolicySection title="Data security">
                        <p>
                            Appropriate technical and organizational security measures are in place
                            to protect your information against unauthorized access, alteration,
                            disclosure, or destruction — including SSL encryption, regular security
                            assessments, and limited access on a need-to-know basis.
                        </p>
                        <p>
                            No method of transmission over the internet is 100% secure. We cannot
                            guarantee absolute security.
                        </p>
                    </PolicySection>

                    <PolicySection title="Cookies and tracking">
                        <p>
                            Cookies and similar technologies are used to enhance your experience:
                        </p>
                        <ul className="flex flex-col gap-1 pl-4">
                            <li><strong className="text-on-background">Essential</strong> — required for basic site functionality</li>
                            <li><strong className="text-on-background">Analytics</strong> — to understand how visitors use the site</li>
                            <li><strong className="text-on-background">Preference</strong> — to remember your settings</li>
                        </ul>
                        <p>
                            You can control cookies through your browser settings. Disabling certain
                            cookies may affect site functionality.
                        </p>
                    </PolicySection>

                    <PolicySection title="Your privacy rights">
                        <p>Depending on your location, you may have the right to:</p>
                        <ul className="flex flex-col gap-1 pl-4">
                            <li>Access personal data held about you</li>
                            <li>Request correction of inaccurate information</li>
                            <li>Request deletion of your personal information</li>
                            <li>Request a portable copy of your data</li>
                            <li>Object to certain processing of your information</li>
                        </ul>
                    </PolicySection>

                    <PolicySection title="Children&apos;s privacy">
                        <p>
                            The services are not intended for children under 13. Personal
                            information from children under 13 is not knowingly collected. If you
                            believe your child has provided personal information, please contact us
                            immediately.
                        </p>
                    </PolicySection>

                    <PolicySection title="Contact">
                        <p>
                            Questions about this Privacy Policy? Get in touch:
                        </p>
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
                        <p>
                            See also:{" "}
                            <Link href="/terms" className="text-primary underline-offset-2 hover:underline">
                                Terms of Service
                            </Link>
                        </p>
                    </PolicySection>
                </Container>
            </Section>
        </div>
    )
}
