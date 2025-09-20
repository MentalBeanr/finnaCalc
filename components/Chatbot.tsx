"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { X } from 'lucide-react'; // Only need X now

interface Message {
    role: 'user' | 'model';
    parts: { text: string }[];
}

export default function ChatBot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const toggleChat = () => setIsOpen(!isOpen);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMessage: Message = { role: 'user', parts: [{ text: input }] };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ history: messages, message: input }),
            });

            const data = await response.json();

            if (response.ok) {
                const botMessage: Message = { role: 'model', parts: [{ text: data.text }] };
                setMessages(prev => [...prev, botMessage]);
            } else {
                console.error('Error from API:', data.error);
            }
        } catch (error) {
            console.error('Failed to fetch from API:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) {
        return (
            <Button
                onClick={toggleChat}
                className="fixed bottom-4 right-4 h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg p-0"
            >
                {/* Custom SVG icon for a more minimalist chat bubble */}
                <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
            </Button>
        );
    }

    return (
        <div className="fixed bottom-4 right-4 z-50">
            <Card className="w-80 h-[28rem] flex flex-col shadow-lg">
                <CardHeader className="flex flex-col items-start justify-between p-4 pb-0">
                    <div className="flex w-full items-center justify-between mb-2">
                        <div>
                            <CardTitle>
                                Finna<span className="text-blue-600">Bot</span>
                            </CardTitle>
                            <p className="text-xs text-gray-500 mt-1">
                                Personal Finance and Business Assistance AI Chatbot
                            </p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={toggleChat} className="p-2 -mr-2"><X className="h-4 w-4" /></Button>
                    </div>
                    <div className="w-full h-px bg-gray-200 mt-2"></div>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-4 pt-4">
                    <div className="space-y-4">
                        {messages.map((m, index) => (
                            <div key={index} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`p-2 rounded-lg max-w-[80%] ${
                                    m.role === 'user'
                                        ? 'bg-blue-600 text-white'
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
                        />
                        <Button type="submit">Send</Button>
                    </form>
                </CardFooter>
            </Card>
        </div>
    );
}