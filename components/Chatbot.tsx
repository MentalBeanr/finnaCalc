"use client";


import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { X } from 'lucide-react';


interface Message {
    role: 'user' | 'model';
    parts: { text: string }[];
}


export default function ChatBot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);


    useEffect(() => {
        // Scroll to bottom whenever messages update
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);


    const toggleChat = () => setIsOpen(!isOpen);


    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;


        const userMessage: Message = { role: 'user', parts: [{ text: input }] };
        setMessages(prev => [...prev, userMessage]);
        const currentInput = input; // Store input before clearing
        setInput('');
        setIsLoading(true);


        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                // Send current messages + new user message for history
                body: JSON.stringify({ history: messages, message: currentInput }),
            });


            if (!response.ok) {
                let errorMsg = 'The chatbot service is currently unavailable. Please try again later.';
                try {
                    const errorData = await response.json();
                    if (errorData.error) {
                        errorMsg = errorData.error; // Use specific error from backend if available
                    }
                } catch (parseError) {
                    // If parsing fails, use the generic error
                }
                // Check if the error indicates an API key issue
                if (response.status === 500 && errorMsg.toLowerCase().includes('api key')) {
                    errorMsg = "Chatbot Error: Invalid or missing API Key. Please check the server configuration.";
                } else if (response.status === 429) {
                    errorMsg = "Chatbot Error: API rate limit reached. Please wait and try again.";
                }


                throw new Error(errorMsg);
            }


            const data = await response.json();


            // Check if the response text is empty or missing
            if (!data.text || data.text.trim() === "") {
                throw new Error("Received an empty response from the chatbot.");
            }


            const botMessage: Message = { role: 'model', parts: [{ text: data.text }] };
            setMessages(prev => [...prev, botMessage]);


        } catch (error: any) {
            // Display error message in the chat UI
            const errorMessage: Message = {
                role: 'model',
                parts: [{ text: `⚠️ ${error.message}` || '⚠️ Sorry, something went wrong. Please check the server logs or API key.' }]
            };
            setMessages(prev => [...prev, errorMessage]);
            console.error('FinnaBot API Error:', error);
        } finally {
            setIsLoading(false);
        }
    };


    if (!isOpen) {
        return (
            <Button
                onClick={toggleChat}
                className="fixed bottom-4 right-4 h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg p-0"
                aria-label="Open FinnaBot"
            >
                <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
            </Button>
        );
    }


    return (
        <div className="fixed bottom-4 right-4 z-50">
            <Card className="w-80 h-[28rem] flex flex-col shadow-lg">
                <CardHeader className="flex flex-col items-start justify-between p-4 pb-0">
                    <div className="flex w-full items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                            <Image
                                src="/finnabot-logo.png"
                                alt="FinnaBot Logo"
                                width={24}
                                height={24}
                            />
                            <div>
                                <CardTitle>
                                    Finna<span className="text-blue-600">Bot</span>
                                </CardTitle>
                            </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={toggleChat} className="p-2 -mr-2"><X className="h-4 w-4" /></Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 pl-8">
                        Personal Finance and Business Assistance AI Chatbot
                    </p>
                    <div className="w-full h-px bg-gray-200 mt-2"></div>
                </CardHeader>
                <CardContent ref={scrollRef} className="flex-1 overflow-y-auto p-4 pt-4">
                    <div className="space-y-4">
                        {messages.map((m, index) => (
                            <div key={index} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`p-2 rounded-lg max-w-[80%] text-sm ${
                                    m.role === 'user'
                                        ? 'bg-blue-600 text-white'
                                        : m.parts[0].text.startsWith('⚠️') // Style error messages differently
                                            ? 'bg-red-100 text-red-700'
                                            : 'bg-gray-200 text-gray-900'
                                }`}>
                                    {m.parts[0].text}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="p-2 rounded-lg bg-gray-200 flex items-center space-x-1.5">
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.3s]"></span>
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.15s]"></span>
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></span>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
                <CardFooter>
                    <form onSubmit={handleSubmit} className="flex w-full gap-2">
                        <Input
                            value={input}
                            placeholder="Ask about finances..."
                            onChange={(e) => setInput(e.target.value)}
                            disabled={isLoading}
                        />
                        <Button type="submit" disabled={isLoading || !input.trim()}>Send</Button>
                    </form>
                </CardFooter>
            </Card>
        </div>
    );
}
