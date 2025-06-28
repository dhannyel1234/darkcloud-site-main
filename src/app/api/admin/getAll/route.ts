import { NextRequest, NextResponse } from 'next/server';

// controllers
import adminController from '@/functions/database/controllers/AdminController';

export async function GET(req: NextRequest) {
    try {
        const dbAllAdmins = await adminController.findAll();
        return NextResponse.json(dbAllAdmins, { status: 200 });
    } catch (err) {
        return NextResponse.json(
            {
                message: "Error when fetching administrators",
                error: err,
                support: '@rw.ts'
            },
            { status: 500 }
        );
    };
};