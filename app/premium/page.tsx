"use client"

import { Calculator, Crown, Check, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { useState } from "react" // Import useState

export default function PremiumPage() {
  const [email, setEmail] = useState(''); // Add state for the email input
  const [message, setMessage] = useState(''); // Add state for success/error messages

  const handleJoinWaitlist = async () => {
    setMessage('');
    if (!email) {
      setMessage('Please enter a valid email address.');
      return;
    }

    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Thank you for joining! A confirmation email has been sent.');
        setEmail('');
      } else {
        setMessage(data.error || 'Something went wrong. Please try again.');
      }
    } catch (error) {
      setMessage('An unexpected error occurred.');
    }
  };

  return (
      <div className="min-h-screen bg-gray-50">
        <header className="border-b border-gray-200 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <Link href="/" className="flex items-center">
                  <Calculator className="h-8 w-8 text-blue-600" />
                  <span className="ml-2 text-xl font-bold text-gray-900">FinnaCalc</span>
                </Link>
              </div>
              <Link href="/">
                <Button variant="outline">Back to Home</Button>
              </Link>
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <Crown className="h-16 w-16 text-yellow-500 mx-auto mb-6" />
            <h1 className="text-4xl font-bold text-gray-900 mb-4">FinnaCalc Premium</h1>
            <p className="text-xl text-gray-600 mb-8">Coming Soon</p>

            <Card className="max-w-3xl mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center justify-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  Premium Features
                  <Star className="h-5 w-5 text-yellow-500" />
                </CardTitle>
                <CardDescription>Advanced tools and features for serious financial planning</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* ... (rest of your premium features) */}

                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-600 mb-4 text-center">
                    Join our exclusive early access list and be the first to experience FinnaCalc Premium!
                  </p>
                  <div className="flex gap-2 max-w-md mx-auto">
                    <Input
                        placeholder="Enter your email for early access"
                        className="flex-1"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <Button
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={handleJoinWaitlist}
                    >
                      Join Waitlist
                    </Button>
                  </div>
                  {message && <p className="text-sm text-center mt-2">{message}</p>}
                  <p className="text-xs text-gray-500 text-center mt-2">
                    No spam. Unsubscribe anytime. Early access members get 60% off forever.
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="mt-8">
              <p className="text-gray-600 mb-4">Continue using our free calculators while you wait:</p>
              <Link href="/">
                <Button variant="outline" className="mr-4">
                  Back to Calculators
                </Button>
              </Link>
              <Link href="/about">
                <Button className="bg-blue-600 hover:bg-blue-700">Learn More About FinnaCalc</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
  )
}
