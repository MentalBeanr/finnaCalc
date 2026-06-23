"use client"

import { useState, useEffect } from "react"
import { Container } from "@/components/ds/container"
import { Section } from "@/components/ds/section"
import { MaterialIcon } from "@/components/ds/material-icon"

interface FinancialEducationHubProps {
    onBack: () => void
    initialTopic?: string
}

const TOPICS = [
    { id: "credit", name: "Credit & Debt" },
    { id: "investing", name: "Investing" },
    { id: "budgeting", name: "Budgeting" },
    { id: "retirement", name: "Retirement" },
    { id: "taxes", name: "Tax Planning" },
] as const

type TopicId = (typeof TOPICS)[number]["id"]

const VIDEO_LESSONS: Record<TopicId, { title: string; url: string }[]> = {
    credit: [
        { title: "What Is a Credit Score?", url: "https://www.youtube.com/watch?v=jwML94IOW0s" },
        { title: "What Can Change Your Credit Score?", url: "https://www.youtube.com/watch?v=IZN5IT28iHo" },
        { title: "Understanding Loans and Debt", url: "https://www.youtube.com/watch?v=E2dzSPOhUOI" },
        { title: "Good Debt vs. Bad Debt", url: "https://www.youtube.com/watch?v=MqqXTrEEZ7Y" },
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
}

const READING_RESOURCES: Record<TopicId, { title: string; url: string }[]> = {
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
}

function getYouTubeId(url: string): string | null {
    const match = url.match(/^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/)
    return match && match[2].length === 11 ? match[2] : null
}

export default function FinancialEducationHub({ onBack, initialTopic = "credit" }: FinancialEducationHubProps) {
    const [activeTopic, setActiveTopic] = useState<TopicId>(initialTopic as TopicId)
    const [videoIndex, setVideoIndex] = useState(0)
    const [articleIndex, setArticleIndex] = useState(0)

    useEffect(() => {
        if (initialTopic) {
            setActiveTopic(initialTopic as TopicId)
        }
    }, [initialTopic])

    const videos = VIDEO_LESSONS[activeTopic]
    const articles = READING_RESOURCES[activeTopic]
    const currentVideo = videos[videoIndex]
    const currentArticle = articles[articleIndex]

    const handleTopicChange = (id: TopicId) => {
        setActiveTopic(id)
        setVideoIndex(0)
        setArticleIndex(0)
    }

    return (
        <div className="flex flex-col">
            <Section spacing="default" className="pt-section-gap-sm pb-0">
                <Container className="flex flex-col gap-stack-lg">
                    <button
                        onClick={onBack}
                        className="inline-flex items-center gap-stack-sm self-start font-ui-button text-ui-button uppercase tracking-[0.05em] text-on-surface-variant hover:text-primary transition-colors"
                    >
                        <MaterialIcon name="arrow_back" size={16} />
                        Back
                    </button>
                    <h1 className="font-headline-display text-[56px] leading-[1.1] tracking-[-0.02em] text-primary">
                        Financial Education Hub
                    </h1>
                    <p className="font-body-lg text-body-lg text-on-surface-variant max-w-prose">
                        Your journey to financial confidence starts here.
                    </p>
                </Container>
            </Section>

            <Section spacing="default">
                <Container className="flex flex-col gap-gutter">
                    {/* Topic nav */}
                    <div className="flex gap-stack-sm">
                        {TOPICS.map((topic) => (
                            <button
                                key={topic.id}
                                onClick={() => handleTopicChange(topic.id)}
                                className={`px-4 py-2 rounded-full border font-ui-button text-ui-button uppercase tracking-[0.05em] transition-colors ${
                                    activeTopic === topic.id
                                        ? "border-primary bg-primary text-on-primary"
                                        : "border-outline-variant/40 text-on-surface-variant hover:border-primary/40 hover:text-primary"
                                }`}
                            >
                                {topic.name}
                            </button>
                        ))}
                    </div>

                    {/* Video lessons */}
                    <div className="border border-outline-variant/30 rounded-lg bg-surface-container-lowest p-10">
                        <h2 className="font-headline-md text-headline-md text-primary mb-stack-sm">
                            Video Lessons
                        </h2>
                        <p className="font-body-md text-body-md text-on-surface-variant mb-stack-lg">
                            Short, engaging videos to explain key concepts.
                        </p>
                        <div className="flex items-center gap-stack-lg">
                            <button
                                onClick={() => setVideoIndex((i) => Math.max(0, i - 1))}
                                disabled={videoIndex === 0}
                                className="p-2 rounded-lg border border-outline-variant/30 text-on-surface-variant hover:border-primary/40 hover:text-primary transition-colors disabled:opacity-30"
                            >
                                <MaterialIcon name="chevron_left" size={20} />
                            </button>
                            <div className="flex-1">
                                <p className="font-body-md text-body-md text-primary font-semibold text-center mb-stack-md">
                                    {currentVideo.title}
                                </p>
                                <iframe
                                    className="w-full h-64 rounded-lg"
                                    src={`https://www.youtube.com/embed/${getYouTubeId(currentVideo.url)}`}
                                    title={currentVideo.title}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                                <p className="font-label-caps text-label-caps uppercase tracking-[0.15em] text-on-surface-variant text-right mt-stack-sm">
                                    {videoIndex + 1} / {videos.length}
                                </p>
                            </div>
                            <button
                                onClick={() => setVideoIndex((i) => Math.min(videos.length - 1, i + 1))}
                                disabled={videoIndex === videos.length - 1}
                                className="p-2 rounded-lg border border-outline-variant/30 text-on-surface-variant hover:border-primary/40 hover:text-primary transition-colors disabled:opacity-30"
                            >
                                <MaterialIcon name="chevron_right" size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Reading resources */}
                    <div className="border border-outline-variant/30 rounded-lg bg-surface-container-lowest p-10">
                        <h2 className="font-headline-md text-headline-md text-primary mb-stack-sm">
                            Reading Resources
                        </h2>
                        <p className="font-body-md text-body-md text-on-surface-variant mb-stack-lg">
                            Curated articles and guides from trusted experts.
                        </p>
                        <div className="flex items-center gap-stack-lg">
                            <button
                                onClick={() => setArticleIndex((i) => Math.max(0, i - 1))}
                                disabled={articleIndex === 0}
                                className="p-2 rounded-lg border border-outline-variant/30 text-on-surface-variant hover:border-primary/40 hover:text-primary transition-colors disabled:opacity-30"
                            >
                                <MaterialIcon name="chevron_left" size={20} />
                            </button>
                            <div className="flex-1">
                                <p className="font-body-md text-body-md text-primary font-semibold text-center mb-stack-md">
                                    {currentArticle.title}
                                </p>
                                <a
                                    href={currentArticle.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block p-6 rounded-lg border border-outline-variant/30 hover:border-primary/40 transition-colors group"
                                >
                                    <div className="flex items-center justify-between">
                                        <p className="font-body-md text-body-md text-on-surface-variant">
                                            Click to read more
                                        </p>
                                        <MaterialIcon
                                            name="open_in_new"
                                            size={16}
                                            className="text-on-surface-variant group-hover:text-primary transition-colors"
                                        />
                                    </div>
                                </a>
                                <p className="font-label-caps text-label-caps uppercase tracking-[0.15em] text-on-surface-variant text-right mt-stack-sm">
                                    {articleIndex + 1} / {articles.length}
                                </p>
                            </div>
                            <button
                                onClick={() => setArticleIndex((i) => Math.min(articles.length - 1, i + 1))}
                                disabled={articleIndex === articles.length - 1}
                                className="p-2 rounded-lg border border-outline-variant/30 text-on-surface-variant hover:border-primary/40 hover:text-primary transition-colors disabled:opacity-30"
                            >
                                <MaterialIcon name="chevron_right" size={20} />
                            </button>
                        </div>
                    </div>
                </Container>
            </Section>
        </div>
    )
}
