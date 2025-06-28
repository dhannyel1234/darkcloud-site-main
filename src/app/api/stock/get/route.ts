import { NextResponse } from 'next/server';

// controllers
import stockController from "@/functions/database/controllers/StockController";

export async function GET() {
    try {
        const stock = await stockController.find({});
        if (!stock) {
            return NextResponse.json(
                {
                    message: "Stock not found",
                    support: "@dump.ts"
                },
                { status: 400 }
            );
        };

        return NextResponse.json({ stock }, { status: 200 });
    } catch (err) {
        return NextResponse.json(
            {
                message: "Error fetching the stock",
                error: err,
                support: '@dump.ts'
            },
            { status: 500 }
        );
    };
};