"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { MaterialIcon } from "@/components/ds/material-icon"

type Message = { role: "user" | "assistant"; content: string }

const WELCOME: Message = {
    role: "assistant",
    content:
        "Hi! I'm FinnaBot. Ask me about budgeting, investing, taxes, or any of the calculators on this site. I'm not a licensed advisor, so verify anything important with a professional.",
}

export default function ChatBot() {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<Message[]>([WELCOME])
    const [input, setInput] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const scrollRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
    }, [messages, loading])

    useEffect(() => {
        if (isOpen) inputRef.current?.focus()
    }, [isOpen])

    const send = async () => {
        const trimmed = input.trim()
        if (!trimmed || loading) return
        const nextMessages = [...messages, { role: "user", content: trimmed } as Message]
        setMessages(nextMessages)
        setInput("")
        setLoading(true)
        setError(null)
        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: nextMessages.map(({ role, content }) => ({ role, content })),
                }),
            })
            const data = await res.json()
            if (!res.ok) {
                throw new Error(data?.error ?? "Something went wrong.")
            }
            setMessages((prev) => [...prev, { role: "assistant", content: data.reply || "(no response)" }])
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong.")
        } finally {
            setLoading(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            send()
        }
    }

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                aria-label="Open FinnaBot"
                className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-primary text-on-primary shadow-lg hover:opacity-90 transition-opacity flex items-center justify-center"
            >
                <MaterialIcon name="chat" size={24} />
            </button>
        )
    }

    return (
        <div className="fixed bottom-6 right-6 z-50">
            <div className="w-96 h-[32rem] flex flex-col rounded-lg border border-outline-variant/30 bg-surface-container-lowest shadow-xl">
                <div className="p-4 border-b border-outline-variant/30">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-stack-sm">
                            <Image src="/finnabot-logo.png" alt="FinnaBot" width={24} height={24} />
                            <p className="font-headline-md text-[18px] leading-none text-primary">
                                FinnaBot
                            </p>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            aria-label="Close"
                            className="p-1 rounded text-on-surface-variant hover:text-primary transition-colors"
                        >
                            <MaterialIcon name="close" size={18} />
                        </button>
                    </div>
                    <p className="font-body-md text-xs text-on-surface-variant mt-1">
                        Personal finance &amp; business AI assistant
                    </p>
                </div>

                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-stack-sm">
                    {messages.map((m, i) => (
                        <div
                            key={i}
                            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                            <div
                                className={`max-w-[85%] rounded-2xl px-3 py-2 font-body-md text-body-md whitespace-pre-wrap ${
                                    m.role === "user"
                                        ? "bg-primary text-on-primary rounded-br-sm"
                                        : "bg-surface-container text-on-surface rounded-bl-sm"
                                }`}
                            >
                                {m.content}
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="flex justify-start">
                            <div className="bg-surface-container text-on-surface rounded-2xl rounded-bl-sm px-3 py-2">
                                <TypingDots />
                            </div>
                        </div>
                    )}
                    {error && (
                        <div className="font-body-md text-xs text-error bg-error/10 border border-error/30 rounded-md px-2 py-1.5">
                            {error}
                        </div>
                    )}
                </div>

                <div className="p-3 border-t border-outline-variant/30">
                    <div className="flex items-center gap-stack-sm">
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask FinnaBot anything..."
                            disabled={loading}
                            className="flex-1 rounded-full border border-outline-variant/40 bg-surface px-4 py-2 font-body-md text-body-md outline-none focus:border-primary disabled:opacity-60"
                        />
                        <button
                            onClick={send}
                            disabled={loading || !input.trim()}
                            aria-label="Send"
                            className="h-9 w-9 rounded-full bg-primary text-on-primary flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-40"
                        >
                            <MaterialIcon name="send" size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

function TypingDots() {
    return (
        <span className="inline-flex gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-on-surface-variant/50 animate-bounce [animation-delay:-0.3s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-on-surface-variant/50 animate-bounce [animation-delay:-0.15s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-on-surface-variant/50 animate-bounce" />
        </span>
    )
}
