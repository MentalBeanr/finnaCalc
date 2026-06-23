/**
 * AI-assisted document extraction (v2 §11).
 *
 * An Extractor seam: the NullExtractor (default, no key) returns nothing so build
 * and CI run keyless; the OpenAIVisionExtractor reads a tax-document image when
 * OPENAI_API_KEY is present. Everything is fail-safe — any error yields no
 * suggestions rather than a crash. Output is ALWAYS a suggestion the user
 * confirms (v2 §11.3); this layer never writes to a return.
 */
import {
    normalizeSuggestions,
    type IncomeSuggestion,
    type RawIncomeSuggestion,
} from "@/lib/extraction-shared"

export interface ExtractInput {
    mime: string
    base64: string
}

export interface Extractor {
    readonly name: string
    extract(input: ExtractInput): Promise<RawIncomeSuggestion[]>
}

/** Build/CI/dev default: no extraction configured. */
export class NullExtractor implements Extractor {
    readonly name = "null"
    async extract(): Promise<RawIncomeSuggestion[]> {
        return []
    }
}

const PROMPT = `You are extracting income figures from a U.S. tax document image.
Return strict JSON: {"suggestions": [{"type": "W-2" | "1099-INT" | "Social Security", "amount": <dollars number>, "withholding": <dollars number>}]}.
Only include fields you can actually read. "amount" is the income; "withholding" is federal tax withheld (0 if none). If nothing is readable, return {"suggestions": []}.`

/** OpenAI vision extractor (production path). Fail-safe: returns [] on any error. */
export class OpenAIVisionExtractor implements Extractor {
    readonly name = "openai"
    async extract(input: ExtractInput): Promise<RawIncomeSuggestion[]> {
        const apiKey = process.env.OPENAI_API_KEY
        if (!apiKey) return []
        const model = process.env.OPENAI_VISION_MODEL ?? "gpt-4o-mini"
        try {
            const res = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model,
                    response_format: { type: "json_object" },
                    messages: [
                        {
                            role: "user",
                            content: [
                                { type: "text", text: PROMPT },
                                {
                                    type: "image_url",
                                    image_url: { url: `data:${input.mime};base64,${input.base64}` },
                                },
                            ],
                        },
                    ],
                }),
            })
            if (!res.ok) return []
            const data = await res.json()
            const text: string = data?.choices?.[0]?.message?.content ?? "{}"
            const parsed = JSON.parse(text)
            return Array.isArray(parsed?.suggestions) ? parsed.suggestions : []
        } catch {
            return []
        }
    }
}

function resolveExtractor(): Extractor {
    return process.env.OPENAI_API_KEY ? new OpenAIVisionExtractor() : new NullExtractor()
}

/** Extract confirmable income suggestions from a document's bytes. */
export async function extractIncomeFromDocument(input: {
    mime: string
    bytes: Buffer
}): Promise<IncomeSuggestion[]> {
    const base64 = input.bytes.toString("base64")
    const raw = await resolveExtractor().extract({ mime: input.mime, base64 })
    return normalizeSuggestions(raw)
}
