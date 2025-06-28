import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';

// controllers
import invoiceController from '@/functions/database/controllers/InvoiceController';

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession();
        if (!session) {
            return NextResponse.json(
                {
                    error: "Unauthenticated account.",
                    support: "@dump.ts"
                },
                { status: 400 }
            );
        };
        
        const { name } = await req.json();
        if (!name) {
            return NextResponse.json(
                {
                    message: "Name not found in json",
                    support: "@dump.ts"
                },
                { status: 400 }
            );
        };

        const dbInvoice = await invoiceController.remove(name);
        return NextResponse.json(dbInvoice, { status: 200 });
    } catch (err) {
        return NextResponse.json(
            {
                message: "Error when removing invoice",
                support: '@dump.ts'
            },
            { status: 500 }
        );
    };
};