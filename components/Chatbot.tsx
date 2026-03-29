"use client";

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X } from 'lucide-react';

export default function ChatBot() {
    const [isOpen, setIsOpen] = useState(false);
    const toggleChat = () => setIsOpen(!isOpen);

    if (!isOpen) {
        return (
            <Button onClick={toggleChat}
                className="fixed bottom-4 right-4 h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg p-0"
                aria-label="Open FinnaBot">
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
                            <Image src="/finnabot-logo.png" alt="FinnaBot Logo" width={24} height={24} />
                            <CardTitle>Finna<span className="text-blue-600">Bot</span></CardTitle>
                        </div>
                        <Button variant="ghost" size="sm" onClick={toggleChat} className="p-2 -mr-2"><X className="h-4 w-4" /></Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 pl-8">Personal Finance and Business Assistance AI Chatbot</p>
                    <div className="w-full h-px bg-gray-200 mt-2"></div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                        <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Coming Soon!</h3>
                    <p className="text-sm text-gray-500">FinnaBot is currently being upgraded. Check back soon for AI-powered financial assistance!</p>
                </CardContent>
            </Card>
        </div>
    );
}
