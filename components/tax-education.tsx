"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Play, Clock } from "lucide-react"

interface TaxEducationProps {
    onBack: () => void
}

export default function TaxEducation({ onBack }: TaxEducationProps) {
    const videoLessons = [
        {
            title: "Understanding Tax Brackets",
            duration: "7 min",
            level: "Beginner",
            description: "Learn how progressive tax brackets work in the US.",
            thumbnail: "/tax-planning-strategies.jpg",
        },
        {
            title: "Deductions vs Credits",
            duration: "5 min",
            level: "Beginner",
            description: "The key differences and how they impact your refund.",
            thumbnail: "/tax-deductions-credits.jpg",
        },
        {
            title: "Business vs Personal Taxes",
            duration: "10 min",
            level: "Intermediate",
            description: "Navigating taxes when you're self-employed or own a business.",
            thumbnail: "/business-personal-taxes.jpg",
        },
        {
            title: "Retirement Tax Benefits",
            duration: "8 min",
            level: "Beginner",
            description: "How 401(k)s and IRAs can help you save on taxes.",
            thumbnail: "/retirement-tax-benefits.jpg",
        },
    ]

    const readingResources = [
        {
            title: "Topic No. 501, Should I Itemize?",
            author: "IRS.gov",
            type: "Article",
            description: "Official IRS guidance on standard vs itemized deductions.",
        },
        {
            title: "Tax Planning Strategies",
            author: "Investopedia",
            type: "Guide",
            description: "A comprehensive guide to year-round tax planning.",
        },
        {
            title: "Understanding Self-Employment Taxes",
            author: "NerdWallet",
            type: "Article",
            description: "A clear breakdown of how quarterly taxes work for freelancers.",
        },
        {
            title: "Child Tax Credit Explained",
            author: "Kiplinger",
            type: "Article",
            description: "Details on who qualifies and how to claim the credit.",
        },
    ]

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" onClick={onBack}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                </Button>
                <div>
                    <h1 className="text-3xl font-bold">Tax Education</h1>
                    <p className="text-muted-foreground">Learn tax strategies and planning</p>
                </div>
            </div>

            {/* Video Lessons */}
            <Card>
                <CardHeader>
                    <CardTitle>Video Lessons</CardTitle>
                    <CardDescription>Short videos explaining key tax concepts</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {videoLessons.map((video, index) => (
                            <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
                                <div className="relative">
                                    <img
                                        src={video.thumbnail}
                                        alt={video.title}
                                        className="w-full h-32 object-cover rounded-t-lg"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-t-lg">
                                        <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                                            <Play className="h-6 w-6 text-primary-foreground ml-1" />
                                        </div>
                                    </div>
                                    <div className="absolute top-2 right-2">
                                        <Badge variant="secondary" className="text-xs">
                                            <Clock className="h-3 w-3 mr-1" />
                                            {video.duration}
                                        </Badge>
                                    </div>
                                </div>
                                <CardContent className="p-4">
                                    <Badge variant={video.level === "Beginner" ? "default" : "secondary"} className="mb-2">
                                        {video.level}
                                    </Badge>
                                    <h3 className="font-semibold mb-2">{video.title}</h3>
                                    <p className="text-sm text-muted-foreground">{video.description}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Reading Resources */}
            <Card>
                <CardHeader>
                    <CardTitle>Reading Resources</CardTitle>
                    <CardDescription>Articles and guides from trusted sources</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                        {readingResources.map((resource, index) => (
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