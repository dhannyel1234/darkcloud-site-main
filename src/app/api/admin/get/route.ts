import { NextRequest, NextResponse } from 'next/server';

// controllers
import adminController from '@/functions/database/controllers/AdminController';
import { UserPlanController } from '@/functions/database/controllers/UserPlanController';

export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const user_id = url.searchParams.get("user_id");
        if (!user_id) {
            return NextResponse.json(
                {
                    message: "ID not found in parameters",
                    support: "@rw.ts"
                },
                { status: 400 }
            );
        };

        const dbAdmin = await adminController.find({ user_id });
        if (!dbAdmin) {
            return NextResponse.json(
                {
                    message: "Administrator not found in the database",
                    support: "@rw.ts"
                },
                { status: 404 }
            );
        };

        // Buscar planos ativos do usuário
        const userPlanController = UserPlanController.getInstance();
        const activePlans = await userPlanController.getActivePlans();

        return NextResponse.json({
            isAdmin: true,
            ...dbAdmin.toObject(),
            activePlans
        }, { status: 200 });
    } catch (err) {
        return NextResponse.json(
            {
                message: "Error when fetching administrator",
                error: err,
                support: '@rw.ts'
            },
            { status: 500 }
        );
    };
};