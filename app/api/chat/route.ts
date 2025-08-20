import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: "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",
});

const response = openai.responses.create({
    model: "gpt-4o-mini",
    input: "write a haiku about ai",
    store: true,
});

response.then((result) => console.log(result.output_text));