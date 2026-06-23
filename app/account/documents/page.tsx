import Link from "next/link"
import { getCurrentUser } from "@/lib/server/auth"
import { listDocuments } from "@/lib/server/documents"
import { documentDisplayName } from "@/lib/documents-shared"
import { Container } from "@/components/ds/container"
import { Section } from "@/components/ds/section"
import { MaterialIcon } from "@/components/ds/material-icon"
import { DocumentsClient, type DocumentRow } from "./documents-client"

export const dynamic = "force-dynamic"

export default async function DocumentsPage() {
    const user = await getCurrentUser()

    if (!user) {
        return (
            <Section spacing="default" className="pt-section-gap-sm">
                <Container className="flex flex-col items-center text-center gap-stack-lg max-w-xl">
                    <MaterialIcon name="folder" size={48} className="text-on-surface-variant" />
                    <h1 className="font-headline-display text-[40px] leading-[1.1] tracking-[-0.02em] text-primary">
                        Sign in to manage documents
                    </h1>
                    <Link
                        href="/sign-in"
                        className="inline-flex items-center gap-stack-sm px-6 py-3 rounded-full bg-primary text-on-primary font-ui-button text-ui-button uppercase tracking-[0.05em] hover:opacity-90 transition-opacity"
                    >
                        Sign In
                    </Link>
                </Container>
            </Section>
        )
    }

    const docs = await listDocuments(user.id)
    const rows: DocumentRow[] = docs.map((d) => ({
        id: d.id,
        name: documentDisplayName(d.objectKey),
        kind: d.kind,
        bytesSize: d.bytesSize,
        mime: d.mime,
        virusScanStatus: d.virusScanStatus,
        uploadedAt:
            d.uploadedAt instanceof Date ? d.uploadedAt.toISOString() : String(d.uploadedAt),
    }))

    return (
        <div className="flex flex-col">
            <Section spacing="default" className="pt-section-gap-sm pb-0">
                <Container className="flex flex-col gap-stack-lg">
                    <Link
                        href="/account"
                        className="inline-flex items-center gap-stack-sm self-start font-ui-button text-ui-button uppercase tracking-[0.05em] text-on-surface-variant hover:text-primary transition-colors"
                    >
                        <MaterialIcon name="arrow_back" size={16} />
                        Account
                    </Link>
                    <h1 className="font-headline-display text-[56px] leading-[1.1] tracking-[-0.02em] text-primary">
                        Documents
                    </h1>
                    <p className="font-body-lg text-body-lg text-on-surface-variant max-w-prose">
                        Upload and organize your tax documents. Files are stored privately and
                        encrypted at rest.
                    </p>
                </Container>
            </Section>

            <Section spacing="default">
                <Container>
                    <DocumentsClient documents={rows} />
                </Container>
            </Section>
        </div>
    )
}
