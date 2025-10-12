"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
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
    onBack: () => void;
    initialTopic?: string;
}

export default function FinancialEducationHub({ onBack, initialTopic = "credit" }: FinancialEducationHubProps) {
    const [activeTopic, setActiveTopic] = useState(initialTopic)
    const [modalContent, setModalContent] = useState<{ title: string; description: string } | null>(null);
    const [videoIndex, setVideoIndex] = useState(0);
    const [articleIndex, setArticleIndex] = useState(0);

    useEffect(() => {
        if (initialTopic) {
            setActiveTopic(initialTopic);
        }
    }, [initialTopic]);


    const topics = [
        { id: "credit", name: "Credit & Debt" },
        { id: "investing", name: "Investing" },
        { id: "budgeting", name: "Budgeting" },
        { id: "retirement", name: "Retirement" },
        { id: "taxes", name: "Tax Planning" },
    ]

    const videoLessons = {
        credit: [
            { title: "What Is a Credit Score?", url: "https://www.youtube.com/watch?v=jwML94IOW0s" },
            { title: "What Can Change Your Credit Score?", url: "https://www.youtube.com/watch?v=IZN5IT28iHo" },
            { title: "Understanding Loans and Debt", url: "https://www.youtube.com/watch?v=E2dzSPOhUOI" },
            { title: "Good Debt vs. Bad Debt", url: "https://www.youtube.com/watch?v=MFCdA2vGVh4" },
            { title: "What Is APR and Why It Matters", url: "https://www.youtube.com/watch?v=MqqXTrEEZ7Y" },
            { title: "Understanding Your FICO Score", url: "https://www.youtube.com/watch?v=8AtM1R9NmwM" },
        ],
        investing: [
            { title: "What Are Stocks?", url: "https://www.youtube.com/watch?v=98qfFzqDKR8" },
            { title: "Bonds vs. Stocks: What's the Difference?", url: "https://www.youtube.com/watch?v=rs1md3e4aYU" },
            { title: "Understanding Risk and Return", url: "https://www.youtube.com/watch?v=7mo167ohvJw" },
            { title: "A Beginner's Guide to Investing", url: "https://www.youtube.com/watch?v=8_iWSsoiNXs" },
            { title: "Index Funds vs. Mutual Funds vs. ETFs", url: "https://www.youtube.com/watch?v=ugBs333NhbI" },
        ],
        retirement: [
            { title: "What Is a 401(k)?", url: "https://www.youtube.com/watch?v=d8rNitoPZeo" },
            { title: "An Introduction to Traditional IRAs", url: "https://www.youtube.com/watch?v=UV8kgqk_DAY" },
            { title: "The Power of a Roth IRA", url: "https://www.youtube.com/watch?v=Xd8VXDqXtkE" },
            { title: "Managing Your 401(k) When You Change Jobs", url: "https://www.youtube.com/watch?v=PLZHTIrazF8" },
        ],
        budgeting: [
            { title: "How to Budget Your Paycheck", url: "https://www.youtube.com/watch?v=5tQuez0kbOY" },
            { title: "How to Stop Living Paycheck to Paycheck", url: "https://www.youtube.com/watch?v=NSpMFtcXxcc" },
            { title: "How to Manage Your Money (The 50/30/20 Rule)", url: "https://www.youtube.com/watch?v=HQzoZfc3GwQ" },
            { title: "How to Manage Your Money (The 70/20/10 Rule)", url: "https://www.youtube.com/watch?v=HkNPZVu-jZM" },
            { title: "A Beginner's Guide to Paying Off Debt", url: "https://www.youtube.com/watch?v=_LdpjN2oDNo" },
        ],
        taxes: [
            { title: "What Are Taxes?", url: "https://www.youtube.com/watch?v=kdfk22Ck4nM" },
            { title: "How Tax Brackets Work", url: "https://www.youtube.com/watch?v=AhgR3X--bbY" },
            { title: "An Introduction to Tax Deductions", url: "https://www.youtube.com/watch?v=GypHy3gnG5E" },
            { title: "Understanding Tax Credits", url: "https://www.youtube.com/watch?v=4gYvlMwvdnw" },
            { title: "A Guide to Common Tax Forms (Part 1)", url: "https://www.youtube.com/watch?v=boklbFhF8l8" },
            { title: "A Guide to Common Tax Forms (Part 2)", url: "https://www.youtube.com/watch?v=W1562KoBExA" },
        ],
    };

    const readingResources = {
        credit: [
            { title: "An Introduction to Credit and Loans", url: "https://www.khanacademy.org/college-careers-more/financial-literacy/xa6995ea67a8e9fdd:loans-and-debt/xa6995ea67a8e9fdd:borrowing-money/a/loans-and-credit" },
            { title: "How to Raise Your Credit Score", url: "https://www.khanacademy.org/college-careers-more/financial-literacy/xa6995ea67a8e9fdd:consumer-credit/xa6995ea67a8e9fdd:credit-score/a/how-do-i-raise-my-credit-score" },
        ],
        investing: [
            { title: "How to Invest with Confidence", url: "https://www.investopedia.com/articles/basics/11/3-s-simple-investing.asp" },
            { title: "How and Where to Start Investing", url: "https://www.investopedia.com/terms/i/investment.asp" },
        ],
        retirement: [
            { title: "How to Invest for Retirement", url: "https://www.khanacademy.org/college-careers-more/financial-literacy/xa6995ea67a8e9fdd:investments-retirement/xa6995ea67a8e9fdd:investing/a/how-to-invest-in-your-retirement-account" },
            { title: "Building a Strong Foundation for Retirement", url: "https://www.khanacademy.org/college-careers-more/personal-finance/pf-investment-vehicles-insurance-and-retirement/pf-ira-401ks/a/building-a-foundation-for-retirement" },
            { title: "The Effect of Time on Your Retirement Savings", url: "https://www.khanacademy.org/college-careers-more/personal-finance/pf-investment-vehicles-insurance-and-retirement/pf-ira-401ks/a/the-effect-of-time-on-your-retirement-account" },
            { title: "Pensions, 403(b)s, and SIMPLE IRAs Explained", url: "https://www.khanacademy.org/college-careers-more/financial-literacy/xa6995ea67a8e9fdd:investments-retirement/xa6995ea67a8e9fdd:saving-for-retirement/a/what-is-a-pension-403-b-simple-ira-and-others" },
        ],
        budgeting: [
            { title: "What Is a Budget?", url: "https://www.khanacademy.org/college-careers-more/financial-literacy/xa6995ea67a8e9fdd:budgeting-and-saving/xa6995ea67a8e9fdd:budgeting/a/what-is-a-budget" },
            { title: "A Step-by-Step Guide to Creating a Budget", url: "https://www.khanacademy.org/college-careers-more/personal-finance/pf-saving-and-budgeting/tips-for-tracking-and-saving-money/a/creating-a-budget" },
            { title: "How to Balance Your Budget", url: "https://www.khanacademy.org/college-careers-more/financial-literacy/xa6995ea67a8e9fdd:budgeting-and-saving/xa6995ea67a8e9fdd:budgeting/a/balancing-your-budget" },
            { title: "Understanding Budgeting Constraints and Decisions", url: "https://www.khanacademy.org/economics-finance-domain/microeconomics/choices-opp-cost-tutorial/utility-maximization-with-indifference-curves/a/how-individuals-make-choices-based-on-their-budget-constraint-cnx" },
        ],
        taxes: [
            { title: "An Overview of Common Tax Forms", url: "https://www.khanacademy.org/college-careers-more/financial-literacy/xa6995ea67a8e9fdd:taxes-and-tax-forms/xa6995ea67a8e9fdd:tax-forms/a/tax-forms" },
            { title: "Your Guide to Key Tax Terms", url: "https://www.khanacademy.org/math/grade-7-math-tx/xa876d090ec748f45:number-and-operations/xa876d090ec748f45:income-tax-withholding/a/your-guide-to-key-tax-terms-brought-to-you-by-better-money-habits" },
            { title: "Understanding the Taxes You Pay", url: "https://www.khanacademy.org/college-careers-more/financial-literacy/xa6995ea67a8e9fdd:taxes-and-tax-forms/xa6995ea67a8e9fdd:what-are-taxes/a/understanding-the-taxes-you-pay" },
            { title: "A Guide to Taxes for the Self-Employed", url: "https://www.khanacademy.org/college-careers-more/financial-literacy/xa6995ea67a8e9fdd:employment/xa6995ea67a8e9fdd:non-typical-pay-structures/a/tax-responsibilities-for-self-employed-individuals" },
        ],
    };

    const getYouTubeId = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };


    return (
        <>
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
                            onClick={() => {
                                setActiveTopic(topic.id);
                                setVideoIndex(0);
                                setArticleIndex(0);
                            }}
                        >
                            {topic.name}
                        </Button>
                    ))}
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>

                {/* Video Lessons */}
                <Card>
                    <CardHeader>
                        <CardTitle>Video Lessons</CardTitle>
                        <CardDescription>Short, engaging videos to explain key concepts</CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => setVideoIndex(prev => Math.max(0, prev - 1))} disabled={videoIndex === 0}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="flex-1">
                            <h3 className="font-semibold mb-2 text-center">{videoLessons[activeTopic as keyof typeof videoLessons][videoIndex].title}</h3>
                            <iframe
                                className="w-full h-64 rounded-lg"
                                src={`https://www.youtube.com/embed/${getYouTubeId(videoLessons[activeTopic as keyof typeof videoLessons][videoIndex].url)}`}
                                title="YouTube video player"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            ></iframe>
                            <div className="text-right text-sm text-muted-foreground mt-2">
                                {videoIndex + 1} / {videoLessons[activeTopic as keyof typeof videoLessons].length}
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setVideoIndex(prev => Math.min(videoLessons[activeTopic as keyof typeof videoLessons].length - 1, prev + 1))} disabled={videoIndex === videoLessons[activeTopic as keyof typeof videoLessons].length - 1}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </CardContent>
                </Card>

                {/* Reading Resources */}
                <Card>
                    <CardHeader>
                        <CardTitle>Reading Resources</CardTitle>
                        <CardDescription>Curated articles and guides from trusted experts</CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => setArticleIndex(prev => Math.max(0, prev - 1))} disabled={articleIndex === 0}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="flex-1">
                            <h3 className="font-semibold mb-2 text-center">{readingResources[activeTopic as keyof typeof readingResources][articleIndex].title}</h3>
                            <a href={readingResources[activeTopic as keyof typeof readingResources][articleIndex].url} target="_blank" rel="noopener noreferrer">
                                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                                    <CardContent className="p-4">
                                        <p className="text-sm text-muted-foreground">Click to read more</p>
                                    </CardContent>
                                </Card>
                            </a>
                            <div className="text-right text-sm text-muted-foreground mt-2">
                                {articleIndex + 1} / {readingResources[activeTopic as keyof typeof readingResources].length}
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setArticleIndex(prev => Math.min(readingResources[activeTopic as keyof typeof readingResources].length - 1, prev + 1))} disabled={articleIndex === readingResources[activeTopic as keyof typeof readingResources].length - 1}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </CardContent>
                </Card>
            </div>
            <Dialog open={!!modalContent} onOpenChange={() => setModalContent(null)}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>{modalContent?.title}</DialogTitle>
                        <DialogDescription>{modalContent?.description}</DialogDescription>
                    </DialogHeader>
                    <div className="aspect-video bg-gray-200 flex items-center justify-center rounded-lg">
                        <p className="text-gray-500">Video or article content will be embedded here.</p>
                    </div>
                    <DialogFooter>
                        <Button onClick={() => setModalContent(null)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}