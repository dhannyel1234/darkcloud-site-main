import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';

// controllers
import machineController from '@/functions/database/controllers/MachineController';

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
                    error: "Required parameters are missing",
                    support: "@dump.ts"
                },
                { status: 400 }
            );
        };

        const dbMachine = await machineController.remove(name);
        return NextResponse.json(dbMachine, { status: 200 });
    } catch (err) {
        console.log("Error when removing database machine:", err);
        return NextResponse.json(
            {
                message: "Error when removing machine",
                support: '@dump.ts'
            },
            { status: 500 }
        );
    };
};