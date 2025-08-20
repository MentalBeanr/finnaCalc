"use client";

import { useState } from 'react';
import { useChat } from 'ai/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { MessageSquare, X } from 'lucide-react';

export default function ChatBot() {
    const [isOpen, setIsOpen] = useState(false);
    const { messages, input, handleInputChange, handleSubmit } = useChat();

    const toggleChat = () => setIsOpen(!isOpen);

    if (!isOpen) {
        return (
            <Button
                onClick={toggleChat}
                className="fixed bottom-4 right-4 h-16 w-16 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg"
            >
                <MessageSquare className="h-8 w-8 text-white" />
            </Button>
        );
    }

    return (
        <div className="fixed bottom-4 right-4 z-50">
            <Card className="w-80 h-[28rem] flex flex-col shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>FinnaBot</CardTitle>
                    <Button variant="ghost" size="sm" onClick={toggleChat}><X className="h-4 w-4" /></Button>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto">
                    <div className="space-y-4">
                        {messages.map(m => (
                            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`p-2 rounded-lg max-w-[80%] ${
                                    m.role === 'user'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-200 text-gray-900'
                                }`}>
                                    {m.content}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
                <CardFooter>
                    <form onSubmit={handleSubmit} className="flex w-full gap-2">
                        <Input
                            value={input}
                            placeholder="Ask about finances..."
                            onChange={handleInputChange}
                        />
                        <Button type="submit">Send</Button>
                    </form>
                </CardFooter>
            </Card>
        </div>
    );
}