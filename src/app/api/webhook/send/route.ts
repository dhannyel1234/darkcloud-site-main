import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const { data } = await req.json();
        if (!data) {
            return NextResponse.json({
                message: "The data was not found in the request body",
                support: "@dump.ts"
            });
        };

        const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL as string;
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            return NextResponse.json({
                message: "Failed when trying to request a POST to the webhook",
                status: response.status,
                support: "@dump.ts"
            });
        };

        return NextResponse.json({
            message: "Webhook sent successfully",
            status: 200,
            support: "@dump.ts"
        }, { status: 200 });
    } catch (err) {
        if (err instanceof SyntaxError) {
            return NextResponse.json({
                message: "Invalid JSON format in request body",
                status: 400,
                support: "@dump.ts"
            }, { status: 400 });
        };

        return NextResponse.json({
            message: "Failed when trying to send something to webhook",
            status: 500,
            support: "@dump.ts"
        }, { status: 500 });
    };
};