import { NextRequest, NextResponse } from 'next/server';

// controllers
import adminController from '@/functions/database/controllers/AdminController';

export async function POST(req: NextRequest) {
    try {
        const { user_id } = await req.json();
        if (!user_id) {
            return NextResponse.json(
                {
                    message: "ID not found in json",
                    support: "@rw.ts"
                },
                { status: 400 }
            );
        };

        const dbAdmin = await adminController.remove({ user_id });
        return NextResponse.json(dbAdmin, { status: 200 });
    } catch (err) {
        return NextResponse.json(
            {
                message: "Error when removing administrator",
                error: err,
                support: '@rw.ts'
            },
            { status: 500 }
        );
    };
};