import { NextRequest, NextResponse } from 'next/server';

// controllers
import stockController from "@/functions/database/controllers/StockController";

export async function POST(req: NextRequest) {
    try {
        const { quantity } = await req.json();
        if (quantity === undefined || quantity === null) {
            return NextResponse.json(
                {
                    message: "Quantity not found in parameters",
                    support: "@dump.ts"
                },
                { status: 400 }
            );
        };

        const stock = await stockController.update({ quantity });
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