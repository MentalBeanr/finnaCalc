import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        const { data, error } = await resend.emails.send({
            from: 'FinnaCalc <onboarding@resend.dev>',
            to: [email],
            subject: 'Welcome to the FinnaCalc Early Access!',
            html: `
        <h1>Welcome!</h1>
        <p>Thank you for signing up for early access to FinnaCalc Premium. We'll be in touch soon with more details.</p>
        <p>Best,</p>
        <p>The FinnaCalc Team</p>
      `,
        });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ message: 'Email sent successfully!', data });
    } catch (error) {
        return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
    }
}