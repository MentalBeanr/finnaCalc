"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    ArrowLeft,
    Play,
    BookOpen,
    Clock,
    Users,
    ExternalLink,
    Star,
    Shield,
    ChevronLeft,
    ChevronRight,
} from "lucide-react"

interface FinancialEducationHubProps {
    onBack: () => void
}

export default function FinancialEducationHub({ onBack }: FinancialEducationHubProps) {
    const [activeTopic, setActiveTopic] = useState("credit")

    const topics = [
        { id: "credit", name: "Credit & Debt" },
        { id: "investing", name: "Investing 101" },
        { id: "budgeting", name: "Budgeting" },
        { id: "retirement", name: "Retirement" },
        { id: "taxes", name: "Tax Planning" },
    ]

    const videoLessons = {
        credit: [
            {
                title: "Understanding Your Credit Score",
                duration: "5 min",
                level: "Beginner",
                description: "Learn what makes up your credit score and why it matters.",
            },
            {
                title: "Strategies to Improve Your Credit",
                duration: "7 min",
                level: "Beginner",
                description: "Actionable steps to increase your credit score over time.",
            },
        ],
        investing: [
            {
                title: "What Are Stocks and Bonds?",
                duration: "6 min",
                level: "Beginner",
                description: "Learn the basic building blocks of investing in simple terms.",
            },
            {
                title: "Building a Diversified Portfolio",
                duration: "10 min",
                level: "Intermediate",
                description: "Don't put all your eggs in one basket - learn why and how.",
            },
        ],
    }

    const readingResources = {
        credit: [
            {
                title: "How to Pay Off Debt",
                author: "NerdWallet",
                type: "Guide",
                description: "A comprehensive guide to various debt payoff strategies.",
            },
            {
                title: "Your Credit Report Explained",
                author: "Experian",
                type: "Article",
                description: "Understand every section of your credit report.",
            },
        ],
        investing: [
            {
                title: "The Simple Path to Wealth",
                author: "JL Collins",
                type: "Book",
                description: "Straightforward advice on index fund investing.",
            },
            {
                title: "SEC Investor.gov",
                author: "U.S. Securities and Exchange Commission",
                type: "Website",
                description: "Official government resource for investment education.",
            },
        ],
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" onClick={onBack}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                </Button>
                <div>
                    <h1 className="text-3xl font-bold">Financial Education Hub</h1>
                    <p className="text-muted-foreground">Your journey to financial confidence starts here</p>
                </div>
            </div>

            {/* Topics Navigation */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                {topics.map((topic) => (
                    <Button
                        key={topic.id}
                        variant={activeTopic === topic.id ? "default" : "outline"}
                        size="sm"
                        className="shrink-0"
                        onClick={() => setActiveTopic(topic.id)}
                    >
                        {topic.name}
                    </Button>
                ))}
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>

            {/* Featured Content */}
            <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
                <CardContent className="p-6">
                    <div className="grid md:grid-cols-2 gap-6 items-center">
                        <div>
                            <Badge className="mb-2">Featured Course</Badge>
                            <h2 className="text-2xl font-bold mb-3">The Path to Financial Independence</h2>
                            <p className="text-muted-foreground mb-4">
                                A comprehensive course covering budgeting, saving, investing, and retirement planning.
                            </p>
                            <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                    <Star className="h-4 w-4 text-yellow-500" />
                                    <span>4.8 (1,200 reviews)</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Users className="h-4 w-4" />
                                    <span>Beginner Friendly</span>
                                </div>
                            </div>
                            <Button>Enroll for Free</Button>
                        </div>
                        <div className="hidden md:block">
                            <img
                                src="/placeholder.svg"
                                alt="Financial independence course"
                                className="rounded-lg object-cover w-full h-48"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Video Lessons */}
            <Card>
                <CardHeader>
                    <CardTitle>Video Lessons</CardTitle>
                    <CardDescription>Short, engaging videos to explain key concepts</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                        {(videoLessons[activeTopic as keyof typeof videoLessons] || []).map((video, index) => (
                            <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
                                <div className="flex items-center gap-4 p-4">
                                    <div className="relative">
                                        <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center">
                                            <Play className="h-8 w-8 text-muted-foreground" />
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Badge variant="secondary">{video.level}</Badge>
                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                                                {video.duration}
                      </span>
                                        </div>
                                        <h3 className="font-semibold mb-1">{video.title}</h3>
                                        <p className="text-sm text-muted-foreground">{video.description}</p>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Reading Resources */}
            <Card>
                <CardHeader>
                    <CardTitle>Reading Resources</CardTitle>
                    <CardDescription>Curated articles and guides from trusted experts</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                        {(readingResources[activeTopic as keyof typeof readingResources] || []).map((resource, index) => (
                            <Card key={index} className="hover:shadow-md transition-shadow">
                                <CardContent className="p-4">
                                    <Badge variant="outline" className="mb-2">
                                        {resource.type}
                                    </Badge>
                                    <h3 className="font-semibold mb-1">{resource.title}</h3>
                                    <p className="text-sm text-muted-foreground mb-3">by {resource.author}</p>
                                    <p className="text-sm text-muted-foreground">{resource.description}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}